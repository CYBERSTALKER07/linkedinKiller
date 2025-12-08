import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Hash,
  Star,
  Mic,
  MonitorPlay,
  Briefcase,
  Coffee,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cva';
import Button from './ui/Button';
import { useCreateEmployerEvent } from '../hooks/useOptimizedQuery';
import { supabase } from '../lib/supabase';
import { bottomSheetVariants, modalVariants, backdropVariants } from '../lib/animations';
import { triggerSubtleSuccess } from '../lib/confetti';
import LocationSelector from './LocationSelector';

interface PostEventFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  fullPage?: boolean;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_end_date?: string;
  event_end_time?: string;
  location: string;
  country?: string;
  city?: string;
  street_address?: string;
  virtual_link?: string;
  event_type: 'recruiting' | 'webinar' | 'networking' | 'workshop' | 'conference';
  capacity?: number;
  tags: string[];
  banner_image_url?: string;
  is_featured: boolean;
}

const EVENT_TYPES = [
  { id: 'recruiting', label: 'Recruiting', icon: Briefcase },
  { id: 'webinar', label: 'Webinar', icon: MonitorPlay },
  { id: 'networking', label: 'Networking', icon: Users },
  { id: 'workshop', label: 'Workshop', icon: Coffee },
  { id: 'conference', label: 'Conference', icon: Mic },
] as const;

