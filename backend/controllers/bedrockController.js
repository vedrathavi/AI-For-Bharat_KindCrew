import * as bedrock from "../services/bedrock.service.js";

// Simple converse - send message and get response
export const converse = async (req, res) => {
  try {
    const { messages, modelId = "google.gemma-3-12b-it", systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages array is required",
      });
    }

    const result = await bedrock.converse(messages, modelId, systemPrompt);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

// Health check
export const healthCheck = async (req, res) => {
  try {
    const result = await bedrock.generateText(
      "Say OK if you can hear me",
      "google.gemma-3-12b-it"
    );
    res.json({
      success: true,
      status: "healthy",
      message: result.content,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
};
