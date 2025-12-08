import { supabase } from './supabase';
import { StudentCV, Application } from '../types';

export const getStudentCV = async (userId: string): Promise<StudentCV | null> => {
    const { data, error } = await supabase
        .from('student_cvs')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        console.error('Error fetching student CV:', error);
        return null;
    }

    return data;
};

export const updateStudentCV = async (cvData: Partial<StudentCV>): Promise<StudentCV> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const updateData = {
        ...cvData,
        user_id: user.user.id,
        updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be manually updated if present
    const cleanData = { ...updateData };
    if ('id' in cleanData) delete cleanData.id;
    if ('created_at' in cleanData) delete cleanData.created_at;

    const { data, error } = await supabase
        .from('student_cvs')
        .upsert(cleanData, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error('Error updating student CV:', error);
        throw error;
    }
    return data;
};

export async function createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'applied_date'>) {
    console.log('🚀 [createApplication] Starting submission...', application);

    try {
        const { data, error } = await supabase
            .from('applications')
            .insert({
                ...application,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [createApplication] Supabase Error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('✅ [createApplication] Success:', data);
        return data;
    } catch (err) {
        console.error('❌ [createApplication] Catch Error:', err);
        throw err;
    }
}

export const getJobApplicants = async (jobId: string) => {
    const { data, error } = await supabase
        .from('applications')
        .select(`
            *,
            student:profiles!student_id(full_name, avatar_url, email)
        `)
        .eq('job_id', jobId);

    if (error) {
        console.error('Error fetching applicants:', error);
        throw error;
    }
    return data;
}

export const checkApplicationStatus = async (jobId: string, studentId: string) => {
    const { data, error } = await supabase
        .from('applications')
        .select('status, id')
        .eq('job_id', jobId)
        .eq('student_id', studentId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking application status:', error);
    }

    return data;
}