export default function PostEventForm({ onClose, onSuccess, fullPage = false }: PostEventFormProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const createEventMutation = useCreateEmployerEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_date: '',
    event_time: '09:00',
    location: '',
    country: '',
    city: '',
    street_address: '',
    event_type: 'recruiting',
    capacity: undefined,
    tags: [],
    is_featured: false
  });

  const [isVirtual, setIsVirtual] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) onClose?.();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);

      const fileName = `${user.id}/events/${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage.from('event-banners').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('event-banners').getPublicUrl(data.path);
      setFormData(prev => ({ ...prev, banner_image_url: publicData.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return setError('Login required');
    if (!formData.title.trim()) return setError('Title required');
    if (!formData.description.trim()) return setError('Description required');
    if (!formData.event_date) return setError('Date required');
    if (!isVirtual && !formData.location.trim()) return setError('Location required');
    if (isVirtual && !formData.virtual_link?.trim()) return setError('Link required');

    try {
      setIsSubmitting(true);
      setError(null);

      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
      const endDateTime = formData.event_end_date
        ? new Date(`${formData.event_end_date}T${formData.event_end_time || '17:00'}`)
        : undefined;

      await createEventMutation.mutateAsync({
        employer_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: eventDateTime.toISOString(),
        event_end_date: endDateTime?.toISOString() || null,
        location: formData.location.trim() || null,
        virtual_link: formData.virtual_link?.trim() || null,
        event_type: formData.event_type,
        capacity: formData.capacity || null,
        banner_image_url: formData.banner_image_url || null,
        tags: formData.tags,
        is_featured: formData.is_featured,
        status: 'upcoming',
        attendees_count: 0
      });

      triggerSubtleSuccess();
      setFormData({
        title: '', description: '', event_date: '', event_time: '09:00',
        location: '', event_type: 'recruiting', capacity: undefined, tags: [], is_featured: false
      });
      setBannerPreview(null);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Content ---
  const renderFormContent = () => (
    <div className="space-y-8 p-6 lg:p-8">

      {/* 1. Event Type Grid */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Event Type</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.event_type === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, event_type: type.id }))}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 gap-2',
                  isSelected
                    ? isDark
                      ? 'bg-lime-400 text-black border-lime-400 shadow-[0_0_20px_-5px_rgba(163,230,53,0.3)]'
                      : 'bg-lime-500 text-white border-lime-500 shadow-lg shadow-lime-500/30'
                    : isDark
                      ? 'bg-zinc-800/50 border-zinc-700 text-gray-400 hover:bg-zinc-800 hover:border-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                )}
              >
                <Icon className={cn("w-6 h-6", isSelected ? "text-blue-500" : "text-gray-500")} />
                <span className={cn("text-xs font-bold", isSelected ? "text-blue-500" : "text-gray-500")}>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Banner Image */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-[24px] border-2 border-dashed transition-all h-48 flex items-center justify-center",
          isDark
            ? "border-zinc-700 bg-zinc-900/50 hover:border-lime-400/50 hover:bg-zinc-900"
            : "border-gray-300 bg-gray-50 hover:border-lime-500/50 hover:bg-gray-100"
        )}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {bannerPreview ? (
          <>
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover transition-opacity group-hover:opacity-70" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md">Change Image</span>
            </div>
          </>
        ) : (
          <div className="text-center space-y-2">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2", isDark ? "bg-zinc-800 text-lime-400" : "bg-white text-lime-600 shadow-sm")}>
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <p className="font-bold text-sm">Upload Event Banner</p>
            <p className="text-xs text-gray-500">1920x1080 recommended</p>
          </div>
        )}
      </div>

      {/* 3. Core Details */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="E.g. Senior Tech Meetup 2024"
            className={cn(
              "w-full px-5 py-4 rounded-2xl text-lg font-semibold outline-none border transition-all",
              isDark
                ? "bg-zinc-900/50 border-zinc-800 focus:border-lime-400 text-white placeholder-zinc-600"
                : "bg-gray-50 border-gray-200 focus:border-lime-500 text-gray-900 placeholder-gray-400"
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="What is this event about?"
            className={cn(
              "w-full px-5 py-4 rounded-2xl outline-none border transition-all resize-none",
              isDark
                ? "bg-zinc-900/50 border-zinc-800 focus:border-lime-400 text-white placeholder-zinc-600"
                : "bg-gray-50 border-gray-200 focus:border-lime-500 text-gray-900 placeholder-gray-400"
            )}
          />
        </div>
      </div>

      {/* 4. Logistics (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Date & Time */}
        <div className={cn("p-5 rounded-3xl space-y-4 border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-gray-50 border-gray-100")}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
            <Calendar className="w-4 h-4" /> Schedule
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold ml-1 opacity-70">Start Date</label>
              <input type="date" name="event_date" value={formData.event_date} onChange={handleInputChange} className={cn("w-full px-3 py-2 rounded-xl text-sm font-medium outline-none border", isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-gray-200")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold ml-1 opacity-70">Start Time</label>
              <input type="time" name="event_time" value={formData.event_time} onChange={handleInputChange} className={cn("w-full px-3 py-2 rounded-xl text-sm font-medium outline-none border", isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-gray-200")} />
            </div>
            {/* End date fields optional, style similarly if needed */}
          </div>
        </div>

        {/* Location */}
        <div className={cn("p-5 rounded-3xl space-y-4 border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-gray-50 border-gray-100")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
              {isVirtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />} Location
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Virtual</span>
              <button
                type="button"
                onClick={() => setIsVirtual(!isVirtual)}
                className={cn("w-10 h-6 rounded-full p-1 transition-colors relative", isVirtual ? "bg-lime-400" : "bg-gray-600")}
              >
                <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transition-transform", isVirtual ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>
          </div>

          {isVirtual ? (
            <input type="url" name="virtual_link" value={formData.virtual_link || ''} onChange={handleInputChange} placeholder="Meeting Link (Zoom/Meet)" className={cn("w-full px-4 py-3 rounded-xl text-sm outline-none border", isDark ? "bg-black border-zinc-700 text-white" : "bg-white border-gray-200")} />
          ) : (
            <LocationSelector
              value={{
                country: formData.country || '',
                city: formData.city || '',
                street_address: formData.street_address || ''
              }}
              onChange={(loc) => {
                setFormData(prev => ({
                  ...prev,
                  country: loc.country,
                  city: loc.city,
                  street_address: loc.street_address,
                  location: `${loc.street_address}, ${loc.city}, ${loc.country}`
                }));
              }}
            />
          )}
        </div>
      </div>

      {/* 5. Details: Capacity & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1 flex items-center gap-2"><Users className="w-4 h-4" /> Capacity</label>
          <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleInputChange} placeholder="Unlimited" className={cn("w-full px-5 py-3 rounded-2xl outline-none border transition-all", isDark ? "bg-zinc-900/50 border-zinc-800 text-white" : "bg-gray-50 border-gray-200")} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold ml-1 flex items-center gap-2"><Hash className="w-4 h-4" /> Tags</label>
          <div className="flex gap-2">
            <input type="text" value={currentTag} onChange={e => setCurrentTag(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Add tag..." className={cn("flex-1 px-5 py-3 rounded-2xl outline-none border transition-all", isDark ? "bg-zinc-900/50 border-zinc-800 text-white" : "bg-gray-50 border-gray-200")} />
            <button type="button" onClick={handleAddTag} className={cn("px-4 rounded-2xl font-bold", isDark ? "bg-zinc-800 text-white" : "bg-gray-200 text-black")}>+</button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-lime-400/10 text-lime-600 flex items-center gap-1">
                  #{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(i)} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Featured Toggle */}
      <div className={cn("flex items-center justify-between p-4 rounded-2xl border", isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-100 text-amber-600")}>
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className={cn("font-bold text-sm", isDark ? "text-amber-500" : "text-amber-700")}>Feature Event</p>
            <p className={cn("text-xs", isDark ? "text-amber-500/70" : "text-amber-700/70")}>Boost visibility for better reach</p>
          </div>
        </div>
        <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 border-t border-gray-200/10 flex justify-end gap-3">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl">Cancel</Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "rounded-xl px-8 py-6 text-base font-bold shadow-xl transition-transform active:scale-95",
            isDark ? "bg-lime-400 text-black hover:bg-lime-300 shadow-lime-400/20" : "bg-lime-500 text-white hover:bg-lime-600"
          )}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Event"}
        </Button>
      </div>
    </div>
  );

  // --- Render Wrapper ---

  if (fullPage) {
    return (
      <div className={cn('w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-2xl', isDark ? 'bg-black border border-zinc-800' : 'bg-white border border-gray-200')}>
        <div className={cn('sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-xl', isDark ? 'border-zinc-800 bg-black/80' : 'border-gray-100 bg-white/80')}>
          <h2 className="text-2xl font-bold tracking-tight">Create Event</h2>
          {onClose && <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-6 h-6" /></button>}
        </div>
        <form onSubmit={handleSubmit}>{renderFormContent()}</form>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', isMobile && 'items-end p-0')}>
        <motion.div
          variants={isMobile ? bottomSheetVariants : modalVariants}
          initial="hidden" animate="visible" exit="exit"
          drag={isMobile ? "y" : false} dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={handleDragEnd}
          className={cn('w-full max-h-[85vh] flex flex-col', isMobile ? 'max-w-full rounded-t-[32px]' : 'max-w-2xl rounded-[32px]', 'shadow-2xl overflow-hidden', isDark ? 'bg-[#121212] border border-zinc-800' : 'bg-white')}
        >
          {isMobile && <div className="flex justify-center pt-4 pb-2"><div className="w-12 h-1.5 rounded-full bg-zinc-700/50" /></div>}

          <div className={cn('flex items-center justify-between p-6 border-b', isDark ? 'border-zinc-800' : 'border-gray-100')}>
            <h2 className="text-xl font-bold">New Event</h2>
            {onClose && <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>}
          </div>

          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit}>{renderFormContent()}</form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}