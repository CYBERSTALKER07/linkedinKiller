import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Unified useJobs hook - wrapper around React Query for consistent API
export function useJobs(jobId?: string) {
  const queryClient = useQueryClient();

  // Use the main React Query hook for jobs
  const query = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        console.log('🔄 [useJobs] Starting to fetch jobs...');

        const { data, error, status, statusText } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            company,
            location,
            type,
            salary_range,
            description,
            skills,
            is_remote,
            posted_at,
            employer_id,
            status,
            requirements,
            benefits,
            experience_level,
            department,
            contact_email,

            views_count,
            deadline,
            updated_at
          `)
          .eq('status', 'open')
          .order('posted_at', { ascending: false })
          .limit(100);

        console.log(`📊 [useJobs] Response status: ${status} ${statusText}`);

        if (error) {
          console.error('❌ [useJobs] Supabase error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        if (!data) {
          console.warn('⚠️ [useJobs] No data returned from query');
          return [];
        }

        console.log(`✅ [useJobs] Fetched ${data.length} jobs from database`);

        if (data.length === 0) {
          console.log('ℹ️ [useJobs] Jobs table is empty or no jobs found');
          return [];
        }

        // Get unique employer IDs
        const employerIds = [...new Set(data.map(job => job.employer_id).filter(Boolean))];
        console.log(`👥 [useJobs] Found ${employerIds.length} unique employers`);

        // Fetch employer profiles
        let employerMap = new Map();
        if (employerIds.length > 0) {
          try {
            console.log('🔍 [useJobs] Fetching employer profiles...');
            const { data: employers, error: employerError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, username, company_name, verified')
              .in('id', employerIds);

            if (employerError) {
              console.warn('⚠️ [useJobs] Error fetching employers:', employerError.message);
            } else if (employers && employers.length > 0) {
              console.log(`✅ [useJobs] Fetched ${employers.length} employer profiles`);
              employerMap = new Map(employers.map(emp => [emp.id, emp]));
            } else {
              console.warn('⚠️ [useJobs] No employer profiles found');
            }
          } catch (err) {
            console.error('❌ [useJobs] Exception fetching employers:', err);
          }
        }

        // Transform jobs with all fields properly mapped
        const result = data.map(job => {
          const employer = employerMap.get(job.employer_id);
          return {
            id: job.id?.toString() || '',
            title: job.title || 'Job Opportunity',
            company: job.company || 'Company Name',
            location: job.location || 'Not specified',
            type: job.type || 'full-time',
            salary_range: job.salary_range || '',
            description: job.description || '',
            skills: Array.isArray(job.skills) ? job.skills : [],
            requirements: Array.isArray(job.requirements) ? job.requirements : [],
            benefits: job.benefits || '',
            is_remote: job.is_remote === true,
            experience_level: job.experience_level || '',
            department: job.department || '',
            contact_email: job.contact_email || '',
            applications_count: 0,
            views_count: job.views_count || 0,
            posted_at: job.posted_at,
            created_at: job.posted_at,
            deadline: job.deadline || null,
            updated_at: job.updated_at || job.posted_at,
            status: job.status || 'active',
            employer_id: job.employer_id,
            salary: job.salary_range, // Alias for compatibility
            posted_date: job.posted_at, // Alias for compatibility
            company_logo: undefined, // Column does not exist
            employer: employer ? {
              id: employer.id,
              name: employer.full_name,
              avatar_url: employer.avatar_url,
              company_name: employer.company_name,
              verified: employer.verified
            } : undefined
          };
        });

        console.log(`📊 [useJobs] Successfully transformed ${result.length} jobs`);
        return result;
      } catch (error) {
        console.error('❌ [useJobs] Fatal error:', error);

        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }

        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute - consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache for 5 minutes
    refetchInterval: false, // Disable auto-refetching to reduce load (optional, or keep if real-time needed)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: (failureCount, error: any) => {
      if (failureCount < 3) {
        if (error?.message?.includes('access control') || error?.message?.includes('permission')) {
          console.error('🔐 [useJobs] Not retrying due to permission error');
          return false;
        }
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000);
      console.log(`⏳ [useJobs] Retry attempt ${attemptIndex + 1}, waiting ${delay}ms`);
      return delay;
    },
  });

  // Return data in the format expected by StudentDashboard and other components
  return {
    jobs: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'An error occurred') : null,
    refetch: query.refetch
  };
}