"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import { extractUserFromToken } from "@/lib/jwtDecode";
import { toast } from "sonner";
import { FiInfo } from "react-icons/fi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import type { CreatorProfileData, Platform } from "@/lib/api/creatorProfile";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const { token, isAuthenticated, authReady, initializeAuth, setAuth } =
    useAuth();
  const {
    createProfile,
    updateProfile,
    completeOnboarding,
    profileLoading,
    hasProfile,
    profileChecked,
    fetchProfile,
    creatorProfile,
  } = useAppStore();

  // Form state
  const [formData, setFormData] = useState<CreatorProfileData>({
    niche: {
      primary: "",
      secondary: "",
    },
    targetAudience: "",
    platforms: [],
    goals: {
      primaryGoal: "growth",
      creatorLevel: "beginner",
    },
    strategy: {
      contentStrategy: "educational",
      postingFrequency: "",
      contentPillars: [],
    },
    preferences: {
      tones: [],
      formats: [],
      constraints: {
        emojiUsage: false,
        ctaStrength: "medium",
        formality: "semi-formal",
      },
      timeCommitment: "medium",
    },
    competitors: [],
  });

  // Temp state for array inputs
  const [newPlatform, setNewPlatform] = useState({ name: "", handle: "" });
  const [newPillar, setNewPillar] = useState("");
  const [newTone, setNewTone] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [isOtherNiche, setIsOtherNiche] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    url: "",
    notes: "",
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Handle token from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (urlToken) {
      const user = extractUserFromToken(urlToken);

      if (user) {
        setAuth({ token: urlToken, user });
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
    }
  }, [router, setAuth]);

  // Redirect if already has profile or not authenticated
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (authReady && token && isAuthenticated() && !profileChecked) {
      fetchProfile(token);
    }
  }, [authReady, token, isAuthenticated, profileChecked, fetchProfile]);

  // Load existing profile data for editing (only once!)
  useEffect(() => {
    if (hasProfile && creatorProfile && !profileLoaded) {
      console.log("📂 [INIT] Loading profile data into form ONCE");
      setFormData({
        niche: creatorProfile.niche || { primary: "", secondary: "" },
        targetAudience: creatorProfile.targetAudience || "",
        platforms: creatorProfile.platforms || [],
        goals: creatorProfile.goals || {
          primaryGoal: "growth",
          creatorLevel: "beginner",
        },
        strategy: creatorProfile.strategy || {
          contentStrategy: "educational",
          postingFrequency: "",
          contentPillars: [],
        },
        preferences: creatorProfile.preferences || {
          tones: [],
          formats: [],
          constraints: {
            emojiUsage: false,
            ctaStrength: "medium",
            formality: "semi-formal",
          },
          timeCommitment: "medium",
        },
        competitors: creatorProfile.competitors || [],
      });

      // If niche is a custom value (not in the standard list), set it as custom
      const standardNiches = [
        "ai-ml",
        "web-dev",
        "mobile-dev",
        "cybersecurity",
        "devops",
        "data-science",
        "tech-general",
        "yoga",
        "weightlifting",
        "running",
        "nutrition",
        "fitness-general",
        "marketing",
        "sales",
        "leadership",
        "entrepreneurship",
        "finance",
        "business-general",
        "personal-dev",
        "productivity",
        "lifestyle",
        "education",
        "entertainment",
        "food",
        "travel",
        "fashion",
        "gaming",
        "art",
        "music",
        "photography",
        "parenting",
        "pets",
        "sustainability",
      ];
      if (
        creatorProfile.niche?.primary &&
        !standardNiches.includes(creatorProfile.niche.primary)
      ) {
        setCustomNiche(creatorProfile.niche.primary);
      }

      setProfileLoaded(true); // ← Mark profile as loaded so this effect doesn't run again
    }
  }, [hasProfile, creatorProfile, profileLoaded]);

  // Debug: Log whenever formData.competitors changes
  useEffect(() => {
    console.log(
      "🔍 [DEBUG] formData.competitors changed:",
      formData.competitors,
      "Length:",
      formData.competitors?.length,
    );
  }, [formData.competitors]);

  useEffect(() => {
    if (authReady && !isAuthenticated()) {
      router.replace("/");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    // Only redirect if profile exists, not in edit mode, AND onboarding is already completed
    if (
      profileChecked &&
      hasProfile &&
      !isEditMode &&
      creatorProfile?.settings?.onboardingCompleted
    ) {
      router.replace("/dashboard");
    }
  }, [
    profileChecked,
    hasProfile,
    isEditMode,
    creatorProfile?.settings?.onboardingCompleted,
    router,
  ]);

  const handleAddPlatform = () => {
    if (newPlatform.name && newPlatform.handle) {
      setFormData({
        ...formData,
        platforms: [
          ...(formData.platforms || []),
          { ...newPlatform, active: true },
        ],
      });
      setNewPlatform({ name: "", handle: "" });
    }
  };

  const handleRemovePlatform = (index: number) => {
    setFormData({
      ...formData,
      platforms: formData.platforms?.filter((_, i) => i !== index),
    });
  };

  const handleAddPillar = () => {
    if (newPillar && !formData.strategy.contentPillars.includes(newPillar)) {
      setFormData({
        ...formData,
        strategy: {
          ...formData.strategy,
          contentPillars: [...formData.strategy.contentPillars, newPillar],
        },
      });
      setNewPillar("");
    }
  };

  const handleRemovePillar = (pillar: string) => {
    setFormData({
      ...formData,
      strategy: {
        ...formData.strategy,
        contentPillars: formData.strategy.contentPillars.filter(
          (p) => p !== pillar,
        ),
      },
    });
  };

  const handleAddTone = () => {
    if (newTone && !formData.preferences?.tones?.includes(newTone)) {
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          tones: [...(formData.preferences?.tones || []), newTone],
        },
      });
      setNewTone("");
    }
  };

  const handleRemoveTone = (tone: string) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        tones: formData.preferences?.tones?.filter((t) => t !== tone),
      },
    });
  };

  const handleAddFormat = () => {
    if (newFormat && !formData.preferences?.formats?.includes(newFormat)) {
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          formats: [...(formData.preferences?.formats || []), newFormat],
        },
      });
      setNewFormat("");
    }
  };

  const handleRemoveFormat = (format: string) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        formats: formData.preferences?.formats?.filter((f) => f !== format),
      },
    });
  };

  const handleAddCompetitor = () => {
    console.log(
      "🏆 [BUTTON] Add Competitor clicked, newCompetitor state:",
      newCompetitor,
    );

    // Validation: at least one field required
    if (!newCompetitor.name && !newCompetitor.url && !newCompetitor.notes) {
      console.warn("🏆 [VALIDATION] No fields filled");
      toast.error("Please add at least a name or URL for the competitor");
      return;
    }

    // If notes exist, must have name or URL
    if (newCompetitor.notes && !newCompetitor.name && !newCompetitor.url) {
      console.warn("🏆 [VALIDATION] Notes exist but no name/url");
      toast.error(
        "When adding notes, please also include a competitor name or URL",
      );
      return;
    }

    const newComp = {
      competitorId: `comp_${Date.now()}`,
      name: newCompetitor.name || null,
      url: newCompetitor.url || null,
      notes: newCompetitor.notes || null,
    };
    console.log("🏆 [FORM] Adding competitor:", newComp);

    const updatedCompetitors = [...(formData.competitors || []), newComp];
    console.log(
      "🏆 [FORM] Updated competitors array after add:",
      updatedCompetitors,
    );

    setFormData({
      ...formData,
      competitors: updatedCompetitors,
    });
    console.log(
      "🏆 [FORM] FormData competitors after setState:",
      formData.competitors,
    );

    setNewCompetitor({ name: "", url: "", notes: "" });
    toast.success(`Competitor added!`);
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    setFormData({
      ...formData,
      competitors: formData.competitors?.filter(
        (c) => c.competitorId !== competitorId,
      ),
    });
  };

  const validateForm = (): boolean => {
    if (!formData.niche.primary) {
      toast.error("Please select your primary niche");
      return false;
    }
    if (!formData.targetAudience.trim()) {
      toast.error("Please select your target audience");
      return false;
    }
    if (!formData.strategy.postingFrequency) {
      toast.error("Please enter your posting frequency");
      return false;
    }
    if (formData.strategy.contentPillars.length === 0) {
      toast.error("Please add at least one content pillar");
      return false;
    }
    return true;
  };

  const handleSaveAndContinue = async () => {
    if (!validateForm()) return;
    if (!token) return;

    try {
      console.log("📤 [SAVE] Current formData state:", {
        niche: formData.niche,
        goals: formData.goals,
        strategy: { contentPillars: formData.strategy.contentPillars.length },
        platforms: formData.platforms,
        platformCount: formData.platforms?.length,
        competitors: formData.competitors,
        competitorCount: formData.competitors?.length,
      });

      // Log each competitor individually to verify structure
      if (formData.competitors && formData.competitors.length > 0) {
        console.log("📤 [SAVE] Competitors in formData:");
        formData.competitors.forEach((c, i) => {
          console.log(`  [${i}]:`, c);
        });
      } else {
        console.warn("📤 [SAVE] ⚠️ NO COMPETITORS IN FORMDATA!");
      }

      let profile;

      // If profile already exists, update it instead of creating a new one
      if (hasProfile && creatorProfile?.creatorId) {
        console.log("📝 Updating existing profile:", creatorProfile.creatorId);
        profile = await updateProfile(
          token,
          creatorProfile.creatorId,
          formData,
        );
      } else {
        console.log("✨ Creating new profile");
        profile = await createProfile(token, formData);
      }

      console.log("✅ Profile saved:", profile);

      if (profile?.creatorId) {
        console.log("📋 Completing onboarding for:", profile.creatorId);
        try {
          await completeOnboarding(token, profile.creatorId);
          console.log("✅ Onboarding completed successfully!");
        } catch (onboardingError) {
          console.error("❌ Failed to complete onboarding:", onboardingError);
          toast.error(
            "Profile saved but failed to mark onboarding as complete",
          );
        }
      }
      toast.success("Profile saved successfully!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save profile";
      toast.error(message);
      console.error(error);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (!authReady || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  const onboardingContent = (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Complete Your Creator Profile
          </h1>
          <p
            className="text-base sm:text-lg"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Tell us about yourself to personalize your experience. Optional
            fields are marked with (optional).
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6 sm:space-y-8">
          {/* Niche Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Your Niche
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <FiInfo
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-secondary)" }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the main topic areas you create content about</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Primary Niche
                </label>
                <select
                  value={isOtherNiche ? "other" : formData.niche.primary}
                  onChange={(e) => {
                    if (e.target.value === "other") {
                      setIsOtherNiche(true);
                      setFormData({
                        ...formData,
                        niche: { ...formData.niche, primary: customNiche },
                      });
                    } else {
                      setIsOtherNiche(false);
                      setCustomNiche("");
                      setFormData({
                        ...formData,
                        niche: { ...formData.niche, primary: e.target.value },
                      });
                    }
                  }}
                  className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="">Select a niche</option>
                  <option value="ai-ml">AI & Machine Learning</option>
                  <option value="web-dev">Web Development</option>
                  <option value="mobile-dev">Mobile Development</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="devops">DevOps & Cloud</option>
                  <option value="data-science">Data Science</option>
                  <option value="tech-general">Technology (General)</option>
                  <option value="yoga">Yoga & Meditation</option>
                  <option value="weightlifting">
                    Weightlifting & Strength
                  </option>
                  <option value="running">Running & Cardio</option>
                  <option value="nutrition">Nutrition & Diet</option>
                  <option value="fitness-general">
                    Fitness & Health (General)
                  </option>
                  <option value="marketing">Marketing & Advertising</option>
                  <option value="sales">Sales & Business Development</option>
                  <option value="leadership">Leadership & Management</option>
                  <option value="entrepreneurship">
                    Entrepreneurship & Startups
                  </option>
                  <option value="finance">Personal Finance & Investing</option>
                  <option value="business-general">Business (General)</option>
                  <option value="personal-dev">Personal Development</option>
                  <option value="productivity">
                    Productivity & Time Management
                  </option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="education">Education & Teaching</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="food">Food & Cooking</option>
                  <option value="travel">Travel & Adventure</option>
                  <option value="fashion">Fashion & Beauty</option>
                  <option value="gaming">Gaming & Esports</option>
                  <option value="art">Art & Design</option>
                  <option value="music">Music & Audio</option>
                  <option value="photography">Photography & Videography</option>
                  <option value="parenting">Parenting & Family</option>
                  <option value="pets">Pets & Animals</option>
                  <option value="sustainability">
                    Sustainability & Eco-Living
                  </option>
                  <option value="other">Other (Specify below)</option>
                </select>
                {isOtherNiche && (
                  <input
                    type="text"
                    value={customNiche}
                    onChange={(e) => {
                      setCustomNiche(e.target.value);
                      setFormData({
                        ...formData,
                        niche: { ...formData.niche, primary: e.target.value },
                      });
                    }}
                    placeholder="Specify your niche..."
                    className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base mt-3"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Secondary Niche (optional)
                </label>
                <input
                  type="text"
                  value={formData.niche.secondary || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      niche: { ...formData.niche, secondary: e.target.value },
                    })
                  }
                  placeholder="e.g., Personal Development"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Target Audience Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2
              className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6"
              style={{ color: "var(--color-text)" }}
            >
              Target Audience
            </h2>
            <select
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
              className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
              style={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <option value="">Select your target audience</option>
              <option value="students-general">Students (General)</option>
              <option value="high-school-students">High School Students</option>
              <option value="college-students">
                College/University Students
              </option>
              <option value="graduate-students">Graduate Students</option>
              <option value="recent-graduates">Recent Graduates</option>
              <option value="career-changers">Career Changers</option>
              <option value="entry-level-professionals">
                Entry-Level Professionals
              </option>
              <option value="mid-level-professionals">
                Mid-Level Professionals
              </option>
              <option value="senior-professionals">
                Senior Professionals/Executives
              </option>
              <option value="entrepreneurs">Entrepreneurs/Founders</option>
              <option value="solopreneurs">Solopreneurs/Freelancers</option>
              <option value="small-business-owners">
                Small Business Owners
              </option>
              <option value="corporate-enterprise">Corporate/Enterprise</option>
              <option value="content-creators">
                Content Creators/Influencers
              </option>
              <option value="coaches-consultants">Coaches/Consultants</option>
              <option value="educators">Educators/Teachers</option>
              <option value="parents">Parents</option>
              <option value="retirees">Retirees</option>
              <option value="hobbyists">Hobbyists/Enthusiasts</option>
              <option value="general-audience">General Audience</option>
            </select>
          </div>

          {/* Platforms Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2
              className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6"
              style={{ color: "var(--color-text)" }}
            >
              Social Media Platforms (optional)
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newPlatform.name}
                  onChange={(e) =>
                    setNewPlatform({ ...newPlatform, name: e.target.value })
                  }
                  placeholder="Platform (e.g., Instagram)"
                  className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <input
                  type="text"
                  value={newPlatform.handle}
                  onChange={(e) =>
                    setNewPlatform({ ...newPlatform, handle: e.target.value })
                  }
                  placeholder="@handle"
                  className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  onClick={handleAddPlatform}
                  className="px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-surface-hover)",
                    color: "var(--color-text)",
                  }}
                >
                  Add
                </button>
              </div>
              {formData.platforms && formData.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.platforms.map((platform, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ color: "var(--color-text)" }}>
                        {platform.name}: {platform.handle}
                      </span>
                      <button
                        onClick={() => handleRemovePlatform(index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goals Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Your Goals
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <FiInfo
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-secondary)" }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tell us what you want to achieve as a creator</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Primary Goal
                </label>
                <select
                  value={formData.goals.primaryGoal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      goals: {
                        ...formData.goals,
                        primaryGoal: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="growth">Audience Growth</option>
                  <option value="monetization">Monetization</option>
                  <option value="engagement">Engagement</option>
                  <option value="brand-building">Brand Building</option>
                  <option value="community-building">Community Building</option>
                  <option value="personal-brand">Personal Branding</option>
                  <option value="thought-leadership">Thought Leadership</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Creator Level
                </label>
                <select
                  value={formData.goals.creatorLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      goals: {
                        ...formData.goals,
                        creatorLevel: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="beginner">Beginner (Just Starting)</option>
                  <option value="intermediate">
                    Intermediate (Some Experience)
                  </option>
                  <option value="advanced">Advanced (Experienced)</option>
                  <option value="expert">Expert (Industry Leader)</option>
                  <option value="professional">
                    Professional (Full-Time Creator)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Strategy Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Content Strategy
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <FiInfo
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-secondary)" }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define how you plan to create and share content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Content Type
                </label>
                <select
                  value={formData.strategy.contentStrategy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strategy: {
                        ...formData.strategy,
                        contentStrategy: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="educational">Educational & How-To</option>
                  <option value="entertainment">Entertainment & Fun</option>
                  <option value="promotional">Promotional & Sales</option>
                  <option value="inspirational">
                    Inspirational & Motivational
                  </option>
                  <option value="news">News & Updates</option>
                  <option value="mixed">Mixed (Variety)</option>
                  <option value="storytelling">Storytelling & Narrative</option>
                  <option value="behind-scenes">Behind the Scenes</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Posting Frequency
                </label>
                <input
                  type="text"
                  value={formData.strategy.postingFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strategy: {
                        ...formData.strategy,
                        postingFrequency: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 3-5 times per week"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Content Pillars (Add at least one)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPillar}
                    onChange={(e) => setNewPillar(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddPillar()}
                    placeholder="e.g., Tips & Tricks"
                    className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                  <button
                    onClick={handleAddPillar}
                    className="px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text)",
                    }}
                  >
                    Add
                  </button>
                </div>
                {formData.strategy.contentPillars.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.strategy.contentPillars.map((pillar, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <span style={{ color: "var(--color-text)" }}>
                          {pillar}
                        </span>
                        <button
                          onClick={() => handleRemovePillar(pillar)}
                          className="text-red-500 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h2
              className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6"
              style={{ color: "var(--color-text)" }}
            >
              Preferences (optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Content Tones
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTone()}
                    placeholder="e.g., Professional, Casual"
                    className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                  <button
                    onClick={handleAddTone}
                    className="px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text)",
                    }}
                  >
                    Add
                  </button>
                </div>
                {formData.preferences?.tones &&
                  formData.preferences.tones.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.preferences.tones.map((tone, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <span style={{ color: "var(--color-text)" }}>
                            {tone}
                          </span>
                          <button
                            onClick={() => handleRemoveTone(tone)}
                            className="text-red-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Content Formats
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddFormat()}
                    placeholder="e.g., Carousel, Reel, Blog"
                    className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                  <button
                    onClick={handleAddFormat}
                    className="px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text)",
                    }}
                  >
                    Add
                  </button>
                </div>
                {formData.preferences?.formats &&
                  formData.preferences.formats.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.preferences.formats.map((format, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <span style={{ color: "var(--color-text)" }}>
                            {format}
                          </span>
                          <button
                            onClick={() => handleRemoveFormat(format)}
                            className="text-red-500 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    CTA Strength (optional)
                  </label>
                  <select
                    value={
                      formData.preferences?.constraints?.ctaStrength || "medium"
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          constraints: {
                            ...formData.preferences?.constraints,
                            ctaStrength: e.target.value as any,
                          },
                        },
                      })
                    }
                    className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="weak">Weak</option>
                    <option value="medium">Medium</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Formality Level (optional)
                  </label>
                  <select
                    value={
                      formData.preferences?.constraints?.formality ||
                      "semi-formal"
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          constraints: {
                            ...formData.preferences?.constraints,
                            formality: e.target.value as any,
                          },
                        },
                      })
                    }
                    className="w-full px-4 py-3 pr-10 rounded-lg outline-none transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="formal">Formal</option>
                    <option value="semi-formal">Semi-Formal</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Time Commitment
                </label>
                <select
                  value={formData.preferences?.timeCommitment || "medium"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        timeCommitment: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="low">Low (1-5 hours/week)</option>
                  <option value="medium">Medium (5-15 hours/week)</option>
                  <option value="high">High (15+ hours/week)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="emojiUsage"
                  checked={
                    formData.preferences?.constraints?.emojiUsage || false
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        constraints: {
                          ...formData.preferences?.constraints,
                          emojiUsage: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-5 h-5 rounded"
                />
                <label
                  htmlFor="emojiUsage"
                  className="text-sm cursor-pointer"
                  style={{ color: "var(--color-text)" }}
                >
                  Use emojis in content
                </label>
              </div>
            </div>
          </div>

          {/* Competitors Section */}
          <div
            className="p-4 sm:p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <h2
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Competitors (optional)
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <FiInfo
                        className="w-4 h-4"
                        style={{ color: "var(--color-text-secondary)" }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Track creators/brands in your niche for inspiration and
                      benchmarking
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => {
                    console.log(
                      "🏆 [INPUT] Competitor name changed:",
                      e.target.value,
                    );
                    setNewCompetitor({
                      ...newCompetitor,
                      name: e.target.value,
                    });
                  }}
                  placeholder="Competitor name (optional)"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <input
                  type="url"
                  value={newCompetitor.url}
                  onChange={(e) => {
                    console.log(
                      "🏆 [INPUT] Competitor URL changed:",
                      e.target.value,
                    );
                    setNewCompetitor({ ...newCompetitor, url: e.target.value });
                  }}
                  placeholder="Profile URL (optional)"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <input
                  type="text"
                  value={newCompetitor.notes}
                  onChange={(e) => {
                    console.log(
                      "🏆 [INPUT] Competitor notes changed:",
                      e.target.value,
                    );
                    setNewCompetitor({
                      ...newCompetitor,
                      notes: e.target.value,
                    });
                  }}
                  placeholder="Notes (optional)"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-colors text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  onClick={() => {
                    console.log("🏆 [BUTTON] Add Competitor clicked");
                    console.log(
                      "🏆 [BUTTON] Current newCompetitor state:",
                      newCompetitor,
                    );
                    console.log(
                      "🏆 [BUTTON] Current formData.competitors:",
                      formData.competitors,
                    );
                    handleAddCompetitor();
                  }}
                  type="button"
                  className="px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base"
                  style={{
                    backgroundColor: "var(--color-surface-hover)",
                    color: "var(--color-text)",
                  }}
                >
                  Add
                </button>
              </div>
              {formData.competitors && formData.competitors.length > 0 && (
                <div className="space-y-2">
                  {formData.competitors.map((competitor) => (
                    <div
                      key={competitor.competitorId}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: "var(--color-background)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium break-words"
                          style={{ color: "var(--color-text)" }}
                        >
                          {competitor.name}
                        </p>
                        <p
                          className="text-sm break-all"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {competitor.url}
                        </p>
                        {competitor.notes && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {competitor.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveCompetitor(competitor.competitorId)
                        }
                        type="button"
                        className="ml-3 px-3 py-1 rounded text-sm transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-surface-hover)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={handleSkip}
          disabled={profileLoading}
          className="px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base order-2 sm:order-1"
          style={{
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Skip for now
        </button>
        <button
          onClick={handleSaveAndContinue}
          disabled={profileLoading}
          className="px-8 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base order-1 sm:order-2 disabled:opacity-50"
          style={{
            background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)",
            color: "var(--color-white)",
          }}
        >
          {profileLoading ? "Saving..." : "Save and Continue"}
        </button>
      </div>
    </div>
  );

  return <AuthenticatedLayout>{onboardingContent}</AuthenticatedLayout>;
}
