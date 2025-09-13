-- Database optimization for Workify
-- Add indexes for better query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_hash ON public.profiles(profile_hash);

-- Intents table indexes
CREATE INDEX IF NOT EXISTS idx_intents_user_id ON public.intents(user_id);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Tailors table indexes
CREATE INDEX IF NOT EXISTS idx_tailors_user_id ON public.tailors(user_id);
CREATE INDEX IF NOT EXISTS idx_tailors_job_id ON public.tailors(job_id);
CREATE INDEX IF NOT EXISTS idx_tailors_created_at ON public.tailors(created_at);
CREATE INDEX IF NOT EXISTS idx_tailors_fit_score ON public.tailors(fit_score);
CREATE INDEX IF NOT EXISTS idx_tailors_status ON public.tailors(status);
CREATE INDEX IF NOT EXISTS idx_tailors_cached_hash ON public.tailors(cached_hash);

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_tailor_id ON public.applications(tailor_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tailors_user_created ON public.tailors(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);

-- Partial indexes for active data
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tailors_pending ON public.tailors(id) WHERE status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_applications_submitted ON public.applications(id) WHERE status = 'submitted';

-- Full-text search indexes (if needed for job descriptions)
CREATE INDEX IF NOT EXISTS idx_jobs_description_fts ON public.jobs USING gin(to_tsvector('english', job_description_text));

-- Update statistics
ANALYZE public.users;
ANALYZE public.profiles;
ANALYZE public.intents;
ANALYZE public.jobs;
ANALYZE public.tailors;
ANALYZE public.applications;
