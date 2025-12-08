import React from 'react';
import { StudentCV } from '../../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface StandardCVViewProps {
    cv: StudentCV;
}

export const StandardCVView: React.FC<StandardCVViewProps> = ({ cv }) => {
    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white text-gray-900 p-8 md:p-12 shadow-2xl min-h-[297mm] select-none">
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-6 mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">{cv.full_name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {cv.email && (
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {cv.email}
                        </div>
                    )}
                    {cv.phone && (
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cv.phone}
                        </div>
                    )}
                    {cv.city && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cv.city}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column (Skills, Education) */}
                <div className="space-y-8">
                    {/* Education */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 text-gray-500">Education</h3>
                        <div className="space-y-4">
                            {cv.university && (
                                <div>
                                    <div className="font-bold">{cv.university}</div>
                                    <div className="text-sm">{cv.major}</div>
                                    <div className="text-xs text-gray-500">{cv.graduation_year ? `Class of ${cv.graduation_year}` : ''}</div>
                                </div>
                            )}
                            {cv.education?.map((edu, i) => (
                                <div key={i}>
                                    <div className="font-bold">{edu.institution}</div>
                                    <div className="text-sm">{edu.degree} in {edu.field_of_study}</div>
                                    <div className="text-xs text-gray-500">{edu.start_year} - {edu.current ? 'Present' : edu.end_year}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 text-gray-500">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {cv.skills?.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column (Experience) */}
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 text-gray-500">Experience</h3>
                        <div className="space-y-6">
                            {cv.experience?.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                        <span className="text-xs text-gray-500 space-x-1">
                                            <span>{exp.start_date}</span>
                                            <span>-</span>
                                            <span>{exp.current ? 'Present' : exp.end_date}</span>
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">{exp.company}</div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
