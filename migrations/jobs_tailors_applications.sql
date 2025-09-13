-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  fit_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tailors table
CREATE TABLE IF NOT EXISTS tailors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tailored_resume TEXT,
  cover_letter TEXT,
  portfolio TEXT,
  fit_score INTEGER,
  token_usage INTEGER,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted_manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailors ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Users can view their own jobs" 
  ON jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" 
  ON jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
  ON jobs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Tailors policies
CREATE POLICY "Users can view their own tailors" 
  ON tailors FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tailors" 
  ON tailors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tailors" 
  ON tailors FOR UPDATE 
  USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can view their own applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
  ON applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
  ON applications FOR UPDATE 
  USING (auth.uid() = user_id);