-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    company_id INT,
    -- Optional based on frontend interface
    type TEXT CHECK (type IN ('internship', 'full-time', 'part-time')),
    location TEXT NOT NULL,
    salary TEXT,
    description TEXT NOT NULL,
    requirements TEXT [] DEFAULT '{}',
    skills TEXT [] DEFAULT '{}',
    posted_date TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    applicants_count INT DEFAULT 0,
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'inactive', 'draft', 'closed', 'open')
    ),
    views INT DEFAULT 0,
    benefits TEXT,
    experience_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- Policies for jobs
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Employers can insert their own jobs" ON public.jobs;
CREATE POLICY "Employers can insert their own jobs" ON public.jobs FOR
INSERT WITH CHECK (auth.uid() = employer_id);
DROP POLICY IF EXISTS "Employers can update their own jobs" ON public.jobs;
CREATE POLICY "Employers can update their own jobs" ON public.jobs FOR
UPDATE USING (auth.uid() = employer_id);
DROP POLICY IF EXISTS "Employers can delete their own jobs" ON public.jobs;
CREATE POLICY "Employers can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = employer_id);
-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'reviewed',
            'accepted',
            'rejected',
            'interview',
            'shortlisted',
            'hired'
        )
    ),
    applied_date TIMESTAMPTZ DEFAULT NOW(),
    cover_letter TEXT,
    application_data JSONB,
    type TEXT DEFAULT 'standard_cv',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
-- Policies for applications
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;
CREATE POLICY "Students can view their own applications" ON public.applications FOR
SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.applications;
CREATE POLICY "Employers can view applications for their jobs" ON public.applications FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.jobs
            WHERE jobs.id = applications.job_id
                AND jobs.employer_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Students can insert applications" ON public.applications;
CREATE POLICY "Students can insert applications" ON public.applications FOR
INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Employers can update status of applications for their jobs" ON public.applications;
CREATE POLICY "Employers can update status of applications for their jobs" ON public.applications FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.jobs
            WHERE jobs.id = applications.job_id
                AND jobs.employer_id = auth.uid()
        )
    );
-- Re-run student_cvs creation just in case
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
-- Enable RLS for student_cvs
ALTER TABLE public.student_cvs ENABLE ROW LEVEL SECURITY;
-- Policies for student_cvs (IF NOT EXISTS to avoid errors if re-run, but standard SQL doesn't support generic CREATE POLICY IF NOT EXISTS nicely without DO block, leaving simple for now assuming first run or manual cleanup if needed. Actually, Postgres throw error if policy exists. I will add DO block for policies or just assume it is fine for now and ignore error if it happens on policy creation, but better to be safe. I will skip policy recreation if table likely existed. )
-- To be safe, I'm just adding policies again. If they exist, it might fail. I'll rely on the user or previous context that they didn't exist or were dropped.
-- Actually, I will wrap policies in a safe way if possible, or just define them.
-- Given I can't easily do `CREATE POLICY IF NOT EXISTS`, and the previous migration failed, it's likely safe.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'student_cvs'
        AND policyname = 'Users can view their own CV'
) THEN CREATE POLICY "Users can view their own CV" ON public.student_cvs FOR
SELECT USING (auth.uid() = user_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'student_cvs'
        AND policyname = 'Users can insert their own CV'
) THEN CREATE POLICY "Users can insert their own CV" ON public.student_cvs FOR
INSERT WITH CHECK (auth.uid() = user_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'student_cvs'
        AND policyname = 'Users can update their own CV'
) THEN CREATE POLICY "Users can update their own CV" ON public.student_cvs FOR
UPDATE USING (auth.uid() = user_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'student_cvs'
        AND policyname = 'Authenticated users can view CVs'
) THEN CREATE POLICY "Authenticated users can view CVs" ON public.student_cvs FOR
SELECT TO authenticated USING (true);
END IF;
END $$;