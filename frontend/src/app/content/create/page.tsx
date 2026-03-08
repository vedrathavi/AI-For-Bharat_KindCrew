"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";

const platforms = ["linkedin", "twitter", "instagram", "youtube", "reddit", "medium"];
const contentTypes = ["list-post", "story", "educational", "tutorial", "opinion", "case-study"];
const tones = ["professional", "casual", "educational", "inspirational", "humorous"];
const goals = ["growth", "engagement", "authority", "conversion"];

export default function ManualContentCreation() {
  const router = useRouter();
  const { userInfo, initializeAuth } = useAuth();
  const { createFromManual: createContentAction, loading, error: storeError, setError } = useContent();
  const [error, setLocalError] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const [formData, setFormData] = useState({
    topic: "",
    platforms: ["linkedin"] as string[],
    contentType: "list-post",
    targetAudience: "",
    goal: "engagement",
    hookIdea: "",
    keyPoints: ["", "", ""],
    tone: "professional",
    length: "medium",
    includeCTA: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const handleKeyPointChange = (index: number, value: string) => {
    setFormData(prev => {
      const keyPoints = [...prev.keyPoints];
      keyPoints[index] = value;
      return { ...prev, keyPoints };
    });
  };

  const addKeyPoint = () => {
    setFormData(prev => ({
      ...prev,
      keyPoints: [...prev.keyPoints, ""],
    }));
  };

  const removeKeyPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!formData.topic.trim()) {
      setLocalError("Please enter a topic");
      return;
    }

    if (formData.platforms.length === 0) {
      setLocalError("Please select at least one platform");
      return;
    }

    const validKeyPoints = formData.keyPoints.filter(point => point.trim() !== "");

    if (validKeyPoints.length === 0) {
      setLocalError("Please enter at least one key point");
      return;
    }

    if (!userInfo?.userId) {
      setLocalError("Your session is not ready. Please refresh and try again.");
      return;
    }

    const result = await createContentAction(userInfo.userId, {
      topic: formData.topic,
      platforms: formData.platforms,
      contentType: formData.contentType,
      targetAudience: formData.targetAudience || "general audience",
      goal: formData.goal,
      hookIdea: formData.hookIdea || null,
      keyPoints: validKeyPoints,
      preferences: {
        tone: formData.tone,
        length: formData.length,
        includeCTA: formData.includeCTA,
      },
    });

    if (result) {
      // Navigate to content library or preview page
      router.push(`/content/library`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/ideation" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Ideation
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Custom Content</h1>
          <p className="text-gray-600">Skip ideation and create content directly from your own idea</p>
        </div>

        {(error || storeError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error || storeError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Topic */}
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
              Topic / Idea *
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., 5 AI tools founders use to save 10 hours/week"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Platforms *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.platforms.includes(platform)
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label htmlFor="contentType" className="block text-sm font-semibold text-gray-700 mb-2">
              Content Type *
            </label>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {contentTypes.map(type => (
                <option key={type} value={type}>
                  {type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              placeholder="e.g., startup founders, tech professionals"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="goal" className="block text-sm font-semibold text-gray-700 mb-2">
              Goal
            </label>
            <select
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {goals.map(goal => (
                <option key={goal} value={goal}>
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Hook Idea */}
          <div>
            <label htmlFor="hookIdea" className="block text-sm font-semibold text-gray-700 mb-2">
              Hook Idea (Optional)
            </label>
            <textarea
              id="hookIdea"
              name="hookIdea"
              value={formData.hookIdea}
              onChange={handleInputChange}
              placeholder="e.g., Most founders waste hours doing repetitive work"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Key Points */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Points *
            </label>
            <div className="space-y-3">
              {formData.keyPoints.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={e => handleKeyPointChange(index, e.target.value)}
                    placeholder={`Key point ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {formData.keyPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyPoint(index)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addKeyPoint}
              className="mt-3 text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add another key point
            </button>
          </div>

          {/* Tone */}
          <div>
            <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 mb-2">
              Tone
            </label>
            <select
              id="tone"
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {tones.map(tone => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Length */}
          <div>
            <label htmlFor="length" className="block text-sm font-semibold text-gray-700 mb-2">
              Content Length
            </label>
            <select
              id="length"
              name="length"
              value={formData.length}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          {/* Include CTA */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeCTA"
              name="includeCTA"
              checked={formData.includeCTA}
              onChange={handleInputChange}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="includeCTA" className="text-sm font-medium text-gray-700">
              Include Call-to-Action
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              }`}
            >
              {loading ? "Generating Content..." : "Generate Content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
