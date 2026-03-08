import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const MODEL_ID = process.env.BEDROCK_DEFAULT_MODEL;

/**
 * Generate content outline from idea
 */
async function generateOutline(ideaInput, creatorProfile = null) {
  const { topic, targetAudience, contentType, hookIdea, keyPoints, platforms } =
    ideaInput;

  const primaryPlatform = Array.isArray(platforms) ? platforms[0] : platforms;
  const keyPointsList = Array.isArray(keyPoints)
    ? keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")
    : keyPoints || "";

  // Build profile context if available
  let profileContext = "";
  if (creatorProfile) {
    profileContext = `\n\nCreator Profile Context:
- Niche: ${creatorProfile.niche?.primary || "General"}
- Content Style: ${creatorProfile.preferences?.contentStyle || "Professional"}
- Primary Goal: ${creatorProfile.goals?.primaryGoal || "Engagement"}`;
    
    if (creatorProfile.preferences?.voiceTone) {
      profileContext += `\n- Voice Tone: ${creatorProfile.preferences.voiceTone}`;
    }
  }

  const prompt = `Create a structured content outline for a ${contentType} post.

Topic: ${topic}
Platform: ${primaryPlatform}
Target Audience: ${targetAudience}
Hook Idea: ${hookIdea || "Create an engaging hook"}${profileContext}

Key Points:
${keyPointsList}

Return ONLY valid JSON with this structure:
{
  "title": "content title",
  "hook": "attention-grabbing opening line",
  "sections": ["section 1", "section 2", "section 3"],
  "cta": "call to action",
  "contentFormat": "list|story|educational|tutorial",
  "estimatedWordCount": 150
}

Make the outline engaging and optimized for ${primaryPlatform}.`;

  const params = {
    modelId: MODEL_ID,
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid outline response from AI");
  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
}

/**
 * Generate draft content from outline
 */
async function generateDraft(ideaInput, outline, creatorProfile = null) {
  const { targetAudience, contentType, platforms, preferences } = ideaInput;
  const primaryPlatform = Array.isArray(platforms) ? platforms[0] : platforms;

  const tone = preferences?.tone || creatorProfile?.preferences?.voiceTone || "professional";
  const length = preferences?.length || "medium";

  const sectionsText = outline.sections
    .map((section, i) => `${i + 1}. ${section}`)
    .join("\n");

  // Build profile context if available
  let profileContext = "";
  if (creatorProfile) {
    profileContext = `\n\nCreator's Voice & Style:
- Style: ${creatorProfile.preferences?.contentStyle || "Professional"}
- Approach: ${creatorProfile.strategy?.contentApproach || "Value-driven"}`;
    
    if (creatorProfile.preferences?.avoidTopics?.length > 0) {
      profileContext += `\n- Avoid: ${creatorProfile.preferences.avoidTopics.join(", ")}`;
    }
  }

  const prompt = `Write a high-quality ${contentType} post for ${primaryPlatform}.

Target Audience: ${targetAudience}
Tone: ${tone}
Length: ${length}${profileContext}

Hook:
${outline.hook}

Sections to cover:
${sectionsText}

Call to Action:
${outline.cta}

Guidelines:
- Write in short, skimmable paragraphs
- Use line breaks for readability
- Make it ${primaryPlatform}-optimized
- Use emojis sparingly if appropriate for ${primaryPlatform}
- Make it conversational and engaging
- Focus on value for ${targetAudience}

Return ONLY the complete post text, ready to publish.`;

  const params = {
    modelId: MODEL_ID,
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const draftText = response.output.message.content[0].text.trim();

    return { text: draftText };
  } catch (error) {
    console.error("Error generating draft:", error);
    throw error;
  }
}

/**
 * Generate LinkedIn content package
 */
async function generateLinkedInVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into an optimized LinkedIn post.

Original Content:
${draft.text}

Target Audience: ${ideaInput.targetAudience}

Guidelines:
- Professional but conversational tone
- 3-5 relevant hashtags
- Clear formatting with line breaks
- Add emojis for visual interest (not excessive)
- Make it scannable

Return ONLY valid JSON:
{
  "postText": "complete linkedin post",
  "hashtags": ["#Hashtag1", "#Hashtag2"],
  "estimatedReadingTime": "45 seconds"
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "linkedin", ...variant };
    }

    throw new Error("Invalid LinkedIn variant response");
  } catch (error) {
    console.error("Error generating LinkedIn variant:", error);
    throw error;
  }
}

/**
 * Generate Twitter/X content package
 */
async function generateTwitterVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into a Twitter/X thread.

Original Content:
${draft.text}

Guidelines:
- Break into tweet-sized chunks (max 280 chars each)
- First tweet should hook attention
- Use numbered format if listing items
- 2-3 relevant hashtags
- End with CTA

Return ONLY valid JSON:
{
  "thread": ["tweet 1", "tweet 2", "tweet 3"],
  "hashtags": ["#AI", "#Tech"],
  "tweetCount": 5
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "twitter", ...variant };
    }

    throw new Error("Invalid Twitter variant response");
  } catch (error) {
    console.error("Error generating Twitter variant:", error);
    throw error;
  }
}

/**
 * Generate Instagram content package
 */
async function generateInstagramVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into an Instagram carousel/post caption.

Original Content:
${draft.text}

Guidelines:
- Engaging caption (first 125 chars are critical)
- 10-15 relevant hashtags
- Include alt text description
- Suggest cover text
- Encourage saves/shares

Return ONLY valid JSON:
{
  "caption": "instagram caption",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "altText": "image description",
  "coverText": "slide 1 cover text",
  "tagSuggestions": ["topic1", "topic2"]
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "instagram", ...variant };
    }

    throw new Error("Invalid Instagram variant response");
  } catch (error) {
    console.error("Error generating Instagram variant:", error);
    throw error;
  }
}

