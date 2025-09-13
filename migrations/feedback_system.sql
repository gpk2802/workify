-- ================================
-- Workify Complete Database Schema
-- ================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. JOBS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending', -- pending | processed | approved | rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- 2. TAILORS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.tailors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tailored_resume TEXT,
  cover_letter TEXT,
  portfolio TEXT,
  fit_score NUMERIC CHECK (fit_score >= 0 AND fit_score <= 100),
  token_usage JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tailors_job_id ON public.tailors(job_id);
CREATE INDEX IF NOT EXISTS idx_tailors_user_id ON public.tailors(user_id);

-- RLS
ALTER TABLE public.tailors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tailors" ON public.tailors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tailors" ON public.tailors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tailors" ON public.tailors
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- 3. FEEDBACK TABLE
-- ================================
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

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
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

-- ================================
-- 4. ANALYTICS FUNCTIONS
-- ================================
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
    '[]'::jsonb as top_strengths,
    '[]'::jsonb as common_gaps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
