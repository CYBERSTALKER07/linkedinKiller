import React, { useState } from 'react';
import { Application, StudentCV } from '../../types';
import { User, MapPin, GraduationCap } from 'lucide-react';
import { StandardCVView } from '../student-cv/StandardCVView';
import Modal from '../ui/Modal';
import { cn } from '../../lib/cva';

interface ApplicantCardProps {
    application: Application;
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({ application }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse application data safely
    const appData = application.application_data;
    const isStandardCV = application.type === 'standard_cv';

    // Extract display info
    const basicInfo = appData as { full_name?: string; email?: string } | undefined;
    const name = basicInfo?.full_name || application.student?.full_name || 'Unknown Candidate';
    const email = basicInfo?.email || application.student?.email;
    const avatarUrl = application.student?.avatar_url;

    // Extract details if standard CV
    const university = isStandardCV ? (appData as unknown as StudentCV).university : null;
    const major = isStandardCV ? (appData as unknown as StudentCV).major : null;
    const city = isStandardCV ? (appData as unknown as StudentCV).city : null;

    return (
        <>
            <div
                onClick={() => setIsOpen(true)}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
            >
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <User className="w-8 h-8" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg dark:text-white truncate pr-6">{name}</h3>
                        <div className="text-sm text-gray-500 mb-1">{email}</div>

                        {(university || major) && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <GraduationCap className="w-4 h-4" />
                                <span className="truncate">{major} {university ? `at ${university}` : ''}</span>
                            </div>
                        )}

                        {city && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{city}</span>
                            </div>
                        )}

                        {/* Tags */}
                        {isStandardCV && (appData as unknown as StudentCV).skills && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {(appData as unknown as StudentCV).skills?.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs rounded-md font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {((appData as unknown as StudentCV).skills?.length || 0) > 3 && (
                                    <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs rounded-md">
                                        +{(appData as unknown as StudentCV).skills!.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className={cn(
                        "absolute top-6 right-6 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide",
                        application.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                            application.status === 'accepted' ? "bg-green-50 text-green-600" :
                                "bg-gray-50 text-gray-600"
                    )}>
                        {application.status}
                    </div>
                </div>
            </div>

            {/* Application Detail Modal - Simplified View */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={`Application from ${name}`}
                size="extra-large"
            >
                <div className="max-h-[80vh] overflow-y-auto">
                    {isStandardCV ? (
                        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-xl flex justify-center">
                            <StandardCVView cv={appData as unknown as StudentCV} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                                <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Cover Letter</h4>
                                <p className="whitespace-pre-wrap dark:text-gray-300">
                                    {application.cover_letter || (appData as Record<string, unknown> | undefined)?.cover_letter as string}
                                </p>
                            </div>
                            {/* Display other custom fields if any */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg dark:border-gray-700">
                                    <label className="text-xs text-gray-500">Email</label>
                                    <div className="font-medium dark:text-white">{email}</div>
                                </div>
                                <div className="p-4 border rounded-lg dark:border-gray-700">
                                    <label className="text-xs text-gray-500">Applied Date</label>
                                    <div className="font-medium dark:text-white">
                                        {new Date(application.created_at || application.applied_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};
