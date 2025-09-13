-- Feedback system for Workify
-- Add feedback table for applicant analytics

-- Feedback table (stores probability scores and insights)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
  
  -- Probability scoring
  selection_probability NUMERIC NOT NULL CHECK (selection_probability >= 0 AND selection_probability <= 100),
  
  -- Scoring breakdown
  semantic_similarity_score NUMERIC NOT NULL CHECK (semantic_similarity_score >= 0 AND semantic_similarity_score <= 100),
  skill_coverage_score NUMERIC NOT NULL CHECK (skill_coverage_score >= 0 AND skill_coverage_score <= 100),
  experience_alignment_score NUMERIC NOT NULL CHECK (experience_alignment_score >= 0 AND experience_alignment_score <= 100),
  
  -- Detailed insights
  strengths JSONB,
  gaps JSONB,
  recommendations JSONB,
  
  -- Metadata
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_job_id ON public.feedback(job_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tailor_id ON public.feedback(tailor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_probability ON public.feedback(selection_probability);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_probability ON public.feedback(user_id, selection_probability);
CREATE INDEX IF NOT EXISTS idx_feedback_job_probability ON public.feedback(job_id, selection_probability);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback (system-based)
CREATE POLICY "Users can insert their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Admins can update feedback
CREATE POLICY "Admins can update feedback" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_updated_at();

-- User-level stats
CREATE OR REPLACE FUNCTION public.get_user_feedback_stats(user_uuid UUID, months INTEGER DEFAULT 3)
RETURNS TABLE (
  total_applications BIGINT,
  avg_probability NUMERIC,
  max_probability NUMERIC,
  min_probability NUMERIC,
  high_probability_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_applications,
    ROUND(AVG(f.selection_probability), 2) as avg_probability,
    MAX(f.selection_probability) as max_probability,
    MIN(f.selection_probability) as min_probability,
    COUNT(*) FILTER (WHERE f.selection_probability >= 70) as high_probability_count
  FROM public.feedback f
  WHERE f.user_id = user_uuid
    AND f.created_at >= (CURRENT_DATE - (months || ' month')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- System-wide analytics
CREATE OR REPLACE FUNCTION public.get_system_feedback_analytics(months INTEGER DEFAULT 3)
RETURNS TABLE (
  total_feedback BIGINT,
  avg_probability NUMERIC,
  high_probability_percentage NUMERIC,
  top_strengths JSONB,
  common_gaps JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_feedback,
    ROUND(AVG(f.selection_probability), 2) as avg_probability,
    ROUND(
      (COUNT(*) FILTER (WHERE f.selection_probability >= 70)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as high_probability_percentage,
    (
      SELECT jsonb_agg(jsonb_build_object('strength', key, 'count', value))
      FROM (
        SELECT 
          jsonb_array_elements_text(strengths) as key,
          COUNT(*) as value
        FROM public.feedback f2
        WHERE f2.created_at >= (CURRENT_DATE - (months || ' month')::INTERVAL)
        GROUP BY key
        ORDER BY value DESC
        LIMIT 5
      ) top_strengths
    ) as top_strengths,
    (
      SELECT jsonb_agg(jsonb_build_object('gap', key, 'count', value))
      FROM (
        SELECT 
          jsonb_array_elements_text(gaps) as key,
          COUNT(*) as value
        FROM public.feedback f3
        WHERE f3.created_at >= (CURRENT_DATE - (months || ' month')::INTERVAL)
        GROUP BY key
        ORDER BY value DESC
        LIMIT 5
      ) common_gaps
    ) as common_gaps
  FROM public.feedback f
  WHERE f.created_at >= (CURRENT_DATE - (months || ' month')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
