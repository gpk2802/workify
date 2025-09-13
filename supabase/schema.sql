-- Create tables for Workify MVP

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Profiles table (master resume data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  master_resume_text TEXT,
  skills JSONB,
  education JSONB,
  experience JSONB,
  profile_hash TEXT,
  UNIQUE(user_id)
);

-- Intents table (user's career intent)
CREATE TABLE IF NOT EXISTS public.intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roles JSONB,
  dream_companies JSONB,
  locations JSONB,
  work_type TEXT,
  UNIQUE(user_id)
);

-- Jobs table (job descriptions submitted by users)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_submitted_url TEXT,
  job_description_text TEXT NOT NULL,
  job_parsed_meta JSONB
);

-- Tailors table (generated tailored resumes)
CREATE TABLE IF NOT EXISTS public.tailors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  fit_score NUMERIC NOT NULL,
  generated_resume_text TEXT,
  cover_letter_text TEXT,
  portfolio_text TEXT,
  prompt_version TEXT,
  tokens_estimate INTEGER,
  cached_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (tracking application status)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted',
  method TEXT,
  outcome TEXT,
  admin_notes TEXT
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profile policies
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Profiles are editable by owner" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Profiles can be inserted by owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Intent policies
CREATE POLICY "Intents are viewable by owner" ON public.intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Intents are editable by owner" ON public.intents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Intents can be inserted by owner" ON public.intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job policies
CREATE POLICY "Jobs are viewable by owner" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Jobs are editable by owner" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Jobs can be inserted by owner" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tailor policies
CREATE POLICY "Tailors are viewable by owner" ON public.tailors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tailors are editable by owner" ON public.tailors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tailors can be inserted by owner" ON public.tailors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Application policies
CREATE POLICY "Applications are viewable by owner" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Applications are editable by owner" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Applications can be inserted by owner" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create admin role for dashboard access
CREATE ROLE admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;

-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for applications table
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for tailors table
CREATE POLICY "Admins can view all tailors" ON public.tailors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin policies for jobs table
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to track tailor request counts
CREATE OR REPLACE FUNCTION public.count_user_tailor_requests(user_uuid UUID, months INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM public.tailors
  WHERE user_id = user_uuid
  AND created_at > (CURRENT_DATE - (months || ' month')::INTERVAL);
  
  RETURN request_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;