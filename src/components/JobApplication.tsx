import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Linkedin,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import { Card } from './ui/Card';
import PageLayout from './ui/PageLayout';
import { cn } from '../lib/cva';
import { linkedInJobService } from '../lib/linkedin-job-service';
import { Job } from '../types';

interface ApplicationData {
  coverLetter: string;
  resumeFile?: File;
  resumeUrl?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
  };
  experience: {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
  }[];
  skills: string[];
  linkedinProfile?: string;
  portfolioUrl?: string;
  additionalInfo?: string;
}

export default function JobApplication() {
  const { jobId } = useParams<{ jobId: string }>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [error, setError] = useState<string>('');

  // Application form state
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    coverLetter: '',
    personalInfo: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || ''
    },
    experience: [],
    education: [],
    skills: user?.skills || []
  });

  // UI state
  const [isLinkedInAvailable, setIsLinkedInAvailable] = useState(false);
  const [useLinkedInData, setUseLinkedInData] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      checkLinkedInAvailability();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from your API
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      console.error('Error loading job:', err);
      setError('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLinkedInAvailability = () => {
    const token = localStorage.getItem('linkedin_access_token');
    setIsLinkedInAvailable(!!token);
  };

  const importLinkedInData = async () => {
    try {
      setIsLoading(true);
      const profile = await linkedInJobService.getUserProfile();

      setApplicationData(prev => ({
        ...prev,
        personalInfo: {
          firstName: profile.firstName || prev.personalInfo.firstName,
          lastName: profile.lastName || prev.personalInfo.lastName,
          email: profile.email || prev.personalInfo.email,
          phone: prev.personalInfo.phone,
          location: profile.location || prev.personalInfo.location
        },
        experience: profile.experience || prev.experience,
        education: profile.education || prev.education,
        skills: [...new Set([...prev.skills, ...(profile.skills || [])])],
        linkedinProfile: profile.publicProfileUrl
      }));

      setUseLinkedInData(true);
    } catch (err) {
      console.error('Error importing LinkedIn data:', err);
      setError('Failed to import LinkedIn data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validate required fields
      if (!applicationData.coverLetter.trim()) {
        setError('Cover letter is required');
        return;
      }

      // Submit to your platform's API
      const applicationPayload = {
        job_id: jobId,
        cover_letter: applicationData.coverLetter,
        personal_info: applicationData.personalInfo,
        experience: applicationData.experience,
        education: applicationData.education,
        skills: applicationData.skills,
        linkedin_profile: applicationData.linkedinProfile,
        portfolio_url: applicationData.portfolioUrl,
        additional_info: applicationData.additionalInfo,
        applied_via: useLinkedInData ? 'linkedin_integration' : 'platform',
        application_date: new Date().toISOString()
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(applicationPayload)
      });

      if (response.ok) {
        // If LinkedIn is available and job supports it, also apply via LinkedIn
        if (isLinkedInAvailable && job?.linkedin_job_id) {
          try {
            await linkedInJobService.applyToJob(job.linkedin_job_id, {
              coverLetter: applicationData.coverLetter,
              resumeUrl: applicationData.resumeUrl
            });
          } catch (linkedinError) {
            console.warn('LinkedIn application failed, but platform application succeeded:', linkedinError);
          }
        }

        setApplicationSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('application/')) {
        setApplicationData(prev => ({
          ...prev,
          resumeFile: file
        }));
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const generateLinkedInApplyUrl = () => {
    if (!job) return '';

    return linkedInJobService.createApplyWithLinkedInUrl({
      companyName: job.company,
      jobTitle: job.title,
      jobDescription: job.description,
      jobLocation: job.location,
      applicationUrl: `${window.location.origin}/job/${job.id}/apply`
    });
  };

  if (isLoading) {
    return (
      <PageLayout className={isDark ? 'bg-black text-white' : 'bg-white text-black'} maxWidth="4xl">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-info-600" />
        </div>
      </PageLayout>
    );
  }

  if (error && !job) {
    return (
      <PageLayout className={isDark ? 'bg-black text-white' : 'bg-white text-black'} maxWidth="4xl">
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => navigate('/jobs')}>
              Back to Jobs
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (applicationSubmitted) {
    return (
      <PageLayout className={isDark ? 'bg-black text-white' : 'bg-white text-black'} maxWidth="4xl">
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8 text-center max-w-md">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-4 text-green-600">Application Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your application for <strong>{job?.title}</strong> at <strong>{job?.company}</strong> has been submitted successfully.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/applications')}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                View My Applications
              </Button>
              <Button
                onClick={() => navigate('/jobs')}
                variant="outlined"
                className="w-full"
              >
                Browse More Jobs
              </Button>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className={isDark ? 'bg-black text-white' : 'bg-white text-black'} maxWidth="6xl" padding="none">
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b ${isDark ? 'bg-black/80 border-gray-800' : 'bg-white/80 border-gray-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="small"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

              <div>
                <h1 className="text-2xl font-bold">Apply for Position</h1>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {job?.title} at {job?.company}
                </p>
              </div>
            </div>

            {isLinkedInAvailable && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={importLinkedInData}
                  variant="outlined"
                  size="small"
                  className="flex items-center space-x-2"
                  disabled={useLinkedInData}
                >
                  <Linkedin className="h-4 w-4" />
                  <span>{useLinkedInData ? 'LinkedIn Data Imported' : 'Import from LinkedIn'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Job Summary</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-xl">{job?.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{job?.company}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{job?.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Briefcase className="h-4 w-4" />
                    <span>{job?.type}</span>
                  </div>
                  {job?.salary && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-green-600 font-medium">{job.salary}</span>
                    </div>
                  )}
                </div>

                {job?.skills && job.skills.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Required Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 6).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-info-100 dark:bg-info-900 text-info-800 dark:text-info-200 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Information</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <input
                        type="text"
                        value={applicationData.personalInfo.firstName}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                        }))}
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={applicationData.personalInfo.lastName}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                        }))}
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        value={applicationData.personalInfo.email}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={applicationData.personalInfo.phone}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Resume</span>
                  </h3>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {applicationData.resumeFile ? applicationData.resumeFile.name : 'Click to upload your resume (PDF, DOC, DOCX)'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Cover Letter *</span>
                  </h3>

                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      coverLetter: e.target.value
                    }))}
                    placeholder="Write a compelling cover letter that highlights your relevant experience and explains why you're interested in this position..."
                    rows={8}
                    className={cn(
                      'w-full p-4 rounded-lg border resize-none',
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    )}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {applicationData.coverLetter.length}/2000 characters
                  </p>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
                      <input
                        type="url"
                        value={applicationData.linkedinProfile || ''}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          linkedinProfile: e.target.value
                        }))}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Portfolio URL</label>
                      <input
                        type="url"
                        value={applicationData.portfolioUrl || ''}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          portfolioUrl: e.target.value
                        }))}
                        placeholder="https://yourportfolio.com"
                        className={cn(
                          'w-full p-3 rounded-lg border',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Notes</label>
                      <textarea
                        value={applicationData.additionalInfo || ''}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          additionalInfo: e.target.value
                        }))}
                        placeholder="Any additional information you'd like to share..."
                        rows={4}
                        className={cn(
                          'w-full p-3 rounded-lg border resize-none',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="text-red-800 dark:text-red-200">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting || !applicationData.coverLetter.trim()}
                    className="bg-info-600 text-white hover:bg-info-700 flex items-center justify-center space-x-2 flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                  </Button>

                  {isLinkedInAvailable && job?.linkedin_job_id && (
                    <Button
                      as="a"
                      href={generateLinkedInApplyUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      className="flex items-center justify-center space-x-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>Apply with LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}