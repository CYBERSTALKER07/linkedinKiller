import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobApplicants } from '../lib/student-cv';
import { Application } from '../types';
import PageLayout from '../components/ui/PageLayout';
import { ApplicantCard } from '../components/employer/ApplicantCard';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const JobApplicantsPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [jobTitle, setJobTitle] = useState('');

    const loadData = useCallback(async () => {
        if (!jobId || !user) return;
        try {
            setLoading(true);

            // fetch job title
            const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single();
            if (job) setJobTitle(job.title);

            const data = await getJobApplicants(jobId);
            setApplicants(data);
        } catch (error) {
            console.error('Error loading applicants:', error);
        } finally {
            setLoading(false);
        }
    }, [jobId, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return (
        <PageLayout>
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        </PageLayout>
    );

    return (
        <PageLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white">
                                Applicants
                            </h1>
                            <p className="text-gray-500 mt-1 text-lg">
                                for {jobTitle}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold text-purple-400">{applicants.length} Applicants</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applicants.map(app => (
                        <ApplicantCard key={app.id} application={app} />
                    ))}

                    {applicants.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-3xl bg-gray-900/50">
                            <Users className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg">No applicants yet</p>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};
