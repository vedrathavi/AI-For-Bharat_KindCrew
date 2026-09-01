import { invokeLLM, resolveAIProvider } from "../../ai/llm.adapter.js";

export function getResearchModelId() {
  const provider = resolveAIProvider();
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (provider === "deepseek") return process.env.DEEPSEEK_MODEL || "deepseek-chat";
  return (
    process.env.BEDROCK_RESEARCH_MODEL ||
    process.env.BEDROCK_DEFAULT_MODEL ||
    "google.gemma-3-12b-it"
  );
}

/**
 * Invoke research model with prompt and system constraints across OpenAI, DeepSeek, or Gemma/Bedrock.
 */
export async function invokeBedrockResearch(prompt, contextLabel = "Research Synthesis") {
  return invokeLLM({
    prompt,
    systemPrompt:
      "You are an expert content researcher and strategist. Return ONLY valid JSON matching the requested structure. Do NOT include markdown code blocks or explanations.",
    contextLabel,
    temperature: 0.6,
    maxTokens: 3000,
  });
}
