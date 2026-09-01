import axios from "axios";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "ap-south-1" });

/**
 * Universal Multi-Provider AI LLM Adapter for KindCrew
 * Seamlessly supports:
 * 1. OpenAI (gpt-4o, gpt-4o-mini) -> via OPENAI_API_KEY
 * 2. DeepSeek (deepseek-chat, deepseek-reasoner) -> via DEEPSEEK_API_KEY
 * 3. Google Gemma on AWS Bedrock (google.gemma-3-12b-it) -> via AWS credentials
 */

export function resolveAIProvider() {
  const explicit = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  if (explicit === "openai" || explicit === "gpt") return "openai";
  if (explicit === "deepseek") return "deepseek";
  if (explicit === "gemma" || explicit === "bedrock") return "gemma";

  // Auto-detection based on configured keys
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  return "gemma";
}

/**
 * Clean and extract JSON object from raw LLM output text.
 */
export function extractJsonFromText(rawText, contextLabel = "LLM") {
  const sanitized = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find outermost JSON object or array
  const start = sanitized.search(/[\[{]/);
  if (start === -1) {
    throw new Error(`[${contextLabel}] No JSON object found in response`);
  }

  const opener = sanitized[start];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaped = false;
  let extracted = null;

  for (let i = start; i < sanitized.length; i += 1) {
    const ch = sanitized[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === opener) depth += 1;
    else if (ch === closer) {
      depth -= 1;
      if (depth === 0) {
        extracted = sanitized.slice(start, i + 1);
        break;
      }
    }
  }

  const jsonStr = extracted || sanitized;

  try {
    return JSON.parse(jsonStr);
  } catch (_firstErr) {
    const cleaned = jsonStr
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Universal LLM Invoker
 */
export async function invokeLLM({
  prompt,
  systemPrompt = "You are an expert content researcher and strategist. Return ONLY valid JSON matching the requested structure.",
  contextLabel = "AI Synthesis",
  temperature = 0.6,
  maxTokens = 3000,
}) {
  const provider = resolveAIProvider();

  // --- 1. OpenAI Provider ---
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    console.log(`[AI_LLM] provider=openai model=${model} context="${contextLabel}"`);
    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      const rawText = res.data?.choices?.[0]?.message?.content || "";
      return extractJsonFromText(rawText, contextLabel);
    } catch (err) {
      console.error(`❌ [OpenAI] Error:`, err.response?.data || err.message);
      throw new Error(`OpenAI call failed (${contextLabel}): ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- 2. DeepSeek Provider ---
  if (provider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
    console.log(`[AI_LLM] provider=deepseek model=${model} context="${contextLabel}"`);
    try {
      const res = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      const rawText = res.data?.choices?.[0]?.message?.content || "";
      return extractJsonFromText(rawText, contextLabel);
    } catch (err) {
      console.error(`❌ [DeepSeek] Error:`, err.response?.data || err.message);
      throw new Error(`DeepSeek call failed (${contextLabel}): ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- 3. Google Gemma / AWS Bedrock Provider ---
  const modelId = process.env.BEDROCK_RESEARCH_MODEL || process.env.BEDROCK_DEFAULT_MODEL || "google.gemma-3-12b-it";
  console.log(`[AI_LLM] provider=gemma model=${modelId} region=${process.env.AWS_REGION || "ap-south-1"} context="${contextLabel}"`);

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: "user",
        content: [{ text: `${systemPrompt}\n\n${prompt}` }],
      },
    ],
    inferenceConfig: {
      maxTokens,
      temperature,
    },
  });

  try {
    const response = await bedrockClient.send(command);
    const text = response.output?.message?.content?.[0]?.text || "";
    if (!text.trim()) {
      throw new Error(`Empty response from Bedrock (${contextLabel})`);
    }
    return extractJsonFromText(text, contextLabel);
  } catch (error) {
    console.error(`❌ [Bedrock/Gemma] Call error (${contextLabel}):`, error.message);
    throw error;
  }
}
