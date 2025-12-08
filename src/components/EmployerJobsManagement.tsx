import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useJobManagement } from '../hooks/useJobManagement';
import { Job } from '../types';
import Button from './ui/Button';
import PageLayout from './ui/PageLayout';

export default function EmployerJobsManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    fetchEmployerJobs,
    deleteJob,
    updateJobStatus,
    error,
    success
  } = useJobManagement();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');

  // Check if user is employer
  useEffect(() => {
    if (user && user.role !== 'employer') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch jobs on mount
  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    const fetchedJobs = await fetchEmployerJobs();
    setJobs(fetchedJobs);
    setIsLoadingJobs(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    const success = await deleteJob(jobId);
    if (success) {
      setJobs(jobs.filter(j => j.id !== jobId));
      setShowDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: 'open' | 'closed' | 'draft') => {
    const success = await updateJobStatus(jobId, newStatus);
    if (success) {
      setJobs(jobs.map(j =>
        j.id === jobId ? { ...j, status: newStatus } : j
      ));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return isDark ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800';
      case 'closed':
        return isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800';
      case 'draft':
        return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job =>
    statusFilter === 'all' ? true : job.status === statusFilter
  );

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    applications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
    views: jobs.reduce((sum, j) => sum + (j.views || 0), 0)
  };

  return (
    <PageLayout
      className={isDark ? 'bg-black text-white' : 'bg-white text-black'}
      maxWidth="6xl"
      padding="none"
    >
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b ${isDark ? 'bg-black/80 border-gray-800' : 'bg-white/80 border-gray-200'
        }`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold">Job Postings</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your job listings
            </p>
          </div>
          <Button
            onClick={() => navigate('/post-job')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
              }`}
          >
            <Plus className="h-5 w-5" />
            <span>Post Job</span>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className={`border-b p-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-sm font-medium text-gray-500">Total Jobs</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-sm font-medium text-green-500">Active</div>
            <div className="text-2xl font-bold mt-1">{stats.open}</div>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-sm font-medium text-info-500">Applications</div>
            <div className="text-2xl font-bold mt-1">{stats.applications}</div>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-sm font-medium text-purple-500">Views</div>
            <div className="text-2xl font-bold mt-1">{stats.views}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={`border-b p-4 ${isDark ? 'border-gray-800 bg-red-900/20' : 'border-gray-200 bg-red-50'}`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className={`border-b p-4 ${isDark ? 'border-gray-800 bg-green-900/20' : 'border-gray-200 bg-green-50'}`}>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className={`border-b p-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex space-x-4">
          {(['all', 'open', 'closed', 'draft'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${statusFilter === filter
                ? isDark
                  ? 'bg-info-900 text-info-100'
                  : 'bg-info-100 text-info-800'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-black'
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="divide-y divide-gray-800 dark:divide-gray-200">
        {isLoadingJobs ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading jobs...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {statusFilter === 'all'
                ? "No jobs posted yet. Create your first job posting!"
                : `No ${statusFilter} jobs`}
            </div>
            {statusFilter === 'all' && (
              <Button
                onClick={() => navigate('/post-job')}
                className="mt-4 mx-auto"
              >
                Post Your First Job
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map(job => (
            <div
              key={job.id}
              className={`p-4 border-b last:border-b-0 hover:transition-colors cursor-pointer ${isDark
                ? 'hover:bg-gray-900/50 border-gray-800'
                : 'hover:bg-gray-50/50 border-gray-200'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold truncate">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(job.status || 'draft')}`}>
                      {(job.status || 'draft').charAt(0).toUpperCase() + (job.status || 'draft').slice(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    {job.company && (
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.company}</span>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center space-x-1 text-info-500">
                      <Users className="h-4 w-4" />
                      <span>{job.applications_count || 0} applications</span>
                    </div>
                    <div className="flex items-center space-x-1 text-purple-500">
                      <Eye className="h-4 w-4" />
                      <span>{job.views || 0} views</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="h-4 w-4" />
                      <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative group">
                    <button
                      className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                      <button
                        onClick={() => navigate(`/edit-job/${job.id}`)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${isDark
                          ? 'hover:bg-gray-700 border-b border-gray-700'
                          : 'hover:bg-gray-100 border-b border-gray-200'
                          }`}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>

                      <div className={`px-4 py-2 text-sm border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <span className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Status
                        </span>
                        <div className="flex gap-2">
                          {(['open', 'closed', 'draft'] as const).map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(job.id, status)}
                              className={`px-2 py-1 rounded text-xs font-medium ${job.status === status
                                ? isDark
                                  ? 'bg-info-900 text-info-100'
                                  : 'bg-info-100 text-info-800'
                                : isDark
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDeleteConfirm(job.id)}
                        className={`w-full text-left px-4 py-2 text-sm text-red-500 flex items-center space-x-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-sm w-full rounded-2xl ${isDark ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Delete Job?</h3>
              <p className={`text-center text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                This action cannot be undone. All applications for this job will also be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outlined"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteJob(showDeleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
