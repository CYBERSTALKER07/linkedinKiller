import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  MapPin,
  Clock,
  Heart,
  Share,
  MoreHorizontal,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useJobs } from '../../hooks/useJobs';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  useRecommendedUsers,
  useMostLikedPosts,
  useFollowUser
} from '../../hooks/useOptimizedQuery';

import Button from '../ui/Button'; // Assuming optimized Button
import PageLayout from '../ui/PageLayout';
import { cn } from '../../lib/cva';
import { supabase } from '../../lib/supabase';
import WhoToFollowItem from '../WhoToFollowItem';

// --- Sub-components for cleaner file ---

const QuickStatsCard = ({ value, label, isDark }: { value: number | string; label: string; isDark: boolean }) => (
  <div className={cn(
    'text-center p-4 rounded-2xl transition-all duration-200 cursor-default',
    isDark
      ? 'bg-gray-900/50 hover:bg-gray-900 text-white'
      : 'bg-gray-50 hover:bg-gray-100 text-black'
  )}>
    <div className="text-2xl font-black mb-1">{value}</div>
    <div className={cn('text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
      {label}
    </div>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActivityItem = ({ activity, isDark }: { activity: any; isDark: boolean }) => (
  <div className={cn(
    "flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group",
    isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
  )}>
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <div className={cn(
        'w-2 h-2 rounded-full shrink-0 ring-2',
        activity.type === 'application'
          ? 'bg-blue-500 ring-blue-500/20'
          : activity.type === 'saved'
            ? 'bg-yellow-500 ring-yellow-500/20'
            : 'bg-green-500 ring-green-500/20'
      )} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-sm truncate group-hover:underline", isDark ? "text-gray-200" : "text-gray-900")}>
          {activity.position} <span className="font-normal text-gray-500">at</span> {activity.company}
        </p>
        <p className="text-xs text-gray-500">
          {activity.type === 'application' ? 'Applied' : activity.type === 'saved' ? 'Saved job' : 'Viewed'}
        </p>
      </div>
    </div>
    <span className="text-xs text-gray-500 shrink-0 font-medium">
      {activity.time}
    </span>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JobCard = ({ job, isDark }: { job: any; isDark: boolean }) => (
  <div
    className={cn(
      'p-5 transition-all border rounded-[24px] duration-200 hover:shadow-3xl hover:-translate-y-0.5 cursor-pointer ',
      isDark ? 'border-gray-800 bg-gray-900/20 hover:bg-gray-900/40' : 'border-gray-200 bg-white shadow-3xl  hover:border-gray-300'
    )}
  >
    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={cn("font-bold text-lg leading-tight mb-1", isDark ? "text-white" : "text-gray-900")}>{job.title}</h3>
            <p className={cn("font-medium text-sm mb-3", isDark ? "text-blue-400" : "text-blue-600")}>
              {job.company}
            </p>
          </div>
          {/* Mobile menu button could go here */}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500 mb-4">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
            <Clock className="h-3.5 w-3.5" />
            <span>{job.type}</span>
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{job.salary_range}</span>
            </div>
          )}
        </div>

        <p className={cn(
          'text-sm line-clamp-2 leading-relaxed',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          {job.description}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
      <div className="flex gap-2">
        {/* Action buttons */}
        <button className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
          <Heart className="w-5 h-5" />
        </button>
        <button className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
          <Share className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-3">
        <Button variant="outlined" size="small" className="rounded-full font-semibold">Save</Button>
        <Link to={`/job/${job.id}`}>
          <Button variant="filled" size="small" className="rounded-full font-bold px-6">Apply</Button>
        </Link>
      </div>
    </div>
  </div>
);

// --- Main Component ---

export default function StudentDashboard() {
  const { jobs, loading: jobsLoading } = useJobs();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [searchTerm] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [applicationsStats, setApplicationsStats] = useState({ applied: 0, interviews: 0, saved: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // React Query Hooks
  const { data: recommendedUsers = [], isLoading: usersLoading } = useRecommendedUsers(user?.id, 3);
  const { data: trendingPosts = [], isLoading: postsLoading } = useMostLikedPosts(5, user?.id);
  // const { data: bookmarksData = [] } = useBookmarks(user?.id); // Table missing

  const followUserMutation = useFollowUser();

  // Load dashboard data
  useEffect(() => {
    if (!user?.id) return;

    const loadDashboardData = async () => {
      try {
        // Parallel requests
        const [applied, interviews, recentAppsResult] = await Promise.all([
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('status', 'interview'),
          supabase.from('applications')
            .select('id, applied_date, status, job_id')
            .eq('student_id', user.id)
            .order('applied_date', { ascending: false })
            .limit(3)
        ]);

        // Fix: Bookmarks table does not exist yet, defaulting to 0 to prevent 404
        const savedCount = 0;

        setApplicationsStats({
          applied: applied.count || 0,
          interviews: interviews.count || 0,
          saved: savedCount
        });

        if (recentAppsResult.data && recentAppsResult.data.length > 0) {
          // Manually fetch jobs for recent apps to avoid join ambiguity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const jobIds = recentAppsResult.data.map((app: any) => app.job_id);
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('id, title, company')
            .in('id', jobIds);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const jobsMap = new Map(jobsData?.map((j: any) => [j.id, j]) || []);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activity = recentAppsResult.data.map((app: any) => {
            const job = jobsMap.get(app.job_id);
            return {
              type: 'application',
              company: job?.company || 'Unknown',
              position: job?.title || 'Unknown',
              time: new Date(app.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            };
          });
          setRecentActivity(activity);
        } else {
          setRecentActivity([]);
        }

      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };
    loadDashboardData();
  }, [user?.id]);

  // Derived state
  const filteredJobs = useMemo(() => {
    return jobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [jobs, searchTerm]);

  if (jobsLoading) {
    return <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-black" : "bg-white")}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <PageLayout
      className={cn('min-h-screen', isDark ? 'bg-black text-white' : 'bg-white text-gray-900')}
      maxWidth="full"
      padding="none"
    >
      {/* 1. Mobile Header */}
      <div className={cn(
        "lg:hidden sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center",
        isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"
      )}>
        <button onClick={() => setShowMobileSidebar(true)} className="p-2 -ml-2 rounded-full active:bg-gray-200 dark:active:bg-gray-800">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg">Dashboard</span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* 2. Mobile Sidebar Drawer */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl p-4 overflow-y-auto",
                isDark ? "bg-black border-r border-gray-800" : "bg-white border-r border-gray-200"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl">Menu</h2>
                <button onClick={() => setShowMobileSidebar(false)}><X className="w-6 h-6" /></button>
              </div>
              {/* Mobile nav items... reusing logic or component */}
              <div className="space-y-4">
                {['Applications', 'Events', 'Companies', 'Resources'].map(item => (
                  <Link key={item} to={`/${item.toLowerCase()}`} className="block p-3 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                    {item}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Desktop Grid */}
      <div className="max-w-7xl mx-auto flex w-full min-h-screen">

        {/* CENTER COLUMN: Main Content */}
        <main className={cn(
          "flex-1 w-full border-x min-h-screen pb-20",
          isDark ? "border-gray-800" : "border-gray-200"
        )}>
          {/* Sticky Header (Desktop) */}
          <div className={cn(
            "hidden lg:flex sticky top-0 z-20 backdrop-blur-xl border-b px-6 py-3 justify-between items-center",
            isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"
          )}>
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <p className="text-xs text-gray-500">Welcome back, {(user as any)?.user_metadata?.full_name || 'Student'}</p>
            </div>
            <Button variant="ghost" size="small"><Sparkles className="w-5 h-5 text-yellow-500" /></Button>
          </div>

          {/* Content Area */}
          <div className="p-4 md:p-6 space-y-8">

            {/* Stats Grid */}
            <section>
              <h2 className="text-lg font-bold mb-4 px-1">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickStatsCard value={jobs.length} label="Jobs" isDark={isDark} />
                <QuickStatsCard value={applicationsStats.applied} label="Applied" isDark={isDark} />
                <QuickStatsCard value={applicationsStats.interviews} label="Interviews" isDark={isDark} />
                <QuickStatsCard value={applicationsStats.saved} label="Saved" isDark={isDark} />
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold">Recent Activity</h2>
                <Link to="/activity" className="text-sm text-blue-500 hover:underline">View all</Link>
              </div>
              <div className={cn(
                "rounded-3xl border overflow-hidden",
                isDark ? "border-gray-800 bg-black" : "border-gray-200 bg-white"
              )}>
                {recentActivity.length > 0 ? (
                  <div className={cn("divide-y", isDark ? "divide-gray-800" : "divide-gray-100")}>
                    {recentActivity.map((act, i) => <ActivityItem key={i} activity={act} isDark={isDark} />)}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No recent activity</div>
                )}
              </div>
            </section>

            {/* Recommended Jobs */}
            <section>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold">Recommended for You</h2>
                <Link to="/jobs" className="text-sm text-blue-500 hover:underline">View all</Link>
              </div>
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} isDark={isDark} />
                ))}
              </div>
            </section>

          </div>
        </main>

        {/* RIGHT COLUMN: Sidebar (Desktop Only) */}
        <aside className={cn(
          "hidden lg:block w-[350px] sticky top-0 h-screen overflow-y-auto no-scrollbar p-5 space-y-6",
          isDark ? "bg-black" : "bg-white"
        )}>
          {/* Search */}



          {/* Trends */}
          <div className={cn("rounded-2xl border p-5 space-y-4", isDark ? "border-gray-800 bg-gray-900/20" : "border-gray-200 bg-gray-50")}>
            <h3 className="font-bold text-xl">What's Trending</h3>
            <div className="space-y-4">
              {postsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                </div>
              ) : trendingPosts.slice(0, 3).map((post, i) => (
                <div key={i} className="cursor-pointer group">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Trending in Tech</span>
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-sm mb-0.5 group-hover:underline">{post.content?.slice(0, 30)}...</div>
                  <div className="text-xs text-gray-500">{post.likes_count} likes</div>
                </div>
              ))}
            </div>
            <Link to="/explore" className="block text-blue-500 text-sm hover:underline">Show more</Link>
          </div>

          {/* Who to follow */}
          <div className={cn("rounded-2xl border p-5 space-y-4", isDark ? "border-gray-800 bg-gray-900/20" : "border-gray-200 bg-gray-50")}>
            <h3 className="font-bold text-xl">Who to follow</h3>
            <div className="space-y-4">
              {recommendedUsers ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                </div>
              ) : recommendedUsers.length > 0 ? (
                recommendedUsers.slice(0, 3).map((recommendedUser) => (
                  <WhoToFollowItem
                    key={recommendedUser.id}
                    user={{
                      id: recommendedUser.id,
                      full_name: recommendedUser.full_name,
                      username: recommendedUser.username,
                      avatar_url: recommendedUser.avatar_url,
                      verified: recommendedUser.verified,
                      bio: recommendedUser.bio
                    }}
                    onNavigate={() => navigator(`/profile/${recommendedUser.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No suggestions available
                </div>
              )}
            </div>
          </div>

          {/* Quick Links Footer */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 px-2">
            <Link to="#" className="hover:underline">Terms of Service</Link>
            <Link to="#" className="hover:underline">Privacy Policy</Link>
            <Link to="#" className="hover:underline">Cookie Policy</Link>
            <span>© 2025 Corp.</span>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}