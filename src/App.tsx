import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import Navigation from './components/Navigation';

// Import iPad testing utilities for development
import './lib/ipad-testing';

// Import Capacitor for platform detection
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
      getPlatform(): string;
    };
    gtag?: (command: string, action: string, parameters: Record<string, unknown>) => void;
    // Add device utils for testing
    deviceUtils?: {
      isIPad(): boolean;
      isTouchDevice(): boolean;
      simulateIPad(): void;
      testNavigation(): void;
    };
  }
}

// Lazy load components for better performance
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const ProfileSetup = lazy(() => import('./components/Profile/ProfileSetup'));
const Profile = lazy(() => import('./components/Profile/Profile'));
const EditProfile = lazy(() => import('./components/Profile/EditProfile'));
const Settings = lazy(() => import('./components/Settings'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const SplashScreen = lazy(() => import('./components/SplashScreen'));
const PostJob = lazy(() => import('./components/PostJob'));
const Messages = lazy(() => import('./components/Messages'));
const Applications = lazy(() => import('./components/Applications'));
const Applicants = lazy(() => import('./components/Applicants'));
const Events = lazy(() => import('./components/Events'));
const EventDetails = lazy(() => import('./components/EventDetails'));
const ResourceCenter = lazy(() => import('./components/ResourceCenter'));
const ResourceDetails = lazy(() => import('./components/ResourceDetails'));
const JobDetails = lazy(() => import('./components/JobDetails'));
const MobileAppPage = lazy(() => import('./components/MobileAppPage'));
const ForStudentsPage = lazy(() => import('./components/ForStudentsPage'));
const ForEmployersPage = lazy(() => import('./components/ForEmployersPage'));
const CareerTipsPage = lazy(() => import('./components/CareerTipsPage'));
const WhosHiringPage = lazy(() => import('./components/WhosHiringPage'));
const DigitalLearningPassport = lazy(() => import('./components/DigitalLearningPassport'));
const SkillsAuditSystem = lazy(() => import('./components/SkillsAuditSystem'));
const Feed = lazy(() => import('./components/Feed'));
const PostDetails = lazy(() => import('./components/PostDetails'));
const CompaniesPage = lazy(() => import('./components/CompaniesPage'));
const CreateCompanyPage = lazy(() => import('./components/CreateCompanyPage'));
const CompanyProfile = lazy(() => import('./components/CompanyProfile'));
const CompanyDetailPage = lazy(() => import('./components/CompanyDetailPage'));
const ResumeBuilder = lazy(() => import('./components/ResumeBuilder/index'));
const AIResumeBuilderPage = lazy(() => import('./components/AIResumeBuilderPage'));
const VisualResumeEditor = lazy(() => import('./components/VisualResumeEditor'));
const GettingStartedPage = lazy(() => import('./components/GettingStartedPage'));

// Employer Job Management
const EmployerJobsManagement = lazy(() => import('./components/EmployerJobsManagement'));

// New pages
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const JobsPage = lazy(() => import('./components/JobsPage'));
const BookmarksPage = lazy(() => import('./components/BookmarksPage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const HashtagDetailPage = lazy(() => import('./components/HashtagDetailPage'));
const SearchDemoPage = lazy(() => import('./components/SearchDemoPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const ExplorePage = lazy(() => import('./components/ExplorePage'));
const PostEventPage = lazy(() => import('./pages/PostEventPage'));
const UniversityDashboard = lazy(() => import('./pages/UniversityDashboard'));
const PremiumUpgrade = lazy(() => import('./pages/PremiumUpgrade'));
const AdminApplicationsPage = lazy(() => import('./pages/AdminApplicationsPage'));
const AnswersPage = lazy(() => import('./pages/AnswersPage'));
const CareerGoalsPage = lazy(() => import('./pages/CareerGoalsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const JobApplicantsPage = lazy(() => import('./pages/JobApplicantsPage').then(module => ({ default: module.JobApplicantsPage })));
const StudentCVPage = lazy(() => import('./pages/StudentCVPage').then(module => ({ default: module.StudentCVPage })));

// LinkedIn Integration
const LinkedInJobImport = lazy(() => import('./components/LinkedIn/LinkedInJobImport'));
const LinkedInJobManager = lazy(() => import('./components/LinkedIn/LinkedInJobManager'));
const LinkedInCallback = lazy(() => import('./components/LinkedIn/LinkedInCallback'));

// AI Job Matching
const AIJobRecommendations = lazy(() => import('./components/AI/AIJobRecommendations'));

// Job Application
const JobApplication = lazy(() => import('./components/JobApplication'));

// Optimized loading component with better UX
function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-asu-maroon dark:text-white" />
        <span className="text-gray-600 dark:text-dark-muted text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// ScrollToTop component to handle automatic scrolling on route changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Auth Redirect Route component - redirects authenticated users away from auth pages
function AuthRedirectRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  // If user is authenticated, redirect to feed
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}

// Protected Route component - Skip auth check if already on protected page
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  // List of protected routes - if we're already on one, assume user is authenticated
  const protectedPaths = [
    '/feed',
    '/dashboard',
    '/profile',
    '/profile-setup',
    '/profile/edit',
    '/job/',
    '/messages',
    '/applications',
    '/applicants',
    '/post-job',
    '/digital-passport',
    '/skills-audit',
    '/skills/add',
    '/badges',
    '/settings',
    '/post/',
    '/create-post',
    '/hashtag/',
    '/notifications',
    '/jobs',
    '/bookmarks',
    '/resume-builder',
    '/ai-resume-builder',
    '/visual-resume-editor',
    '/search',
    '/linkedin-job-manager',
    '/ai-job-recommendations',
    '/explore',
    '/university-dashboard',
    '/premium-upgrade',
    '/career-goals',
    '/analytics'
  ];

  // Check if current path is a protected route
  const isOnProtectedPage = protectedPaths.some(path => pathname.startsWith(path));

  // If user is on a protected page and auth is still loading, skip auth check and show content immediately
  if (isOnProtectedPage) {
    if (loading) {
      // Assume authenticated and show content without waiting for auth
      return <>{children}</>;
    }
    // Auth loaded, return content normally
    return <>{children}</>;
  }

  // For non-protected paths, do normal auth check
  if (loading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Dashboard Router component
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
      <Dashboard />
    </Suspense>
  );
}

// Component to handle smart routing based on PWA vs Web
function SmartHomeRoute() {
  const { user, loading } = useAuth();

  // If still loading, show loading screen
  if (loading) {
    return <LoadingFallback message="Loading application..." />;
  }

  // If user is authenticated, go to feed
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    return false;
  });

  const [forceLoadingOff, setForceLoadingOff] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('aut-handshake-splash-seen', 'true');
  };

  // Remove service worker cleanup that was causing issues
  // Service workers were being unregistered on every mount, causing endless reloading

  // Force loading timeout protection
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('Forcing loading state off after 15 seconds');
        setForceLoadingOff(true);
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (showSplash) {
    return (
      <Suspense fallback={<LoadingFallback message="Initializing..." />}>
        <SplashScreen onComplete={handleSplashComplete} />
      </Suspense>
    );
  }

  if (loading && !forceLoadingOff) {
    return <LoadingFallback message="Loading application..." />;
  }

  return (
    <div className="App">
      <ScrollToTop />
      {/* X-Style Navigation - only show when user is authenticated */}
      {user && <Navigation />}

      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes with lazy loading */}
            <Route path="/login" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading login..." />}>
                  <Login />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/register" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading registration..." />}>
                  <Register />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/mobile-app" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading mobile app info..." />}>
                  <MobileAppPage />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/for-students" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading student resources..." />}>
                  <ForStudentsPage />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/for-employers" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading employer resources..." />}>
                  <ForEmployersPage />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/career-tips" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading career tips..." />}>
                  <CareerTipsPage />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/whos-hiring" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading hiring info..." />}>
                  <WhosHiringPage />
                </Suspense>
              </AuthRedirectRoute>
            } />
            <Route path="/companies" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading companies..." />}>
                  <CompaniesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/company/:companyId" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading company profile..." />}>
                  <CompanyProfile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/company-detail/:companyId" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading company detail..." />}>
                  <CompanyDetailPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/company/create" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <CreateCompanyPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/getting-started" element={
              <AuthRedirectRoute>
                <Suspense fallback={<LoadingFallback message="Loading getting started..." />}>
                  <GettingStartedPage />
                </Suspense>
              </AuthRedirectRoute>
            } />

            {/* Protected routes with lazy loading */}
            <Route path="/feed" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading feed..." />}>
                  <Feed />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } />
            <Route path="/university-dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading university dashboard..." />}>
                  <UniversityDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/premium-upgrade" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading premium features..." />}>
                  <PremiumUpgrade />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile-setup" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading profile setup..." />}>
                  <ProfileSetup />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading profile..." />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading user profile..." />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading profile editor..." />}>
                  <EditProfile />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/job/:jobId" element={
              <Suspense fallback={<LoadingFallback message="Loading job details..." />}>
                <JobDetails />
              </Suspense>
            } />
            <Route path="/job/:jobId/apply" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading job application..." />}>
                  <JobApplication />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading messages..." />}>
                  <Messages />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading applications..." />}>
                  <Applications />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/admin/applications" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading applications..." />}>
                  <AdminApplicationsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/applicants" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading applicants..." />}>
                  <Applicants />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/post-job" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading job posting..." />}>
                  <PostJob />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/post-event" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading event form..." />}>
                  <PostEventPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/employer/jobs" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading job management..." />}>
                  <EmployerJobsManagement />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/job/:jobId/applicants" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading applicants..." />}>
                  <JobApplicantsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/student/cv" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading CV..." />}>
                  <StudentCVPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <Suspense fallback={<LoadingFallback message="Loading events..." />}>
                <Events />
              </Suspense>
            } />
            <Route path="/event/:eventId" element={
              <Suspense fallback={<LoadingFallback message="Loading event details..." />}>
                <EventDetails />
              </Suspense>
            } />
            <Route path="/resources" element={
              <Suspense fallback={<LoadingFallback message="Loading resources..." />}>
                <ResourceCenter />
              </Suspense>
            } />
            <Route path="/resource/:resourceId" element={
              <Suspense fallback={<LoadingFallback message="Loading resource details..." />}>
                <ResourceDetails />
              </Suspense>
            } />
            <Route path="/digital-passport" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading digital passport..." />}>
                  <DigitalLearningPassport />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/skills-audit" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading skills audit..." />}>
                  <SkillsAuditSystem />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/skills/add" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading skills assessment..." />}>
                  <SkillsAuditSystem />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/badges" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading badges..." />}>
                  <DigitalLearningPassport />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading settings..." />}>
                  <Settings />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/post/:postId" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading post details..." />}>
                  <PostDetails />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/post/:postId/answers" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading answers..." />}>
                  <AnswersPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/create-post" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading post creator..." />}>
                  <CreatePostPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/hashtag/:hashtagName" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading hashtag..." />}>
                  <HashtagDetailPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading notifications..." />}>
                  <NotificationsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading jobs..." />}>
                  <JobsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/bookmarks" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading bookmarks..." />}>
                  <BookmarksPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/resume-builder" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading resume builder..." />}>
                  <ResumeBuilder />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/ai-resume-builder" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading AI resume builder..." />}>
                  <AIResumeBuilderPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/visual-resume-editor" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading Visual Resume Editor..." />}>
                  <VisualResumeEditor />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/search-demo" element={
              <Suspense fallback={<LoadingFallback message="Loading search demo..." />}>
                <SearchDemoPage />
              </Suspense>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading search..." />}>
                  <SearchPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/linkedin-job-import" element={
              <Suspense fallback={<LoadingFallback message="Loading LinkedIn job import..." />}>
                <LinkedInJobImport />
              </Suspense>
            } />
            <Route path="/linkedin-job-manager" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading LinkedIn job manager..." />}>
                  <LinkedInJobManager />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/linkedin-callback" element={
              <Suspense fallback={<LoadingFallback message="Processing LinkedIn connection..." />}>
                <LinkedInCallback />
              </Suspense>
            } />
            <Route path="/ai-job-recommendations" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading AI job recommendations..." />}>
                  <AIJobRecommendations />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading explore page..." />}>
                  <ExplorePage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/career-goals" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading career goals..." />}>
                  <CareerGoalsPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback message="Loading analytics..." />}>
                  <AnalyticsPage />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Smart root route - shows landing page for web, redirects to login for PWA */}
            <Route path="/" element={<SmartHomeRoute />} />

            {/* Catch all route - redirect to appropriate home */}
            <Route path="*" element={
              user ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}