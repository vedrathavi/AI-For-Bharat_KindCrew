'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enrichIdeaResearch, getUserIdeas, IdeaBrief } from '@/lib/api/ideation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import { FiArrowLeft, FiCheck, FiCopy, FiEye, FiEyeOff, FiFolder, FiPlus, FiSearch } from 'react-icons/fi';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

// Helper to safely format scores
const formatScore = (score: number | string | undefined): string => {
  if (typeof score === 'number') return score.toFixed(1);
  if (typeof score === 'string') return parseFloat(score).toFixed(1);
  return '0.0';
};

type NormalizedResearch = {
  audiencePainPoints: string[];
  competitorPatterns: string[];
  keyPoints: string[];
  recommendedStructure: string;
  yourAngleStrength: string;
};

function normalizeResearchData(idea: IdeaBrief): NormalizedResearch {
  const toRecord = (value: unknown): Record<string, unknown> => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch (_error) {
        return {};
      }
    }

    return {};
  };

  const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\n|\||,|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getFirstArray = (obj: Record<string, unknown>, keys: string[]): string[] => {
    for (const key of keys) {
      const value = asStringArray(obj[key]);
      if (value.length > 0) return value;
    }
    return [];
  };

  const getFirstString = (obj: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  };

  const research = toRecord(idea.research);

  return {
    audiencePainPoints: getFirstArray(research, ['audiencePainPoints', 'audience_pain_points', 'painPoints']),
    competitorPatterns: getFirstArray(research, ['competitorPatterns', 'competitor_patterns', 'competitors']),
    keyPoints: getFirstArray(research, ['keyPoints', 'key_points', 'keyInsights', 'insights']).length
      ? getFirstArray(research, ['keyPoints', 'key_points', 'keyInsights', 'insights'])
      : (Array.isArray(idea.keyPoints) ? idea.keyPoints : []).map((item) => String(item).trim()).filter(Boolean),
    recommendedStructure: getFirstString(research, ['recommendedStructure', 'recommended_structure', 'structure']),
    yourAngleStrength: getFirstString(research, ['yourAngleStrength', 'your_angle_strength', 'angleStrength']),
  };
}

