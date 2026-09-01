import { tavily } from "@tavily/core";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { v4 as uuidv4 } from "uuid";
import { TavilyResultSchema } from "../../schemas/ideation.schemas.js";

import OpenAI from "openai";
import { getTokenProvider } from "@aws/bedrock-token-generator";

export const MAX_WEB_SEARCH_QUERIES = 2;
export const MAX_RESULTS_PER_QUERY = 5;

/**
 * Abstract WebSearchProvider Base Class
 */
export class WebSearchProvider {
  get name() {
    return "base";
  }
  async search(_query, _options = {}) {
    return [];
  }
}

/**
 * NullWebSearchProvider
 * Safe fallback when live web search is disabled, unavailable, or failed.
 */
export class NullWebSearchProvider extends WebSearchProvider {
  get name() {
    return "null";
  }
  async search() {
    return [];
  }
}

/**
 * BedrockMantleWebSearchProvider
 * Official AWS Bedrock Mantle Web Search Provider via OpenAI-compatible Responses API (/openai/v1).
 */
export class BedrockMantleWebSearchProvider extends WebSearchProvider {
  constructor(options = {}) {
    super();
    this.region = options.region || process.env.AWS_WEB_SEARCH_REGION || "us-east-1";
    this.apiKey = options.apiKey || process.env.BEDROCK_MANTLE_API_KEY;
    this.model = options.model || process.env.BEDROCK_WEB_SEARCH_MODEL || "openai.gpt-5.6-luna";
    this.baseURL = options.baseURL || "https://bedrock-mantle.us-east-1.api.aws/openai/v1";
    this.lastError = null;
  }

  get name() {
    return "aws_bedrock_web_search";
  }

  async getClient() {
    if (this.apiKey) {
      return new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
    }
    try {
      const getBearerToken = getTokenProvider({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      });
      const token = await getBearerToken();
      return new OpenAI({
        apiKey: token,
        baseURL: this.baseURL,
      });
    } catch (err) {
      this.lastError = { errorCode: "TOKEN_GEN_FAILED", reason: err.message };
      return null;
    }
  }

  async search(query, options = {}) {
    this.lastError = null;
    const cleanQuery = String(query || "").trim();
    if (!cleanQuery) return [];

    console.log(`[WEB_RESEARCH] enabled=true provider=${this.name} region=${this.region} query="${cleanQuery}"`);

    const client = await this.getClient();
    if (!client) {
      console.log(`[WEB_RESEARCH] provider=${this.name} status=failed errorCode=${this.lastError?.errorCode || "NO_CLIENT"}`);
      return [];
    }

    try {
      const externalWebAccess = options.externalWebAccess !== false && process.env.AWS_WEB_SEARCH_EXTERNAL_ACCESS !== "false";

      const response = await client.responses.create({
        model: this.model,
        input: cleanQuery,
        tools: [
          {
            type: "web_search",
            external_web_access: externalWebAccess,
          },
        ],
      });

      const sources = [];
      const now = new Date().toISOString();
      const outputMessage = response.output?.message || response.output || {};
      const annotations = outputMessage.annotations || response.annotations || [];

      for (const ann of annotations) {
        if (ann.type === "url_citation" || ann.type === "citation") {
          const url = ann.url || ann.url_citation?.url;
          const title = ann.title || ann.url_citation?.title || cleanQuery;
          if (url) {
            let domain = "web";
            try {
              domain = new URL(url).hostname.replace(/^www\./, "");
            } catch {
              domain = "web";
            }
            sources.push({
              sourceId: `src_mantle_${sources.length + 1}_${Math.random().toString(36).slice(2, 7)}`,
              title,
              url,
              domain,
              snippet: ann.snippet || ann.text || "",
              score: 0.95,
              publishedDate: null,
              retrievedAt: now,
              sourceType: "news",
              query: cleanQuery,
              provider: this.name,
              relevanceScore: 0.95,
            });
          }
        }
      }

      if (sources.length > 0) {
        console.log(`[WEB_RESEARCH] provider=${this.name} status=success resultCount=${sources.length}`);
        return sources.slice(0, options.maxResults || MAX_RESULTS_PER_QUERY);
      }

      this.lastError = {
        errorCode: "NO_MANTLE_CITATIONS",
        reason: "Bedrock Mantle completed without returning url_citation annotations",
        responseId: response.id,
      };
      console.log(`[WEB_RESEARCH] provider=${this.name} status=failed errorCode=${this.lastError.errorCode}`);
      return [];
    } catch (err) {
      this.lastError = {
        errorCode: err.code || err.name || "MANTLE_ERROR",
        reason: err.message || "Failed to invoke Bedrock Mantle Web Search",
        statusCode: err.status,
      };
      console.log(`[WEB_RESEARCH] provider=${this.name} status=failed errorCode=${this.lastError.errorCode} reason="${this.lastError.reason}"`);
      return [];
    }
  }
}

