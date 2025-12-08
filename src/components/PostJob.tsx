import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Eye,
  MapPin,
  DollarSign,
  Briefcase,
  Building2,
  Users,
  Clock,
  Mail,
  Hash,
  X as XIcon,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useJobManagement } from '../hooks/useJobManagement';
import { supabase } from '../lib/supabase';
import Avatar from './ui/Avatar';
import PageLayout from './ui/PageLayout';
import Stepper, { Step } from './ui/Stepper';
import { cn } from '../lib/cva';
import { buttonVariants } from '../lib/animations';
import { triggerSuccessConfetti } from '../lib/confetti';
import LocationSelector from './LocationSelector';

// --- Custom Hook to Replace Broken Import ---
const useBreakpoint = (breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    const breakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };

    const query = `(min-width: ${breakpoints[breakpoint]})`;
    const media = window.matchMedia(query);

    const listener = () => setIsMatch(media.matches);

    setIsMatch(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [breakpoint]);

  return isMatch;
};

export default function PostJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { postJob, loading, error, success, clearMessages } = useJobManagement();

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    company: user?.profile?.company_name || '',
    location: '',
    type: 'full-time' as const,
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    skills: [] as string[],
    deadline: '',
    contact_email: user?.email || '',
    is_remote: false,
    experience_level: 'entry',
    department: '',
    country: '',
    city: '',
    street_address: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const isLg = useBreakpoint('lg');
  const isMobile = !isLg;

  useEffect(() => {
    if (user && user.role !== 'employer') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      setUploadingMedia(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const userId = user?.id;

      const isVideo = file.type.startsWith('video/');
      const bucketName = isVideo ? 'videos' : 'post-images';
      const filePath = `${userId}/jobs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);

      try {
        await uploadMedia(file);
      } catch (err) {
        console.error('Failed to upload media:', err);
        alert('Failed to upload media. Please try again.');
      }
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = 'Job title is required';
    if (!formData.company.trim()) errors.company = 'Company name is required';
    if (!formData.country.trim()) errors.location = 'Country is required';
    if (!formData.city.trim()) errors.location = 'City is required';
    if (!formData.street_address.trim()) errors.location = 'Street address is required';
    if (!formData.description.trim()) errors.description = 'Job description is required';
    if (!formData.requirements.trim()) errors.requirements = 'Requirements are required';
    if (!formData.contact_email.trim()) errors.contact_email = 'Contact email is required';
    if (formData.skills.length === 0) errors.skills = 'At least one skill is required';
    if (formData.deadline && new Date(formData.deadline) < new Date()) {
      errors.deadline = 'Deadline must be in the future';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
      if (validationErrors.skills) {
        const newErrors = { ...validationErrors };
        delete newErrors.skills;
        setValidationErrors(newErrors);
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await postJob(formData);

      triggerSuccessConfetti();

      if (result) {
        setTimeout(() => {
          clearMessages();
          navigate('/dashboard');
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Preview Component
  const LivePreview = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "sticky top-24 h-fit rounded-3xl border p-6 shadow-xl",
        isDark
          ? 'bg-zinc-900/50 border-gray-200/10 backdrop-blur-xl'
          : 'bg-white/80 border-gray-200 backdrop-blur-xl'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn("text-lg font-bold flex items-center gap-2", isDark ? 'text-white' : 'text-gray-900')}>
          <Eye className="h-5 w-5" />
          Live Preview
        </h3>
      </div>

      <div className="space-y-4">
        {formData.title && (
          <div>
            <h4 className={cn("text-xl font-bold", isDark ? 'text-white' : 'text-gray-900')}>
              {formData.title}
            </h4>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {formData.company && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border",
              isDark ? 'bg-zinc-800/50 border-gray-200/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            )}>
              <Building2 className="h-3.5 w-3.5" />
              {formData.company}
            </div>
          )}
          {formData.location && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border",
              isDark ? 'bg-zinc-800/50 border-gray-200/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            )}>
              <MapPin className="h-3.5 w-3.5" />
              {formData.location}
            </div>
          )}
          {formData.salary && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border",
              isDark ? 'bg-lime-400/10 border-lime-400/20 text-lime-400' : 'bg-lime-50 border-lime-200 text-lime-700'
            )}>
              <DollarSign className="h-3.5 w-3.5" />
              {formData.salary}
            </div>
          )}
        </div>

        {formData.skills.length > 0 && (
          <div>
            <p className={cn("text-xs font-semibold mb-2", isDark ? 'text-gray-400' : 'text-gray-600')}>
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    isDark ? 'bg-zinc-800 border-gray-200/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  )}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {formData.description && (
          <div>
            <p className={cn("text-xs font-semibold mb-2", isDark ? 'text-gray-400' : 'text-gray-600')}>
              Description
            </p>
            <p className={cn("text-sm line-clamp-3", isDark ? 'text-gray-300' : 'text-gray-700')}>
              {formData.description}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <PageLayout
      className={cn(isDark ? 'bg-black text-white' : 'bg-gray-50 text-black')}
      maxWidth="7xl"
      padding="none"
    >
      {/* Header */}
      <div className={cn("sticky top-0 z-10 backdrop-blur-xl border-b", isDark ? 'bg-zinc-900/80 border-gray-200/10 text-white' : 'bg-white/80 border-gray-200 text-gray-900')}>
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className={cn("p-2 rounded-full transition-colors", isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Post a Job</h1>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className={cn("p-2 rounded-full transition-colors", isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
            title="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn("border-b p-4", isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50')}
          >
            <div className="flex items-start space-x-3 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
              <AlertCircle className={cn("h-5 w-5 shrink-0 mt-0.5", isDark ? 'text-red-400' : 'text-red-600')} />
              <div className="flex-1">
                <p className={cn("font-semibold text-sm sm:text-base", isDark ? 'text-red-400' : 'text-red-700')}>{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn("border-b p-4", isDark ? 'border-lime-400/20 bg-lime-400/10' : 'border-lime-200 bg-lime-50')}
          >
            <div className="flex items-start space-x-3 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
              <CheckCircle className={cn("h-5 w-5 shrink-0 mt-0.5", isDark ? 'text-lime-400' : 'text-lime-600')} />
              <div className="flex-1">
                <p className={cn("font-semibold text-sm sm:text-base", isDark ? 'text-lime-400' : 'text-lime-700')}>{success}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("w-full", isDark ? 'bg-black' : 'bg-gray-50')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="w-full">
                <Stepper
                  initialStep={1}
                  onStepChange={(step) => {
                    setCurrentStep(step);
                  }}
                  backButtonText="← Previous"
                  nextButtonText="Next →"
                  stepCircleContainerClassName={cn(
                    isDark ? 'bg-zinc-900/50 border-gray-200/10' : 'bg-white border-gray-200',
                    'border rounded-3xl shadow-sm'
                  )}
                  contentClassName={cn(
                    'py-8 sm:py-10',
                    isDark ? 'bg-transparent' : 'bg-transparent'
                  )}
                  currentStep={currentStep}
                  footerClassName={cn(currentStep === 4 ? 'hidden' : '')}
                >
                  {/* Step 1: Basic Information */}
                  <Step>
                    <div className={cn(
                      "space-y-6 p-6 sm:p-8 rounded-3xl border",
                      isDark ? 'bg-zinc-900/30 border-gray-200/10' : 'bg-white border-gray-200 shadow-sm'
                    )}>
                      <div>
                        <h2 className={cn("text-2xl font-bold mb-2", isDark ? 'text-white' : 'text-black')}>
                          Job Basics
                        </h2>
                        <p className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                          Tell us about the position
                        </p>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Avatar
                          src={user?.profile.avatar_url || ''}
                          alt={user?.profile.full_name || 'User'}
                          size="lg"
                          className="shrink-0"
                        />
                        <div className="flex-1">
                          <div className={cn("font-bold text-lg", isDark ? 'text-white' : 'text-black')}>{user?.profile?.full_name || 'Your Company'}</div>
                          <div className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>{user?.profile?.company_name || 'Company Name'}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={cn("font-semibold text-base", isDark ? 'text-white' : 'text-black')}>
                          Job Title *
                        </label>
                        <textarea
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Senior Product Manager, Frontend Engineer..."
                          rows={2}
                          className={cn(
                            "w-full text-lg font-semibold bg-transparent border rounded-3xl px-4 py-3 outline-none focus:border-2 resize-none transition-all",
                            isDark
                              ? 'border-gray-200/10 placeholder-gray-500 text-white focus:border-lime-400'
                              : 'border-gray-200 placeholder-gray-400 text-gray-900 focus:border-lime-500 shadow-sm'
                          )}
                        />
                        {validationErrors.title && (
                          <p className="text-red-500 text-sm">{validationErrors.title}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                            <Building2 className="h-4 w-4" />
                            <span>Company *</span>
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder="Company name"
                            className={cn(
                              "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2 transition-all",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-lime-500 shadow-sm'
                            )}
                          />
                          {validationErrors.company && (
                            <p className="text-red-500 text-sm">{validationErrors.company}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          {/* Location Selector */}
                          <LocationSelector
                            value={{
                              country: formData.country,
                              city: formData.city,
                              street_address: formData.street_address
                            }}
                            onChange={(loc) => {
                              setFormData(prev => ({
                                ...prev,
                                country: loc.country,
                                city: loc.city,
                                street_address: loc.street_address,
                                location: `${loc.street_address}, ${loc.city}, ${loc.country}`
                              }));
                              if (validationErrors.location) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.location;
                                  return newErrors;
                                });
                              }
                            }}
                            error={validationErrors.location}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                            <Clock className="h-4 w-4" />
                            <span>Job Type</span>
                          </label>
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                                : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                            )}
                          >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="internship">Internship</option>
                            <option value="contract">Contract</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                            <DollarSign className="h-4 w-4" />
                            <span>Salary Range</span>
                          </label>
                          <input
                            type="text"
                            name="salary"
                            value={formData.salary}
                            onChange={handleInputChange}
                            placeholder="e.g., $60k-80k or $25/hour"
                            className={cn(
                              "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                                : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                            )}
                          />
                        </div>
                      </div>

                      <label className={cn(
                        "flex items-center space-x-3 cursor-pointer p-4 rounded-3xl border-2 transition-all",
                        isDark ? 'border-gray-200/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50',
                        formData.is_remote ? (isDark ? 'bg-lime-400/10 border-lime-400/30' : 'bg-lime-50 border-lime-300') : ''
                      )}>
                        <input
                          type="checkbox"
                          name="is_remote"
                          checked={formData.is_remote}
                          onChange={handleInputChange}
                          className={cn(
                            "w-5 h-5 rounded border-2 focus:ring-2",
                            isDark
                              ? 'border-gray-200/20 bg-zinc-900 text-lime-400 focus:ring-lime-400/20'
                              : 'border-gray-300 bg-white text-lime-500 focus:ring-lime-500/20'
                          )}
                        />
                        <span className="font-semibold">🌍 Remote work available</span>
                      </label>
                    </div>
                  </Step>

                  {/* Step 2: Description & Media */}
                  <Step>
                    <div className={cn(
                      "space-y-6 p-6 sm:p-8 rounded-3xl border",
                      isDark ? 'bg-zinc-900/30 border-gray-200/10' : 'bg-white border-gray-200 shadow-sm'
                    )}>
                      <div>
                        <h2 className={cn("text-2xl font-bold mb-2", isDark ? 'text-white' : 'text-black')}>
                          Job Description
                        </h2>
                        <p className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                          Add details and media about the role
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <TrendingUp className="h-4 w-4" />
                          <span>Description *</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                          rows={5}
                          className={cn(
                            "w-full border rounded-3xl px-4 py-3 outline-none focus:border-2 resize-none transition-all",
                            isDark
                              ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-lime-500 shadow-sm'
                          )}
                        />
                        {validationErrors.description && (
                          <p className="text-red-500 text-sm">{validationErrors.description}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <ImageIcon className="h-4 w-4" />
                          <span>Add Media (optional)</span>
                        </div>

                        {!mediaPreview ? (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex-1 border-2 border-dashed rounded-3xl p-6 transition-all text-center",
                                isDark
                                  ? 'border-gray-200/10 hover:border-lime-400/30 hover:bg-white/5'
                                  : 'border-gray-300 hover:border-lime-500/30 hover:bg-lime-50/50'
                              )}
                              title="Upload image"
                            >
                              <ImageIcon className={cn("h-8 w-8 mx-auto mb-2", isDark ? 'text-gray-400' : 'text-gray-600')} />
                              <div className={cn("font-semibold text-sm", isDark ? 'text-white' : 'text-black')}>Add Image</div>
                              <div className={cn("text-xs", isDark ? 'text-gray-400' : 'text-gray-600')}>JPG, PNG up to 5MB</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => videoInputRef.current?.click()}
                              className={cn(
                                "flex-1 border-2 border-dashed rounded-3xl p-6 transition-all text-center",
                                isDark
                                  ? 'border-gray-200/10 hover:border-lime-400/30 hover:bg-white/5'
                                  : 'border-gray-300 hover:border-lime-500/30 hover:bg-lime-50/50'
                              )}
                              title="Upload video"
                            >
                              <Video className={cn("h-8 w-8 mx-auto mb-2", isDark ? 'text-gray-400' : 'text-gray-600')} />
                              <div className={cn("font-semibold text-sm", isDark ? 'text-white' : 'text-black')}>Add Video</div>
                              <div className={cn("text-xs", isDark ? 'text-gray-400' : 'text-gray-600')}>MP4 up to 50MB</div>
                            </button>
                          </div>
                        ) : (
                          <div className={cn("relative rounded-3xl overflow-hidden", isDark ? 'bg-black' : 'bg-gray-100')}>
                            {selectedMedia?.type.startsWith('image/') ? (
                              <img
                                src={mediaPreview}
                                alt="Preview"
                                className="w-full h-auto max-h-96 object-cover"
                              />
                            ) : (
                              <video
                                src={mediaPreview}
                                controls
                                className="w-full h-auto max-h-96"
                              />
                            )}
                            <button
                              type="button"
                              onClick={removeMedia}
                              className={cn(
                                "absolute top-3 right-3 rounded-full p-2 transition-colors",
                                isDark ? 'bg-black/80 text-white hover:bg-black' : 'bg-white/80 text-black hover:bg-white'
                              )}
                              title="Remove media"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {uploadingMedia && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <span>Benefits & Perks</span>
                        </label>
                        <textarea
                          name="benefits"
                          value={formData.benefits}
                          onChange={handleInputChange}
                          placeholder="Health insurance, flexible hours, learning opportunities, stock options..."
                          rows={3}
                          className={cn(
                            "w-full border rounded-3xl px-4 py-3 outline-none focus:border-2 resize-none",
                            isDark
                              ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                              : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                          )}
                        />
                      </div>
                    </div>
                  </Step>

                  {/* Step 3: Requirements & Skills */}
                  <Step>
                    <div className={cn(
                      "space-y-6 p-6 sm:p-8 rounded-3xl border",
                      isDark ? 'bg-zinc-900/30 border-gray-200/10' : 'bg-white border-gray-200 shadow-sm'
                    )}>
                      <div>
                        <h2 className={cn("text-2xl font-bold mb-2", isDark ? 'text-white' : 'text-black')}>
                          Requirements & Skills
                        </h2>
                        <p className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                          What should candidates have?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <Hash className="h-4 w-4" />
                          <span>Requirements *</span>
                        </label>
                        <textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleInputChange}
                          placeholder="List the required qualifications, skills, and experience (one per line)..."
                          rows={4}
                          className={cn(
                            "w-full border rounded-3xl px-4 py-3 outline-none focus:border-2 resize-none",
                            isDark
                              ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                              : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                          )}
                        />
                        {validationErrors.requirements && (
                          <p className="text-red-500 text-sm">{validationErrors.requirements}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <Users className="h-4 w-4" />
                          <span>Required Skills * ({formData.skills.length})</span>
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkill();
                              }
                            }}
                            placeholder="Add a skill..."
                            className={cn(
                              "flex-1 border rounded-3xl px-4 py-2.5 outline-none focus:border-2",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400 placeholder-gray-500'
                                : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm placeholder-gray-400'
                            )}
                          />
                          <button
                            type="button"
                            onClick={addSkill}
                            className={cn(
                              "px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center shadow-xl",
                              isDark
                                ? 'bg-black text-white hover:bg-black/20 shadow-black/20'
                                : 'bg-white border-[0.1px] text-black hover:bg-white/20 shadow-white/20'
                            )}
                            title="Add skill"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <motion.button
                              key={index}
                              type="button"
                              onClick={() => removeSkill(skill)}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-all border",
                                isDark
                                  ? 'bg-black/10 text-white border-black/20 hover:bg-black/20'
                                  : 'bg-white text-black border-black/20 hover:bg-white/20'
                              )}
                              title={`Remove ${skill}`}
                            >
                              <span>{skill}</span>
                              <XIcon className="h-4 w-4" />
                            </motion.button>
                          ))}
                        </div>
                        {validationErrors.skills && (
                          <p className="text-red-500 text-sm">{validationErrors.skills}</p>
                        )}
                      </div>
                    </div>
                  </Step>

                  {/* Step 4: Additional Details */}
                  <Step>
                    <div className={cn(
                      "space-y-6 p-6 sm:p-8 rounded-3xl border",
                      isDark ? 'bg-zinc-900/30 border-gray-200/10' : 'bg-white border-gray-200 shadow-sm'
                    )}>
                      <div>
                        <h2 className={cn("text-2xl font-bold mb-2", isDark ? 'text-white' : 'text-black')}>
                          Final Details
                        </h2>
                        <p className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                          Complete your job posting
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                            <Calendar className="h-4 w-4" />
                            <span>Application Deadline</span>
                          </label>
                          <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                                : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                            )}
                          />
                          {validationErrors.deadline && (
                            <p className="text-red-500 text-sm">{validationErrors.deadline}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                            <Mail className="h-4 w-4" />
                            <span>Contact Email *</span>
                          </label>
                          <input
                            type="email"
                            name="contact_email"
                            value={formData.contact_email}
                            onChange={handleInputChange}
                            placeholder="hiring@company.com"
                            className={cn(
                              "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2",
                              isDark
                                ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
                                : 'bg-white border-gray-200 text-black focus:border-lime-500 shadow-sm'
                            )}
                          />
                          {validationErrors.contact_email && (
                            <p className="text-red-500 text-sm">{validationErrors.contact_email}</p>
                          )}
                        </div>
                      </div>

                      <div className={cn(
                        "rounded-3xl border p-6 space-y-4",
                        isDark ? 'bg-zinc-900/50 border-gray-200/10' : 'bg-gray-50 border-gray-200'
                      )}>
                        <h3 className={cn("font-bold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                          <CheckCircle className="h-5 w-5" />
                          <span>Tips for Success</span>
                        </h3>
                        <ul className={cn("space-y-2 text-sm", isDark ? 'text-gray-300' : 'text-gray-700')}>
                          <li className="flex items-start space-x-2">
                            <span className="font-bold">•</span>
                            <span>Include salary range to attract quality candidates</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="font-bold">•</span>
                            <span>Be specific about required skills and experience</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="font-bold">•</span>
                            <span>Add images or videos to showcase company culture</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="font-bold">•</span>
                            <span>Highlight unique benefits and perks</span>
                          </li>
                        </ul>
                      </div>

                      <div className="flex gap-4">
                        <motion.button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          variants={buttonVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className={cn(
                            "flex-1 border-2 py-3 rounded-3xl font-bold transition-all flex items-center justify-center",
                            isDark
                              ? 'border-lime-400/30 text-lime-400 bg-transparent hover:bg-lime-400/10'
                              : 'border-lime-500 text-lime-600 bg-white hover:bg-lime-50'
                          )}
                          disabled={isSubmitting || loading}
                          title="Preview job posting"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          Preview
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          variants={buttonVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className={cn(
                            "flex-1 border-2 py-3 rounded-3xl font-bold transition-all flex items-center justify-center",
                            isDark
                              ? 'border-gray-200/10 text-white hover:bg-white/5'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          )}
                          disabled={isSubmitting || loading}
                          title="Go back"
                        >
                          <ArrowLeft className="h-5 w-5 mr-2" />
                          Previous
                        </motion.button>
                        <motion.button
                          type="submit"
                          variants={buttonVariants}
                          initial="rest"
                          whileHover="hover"
                          whileTap="tap"
                          className={cn(
                            "flex-1 py-3 rounded-3xl font-bold transition-all flex items-center justify-center disabled:opacity-50 shadow-lg",
                            isDark
                              ? 'bg-white text-black hover:bg-lime-300 shadow-lime-400/20'
                              : 'bg-black text-white hover:bg-lime-600 shadow-lime-500/30'
                          )}
                          disabled={isSubmitting || loading}
                          title="Submit and post job"
                        >
                          {isSubmitting || loading ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5 mr-2" />
                              Post Job
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </Step>
                </Stepper>
              </form>
            </div>

            {/* Live Preview Section - 40% (Desktop Only) */}
            {!isMobile && (
              <div className="lg:col-span-2">
                <LivePreview />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Submit Button */}
      {isMobile && currentStep === 4 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 p-4 pb-safe border-t backdrop-blur-xl z-40",
            isDark ? 'bg-zinc-900/90 border-gray-200/10' : 'bg-white/90 border-gray-200'
          )}
        >
          <motion.button
            type="submit"
            onClick={handleSubmit}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            disabled={isSubmitting || loading}
            className={cn(
              "w-full py-4 rounded-3xl font-bold transition-all flex items-center justify-center disabled:opacity-50 shadow-lg",
              isDark
                ? 'bg-lime-400 text-black hover:bg-lime-300 shadow-lime-400/30'
                : 'bg-lime-500 text-white hover:bg-lime-600 shadow-lime-500/40'
            )}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Post Job
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={cn(
            "max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border-2",
            isDark ? 'bg-zinc-900 border-lime-400/30 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
          )}>
            {/* Preview Header */}
            <div className={cn(
              "sticky top-0 backdrop-blur-xl border-b p-4 flex items-center justify-between",
              isDark ? 'bg-zinc-900/80 border-gray-200/10' : 'bg-white/80 border-gray-200'
            )}>
              <h2 className="text-xl font-bold">Job Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2"
                title="Close preview"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className={cn("flex items-start space-x-4 pb-4 border-b-2", isDark ? 'border-gray-200/10' : 'border-gray-300')}>
                <Avatar
                  src={user?.profile.avatar_url || ''}
                  alt={user?.profile.full_name || 'User'}
                  size="lg"
                />
                <div>
                  <div className="font-bold text-lg">{user?.profile?.full_name || 'Company'}</div>
                  <div className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>{user?.profile?.company_name || 'Company Name'}</div>
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold mb-4">
                  {formData.title || 'Job Title'}
                </h1>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 text-sm font-semibold mb-4">
                  {formData.company && (
                    <div className={cn("flex items-center space-x-2 px-3 py-2 rounded-3xl border", isDark ? 'bg-zinc-900/50 border-gray-200/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700')}>
                      <Building2 className="h-4 w-4" />
                      <span>{formData.company}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className={cn("flex items-center space-x-2 px-3 py-2 rounded-3xl border", isDark ? 'bg-zinc-900/50 border-gray-200/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700')}>
                      <MapPin className="h-4 w-4" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                  <div className={cn("flex items-center space-x-2 px-3 py-2 rounded-3xl border", isDark ? 'bg-zinc-900/50 border-gray-200/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700')}>
                    <Briefcase className="h-4 w-4" />
                    <span className="capitalize">{formData.type.replace('-', ' ')}</span>
                  </div>
                  {formData.salary && (
                    <div className={cn("flex items-center space-x-2 px-3 py-2 rounded-3xl border", isDark ? 'bg-zinc-900/50 border-gray-200/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700')}>
                      <DollarSign className="h-4 w-4" />
                      <span>{formData.salary}</span>
                    </div>
                  )}
                </div>

                {formData.is_remote && (
                  <div className={cn("inline-block px-3 py-1 rounded-full text-sm font-bold", isDark ? 'bg-lime-400/20 text-lime-400' : 'bg-lime-100 text-lime-700')}>
                    🌍 Remote Available
                  </div>
                )}
              </div>

              {/* Media Preview */}
              {mediaPreview && (
                <div className={cn("rounded-3xl overflow-hidden border-2", isDark ? 'border-gray-200/10' : 'border-gray-300')}>
                  {selectedMedia?.type.startsWith('image/') ? (
                    <img src={mediaPreview} alt="Job posting" className="w-full h-auto" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full h-auto" />
                  )}
                </div>
              )}

              {/* Description */}
              {formData.description && (
                <div>
                  <h3 className="font-bold text-lg mb-2">About the Role</h3>
                  <p className={cn("whitespace-pre-wrap leading-relaxed", isDark ? 'text-gray-300' : 'text-gray-700')}>
                    {formData.description}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {formData.requirements && (
                <div>
                  <h3 className="font-bold text-lg mb-2">What We're Looking For</h3>
                  <p className={cn("whitespace-pre-wrap leading-relaxed", isDark ? 'text-gray-300' : 'text-gray-700')}>
                    {formData.requirements}
                  </p>
                </div>
              )}

              {/* Skills */}
              {formData.skills.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className={cn("px-3 py-2 rounded-full text-sm font-semibold border", isDark ? 'bg-lime-400/10 border-lime-400/20 text-lime-400' : 'bg-lime-50 border-lime-200 text-lime-700')}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {formData.benefits && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Benefits & Perks</h3>
                  <p className={cn("whitespace-pre-wrap leading-relaxed", isDark ? 'text-gray-300' : 'text-gray-700')}>
                    {formData.benefits}
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className={cn("border-t-2 pt-6 mt-6", isDark ? 'border-gray-200/10' : 'border-gray-300')}>
                <button
                  type="button"
                  className={cn("w-full py-3 rounded-3xl font-bold text-lg transition-colors shadow-lg", isDark ? 'bg-lime-400 text-black hover:bg-lime-300' : 'bg-lime-500 text-white hover:bg-lime-600')}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleMediaSelect}
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        className="hidden"
        onChange={handleMediaSelect}
      />
    </PageLayout>
  );
}