import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Job } from '../types';
import { useAuth } from '../context/AuthContext';

interface JobFormData {
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  salary?: string;
  description: string;
  requirements: string;
  benefits?: string;
  skills: string[];
  deadline?: string;
  contact_email: string;
  is_remote: boolean;
  experience_level?: string;
  department?: string;
  country?: string;
  city?: string;
  street_address?: string;
}

interface JobResponse extends Job {
  applications_count?: number;
  views_count?: number;
}

export function useJobManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Post a new job
  const postJob = useCallback(
    async (formData: JobFormData): Promise<Job | null> => {
      if (!user) {
        setError('You must be logged in to post a job');
        return null;
      }

      if (user.role !== 'employer') {
        setError('Only employers can post jobs');
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Prepare job data - convert requirements string to array
        const requirementsArray = formData.requirements
          .split('\n')
          .map(r => r.trim())
          .filter(r => r.length > 0);

        const jobData = {
          employer_id: user.id,
          title: formData.title,
          company: formData.company,
          location: formData.location,
          type: formData.type,
          salary_range: formData.salary || null,
          description: formData.description,
          requirements: requirementsArray,
          benefits: formData.benefits || null,
          skills: formData.skills,
          deadline: formData.deadline || null,
          contact_email: formData.contact_email,
          is_remote: formData.is_remote,
          experience_level: formData.experience_level || 'entry',
          department: formData.department || null,
          country: formData.country || null,
          city: formData.city || null,
          street_address: formData.street_address || null,
          status: 'open',
          posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert job into database
        const { data, error: insertError } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
          .single();

        if (insertError) {
          console.error('Error posting job:', insertError);
          setError(insertError.message || 'Failed to post job');
          return null;
        }

        setSuccess('Job posted successfully!');
        return data as Job;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while posting the job';
        setError(errorMessage);
        console.error('Error in postJob:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update an existing job
  const updateJob = useCallback(
    async (jobId: string, formData: Partial<JobFormData>): Promise<Job | null> => {
      if (!user) {
        setError('You must be logged in to update a job');
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Prepare update data
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };

        if (formData.title) updateData.title = formData.title;
        if (formData.company) updateData.company = formData.company;
        if (formData.location) updateData.location = formData.location;
        if (formData.type) updateData.type = formData.type;
        if (formData.salary) updateData.salary_range = formData.salary;
        if (formData.description) updateData.description = formData.description;
        if (formData.requirements) {
          updateData.requirements = formData.requirements
            .split('\n')
            .map(r => r.trim())
            .filter(r => r.length > 0);
        }
        if (formData.benefits) updateData.benefits = formData.benefits;
        if (formData.skills) updateData.skills = formData.skills;
        if (formData.deadline) updateData.deadline = formData.deadline;
        if (formData.contact_email) updateData.contact_email = formData.contact_email;
        if (formData.is_remote !== undefined) updateData.is_remote = formData.is_remote;
        if (formData.experience_level) updateData.experience_level = formData.experience_level;
        if (formData.department) updateData.department = formData.department;

        // Update job in database
        const { data, error: updateError } = await supabase
          .from('jobs')
          .update(updateData)
          .eq('id', jobId)
          .eq('employer_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating job:', updateError);
          setError(updateError.message || 'Failed to update job');
          return null;
        }

        setSuccess('Job updated successfully!');
        return data as Job;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the job';
        setError(errorMessage);
        console.error('Error in updateJob:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Delete a job
  const deleteJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to delete a job');
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: deleteError } = await supabase
          .from('jobs')
          .delete()
          .eq('id', jobId)
          .eq('employer_id', user.id);

        if (deleteError) {
          console.error('Error deleting job:', deleteError);
          setError(deleteError.message || 'Failed to delete job');
          return false;
        }

        setSuccess('Job deleted successfully!');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the job';
        setError(errorMessage);
        console.error('Error in deleteJob:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Fetch a single job
  const fetchJob = useCallback(async (jobId: string): Promise<JobResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          id, title, company, company_logo, location, type, salary_range, description, 
          requirements, benefits, skills, deadline, contact_email, experience_level, 
          posted_at, status, views_count, created_at, updated_at, employer_id,
          is_remote, department, country, city, street_address
        `)
        .eq('id', jobId)
        .single();

      if (fetchError) {
        console.error('Error fetching job:', fetchError);
        setError(fetchError.message || 'Failed to fetch job');
        return null;
      }

      return data as JobResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the job';
      setError(errorMessage);
      console.error('Error in fetchJob:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch employer's jobs
  const fetchEmployerJobs = useCallback(async (): Promise<JobResponse[]> => {
    if (!user) {
      setError('You must be logged in to fetch jobs');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          id, title, company, company_logo, location, type, salary_range, description, 
          requirements, benefits, skills, deadline, contact_email, experience_level, 
          posted_at, status, views_count, created_at, updated_at, employer_id,
          is_remote, department, country, city, street_address
        `)
        .eq('employer_id', user.id)
        .order('posted_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching employer jobs:', fetchError);
        setError(fetchError.message || 'Failed to fetch jobs');
        return [];
      }

      return (data || []) as JobResponse[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching jobs';
      setError(errorMessage);
      console.error('Error in fetchEmployerJobs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update job status (open, closed, draft)
  const updateJobStatus = useCallback(
    async (jobId: string, status: 'open' | 'closed' | 'draft'): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to update job status');
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: updateError } = await supabase
          .from('jobs')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', jobId)
          .eq('employer_id', user.id);

        if (updateError) {
          console.error('Error updating job status:', updateError);
          setError(updateError.message || 'Failed to update job status');
          return false;
        }

        setSuccess(`Job status updated to ${status}!`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating job status';
        setError(errorMessage);
        console.error('Error in updateJobStatus:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Get job applicants
  const getJobApplicants = useCallback(
    async (jobId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('applications')
          .select(`
            *,
            profiles!applications_student_id_fkey(*)
          `)
          .eq('job_id', jobId)
          .order('applied_date', { ascending: false });

        if (fetchError) {
          console.error('Error fetching applicants:', fetchError);
          setError(fetchError.message || 'Failed to fetch applicants');
          return [];
        }

        return data || [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching applicants';
        setError(errorMessage);
        console.error('Error in getJobApplicants:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    postJob,
    updateJob,
    deleteJob,
    fetchJob,
    fetchEmployerJobs,
    updateJobStatus,
    getJobApplicants,
    loading,
    error,
    success,
    clearMessages
  };
}