/**
 * Generate Reddit content package
 */
async function generateRedditVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into a Reddit post.

Original Content:
${draft.text}

Target Audience: ${ideaInput.targetAudience}

Guidelines:
- Reddit-appropriate tone (genuine, not salesy)
- Catchy title
- Natural conversational style
- Suggest relevant subreddits

Return ONLY valid JSON:
{
  "title": "reddit post title",
  "postBody": "reddit post content",
  "subredditSuggestions": ["subreddit1", "subreddit2"]
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "reddit", ...variant };
    }

    throw new Error("Invalid Reddit variant response");
  } catch (error) {
    console.error("Error generating Reddit variant:", error);
    throw error;
  }
}

/**
 * Generate YouTube content package
 */
async function generateYouTubeVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into YouTube video metadata.

Topic: ${ideaInput.topic}

Sections:
${outline.sections.join("\n")}

Guidelines:
- SEO-optimized title
- Detailed description
- 10-15 relevant tags
- Chapter markers
- Thumbnail text suggestion

Return ONLY valid JSON:
{
  "title": "youtube title",
  "description": "video description",
  "tags": ["tag1", "tag2"],
  "chapters": ["chapter 1", "chapter 2"],
  "thumbnailText": "thumbnail text",
  "shortHook": "youtube shorts hook"
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "youtube", ...variant };
    }

    throw new Error("Invalid YouTube variant response");
  } catch (error) {
    console.error("Error generating YouTube variant:", error);
    throw error;
  }
}

/**
 * Generate Medium/Blog content package
 */
async function generateMediumVariant(draft, outline, ideaInput) {
  const prompt = `Convert this content into a Medium blog post metadata.

Topic: ${ideaInput.topic}
Original Content:
${draft.text}

Guidelines:
- Compelling title and subtitle
- 5 relevant tags
- SEO description
- Estimated reading time

Return ONLY valid JSON:
{
  "title": "blog title",
  "subtitle": "subtitle",
  "tags": ["tag1", "tag2"],
  "seoDescription": "meta description",
  "readingTime": "5 min"
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const variant = JSON.parse(jsonMatch[0]);
      return { platform: "medium", body: draft.text, ...variant };
    }

    throw new Error("Invalid Medium variant response");
  } catch (error) {
    console.error("Error generating Medium variant:", error);
    throw error;
  }
}

/**
 * Generate video script for platforms that support video
 */
async function generateVideoScript(outline, ideaInput, platform) {
  const targetDuration =
    platform === "youtube" ? "45-60 seconds" : "30-40 seconds";

  const prompt = `Create a short video script for ${platform}.

Topic: ${ideaInput.topic}
Hook: ${outline.hook}
Key Points: ${outline.sections.join(", ")}
Target Duration: ${targetDuration}

Structure:
- Hook (3-5 seconds)
- Main points (25-40 seconds)
- CTA (3-5 seconds)

Return ONLY valid JSON:
{
  "duration": "45 seconds",
  "sections": [
    {"type": "hook", "text": "hook text"},
    {"type": "point", "text": "point 1"},
    {"type": "point", "text": "point 2"},
    {"type": "cta", "text": "cta text"}
  ]
}`;

  const params = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
  };

  try {
    const command = new ConverseCommand(params);
    const response = await client.send(command);
    const text = response.output.message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Invalid script response");
  } catch (error) {
    console.error("Error generating video script:", error);
    throw error;
  }
}

/**
 * Main function to generate all platform variants
 */
async function generateAllPlatformVariants(draft, outline, ideaInput, platforms) {
  const platformVariants = {};

  // Generate variants for requested platforms
  for (const platform of platforms) {
    try {
      switch (platform.toLowerCase()) {
        case "linkedin":
          platformVariants.linkedin = await generateLinkedInVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "twitter":
        case "x":
          platformVariants.twitter = await generateTwitterVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "instagram":
          platformVariants.instagram = await generateInstagramVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "tiktok":
          // Reuse Instagram-style short-form structure for TikTok publish fields.
          platformVariants.tiktok = await generateInstagramVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "reddit":
          platformVariants.reddit = await generateRedditVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "youtube":
          platformVariants.youtube = await generateYouTubeVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "medium":
          platformVariants.medium = await generateMediumVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        case "blog":
          platformVariants.blog = await generateMediumVariant(
            draft,
            outline,
            ideaInput
          );
          break;
        default:
          console.warn(`Platform ${platform} not supported yet`);
      }
    } catch (error) {
      console.error(`Error generating ${platform} variant:`, error);
    }
  }

  return platformVariants;
}

/**
 * Generate video scripts for video-enabled platforms
 */
async function generateScriptsForPlatforms(outline, ideaInput, platforms) {
  const scripts = {};
  const videoPlatforms = ["youtube", "instagram", "linkedin", "tiktok"];

  for (const platform of platforms) {
    if (videoPlatforms.includes(platform.toLowerCase())) {
      try {
        const scriptKey =
          platform.toLowerCase() === "instagram"
            ? "instagramReel"
            : platform.toLowerCase();
        scripts[scriptKey] = await generateVideoScript(
          outline,
          ideaInput,
          platform
        );
      } catch (error) {
        console.error(`Error generating ${platform} script:`, error);
      }
    }
  }

  return scripts;
}

export {
  generateOutline,
  generateDraft,
  generateAllPlatformVariants,
  generateScriptsForPlatforms,
  generateLinkedInVariant,
  generateTwitterVariant,
  generateInstagramVariant,
  generateRedditVariant,
  generateYouTubeVariant,
  generateMediumVariant,
  generateVideoScript,
};
