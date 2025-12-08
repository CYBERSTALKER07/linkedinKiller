import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  Trash2,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/Button';
import { Card } from './ui/Card';
import PageLayout from './ui/PageLayout';
import { cn } from '../lib/cva';
import { Application } from '../types';
import { supabase } from '../lib/supabase';
import Typography from './ui/Typography';
import SegmentedControl from './ui/SegmentedControl';

export default function Applications() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');



  useEffect(() => {
    fetchApplications();
  }, [user?.id]);

  const fetchApplications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner(
            title,
            company,
            location,
            type,
            salary_range,
            description,
            requirements
          )
        `)
        .eq('student_id', user.id)
        .order('applied_date', { ascending: false });

      if (error) throw error;

      const formattedApplications: Application[] = data?.map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: app.jobs.title,
        company_name: app.jobs.company,
        location: app.jobs.location,
        type: app.jobs.type,
        status: app.status,
        applied_date: app.applied_date,
        salary_range: app.jobs.salary_range,
        description: app.jobs.description,
        requirements: app.jobs.requirements,
        last_updated: app.updated_at
      })) || [];

      setApplications(formattedApplications);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('student_id', user?.id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to withdraw application');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600';
      case 'reviewed': return isDark ? 'bg-info-500/10 text-info-400' : 'bg-info-50 text-info-600';
      case 'interview': return isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600';
      case 'accepted': return isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600';
      case 'rejected': return isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600';
      default: return isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'interview': return <FileText className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };



  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${isDark ? 'border-lime' : 'border-asu-maroon'
              }`}></div>
            <Typography variant="body1" color="textSecondary">
              Loading your applications...
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <Typography variant="h6" className="text-red-600 mb-2">
              Error Loading Applications
            </Typography>
            <Typography variant="body1" color="textSecondary" className="mb-4">
              {error}
            </Typography>
            <Button onClick={fetchApplications} variant="outlined">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      className={isDark ? 'bg-black text-white' : 'bg-white text-black'}
      maxWidth="6xl"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          My Applications
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Track your job applications and their status
        </p>
      </div>

      {/* Filters and Search */}
      <div className="space-y-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDark
              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-black placeholder-gray-500'
              }`}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <SegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="Status filter"
            >
              <SegmentedControl.Option value="all">All Status</SegmentedControl.Option>
              <SegmentedControl.Option value="pending">Pending</SegmentedControl.Option>
              <SegmentedControl.Option value="reviewed">Reviewed</SegmentedControl.Option>
              <SegmentedControl.Option value="interview">Interview</SegmentedControl.Option>
              <SegmentedControl.Option value="accepted">Accepted</SegmentedControl.Option>
              <SegmentedControl.Option value="rejected">Rejected</SegmentedControl.Option>
            </SegmentedControl>
          </div>

          <div className="overflow-x-auto">
            <SegmentedControl
              value={typeFilter}
              onChange={setTypeFilter}
              aria-label="Type filter"
            >
              <SegmentedControl.Option value="all">All Types</SegmentedControl.Option>
              <SegmentedControl.Option value="full-time">Full Time</SegmentedControl.Option>
              <SegmentedControl.Option value="part-time">Part Time</SegmentedControl.Option>
              <SegmentedControl.Option value="internship">Internship</SegmentedControl.Option>
            </SegmentedControl>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-6">
        {filteredApplications.map((application) => (
          <Card
            key={application.id}
            className={`p-6 hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                  <Building2 className="h-6 w-6 text-info-500" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{application.job_title}</h3>
                  <p className="text-info-500 font-medium mb-2">{application.company_name}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {application.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied {new Date(application.applied_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {application.type}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      getStatusColor(application.status)
                    )}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>

                    {application.interview_date && (
                      <span className="text-sm text-orange-600 font-medium">
                        Interview: {new Date(application.interview_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => window.open(`/job/${application.job_id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>



                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleDeleteApplication(application.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {application.description && (
              <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-dark-surface' : 'bg-gray-50'
                }`}>
                <Typography variant="body2" color="textSecondary">
                  {application.description}
                </Typography>
              </div>
            )}

            {application.requirements && (
              <div className="flex flex-wrap gap-2 mb-4">
                {application.requirements.slice(0, 4).map((req, reqIndex) => (
                  <span
                    key={reqIndex}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-lime/10 text-lime' : 'bg-asu-maroon/10 text-asu-maroon'
                      }`}
                  >
                    {req}
                  </span>
                ))}
                {application.requirements.length > 4 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                    +{application.requirements.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building2 className={`h-4 w-4 ${isDark ? 'text-dark-muted' : 'text-gray-400'}`} />
                  <Typography variant="body2" color="textSecondary" className="capitalize">
                    {application.type.replace('-', ' ')}
                  </Typography>
                </div>
                <Typography variant="body2" color="textSecondary">
                  Updated {new Date(application.last_updated).toLocaleDateString()}
                </Typography>
              </div>
              <div className="flex space-x-2">
                <Button variant="outlined" size="small">
                  View Details
                </Button>
                <Button variant="text" size="small">
                  Contact
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No applications found</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : "You haven't applied to any jobs yet"
            }
          </p>
          <Link to="/jobs">
            <Button className="px-6 py-3">
              Browse Jobs
            </Button>
          </Link>
        </div>
      )}
    </PageLayout>
  );
}