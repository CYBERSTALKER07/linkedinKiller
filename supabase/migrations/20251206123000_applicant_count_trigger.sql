-- Function to update applicants_count
CREATE OR REPLACE FUNCTION update_job_applicants_count() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'INSERT') THEN
UPDATE public.jobs
SET applicants_count = applicants_count + 1
WHERE id = NEW.job_id;
ELSIF (TG_OP = 'DELETE') THEN
UPDATE public.jobs
SET applicants_count = applicants_count - 1
WHERE id = OLD.job_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger
DROP TRIGGER IF EXISTS tr_update_job_applicants_count ON public.applications;
CREATE TRIGGER tr_update_job_applicants_count
AFTER
INSERT
    OR DELETE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_job_applicants_count();