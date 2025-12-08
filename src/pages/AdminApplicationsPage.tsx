import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import PageLayout from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { MapPin, Building2, AlertCircle, Filter } from 'lucide-react';
import { cn } from '../lib/cva';

export default function AdminApplicationsPage() {
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const { data: applications, isLoading } = useQuery({
        queryKey: ['admin-applications', filterStatus],
        queryFn: async () => {
            let query = supabase
                .from('applications')
                .select(`
          id,
          status,
          applied_date,
          cover_letter,
          jobs (
            id,
            title,
            company,
            location
          ),
          profiles (
            id,
            full_name,
            email,
            avatar_url,
            username
          )
        `)
                .order('applied_date', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from('applications')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
        }
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'accepted':
            case 'hired':
                return 'text-green-500 bg-green-500/10';
            case 'rejected':
                return 'text-red-500 bg-red-500/10';
            case 'interview':
                return 'text-purple-500 bg-purple-500/10';
            default:
                return 'text-yellow-500 bg-yellow-500/10';
        }
    };

    if (isLoading) {
        return (
            <PageLayout className={isDark ? 'bg-black text-white' : 'bg-white text-black'}>
                <div className="flex justify-center items-center h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            className={cn('min-h-screen', isDark ? 'bg-black text-white' : 'bg-white text-black')}
            maxWidth="xl"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Application Management</h1>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Review and manage all student applications
                    </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-gray-500" />
                    {['all', 'pending', 'interview', 'accepted', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                                'px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap',
                                filterStatus === status
                                    ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {applications?.length === 0 ? (
                    <div className={cn(
                        'text-center py-12 rounded-3xl border',
                        isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-200 bg-gray-50'
                    )}>
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-bold mb-2">No applications found</h3>
                        <p className="text-gray-500">Try adjusting your filters</p>
                    </div>
                ) : (
                    applications?.map((application: any) => (
                        <Card
                            key={application.id}
                            className={cn(
                                'p-6 transition-all hover:shadow-lg',
                                isDark ? 'bg-gray-900/20 border-gray-800' : 'bg-white border-gray-200'
                            )}
                        >
                            <div className="flex flex-col gap-6">
                                {/* Header: Job and Status */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{application.jobs?.title}</h3>
                                        <div className="flex items-center text-gray-500 mb-2">
                                            <Building2 className="w-4 h-4 mr-1" />
                                            <span className="mr-4">{application.jobs?.company}</span>
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span>{application.jobs?.location || 'Remote'}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'self-start px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center',
                                        getStatusColor(application.status)
                                    )}>
                                        {application.status}
                                    </div>
                                </div>

                                {/* Applicant Info */}
                                <div className={cn(
                                    'p-4 rounded-xl flex items-center gap-4',
                                    isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                                )}>
                                    {application.profiles?.avatar_url ? (
                                        <img
                                            src={application.profiles.avatar_url}
                                            alt={application.profiles.full_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className={cn(
                                            'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
                                            isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                                        )}>
                                            {application.profiles?.full_name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold">{application.profiles?.full_name || 'Unknown Applicant'}</div>
                                        <div className="text-sm text-gray-500">@{application.profiles?.username}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => updateStatusMutation.mutate({ id: application.id, status: 'interview' })}
                                        disabled={application.status === 'interview'}
                                        className={application.status === 'interview' ? 'opacity-50' : ''}
                                    >
                                        Interview
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => updateStatusMutation.mutate({ id: application.id, status: 'accepted' })}
                                        disabled={application.status === 'accepted'}
                                        className={cn(
                                            application.status === 'accepted' ? 'opacity-50' : '',
                                            'text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        )}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => updateStatusMutation.mutate({ id: application.id, status: 'rejected' })}
                                        disabled={application.status === 'rejected'}
                                        className={cn(
                                            application.status === 'rejected' ? 'opacity-50' : '',
                                            'text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        )}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </PageLayout>
    );
}
