import OpenAI from 'openai';
import { openaiCache, cacheKeys, hashObject, getCachedOrFetch } from './cache';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for feedback system
export interface FeedbackInsight {
  type: 'skill' | 'experience' | 'education' | 'achievement';
  description: string;
  confidence?: number;
  severity?: 'low' | 'medium' | 'high';
}

export interface FeedbackRecommendation {
  type: 'skill' | 'experience' | 'presentation' | 'content';
  action: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FeedbackScores {
  selection_probability: number;
  semantic_similarity_score: number;
  skill_coverage_score: number;
  experience_alignment_score: number;
  strengths: FeedbackInsight[];
  gaps: FeedbackInsight[];
  recommendations: FeedbackRecommendation[];
}

// Weight configuration for scoring model
const SCORING_WEIGHTS = {
  semantic_similarity: 0.6,
  skill_coverage: 0.3,
  experience_alignment: 0.1,
};

/**
 * Extract skills from text using OpenAI
 */
async function extractSkills(text: string): Promise<string[]> {
  const cacheKey = cacheKeys.openaiResponse(hashObject({ text, type: 'skill_extraction' }));
  
  return await getCachedOrFetch(
    openaiCache,
    cacheKey,
    async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Extract technical skills, soft skills, and tools from the given text. Return only a JSON array of skill strings, no explanations.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.skills || [];
    },
    60 * 60 * 1000 // 1 hour cache
  );
}

/**
 * Calculate skill coverage score
 */
function calculateSkillCoverage(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 100;
  
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
  
  // Calculate exact matches
  const exactMatches = jobSkillsLower.filter(jobSkill => 
    resumeSkillsLower.some(resumeSkill => resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill))
  );
  
  // Calculate partial matches (fuzzy matching)
  const partialMatches = jobSkillsLower.filter(jobSkill => {
    return resumeSkillsLower.some(resumeSkill => {
      const similarity = calculateStringSimilarity(jobSkill, resumeSkill);
      return similarity > 0.7; // 70% similarity threshold
    });
  });
  
  const totalMatches = new Set([...exactMatches, ...partialMatches]).size;
  return Math.round((totalMatches / jobSkills.length) * 100);
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate experience alignment score
 */
async function calculateExperienceAlignment(resumeText: string, jobDescription: string): Promise<number> {
  const cacheKey = cacheKeys.openaiResponse(hashObject({ resumeText, jobDescription, type: 'experience_alignment' }));
  
  return await getCachedOrFetch(
    openaiCache,
    cacheKey,
    async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Analyze the experience alignment between a resume and job description. Consider years of experience, seniority level, and relevant work history. Return a JSON object with a score from 0-100 and a brief explanation.'
          },
          {
            role: 'user',
            content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return Math.min(100, Math.max(0, result.score || 50));
    },
    60 * 60 * 1000 // 1 hour cache
  );
}

/**
 * Generate detailed feedback insights using AI
 */
async function generateFeedbackInsights(
  resumeText: string,
  jobDescription: string,
  scores: { semantic: number; skills: number; experience: number }
): Promise<{ strengths: FeedbackInsight[]; gaps: FeedbackInsight[]; recommendations: FeedbackRecommendation[] }> {
  const cacheKey = cacheKeys.openaiResponse(hashObject({ 
    resumeText, 
    jobDescription, 
    scores, 
    type: 'feedback_insights' 
  }));
  
  return await getCachedOrFetch(
    openaiCache,
    cacheKey,
    async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze a resume against a job description and provide detailed feedback. Return a JSON object with:
            - strengths: Array of strength objects with type, description, and confidence (0-1)
            - gaps: Array of gap objects with type, description, and severity (low/medium/high)
            - recommendations: Array of recommendation objects with type, action, and priority (low/medium/high)
            
            Focus on actionable insights that help the candidate improve their application.`
          },
          {
            role: 'user',
            content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nSCORES:\nSemantic Similarity: ${scores.semantic}%\nSkill Coverage: ${scores.skills}%\nExperience Alignment: ${scores.experience}%`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        strengths: result.strengths || [],
        gaps: result.gaps || [],
        recommendations: result.recommendations || []
      };
    },
    60 * 60 * 1000 // 1 hour cache
  );
}

/**
 * Main function to generate comprehensive feedback
 */
export async function generateFeedback(
  resumeText: string,
  jobDescription: string,
  semanticSimilarity: number
): Promise<FeedbackScores> {
  try {
    // Extract skills from both texts
    const [resumeSkills, jobSkills] = await Promise.all([
      extractSkills(resumeText),
      extractSkills(jobDescription)
    ]);

    // Calculate individual scores
    const skillCoverageScore = calculateSkillCoverage(resumeSkills, jobSkills);
    const experienceAlignmentScore = await calculateExperienceAlignment(resumeText, jobDescription);
    
    // Calculate weighted probability
    const selectionProbability = Math.round(
      (semanticSimilarity * SCORING_WEIGHTS.semantic_similarity) +
      (skillCoverageScore * SCORING_WEIGHTS.skill_coverage) +
      (experienceAlignmentScore * SCORING_WEIGHTS.experience_alignment)
    );

    // Generate detailed insights
    const insights = await generateFeedbackInsights(resumeText, jobDescription, {
      semantic: semanticSimilarity,
      skills: skillCoverageScore,
      experience: experienceAlignmentScore
    });

    return {
      selection_probability: Math.min(100, Math.max(0, selectionProbability)),
      semantic_similarity_score: semanticSimilarity,
      skill_coverage_score: skillCoverageScore,
      experience_alignment_score: experienceAlignmentScore,
      strengths: insights.strengths,
      gaps: insights.gaps,
      recommendations: insights.recommendations
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    
    // Return fallback scores if AI fails
    return {
      selection_probability: Math.round(semanticSimilarity * 0.8), // Conservative estimate
      semantic_similarity_score: semanticSimilarity,
      skill_coverage_score: 50, // Default middle score
      experience_alignment_score: 50,
      strengths: [],
      gaps: [],
      recommendations: []
    };
  }
}

/**
 * Get feedback statistics for a user
 */
export async function getUserFeedbackStats(userId: string, months: number = 3) {
  // This would be called from an API route that has database access
  // Implementation will be in the API route
  return {
    total_applications: 0,
    avg_probability: 0,
    max_probability: 0,
    min_probability: 0,
    high_probability_count: 0
  };
}

/**
 * Get system-wide feedback analytics
 */
export async function getSystemFeedbackAnalytics(months: number = 3) {
  // This would be called from an API route that has database access
  // Implementation will be in the API route
  return {
    total_feedback: 0,
    avg_probability: 0,
    high_probability_percentage: 0,
    top_strengths: [],
    common_gaps: []
  };
}