export const BedrockWebSearchProvider = BedrockMantleWebSearchProvider;

/**
 * TavilyWebSearchProvider
 * Production-grade external web search provider powered by Tavily Search API.
 */
export class TavilyWebSearchProvider extends WebSearchProvider {
  constructor(apiKey = process.env.TAVILY_API_KEY) {
    super();
    this.apiKey = apiKey;
    this.client = apiKey ? tavily({ apiKey }) : null;
    this.lastError = null;
  }

  get name() {
    return "tavily";
  }

  async search(query, options = {}) {
    this.lastError = null;
    const cleanQuery = String(query || "").trim();
    if (!this.client || !cleanQuery) {
      this.lastError = { errorCode: "NO_API_KEY", reason: "Tavily API key not configured" };
      console.log(`[WEB_RESEARCH] provider=${this.name}\n[WEB_RESEARCH] status=failed\n[WEB_RESEARCH] errorCode=NO_API_KEY`);
      return [];
    }

    try {
      const maxResults = Math.min(options.maxResults || MAX_RESULTS_PER_QUERY, 5);
      const searchPayload = {
        searchDepth: options.searchDepth || "basic",
        maxResults,
        includeAnswer: false,
        includeImages: false,
      };

      if (options.topic === "news" || options.isBreakingEvent) {
        searchPayload.topic = "news";
      }

      const response = await this.client.search(cleanQuery, searchPayload);

      if (!response || !Array.isArray(response.results)) {
        console.log(`[WEB_RESEARCH] provider=${this.name}\n[WEB_RESEARCH] status=failed\n[WEB_RESEARCH] errorCode=NO_RESULTS`);
        return [];
      }

      const now = new Date().toISOString();
      const results = response.results.map((item, index) => {
        const parsed = TavilyResultSchema.parse(item);
        let domain = "";
        try {
          domain = new URL(parsed.url).hostname.replace(/^www\./, "");
        } catch {
          domain = "web";
        }

        // Classify source type based on domain
        let sourceType = "web";
        const dLower = domain.toLowerCase();
        if (
          dLower.includes("bbc.") ||
          dLower.includes("reuters.") ||
          dLower.includes("thehindu.") ||
          dLower.includes("indianexpress.") ||
          dLower.includes("hindustantimes.") ||
          dLower.includes("ndtv.") ||
          dLower.includes("nytimes.") ||
          dLower.includes("wsj.") ||
          dLower.includes("bloomberg.") ||
          dLower.includes("techcrunch.")
        ) {
          sourceType = "news";
        } else if (dLower.endsWith(".gov") || dLower.includes(".gov.") || dLower.includes("wikipedia.org")) {
          sourceType = "official";
        } else if (dLower.includes("medium.com") || dLower.includes("substack.com") || dLower.includes("hbr.org")) {
          sourceType = "analysis";
        } else if (dLower.endsWith(".edu") || dLower.includes("arxiv.org") || dLower.includes("github.com")) {
          sourceType = "reference";
        }

        return {
          sourceId: `src_${index + 1}`,
          title: parsed.title,
          url: parsed.url,
          domain,
          snippet: (parsed.content || "").slice(0, 400),
          score: parsed.score,
          publishedDate: parsed.published_date || null,
          publicationDateUnavailable: !parsed.published_date,
          retrievedAt: now,
          sourceType,
          query: cleanQuery,
          provider: "tavily",
          relevanceScore: parseFloat(parsed.score.toFixed(2)),
        };
      });

      console.log(`[WEB_RESEARCH] provider=${this.name}\n[WEB_RESEARCH] status=success\n[WEB_RESEARCH] resultCount=${results.length}`);
      console.log(`[WEB_RESEARCH] results=${JSON.stringify(results.map((s) => ({ title: s.title, domain: s.domain, url: s.url, publishedDate: s.publishedDate, relevance: s.relevanceScore })))}`);

      return results;
    } catch (error) {
      this.lastError = { errorCode: error.name || "TAVILY_ERROR", reason: error.message };
      console.log(`[WEB_RESEARCH] provider=${this.name}\n[WEB_RESEARCH] status=failed\n[WEB_RESEARCH] errorCode=${this.lastError.errorCode}\n[WEB_RESEARCH] reason="${this.lastError.reason}"`);
      return [];
    }
  }
}

