import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BookOpen,
  Award,
  GraduationCap,
  Briefcase,
  Heart,
  FolderOpen,
  Clock,
  Medal,
  Plus,
  Download,
  Share2,
  Edit,
  Filter,
  BarChart3,
  TrendingUp,
  Trophy,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DigitalPassport } from '../types';
import { supabase } from '../lib/supabase';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { Card } from './ui/Card';
import Modal from './ui/Modal';

gsap.registerPlugin(ScrollTrigger);

interface PassportStats {
  totalAchievements: number;
  skillsAssessed: number;
  hoursLogged: number;
  badgesEarned: number;
  portfolioItems: number;
  overallProgress: number;
}

export default function DigitalLearningPassport() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [passport, setPassport] = useState<DigitalPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchDigitalPassport();
    }
  }, [user?.id]);

  const fetchDigitalPassport = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('digital_passports')
        .select(`
          *,
          academic_achievements(*),
          co_curricular_activities(*),
          internships(*),
          volunteer_work(*),
          micro_credentials(*),
          career_milestones(*),
          digital_badges(*),
          portfolio_items(*),
          passport_reflections(*)
        `)
        .eq('student_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPassport(data);
      } else {
        // Create new passport for user
        const { data: newPassport, error: createError } = await supabase
          .from('digital_passports')
          .insert([{
            student_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        setPassport(newPassport);
      }
    } catch (err) {
      console.error('Error fetching digital passport:', err);
      setError(err instanceof Error ? err.message : 'Failed to load digital passport');
    } finally {
      setLoading(false);
    }
  };

  const calculatePassportStats = (passport: DigitalPassport | null): PassportStats => {
    if (!passport) {
      return {
        totalAchievements: 0,
        skillsAssessed: 0,
        hoursLogged: 0,
        badgesEarned: 0,
        portfolioItems: 0,
        overallProgress: 0
      };
    }

    const academicCount = passport.academic_achievements?.length || 0;
    const activitiesCount = passport.co_curricular_activities?.length || 0;
    const internshipsCount = passport.internships?.length || 0;
    const volunteerCount = passport.volunteer_work?.length || 0;
    const totalAchievements = academicCount + activitiesCount + internshipsCount + volunteerCount;

    // Calculate completion percentage based on filled sections
    const sections = [
      academicCount > 0,
      activitiesCount > 0,
      internshipsCount > 0,
      volunteerCount > 0,
      (passport.portfolio_items?.length || 0) > 0,
      (passport.digital_badges?.length || 0) > 0
    ];
    const completedSections = sections.filter(Boolean).length;
    const overallProgress = Math.round((completedSections / sections.length) * 100);

    return {
      totalAchievements,
      skillsAssessed: 15, // This would come from skills audit system
      hoursLogged: passport.internships?.reduce((sum, internship) =>
        sum + (internship.duration_weeks * 40), 0) || 0,
      badgesEarned: passport.digital_badges?.length || 0,
      portfolioItems: passport.portfolio_items?.length || 0,
      overallProgress
    };
  };

  const passportStats = calculatePassportStats(passport);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Entrance animations
      gsap.fromTo('.passport-header', {
        opacity: 0,
        y: -50
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      });

      gsap.fromTo('.stats-card', {
        opacity: 0,
        y: 30,
        scale: 0.9
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        delay: 0.3
      });

      gsap.fromTo('.passport-tab', {
        opacity: 0,
        x: -20
      }, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power2.out',
        delay: 0.6
      });

      gsap.fromTo('.content-card', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.8
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen, emoji: '📊' },
    { id: 'skills', label: 'Skills Audit', icon: BarChart3, emoji: '📈' },
    { id: 'academic', label: 'Academic', icon: GraduationCap, emoji: '🎓' },
    { id: 'experience', label: 'Experience', icon: Briefcase, emoji: '💼' },
    { id: 'portfolio', label: 'Portfolio', icon: FolderOpen, emoji: '📁' },
    { id: 'badges', label: 'Badges', icon: Medal, emoji: '🏆' },
    { id: 'goals', label: 'Goals', icon: TrendingUp, emoji: '🎯' },
    { id: 'reflections', label: 'Reflections', icon: Award, emoji: '💭' }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="content-card">
        <Card className="p-8" elevation={2}>
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h5" className="font-bold">
              Learning Journey Progress
            </Typography>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-lime/10 text-lime' : 'bg-asu-maroon/10 text-asu-maroon'
              }`}>
              {passportStats.overallProgress}% Complete
            </div>
          </div>

          <div className={`w-full bg-gray-200 rounded-full h-3 mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${isDark ? 'bg-linear-to-r from-lime to-green-400' : 'bg-linear-to-r from-asu-maroon to-red-600'
                }`}
              style={{ width: `${passportStats.overallProgress}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-lime' : 'text-asu-maroon'
                }`}>
                {passportStats.totalAchievements}
              </div>
              <div className={`text-sm ${isDark ? 'text-dark-muted' : 'text-gray-600'
                }`}>
                Achievements
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-lime' : 'text-asu-maroon'
                }`}>
                {passportStats.skillsAssessed}
              </div>
              <div className={`text-sm ${isDark ? 'text-dark-muted' : 'text-gray-600'
                }`}>
                Skills Assessed
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-lime' : 'text-asu-maroon'
                }`}>
                {passportStats.hoursLogged}
              </div>
              <div className={`text-sm ${isDark ? 'text-dark-muted' : 'text-gray-600'
                }`}>
                Hours Logged
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-lime' : 'text-asu-maroon'
                }`}>
                {passportStats.badgesEarned}
              </div>
              <div className={`text-sm ${isDark ? 'text-dark-muted' : 'text-gray-600'
                }`}>
                Badges Earned
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-lime' : 'text-asu-maroon'
                }`}>
                {passportStats.portfolioItems}
              </div>
              <div className={`text-sm ${isDark ? 'text-dark-muted' : 'text-gray-600'
                }`}>
                Portfolio Items
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="content-card">
        <Card className="p-8" elevation={2}>
          <Typography variant="h5" className="font-bold mb-6">
            Recent Activity
          </Typography>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Completed AWS Cloud Practitioner Certification</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">2 days ago</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-lg bg-info-50 dark:bg-info-900/20">
              <div className="w-10 h-10 bg-info-500 rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Earned Leadership Excellence Badge</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">1 week ago</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Added AI Study Assistant to Portfolio</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">2 weeks ago</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-dark-bg' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${isDark ? 'border-lime' : 'border-asu-maroon'
            }`}></div>
          <Typography variant="body1" color="textSecondary">
            Loading your Digital Learning Passport...
          </Typography>
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
              Error Loading Digital Passport
            </Typography>
            <Typography variant="body1" color="textSecondary" className="mb-4">
              {error}
            </Typography>
            <Button onClick={fetchDigitalPassport} variant="outlined">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center">
            <BookOpen className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-dark-muted' : 'text-gray-400'
              }`} />
            <Typography variant="h5" className="font-medium mb-2">
              Create Your Digital Learning Passport
            </Typography>
            <Typography variant="body1" color="textSecondary" className="mb-6">
              Document your academic journey, achievements, and professional growth in one comprehensive portfolio.
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={fetchDigitalPassport}>
              Create Passport
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-dark-bg' : 'bg-gray-50'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="passport-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h3" className="font-bold mb-2">
                🎓 Digital Learning Passport
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Your comprehensive journey of growth, skills, and achievements at AUT
              </Typography>
            </div>
            <div className="flex space-x-3">
              <Button variant="outlined" startIcon={<Download />}>
                Export
              </Button>
              <Button variant="outlined" startIcon={<Share2 />}>
                Share
              </Button>
              <Button variant="contained" startIcon={<Plus />}>
                Add Entry
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${isDark ? 'bg-lime/10' : 'bg-asu-maroon/10'
                }`}>
                <Trophy className={`h-6 w-6 ${isDark ? 'text-lime' : 'text-asu-maroon'
                  }`} />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.totalAchievements}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Achievements
              </Typography>
            </Card>
          </div>

          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-info-100 dark:bg-info-900/30 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-info-600 dark:text-info-400" />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.skillsAssessed}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Skills Assessed
              </Typography>
            </Card>
          </div>

          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.hoursLogged}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Hours Logged
              </Typography>
            </Card>
          </div>

          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Medal className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.badgesEarned}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Badges Earned
              </Typography>
            </Card>
          </div>

          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.portfolioItems}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Portfolio Items
              </Typography>
            </Card>
          </div>

          <div className="stats-card">
            <Card className="p-6 text-center" elevation={1}>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <Typography variant="h4" className="font-bold mb-1">
                {passportStats.overallProgress}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Progress
              </Typography>
            </Card>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-8" elevation={1}>
          <div className="flex flex-wrap border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`passport-tab flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-300 ${activeTab === tab.id
                      ? `border-b-2 ${isDark
                        ? 'border-lime text-lime bg-lime/5'
                        : 'border-asu-maroon text-asu-maroon bg-asu-maroon/5'
                      }`
                      : `${isDark
                        ? 'text-dark-muted hover:text-dark-text hover:bg-dark-surface'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className="text-lg">{tab.emoji}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && renderOverview()}

          {activeTab !== 'overview' && (
            <Card className="p-8" elevation={2}>
              <div className="text-center py-12">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-lime/10' : 'bg-asu-maroon/10'
                  }`}>
                  <BookOpen className={`h-8 w-8 ${isDark ? 'text-lime' : 'text-asu-maroon'
                    }`} />
                </div>
                <Typography variant="h5" className="font-bold mb-2">
                  {tabs.find(t => t.id === activeTab)?.label} Section
                </Typography>
                <Typography variant="body1" color="textSecondary" className="mb-6">
                  This comprehensive section is being developed to provide detailed insights into your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.
                </Typography>
                <Button variant="contained" startIcon={<Plus />}>
                  Add New {tabs.find(t => t.id === activeTab)?.label}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}