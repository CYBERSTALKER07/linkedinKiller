-- Add FK to profiles for easy joining
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_employer_id_fkey_profiles FOREIGN KEY (employer_id) REFERENCES public.profiles(id);
ALTER TABLE public.applications
ADD CONSTRAINT applications_student_id_fkey_profiles FOREIGN KEY (student_id) REFERENCES public.profiles(id);
-- Ensure consistencies if any columns were wrong in previous steps (though `posted_date` and `applied_date` were correct in my SQL).
-- But checks won't hurt.