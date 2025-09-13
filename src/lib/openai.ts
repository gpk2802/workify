import OpenAI from 'openai';
import { openaiCache, cacheKeys, hashObject, getCachedOrFetch } from './cache';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate semantic similarity between two texts using embeddings
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns Similarity score between 0 and 1
 */
export async function calculateSimilarity(text1: string, text2: string): Promise<number> {
  try {
    // Create cache key for this similarity calculation
    const cacheKey = cacheKeys.openaiResponse(hashObject({ text1, text2, type: 'similarity' }));
    
    return await getCachedOrFetch(
      openaiCache,
      cacheKey,
      async () => {
        // Get embeddings for both texts
        const [embedding1, embedding2] = await Promise.all([
          getEmbedding(text1),
          getEmbedding(text2),
        ]);

        // Calculate cosine similarity
        const similarity = cosineSimilarity(embedding1, embedding2);
        return similarity;
      },
      30 * 60 * 1000 // 30 minutes cache
    );
  } catch (error) {
    console.error('Error calculating similarity:', error);
    throw error;
  }
}

/**
 * Get embedding for a text using OpenAI's embedding model
 * @param text Text to get embedding for
 * @returns Array of embedding values
 */
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param vec1 First vector
 * @param vec2 Second vector
 * @returns Cosine similarity (0-1)
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  // Calculate dot product
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  
  // Calculate magnitudes
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  // Calculate cosine similarity
  return dotProduct / (mag1 * mag2);
}

/**
 * Generate tailored resume content using GPT-4
 * @param resumeText Original resume text
 * @param jobDescription Job description
 * @param userIntent User's job search preferences
 * @returns Object containing tailored resume, cover letter, and portfolio
 */
export async function generateTailoredContent(
  resumeText: string,
  jobDescription: string,
  userIntent: any
): Promise<{
  tailoredResume: string;
  coverLetter: string;
  portfolio: string;
  tokenUsage: number;
}> {
  try {
    // Create cache key for this content generation
    const cacheKey = cacheKeys.openaiResponse(hashObject({ 
      resumeText, 
      jobDescription, 
      userIntent, 
      type: 'tailored_content' 
    }));
    
    return await getCachedOrFetch(
      openaiCache,
      cacheKey,
      async () => {
        // Prepare system message with instructions
        const systemMessage = `You are an expert resume tailoring assistant. Your task is to create three documents:

1. A tailored resume that highlights relevant experience and skills for the job description.
2. A concise cover letter with a short intro and 3 specific match points.
3. A 1-page value portfolio with 3 impact bullets and 1 mini-project snippet.

Base your tailoring on the provided resume, job description, and user's job search preferences.`;

        // Prepare user message with content
        const userMessage = `
RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nUSER PREFERENCES:\nDesired Roles: ${userIntent.roles.join(', ')}\nDream Companies: ${userIntent.dream_companies?.join(', ') || 'Not specified'}\nPreferred Locations: ${userIntent.locations?.join(', ') || 'Not specified'}\nWork Type: ${userIntent.work_type || 'Not specified'}`;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        });

        // Parse the response
        const content = JSON.parse(response.choices[0].message.content || '{}');
        
        return {
          tailoredResume: content.tailoredResume || '',
          coverLetter: content.coverLetter || '',
          portfolio: content.portfolio || '',
          tokenUsage: response.usage?.total_tokens || 0,
        };
      },
      60 * 60 * 1000 // 1 hour cache for tailored content
    );
  } catch (error) {
    console.error('Error generating tailored content:', error);
    throw error;
  }
}

export default openai;