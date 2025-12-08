import React from 'react';
import PageLayout from '../components/ui/PageLayout';
import { StudentCVForm } from '../components/student-cv/StudentCVForm';

export const StudentCVPage = () => {
    return (
        <PageLayout>
            <div className="container mx-auto px-4 py-8">
                <StudentCVForm />
            </div>
        </PageLayout>
    );
};
