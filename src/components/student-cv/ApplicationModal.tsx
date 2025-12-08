import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { createApplication, getStudentCV } from '../../lib/student-cv';
import { useToast } from '../ui/Toast';
import { FileText, PenTool, Loader2, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    employerName: string;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
    isOpen,
    onClose,
    jobId,
    jobTitle,
    employerName
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [mode, setMode] = useState<'select' | 'custom'>('select');
    const [loading, setLoading] = useState(false);
    const [checkingCV, setCheckingCV] = useState(false);

    // Custom form state
    const [customForm, setCustomForm] = useState({
        full_name: '',
        email: '',
        cover_letter: '',
        linkedin_url: ''
    });

    const handleApplyWithCV = async () => {
        console.log('🚀 [ApplicationModal] handleApplyWithCV started', { jobId, userId: user?.id });
        try {
            setCheckingCV(true);
            if (!user) {
                console.error('❌ [ApplicationModal] No user found');
                return;
            }

            // Check if user has a CV
            console.log('🔍 [ApplicationModal] Fetching CV...');
            const cv = await getStudentCV(user.id);
            console.log('📄 [ApplicationModal] CV result:', cv);

            if (!cv || !cv.full_name) {
                console.warn('⚠️ [ApplicationModal] CV incomplete or missing');
                toastError('Please complete your Professional CV first');
                navigate('/student/cv');
                return;
            }

            setLoading(true);
            console.log('📝 [ApplicationModal] Creating application...');
            const result = await createApplication({
                job_id: jobId,
                student_id: user.id,
                type: 'standard_cv',
                application_data: cv as unknown as Record<string, unknown>,
                status: 'pending' // pending review
            });
            console.log('✅ [ApplicationModal] Application created:', result);

            success('Application submitted successfully!');
            onClose();
        } catch (error: any) {
            console.error('❌ [ApplicationModal] Error submitting application:', error);
            if (error?.status === 409 || error?.code === '23505' || error?.message?.includes('409')) {
                toastError('You have already applied for this job');
            } else {
                toastError(error?.message || 'Failed to submit application');
            }
        } finally {
            setLoading(false);
            setCheckingCV(false);
        }
    };

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user) return;
            setLoading(true);

            await createApplication({
                job_id: jobId,
                student_id: user.id,
                type: 'custom_form',
                application_data: customForm,
                status: 'pending'
            });

            success('Application submitted successfully!');
            onClose();
        } catch (error: any) {
            console.error(error);
            if (error?.status === 409 || error?.code === '23505' || error?.message?.includes('409')) {
                toastError('You have already applied for this job');
            } else {
                toastError(error?.message || 'Failed to submit application');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal className='bg-white' isOpen={isOpen} onClose={onClose} title={`Apply to ${jobTitle}`} size="large">
            <div className="p-6">
                {mode === 'select' ? (
                    <div className="space-y-6">
                        <h3 className="text-gray-40 text-center">
                            Choose how you want to apply to <span className={cn("font-bold text-lg", user ? "text-black" : "text-gray-900")}>{employerName}
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={handleApplyWithCV}
                                disabled={loading || checkingCV}
                                className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all duration-300 relative hover:shadow-xl hover:-translate-y-1 group ${
                                    // Use similar dark/light classes as JobCard but slightly adapted for modal context
                                    'bg-white border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/50'
                                    }`}
                            >
                                <div className="p-4 rounded-full mb-4  transition-colors">
                                    <FileText className="w-8 h-8 " />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 text-center">Apply with CV</h3>

                                {loading && checkingCV && <Loader2 className="w-5 h-5 animate-spin mt-4 text-purple-600" />}
                            </button>

                            <button
                                onClick={() => setMode('custom')}
                                className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all duration-300 relative hover:shadow-xl hover:-translate-y-1 group ${'bg-white dark:bg-[#121212] border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/50'
                                    }`}
                            >
                                <div className="p-4 rounded-full mb-4  transition-colors">
                                    <PenTool className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 text-center">Fill Application</h3>

                            </button>

                            <button
                                onClick={() => navigate(`/job/${jobId}`)}
                                className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all duration-300 relative hover:shadow-xl hover:-translate-y-1 group ${'bg-white dark:bg-[#121212] border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-black/50'
                                    }`}
                            >
                                <div className="p-4  rounded-full mb-4transition-colors">
                                    <Eye className="w-8 h-8 " />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 text-center">View Details</h3>

                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500  p-3 rounded-lg border border-white/5">
                            <AlertTriangle className="w-4 h-4 text-yellow-100" />
                            <span>Make sure your CV is up to date before applying.</span>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCustomSubmit} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Application Form</h3>
                            <button
                                type="button"
                                onClick={() => setMode('select')}
                                className="text-sm text-gray-400 hover:text-white"
                            >
                                Back
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Full Name</label>
                            <input
                                required
                                type="text"
                                value={customForm.full_name}
                                onChange={e => setCustomForm({ ...customForm, full_name: e.target.value })}
                                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Email</label>
                            <input
                                required
                                type="email"
                                value={customForm.email}
                                onChange={e => setCustomForm({ ...customForm, email: e.target.value })}
                                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Cover Letter</label>
                            <textarea
                                required
                                value={customForm.cover_letter}
                                onChange={e => setCustomForm({ ...customForm, cover_letter: e.target.value })}
                                className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2 h-32 focus:outline-none focus:border-purple-500/50 resize-none"
                                placeholder="Tell us why you're a great fit..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Submit Application
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
};
