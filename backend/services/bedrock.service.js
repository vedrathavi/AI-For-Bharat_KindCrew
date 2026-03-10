import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Use AWS_REGION from .env (same as other AWS services)
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

// Simple converse method - matches Amazon's example
export async function converse(
  messages,
  modelId,
  systemPrompt = null,
  temperature = 0.8,
) {
  try {
    const commandParams = {
      modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.content }],
      })),
      inferenceConfig: {
        temperature,
        maxTokens: 512,
      },
    };

    // Add system prompt if provided
    if (systemPrompt) {
      commandParams.system = [{ text: systemPrompt }];
    }

    const command = new ConverseCommand(commandParams);
    const response = await client.send(command);

    return {
      success: true,
      content: response.output?.message?.content?.[0]?.text || "",
      usage: {
        inputTokens: response.usage?.inputTokens,
        outputTokens: response.usage?.outputTokens,
      },
      stopReason: response.stopReason,
    };
  } catch (error) {
    console.error("Bedrock Error:", error.message);
    throw error;
  }
}

// Generate text with simple interface
export async function generateText(
  userMessage,
  modelId,
  systemPrompt = null,
  temperature = 0.8,
) {
  const messages = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  return converse(messages, modelId, systemPrompt, temperature);
}
