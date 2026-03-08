#!/usr/bin/env node

/**
 * Bedrock Integration Test Script
 * Tests all Bedrock API endpoints
 * 
 * Usage: node scripts/testBedrock.js
 */

import axios from "axios";
import colors from "colors";

const API_BASE_URL = "http://localhost:5000/api/bedrock";

class BedrockTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  log(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case "success":
        console.log(`${prefix} ✅ ${colors.green(message)}`);
        break;
      case "error":
        console.log(`${prefix} ❌ ${colors.red(message)}`);
        break;
      case "info":
        console.log(`${prefix} ℹ️  ${colors.blue(message)}`);
        break;
      case "warning":
        console.log(`${prefix} ⚠️  ${colors.yellow(message)}`);
        break;
      case "header":
        console.log(`\n${colors.cyan("═".repeat(60))}`);
        console.log(`${colors.cyan(message)}`);
        console.log(`${colors.cyan("═".repeat(60))}\n`);
        break;
      default:
        console.log(message);
    }
  }

  printResponse(response) {
    if (response.status === 200 && response.data.success) {
      this.log("Response successful", "success");
    } else {
      this.log(`Status: ${response.status}`, "warning");
    }
    console.log(colors.gray(JSON.stringify(response.data, null, 2)));
  }

  async testHealthCheck() {
    this.log("header", "🏥 HEALTH CHECK TEST");

    try {
      this.log("Sending health check request...");
      const response = await this.client.post("/health-check");

      if (response.status === 200 && response.data.success) {
        this.log("Bedrock service is healthy!", "success");
        this.printResponse(response);
        return true;
      } else {
        this.log("Health check failed", "error");
        this.printResponse(response);
        return false;
      }
    } catch (error) {
      this.log(`Health check error: ${error.message}`, "error");
      return false;
    }
  }

  async testGetModels() {
    this.log("header", "📦 AVAILABLE MODELS TEST");

    try {
      this.log("Fetching available models...");
      const response = await this.client.get("/models");

      if (response.status === 200 && response.data.success) {
        this.log(
          `Found ${Object.keys(response.data.data).length} model providers`,
          "success"
        );

        // Print model summary
        Object.entries(response.data.data).forEach(([provider, models]) => {
          console.log(`\n${colors.yellow(`${provider.toUpperCase()}`)}:`);
          models.forEach((model) => {
            console.log(`  • ${model.name}`);
            console.log(`    ID: ${model.id}`);
            console.log(`    ${model.description}`);
          });
        });

        return true;
      } else {
        this.log("Failed to fetch models", "error");
        this.printResponse(response);
        return false;
      }
    } catch (error) {
      this.log(`Error fetching models: ${error.message}`, "error");
      return false;
    }
  }

  async testSimpleConverse() {
    this.log("header", "💬 SIMPLE MESSAGE TEST");

    try {
      const message = "What are the top 3 tips for growing a YouTube channel?";
      this.log(`Sending message: "${message}"`);

      const response = await this.client.post("/converse", {
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        maxTokens: 500,
        temperature: 0.7,
      });

      if (response.status === 200 && response.data.success) {
        this.log("Message processed successfully", "success");
        this.log(`Response: "${response.data.data.content}"`);
        this.log(
          `Tokens used - Input: ${response.data.data.usage.inputTokens}, Output: ${response.data.data.usage.outputTokens}`,
          "info"
        );
        return true;
      } else {
        this.log("Message processing failed", "error");
        this.printResponse(response);
        return false;
      }
    } catch (error) {
      this.log(`Error sending message: ${error.message}`, "error");
      return false;
    }
  }

  async testMultiTurnConversation() {
    this.log("header", "🔄 MULTI-TURN CONVERSATION TEST");

    try {
      const messages = [
        {
          role: "user",
          content: "What are the main content pillars for a tech creator?",
        },
        {
          role: "assistant",
          content:
            "The main content pillars for a tech creator typically include: tutorials, product reviews, industry trends, personal experiences, and educational content.",
        },
        {
          role: "user",
          content:
            "How often should I post content for maximum audience engagement?",
        },
      ];

      this.log("Starting multi-turn conversation...");
      messages.forEach((msg, idx) => {
        this.log(
          `Turn ${idx + 1}: ${msg.role.toUpperCase()} - ${msg.content.substring(0, 50)}...`
        );
      });

      const response = await this.client.post("/converse", {
        messages,
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        systemPrompt:
          "You are a content strategy expert for tech creators.",
        maxTokens: 800,
        temperature: 0.6,
      });

      if (response.status === 200 && response.data.success) {
        this.log("Multi-turn conversation succeeded", "success");
        this.log(`Final Response: "${response.data.data.content}"`);
        return true;
      } else {
        this.log("Multi-turn conversation failed", "error");
        this.printResponse(response);
        return false;
      }
    } catch (error) {
      this.log(`Error in multi-turn conversation: ${error.message}`, "error");
      return false;
    }
  }

  async testWithSystemPrompt() {
    this.log("header", "🎯 SYSTEM PROMPT TEST");

    try {
      const systemPrompt =
        "You are an expert content coach for Indian creators. Provide advice tailored to Indian audiences and platforms.";
      const userMessage =
        "How can I grow my following on YouTube in India?";

      this.log(`System Prompt: "${systemPrompt}"`);
      this.log(`User Message: "${userMessage}"`);

      const response = await this.client.post("/converse", {
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        systemPrompt,
        maxTokens: 1000,
        temperature: 0.8,
      });

      if (response.status === 200 && response.data.success) {
        this.log("System prompt test succeeded", "success");
        this.log(`Response: "${response.data.data.content}"`);
        return true;
      } else {
        this.log("System prompt test failed", "error");
        this.printResponse(response);
        return false;
      }
    } catch (error) {
      this.log(`Error with system prompt: ${error.message}`, "error");
      return false;
    }
  }

  async testDifferentModels() {
    this.log("header", "🔀 TEST DIFFERENT MODELS");

    const models = [
      {
        id: "anthropic.claude-3-sonnet-20240229-v1:0",
        name: "Claude 3 Sonnet",
      },
      {
        id: "anthropic.claude-3-haiku-20240307-v1:0",
        name: "Claude 3 Haiku",
      },
    ];

    let allPassed = true;

    for (const model of models) {
      try {
        this.log(`Testing model: ${model.name} (${model.id})`);

        const response = await this.client.post("/converse", {
          messages: [
            {
              role: "user",
              content:
                "Say your name and briefly describe your capabilities.",
            },
          ],
          modelId: model.id,
          maxTokens: 200,
          temperature: 0.5,
        });

        if (response.status === 200 && response.data.success) {
          this.log(`${model.name} test passed`, "success");
          console.log(colors.gray(`Response: ${response.data.data.content}`));
        } else {
          this.log(`${model.name} test failed`, "error");
          allPassed = false;
        }
      } catch (error) {
        this.log(
          `Error testing ${model.name}: ${error.message}`,
          "error"
        );
        allPassed = false;
      }

      console.log("");
    }

    return allPassed;
  }

  async testErrorHandling() {
    this.log("header", "⚠️  ERROR HANDLING TEST");

    // Test 1: Missing messages
    try {
      this.log("Test 1: Missing messages array...");
      const response = await this.client.post("/converse", {
        modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      });

      if (response.status === 400) {
        this.log("Correctly caught missing messages error", "success");
      } else {
        this.log("Error handling test 1 failed", "error");
      }
    } catch (error) {
      this.log(`Unexpected error: ${error.message}`, "error");
    }

    // Test 2: Invalid message structure
    try {
      this.log("Test 2: Invalid message structure...");
      const response = await this.client.post("/converse", {
        messages: [
          {
            role: "user",
            // Missing content field
          },
        ],
      });

      if (response.status === 400) {
        this.log("Correctly caught invalid message structure error", "success");
      } else {
        this.log("Error handling test 2 failed", "error");
      }
    } catch (error) {
      this.log(`Unexpected error: ${error.message}`, "error");
    }
  }

  async runAllTests() {
    this.log("header", "🚀 BEDROCK API TEST SUITE");
    this.log(`Testing Bedrock service at: ${colors.cyan(API_BASE_URL)}\n`);

    const results = {
      "Health Check": await this.testHealthCheck(),
      "Get Models": await this.testGetModels(),
      "Simple Message": await this.testSimpleConverse(),
      "Multi-turn Conversation": await this.testMultiTurnConversation(),
      "System Prompt": await this.testWithSystemPrompt(),
      "Different Models": await this.testDifferentModels(),
      "Error Handling": await this.testErrorHandling(),
    };

    // Print summary
    this.log("header", "📊 TEST RESULTS SUMMARY");
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? colors.green("✅ PASSED") : colors.red("❌ FAILED");
      console.log(`${test}: ${status}`);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter((r) => r).length;

    console.log(
      `\n${colors.cyan(`Total: ${passedTests}/${totalTests} tests passed`)}`
    );

    if (passedTests === totalTests) {
      this.log("🎉 All tests passed! Bedrock integration is ready to use.", "success");
    } else {
      this.log("⚠️  Some tests failed. Check the configuration.", "warning");
    }
  }
}

// Run tests
const tester = new BedrockTester();
tester.runAllTests().catch(console.error);
