-- Create student_cvs table
CREATE TABLE IF NOT EXISTS public.student_cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    university TEXT,
    major TEXT,
    graduation_year INTEGER,
    skills TEXT [],
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
-- Update applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS application_data JSONB,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard_cv';
-- Enable RLS
ALTER TABLE public.student_cvs ENABLE ROW LEVEL SECURITY;
-- Policies for student_cvs
CREATE POLICY "Users can view their own CV" ON public.student_cvs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own CV" ON public.student_cvs FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CV" ON public.student_cvs FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view CVs" ON public.student_cvs FOR
SELECT TO authenticated USING (true);