/**
 * CompositeWebResearchProvider
 * Active Production Provider Chain: Tavily (Primary) -> Null (Fallback).
 * Note: BedrockMantleWebSearchProvider remains defined and exported above for future use.
 */
export class CompositeWebResearchProvider {
  constructor(tavilyApiKey = process.env.TAVILY_API_KEY) {
    this.tavilyProvider = tavilyApiKey
      ? new TavilyWebSearchProvider(tavilyApiKey)
      : new NullWebSearchProvider();
    this.primaryProvider = this.tavilyProvider;
    this.nullProvider = new NullWebSearchProvider();
  }

  async executeResearch(queries = [], options = {}) {
    if (!options.enableLiveWebSearch || !Array.isArray(queries) || queries.length === 0) {
      console.log("[WEB-SEARCH] status=disabled or empty queries");
      return {
        sources: [],
        researchAvailability: {
          webSearch: false,
          provider: null,
          tavilyStatus: "NOT_REQUESTED",
          reason: options.enableLiveWebSearch ? "no_queries" : "disabled_by_user",
          queryCount: 0,
          sourceCount: 0,
        },
        webResearch: {
          enabled: false,
          primaryProvider: this.tavilyProvider.name,
          providersUsed: [],
          queries: [],
          sourceCount: 0,
          fallbackUsed: false,
          retrievedAt: new Date().toISOString(),
        },
      };
    }

    const boundedQueries = (Array.isArray(queries) ? queries : [])
      .map((q) => String(q || "").trim())
      .filter(Boolean)
      .slice(0, MAX_WEB_SEARCH_QUERIES);

    let activeProviderName = null;
    let allSources = [];
    let tavilyStatus = "ATTEMPTED";
    const providersUsed = [this.tavilyProvider.name];

    try {
      for (const query of boundedQueries) {
        const results = await this.tavilyProvider.search(query, options);
        if (results.length > 0) {
          activeProviderName = this.tavilyProvider.name;
          allSources.push(...results);
        }
      }

      if (allSources.length > 0) {
        tavilyStatus = "SUCCESS";
        console.log(`[WEB-SEARCH] provider=${this.tavilyProvider.name} status=success sourceCount=${allSources.length}`);
      } else {
        tavilyStatus = "NO_RESULTS";
        console.log(`[WEB-SEARCH] provider=${this.tavilyProvider.name} status=no_results sourceCount=0`);
      }
    } catch (err) {
      tavilyStatus = "FAILED";
      console.log(`[WEB-SEARCH] provider=${this.tavilyProvider.name} status=failure sourceCount=0 error="${err.message}"`);
    }

    // Phase 5: Multi-Factor Source & Snippet Deduplication (URL + Title/Snippet similarity)
    const seenUrls = new Set();
    const seenTitles = new Set();
    const rawDeduplicated = [];

    for (const src of allSources) {
      if (!src.url || seenUrls.has(src.url)) continue;

      // Title normalization (remove punctuation, extra spaces)
      const normTitle = (src.title || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (normTitle && seenTitles.has(normTitle)) continue;

      seenUrls.add(src.url);
      if (normTitle) seenTitles.add(normTitle);
      rawDeduplicated.push(src);
    }

    // Assign clean, stable, deterministic sequential source IDs (src_1, src_2, src_3...)
    const deduplicatedSources = rawDeduplicated.map((src, index) => ({
      ...src,
      sourceId: `src_${index + 1}`,
    }));

    const webSearchSuccess = deduplicatedSources.length > 0;
    const now = new Date().toISOString();

    console.log(
      `[WEB-SEARCH] provider=${this.tavilyProvider.name} queries=${JSON.stringify(boundedQueries)} resultCount=${allSources.length} deduplicatedCount=${deduplicatedSources.length}`
    );

    const webResearchMetadata = {
      enabled: true,
      primaryProvider: this.tavilyProvider.name,
      providersUsed,
      queries: boundedQueries,
      rawCount: allSources.length,
      sourceCount: deduplicatedSources.length,
      fallbackUsed: false,
      retrievedAt: now,
    };

    return {
      sources: deduplicatedSources,
      researchAvailability: {
        webSearch: webSearchSuccess,
        provider: webSearchSuccess ? activeProviderName : null,
        tavilyStatus,
        queryCount: boundedQueries.length,
        sourceCount: deduplicatedSources.length,
      },
      webResearch: webResearchMetadata,
    };
  }
}

export function createWebSearchProvider() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (apiKey) {
    return new TavilyWebSearchProvider(apiKey);
  }
  return new NullWebSearchProvider();
}