export default function MyIdeasPage() {
  const router = useRouter();
  const { userInfo, authReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<IdeaBrief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [copiedIdeaId, setCopiedIdeaId] = useState<string | null>(null);
  const [researchingIdeaId, setResearchingIdeaId] = useState<string | null>(null);

  useEffect(() => {
    // Only load ideas once auth is ready and we have a userId
    if (authReady && userInfo?.userId) {
      loadIdeas();
    } else if (authReady && !userInfo?.userId) {
      // Auth is ready but no user - shouldn't happen in authenticated page
      setLoading(false);
      setError('Not authenticated');
    }
  }, [authReady, userInfo?.userId]);

  const loadIdeas = async () => {
    if (!userInfo?.userId) {
      console.error('No userId available');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserIdeas(userInfo.userId);

      if (result.success && result.ideas) {
        setIdeas(result.ideas);
      } else {
        setError(result.error || 'Failed to load ideas');
      }
    } catch (err: unknown) {
      console.error('Error loading ideas:', err);
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDate = (dateString: string | number | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = typeof dateString === 'string' ? new Date(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const normalizeScore = (score: number | string | undefined): number => {
    if (typeof score === 'number') return score;
    if (typeof score === 'string') {
      const parsed = parseFloat(score);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const buildIdeaExportText = (idea: IdeaBrief) => {
    const lines = [
      `Title: ${idea.topic || 'N/A'}`,
      `Platform: ${idea.platform || 'N/A'}`,
      `Content Type: ${idea.contentType || 'N/A'}`,
      `Audience: ${idea.targetAudience || 'N/A'}`,
      `Angle: ${idea.angle || 'N/A'}`,
      `Hook: ${idea.hookIdea || 'N/A'}`,
      '',
      'Scores:',
      `- Overall: ${formatScore(idea.scores?.overall)}/10`,
      `- Virality: ${formatScore(idea.scores?.virality)}/10`,
      `- Clarity: ${formatScore(idea.scores?.clarity)}/10`,
      `- Competition: ${formatScore(idea.scores?.competition)}/10`,
      '',
      'Research:',
      `- Audience Pain Points: ${(idea.research?.audiencePainPoints || []).join(' | ') || 'N/A'}`,
      `- Competitor Patterns: ${(idea.research?.competitorPatterns || []).join(' | ') || 'N/A'}`,
      `- Recommended Structure: ${idea.research?.recommendedStructure || 'N/A'}`,
      `- Key Points: ${(idea.research?.keyPoints || []).join(' | ') || 'N/A'}`,
      `- Your Angle Strength: ${idea.research?.yourAngleStrength || 'N/A'}`,
    ];

    return lines.join('\n');
  };

  const handleCopyIdea = async (idea: IdeaBrief) => {
    try {
      await navigator.clipboard.writeText(buildIdeaExportText(idea));
      setCopiedIdeaId(idea.ideaId);
      setTimeout(() => setCopiedIdeaId(null), 1500);
    } catch (_error) {
      setError('Unable to copy content. Please try again.');
    }
  };

  const handleGenerateResearch = async (idea: IdeaBrief) => {
    if (!userInfo?.userId) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    setResearchingIdeaId(idea.ideaId);

    try {
      const result = await enrichIdeaResearch(userInfo.userId, idea.ideaId);
      if (!result.success) {
        setError(result.error || 'Failed to generate research');
        return;
      }

      await loadIdeas();
      setExpandedIdeaId(idea.ideaId);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setResearchingIdeaId(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
        <div className="mb-8">
          <button
            onClick={() => router.push('/ideation')}
            className="mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                My Content Ideas
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Your approved ideas ready for content creation
              </p>
            </div>
            <button
              onClick={() => router.push('/ideation')}
              className="py-2 px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-background)' }}
            >
              <FiPlus className="w-4 h-4" />
              New Idea
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your ideas...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="px-6 py-4 rounded-lg" style={{ border: '1px solid #7f1d1d', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && ideas.length === 0 && (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="mb-4 flex justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                <FiFolder className="w-7 h-7" style={{ color: 'var(--color-text)' }} />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              No Ideas Yet
            </h3>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Start generating content ideas to build your pipeline
            </p>
            <button
              onClick={() => router.push('/ideation')}
              className="py-3 px-8 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-background)' }}
            >
              Generate Your First Idea
            </button>
          </div>
        )}

        {/* Ideas Grid */}
        {!loading && !error && ideas.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {ideas.map((idea) => {
              const isExpanded = expandedIdeaId === idea.ideaId;
              const research = normalizeResearchData(idea);
              const hasResearch =
                research.audiencePainPoints.length > 0 ||
                research.competitorPatterns.length > 0 ||
                research.keyPoints.length > 0 ||
                Boolean(research.recommendedStructure) ||
                Boolean(research.yourAngleStrength);
              
              return (
                <div
                  key={idea.ideaId}
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col"
                  style={{ 
                    backgroundColor: 'var(--color-surface)', 
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Header */}
                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: 'var(--color-surface-hover)',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getScoreColor(normalizeScore(idea.scores?.overall))}`}>
                        {formatScore(idea.scores?.overall || 0)}/10
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDate(idea.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base leading-snug break-words" style={{ color: 'var(--color-text)' }}>
                      {idea.topic || 'Untitled idea'}
                    </h3>
                  </div>

                  {/* Main Content Section */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Hook/Description */}
                    {idea.hookIdea && (
                      <div 
                        className="text-sm mb-4 p-4 rounded-xl"
                        style={{ 
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        <div className="leading-7">
                          <ReactMarkdown>{idea.hookIdea}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full max-w-full break-words border" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                        {idea.platform}
                      </span>
                      <span className="px-3 py-1.5 text-xs font-medium rounded-xl max-w-full break-words border" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                        {idea.contentType}
                      </span>
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full max-w-full break-words border" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                        {idea.targetAudience}
                      </span>
                    </div>

                    {/* Score Breakdown */}
                    {idea.scores && (
                      <div 
                        className="rounded-xl p-4 mb-4"
                        style={{ 
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                            <div className="font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Viral</div>
                            <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatScore(idea.scores?.virality)}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                            <div className="font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Clarity</div>
                            <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatScore(idea.scores?.clarity)}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                            <div className="font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Comp</div>
                            <div className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatScore(idea.scores?.competition)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedIdeaId(isExpanded ? null : idea.ideaId)}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        style={{ 
                          backgroundColor: 'var(--color-surface-hover)', 
                          color: 'var(--color-text)',
                          border: isExpanded ? '2px solid var(--color-text-muted)' : '1px solid var(--color-border)'
                        }}
                      >
                        {isExpanded ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        {isExpanded ? 'Hide' : 'View'}
                      </button>
                      <button
                        onClick={() => handleCopyIdea(idea)}
                        className="py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        style={{ 
                          backgroundColor: copiedIdeaId === idea.ideaId ? 'var(--color-surface)' : 'var(--color-surface-hover)', 
                          color: 'var(--color-text)',
                          border: copiedIdeaId === idea.ideaId ? '2px solid var(--color-text-muted)' : '1px solid var(--color-border)'
                        }}
                      >
                        {copiedIdeaId === idea.ideaId ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                        {/* Angle */}
                        <div 
                          className="p-4 rounded-xl"
                          style={{ 
                            backgroundColor: 'var(--color-surface-hover)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                            Angle
                          </div>
                          <div className="text-sm break-words leading-7" style={{ color: 'var(--color-text)' }}>
                            <ReactMarkdown>{idea.angle || 'No angle specified'}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Research Section */}
                        {hasResearch ? (
                          <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                              Research Insights
                            </div>
                            
                            {research.audiencePainPoints.length > 0 && (
                              <div 
                                className="p-4 rounded-xl"
                                style={{ 
                                  backgroundColor: 'var(--color-surface-hover)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Audience Pain Points
                                </div>
                                <ul className="text-sm leading-7 list-disc pl-5 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  {research.audiencePainPoints.map((point, idx) => (
                                    <li key={`pain-${idea.ideaId}-${idx}`}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {research.competitorPatterns.length > 0 && (
                              <div 
                                className="p-4 rounded-xl"
                                style={{ 
                                  backgroundColor: 'var(--color-surface-hover)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Competitor Patterns
                                </div>
                                <ul className="text-sm leading-7 list-disc pl-5 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  {research.competitorPatterns.map((pattern, idx) => (
                                    <li key={`pattern-${idea.ideaId}-${idx}`}>{pattern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {research.keyPoints.length > 0 && (
                              <div 
                                className="p-4 rounded-xl"
                                style={{ 
                                  backgroundColor: 'var(--color-surface-hover)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Key Points
                                </div>
                                <ul className="text-sm leading-7 list-disc pl-5 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  {research.keyPoints.map((point, idx) => (
                                    <li key={`key-${idea.ideaId}-${idx}`}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {research.recommendedStructure && (
                              <div 
                                className="p-4 rounded-xl"
                                style={{ 
                                  backgroundColor: 'var(--color-surface-hover)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Recommended Structure
                                </div>
                                <div className="text-sm break-words leading-7" style={{ color: 'var(--color-text-secondary)' }}>
                                  <ReactMarkdown>{research.recommendedStructure}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                            
                            {research.yourAngleStrength && (
                              <div 
                                className="p-4 rounded-xl"
                                style={{ 
                                  backgroundColor: 'var(--color-surface-hover)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                  Your Angle Strength
                                </div>
                                <div className="text-sm break-words leading-7" style={{ color: 'var(--color-text-secondary)' }}>
                                  <ReactMarkdown>{research.yourAngleStrength}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="p-4 rounded-xl text-center"
                            style={{ 
                              backgroundColor: 'var(--color-surface-hover)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-muted)'
                            }}
                          >
                            <div className="text-sm mb-3">No research data available yet</div>
                            <button
                              onClick={() => handleGenerateResearch(idea)}
                              disabled={researchingIdeaId === idea.ideaId}
                              className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <FiSearch className="w-3 h-3" />
                              {researchingIdeaId === idea.ideaId ? 'Generating research...' : 'Generate research'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Status Badge */}
                  <div 
                    className="px-5 py-3"
                    style={{ 
                      backgroundColor: 'var(--color-surface-hover)',
                      borderTop: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                        <FiCheck className="w-4 h-4" />
                        Ready for Phase 2
                      </span>
                      <span className="opacity-50" style={{ color: 'var(--color-text-muted)' }}>
                        ID: {idea.ideaId.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && !error && ideas.length > 0 && (
          <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {ideas.length}
                </div>
                <div className="text-sm text-gray-600">Total Ideas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {ideas.filter((idea) => idea.scores?.overall >= 8).length}
                </div>
                <div className="text-sm text-gray-600">High Scoring (8+)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {new Set(ideas.map((idea) => idea.platform)).size}
                </div>
                <div className="text-sm text-gray-600">Platforms</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
