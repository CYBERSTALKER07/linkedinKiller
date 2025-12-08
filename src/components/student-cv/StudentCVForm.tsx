import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentCV, updateStudentCV } from '../../lib/student-cv';
import { StudentCV, CVExperience } from '../../types';
import { Loader2, Save, Plus, Trash2, MapPin, GraduationCap, Briefcase, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useToast } from '../ui/Toast';

export const StudentCVForm: React.FC = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cv, setCv] = useState<Partial<StudentCV>>({
        skills: [],
        experience: [],
        education: []
    });

    const loadCV = useCallback(async () => {
        try {
            if (!user) return;
            const data = await getStudentCV(user.id);
            if (data) {
                setCv(data);
            } else {
                // Initialize with user profile data if available
                setCv({
                    full_name: user?.profile?.full_name || '',
                    email: user?.email || '',
                    skills: [],
                    experience: [],
                    education: []
                });
            }
        } catch (error) {
            console.error(error);
            toastError('Failed to load CV');
        } finally {
            setLoading(false);
        }
    }, [user, toastError]);

    useEffect(() => {
        if (user) {
            loadCV();
        }
    }, [user, loadCV]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateStudentCV(cv);
            success('CV saved successfully');
        } catch (error) {
            console.error(error);
            toastError('Failed to save CV');
        } finally {
            setSaving(false);
        }
    };

    const addExperience = () => {
        const newExp: CVExperience = {
            id: crypto.randomUUID(),
            company: '',
            role: '',
            start_date: '',
            current: false,
            description: ''
        };
        setCv(prev => ({ ...prev, experience: [...(prev.experience || []), newExp] }));
    };

    const updateExperience = (id: string, field: keyof CVExperience, value: string | boolean) => {
        setCv(prev => ({
            ...prev,
            experience: prev.experience?.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }));
    };

    const removeExperience = (id: string) => {
        setCv(prev => ({
            ...prev,
            experience: prev.experience?.filter(exp => exp.id !== id)
        }));
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Professional CV</h1>
                    <p className="text-gray-400">Manage your standardized profile for one-click applications.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 space-y-6">

                    {/* Personal Info */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <UserIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold">Personal Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Full Name</label>
                                <input
                                    type="text"
                                    value={cv.full_name || ''}
                                    onChange={e => setCv({ ...cv, full_name: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="email"
                                        value={cv.email || ''}
                                        onChange={e => setCv({ ...cv, email: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="tel"
                                        value={cv.phone || ''}
                                        onChange={e => setCv({ ...cv, phone: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">City / Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={cv.city || ''}
                                        onChange={e => setCv({ ...cv, city: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                        placeholder="San Francisco, CA"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Education - Top Level */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <GraduationCap className="w-5 h-5 text-pink-400" />
                            </div>
                            <h2 className="text-lg font-semibold">Primary Education</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm text-gray-400">University / College</label>
                                <input
                                    type="text"
                                    value={cv.university || ''}
                                    onChange={e => setCv({ ...cv, university: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500/50 transition-colors"
                                    placeholder="Stanford University"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Major / Degree</label>
                                <input
                                    type="text"
                                    value={cv.major || ''}
                                    onChange={e => setCv({ ...cv, major: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500/50 transition-colors"
                                    placeholder="Computer Science"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Graduation Year</label>
                                <input
                                    type="number"
                                    value={cv.graduation_year || ''}
                                    onChange={e => setCv({ ...cv, graduation_year: parseInt(e.target.value) })}
                                    className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500/50 transition-colors"
                                    placeholder="2025"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Experience Section */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-blue-400" />
                                </div>
                                <h2 className="text-lg font-semibold">Experience</h2>
                            </div>
                            <button
                                onClick={addExperience}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {cv.experience?.map((exp) => (
                                <div key={exp.id} className="relative p-6 bg-gray-800/30 rounded-xl border border-white/5 group transition-all hover:border-white/10">
                                    <button
                                        onClick={() => removeExperience(exp.id)}
                                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Company</label>
                                            <input
                                                type="text"
                                                value={exp.company}
                                                onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Role</label>
                                            <input
                                                type="text"
                                                value={exp.role}
                                                onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                placeholder="Software Engineer Intern"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Start Date</label>
                                            <input
                                                type="text"
                                                value={exp.start_date}
                                                onChange={e => updateExperience(exp.id, 'start_date', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                placeholder="Jun 2023"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">End Date</label>
                                            <input
                                                type="text"
                                                value={exp.end_date || ''}
                                                onChange={e => updateExperience(exp.id, 'end_date', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 focus:outline-none focus:border-blue-500/50 transition-colors"
                                                placeholder="Aug 2023"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={exp.description}
                                            onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                            className="w-full bg-gray-900/30 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:shadow-inner"
                                            placeholder="Describe your responsibilities and achievements..."
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!cv.experience || cv.experience.length === 0) && (
                                <div className="text-center py-8 text-gray-500 bg-gray-800/20 rounded-xl border border-dashed border-white/10">
                                    No experience added yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Skills (Comma separated)</label>
                            <input
                                type="text"
                                value={cv.skills?.join(', ') || ''}
                                onChange={e => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                                placeholder="React, TypeScript, Node.js, Design System..."
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
