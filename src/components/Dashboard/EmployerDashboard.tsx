import { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Plus,
  Calendar,
  ArrowUpRight,
  X,
  Briefcase,
  MoreHorizontal,
  Clock,
  CheckCircle,
  MessageSquare,
  Settings,
  LucideIcon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useJobManagement } from '../../hooks/useJobManagement';
import Button from '../ui/Button';
import { cn } from '../../lib/cva';
import PageLayout from '../ui/PageLayout';
import PostEventForm from '../PostEventForm';
import PostJob from '../PostJob';

// --- Types ---
interface JobPosting {
  id: string;
  title: string;
  location: string;
  status: 'open' | 'closed' | 'draft';
  applications_count?: number;
  views?: number;
}

interface Applicant {
  id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
    headline?: string;
  };
  status: string;
  applied_date: string;
}

// --- Components ---

// 1. The Small Metric Card (from the "Activities" grid in the image)
const ActivityCard = ({
  value,
  label,
  icon: Icon,
  isDark
}: {
  value: number | string;
  label: string;
  icon?: LucideIcon;
  isDark: boolean;
}) => (
  <div className={cn(
    "p-5 rounded-[24px] flex flex-col justify-between h-32 transition-all hover:-translate-y-1 duration-300 group",
    isDark
      ? "bg-[#1C1C1E] border border-white/5"
      : "bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
  )}>
    <div className="flex justify-between items-start">
      <span className={cn("text-4xl font-semibold tracking-tight", isDark ? "text-white" : "text-gray-900")}>
        {value}
      </span>
      <div className={cn(
        "p-2 rounded-full transition-colors",
        isDark ? "bg-white/5 text-gray-400 group-hover:bg-lime-400 group-hover:text-black" : "bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white"
      )}>
        {Icon ? <Icon className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
      </div>
    </div>
    <span className={cn("text-sm font-medium", isDark ? "text-gray-500" : "text-gray-500")}>
      {label}
    </span>
  </div>
);

// 2. The "Department" Summary Card (Left Column)
const DepartmentCard = ({ jobs, totalViews, isDark }: { jobs: JobPosting[], totalViews: number, isDark: boolean }) => (
  <div className={cn(
    "p-6 rounded-[32px] relative overflow-hidden",
    isDark ? "bg-[#1C1C1E] border border-white/5" : "bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
  )}>
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>Recruitment Dept.</h3>
        <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>Update - {new Date().toLocaleDateString()}</p>
      </div>
      <div className={cn("p-2 rounded-full", isDark ? "bg-white/5" : "bg-gray-50")}>
        <Briefcase className="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className={cn("p-4 rounded-2xl", isDark ? "bg-[#121212]" : "bg-[#F8F8F9]")}>
        <span className={cn("block text-3xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>{jobs.length}</span>
        <span className="text-xs text-gray-500 font-medium">Active Jobs</span>
      </div>
      <div className={cn("p-4 rounded-2xl", isDark ? "bg-[#121212]" : "bg-[#F8F8F9]")}>
        <span className={cn("block text-3xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>{totalViews}</span>
        <span className="text-xs text-gray-500 font-medium">Total Views</span>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex -space-x-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-bold", isDark ? "border-[#1C1C1E] bg-gray-800" : "border-white bg-gray-100")}>
            U{i}
          </div>
        ))}
        <div className={cn("w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-bold z-10", isDark ? "border-[#1C1C1E] bg-lime-400 text-black" : "border-white bg-black text-white")}>
          10+
        </div>
      </div>
      <button className={cn("px-4 py-2 rounded-full text-xs font-bold transition-colors", isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800")}>
        Full Report
      </button>
    </div>
  </div>
);

// 3. The "Tasks" List Row (Applicants)
const ApplicantRow = ({ applicant, isDark }: { applicant: Applicant, isDark: boolean }) => (
  <div className={cn(
    "flex items-center gap-4 p-4 mb-2 rounded-2xl transition-all group cursor-pointer",
    isDark ? "hover:bg-[#1C1C1E]" : "hover:bg-white hover:shadow-sm"
  )}>
    {/* Avatar */}
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
      <img src={applicant.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${applicant.id}`} className="w-full h-full object-cover" />
    </div>

    {/* Name & Role */}
    <div className="flex-1 min-w-0">
      <h4 className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-gray-900")}>
        {applicant.profiles?.full_name || 'Candidate'}
      </h4>
      <p className="text-xs text-gray-500 truncate">{applicant.profiles?.headline || 'Applicant'}</p>
    </div>

    {/* Description (Hidden on mobile) */}
    <div className="hidden md:block flex-[2] min-w-0">
      <p className={cn("text-xs truncate", isDark ? "text-gray-400" : "text-gray-600")}>
        Applied for <span className="font-medium">Software Engineer</span> • Review pending
      </p>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-3 shrink-0">
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium", isDark ? "bg-[#1C1C1E]" : "bg-gray-100")}>
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span className={isDark ? "text-gray-300" : "text-gray-600"}>
          {new Date(applicant.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <button className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "bg-[#1C1C1E] text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
        <Clock className="w-4 h-4" />
      </button>
      <button className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "bg-[#1C1C1E] text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function EmployerDashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { fetchEmployerJobs, getJobApplicants } = useJobManagement();

  const [showPostEventModal, setShowPostEventModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);

  // Data
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'employer') { setLoading(false); return; }

      try {
        const jobs = await fetchEmployerJobs();
        setJobPostings(jobs as JobPosting[]);

        if (jobs.length > 0) {
          let apps: Applicant[] = [];
          // Just get first few jobs' applicants for demo
          for (const job of jobs.slice(0, 3)) {
            const jobApps = await getJobApplicants(job.id);
            if (jobApps) apps = [...apps, ...jobApps];
          }
          setRecentApplicants(apps);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user, fetchEmployerJobs, getJobApplicants]);

  // Derived Metrics
  const totalViews = jobPostings.reduce((acc, job) => acc + (job.views || 0), 0);
  const totalApps = jobPostings.reduce((acc, job) => acc + (job.applications_count || 0), 0);
  const activeJobs = jobPostings.filter(j => j.status === 'open').length;
  const interviewsSet = recentApplicants.filter(a => a.status === 'interview').length;
  const hires = recentApplicants.filter(a => a.status === 'hired' || a.status === 'accepted').length;

  if (loading) return <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000]" />;

  return (
    <PageLayout
      className={cn("min-h-screen font-sans", isDark ? "bg-[#0C0C0C] text-white" : "bg-[#F2F2F7] text-gray-900")}
      maxWidth="full"
      padding="none"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 lg:pl-24">

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Hey, {user?.profile?.full_name?.split(' ')[0] || 'Recruiter'}
          </h1>
          <div className="flex gap-3">
            <Button variant="ghost" className="rounded-full w-10 h-10 p-0"><MessageSquare className="w-5 h-5" /></Button>
            <Button variant="ghost" className="rounded-full w-10 h-10 p-0"><Settings className="w-5 h-5" /></Button>
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
              <img src={user?.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.profile?.full_name || 'User'}`} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT (1/3 Left, 2/3 Right) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* === LEFT COLUMN (Profile & Summary) === */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Widget */}
            <div className="flex items-center gap-4 p-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                <img src={user?.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.profile?.full_name || 'User'}`} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {user?.profile?.full_name}
                </h2>
                <p className="text-sm text-gray-500">{user?.profile?.title || 'Head of Talent Acquisition'}</p>
              </div>
              <button className={cn("ml-auto p-2 rounded-full", isDark ? "hover:bg-[#1C1C1E]" : "hover:bg-white")}>
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Department / Jobs Card */}
            <DepartmentCard jobs={jobPostings} totalViews={totalViews} isDark={isDark} />

            {/* Online Sales / Secondary Card (Example) */}
            <div className={cn(
              "p-6 rounded-[32px] relative overflow-hidden",
              isDark ? "bg-[#1C1C1E] border border-white/5" : "bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>Events & Reach</h3>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>Update - {new Date().toLocaleDateString()}</p>
                </div>
                <div className={cn("p-2 rounded-full", isDark ? "bg-white/5" : "bg-gray-50")}>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-2xl", isDark ? "bg-[#121212]" : "bg-[#F8F8F9]")}>
                  <span className={cn("block text-3xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>56</span>
                  <span className="text-xs text-gray-500 font-medium">Interviews</span>
                </div>
                <div className={cn("p-4 rounded-2xl", isDark ? "bg-[#121212]" : "bg-[#F8F8F9]")}>
                  <span className={cn("block text-3xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>23</span>
                  <span className="text-xs text-gray-500 font-medium">Hired</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button onClick={() => setShowPostJobModal(true)} className="w-full rounded-full py-6 font-bold bg-lime-400 text-black hover:bg-lime-500 border-none">
                  + Post Job
                </Button>
              </div>
            </div>

          </div>

          {/* === RIGHT COLUMN (Activities & Tasks) === */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Activities Grid (3x2) */}
            <div>
              <h3 className={cn("text-lg font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>Activities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ActivityCard isDark={isDark} value={totalApps} label="Total Applicants" icon={Users} />
                <ActivityCard isDark={isDark} value={interviewsSet} label="Interviews Set" icon={Clock} />
                <ActivityCard isDark={isDark} value={hires} label="Hires / Offers" icon={CheckCircle} />
                <ActivityCard isDark={isDark} value={activeJobs} label="Active Listings" icon={Briefcase} />
                <ActivityCard isDark={isDark} value={totalViews} label="Job Views" icon={Eye} />
                <ActivityCard isDark={isDark} value={2} label="Events Hosted" icon={Calendar} />
              </div>
            </div>

            {/* 2. Tasks / Applicants List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>Tasks</h3>
                <div className="flex items-center gap-2">
                  <span className={cn("px-4 py-2 rounded-full text-xs font-medium cursor-pointer", isDark ? "bg-white text-black" : "bg-white shadow-sm text-gray-900")}>
                    Applicants
                  </span>
                  <Button onClick={() => setShowPostEventModal(true)} className="rounded-full w-8 h-8 p-0 flex items-center justify-center bg-black text-white"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className={cn("rounded-[32px] p-2", isDark ? "" : "")}>
                {recentApplicants.length > 0 ? (
                  recentApplicants.slice(0, 5).map(app => (
                    <ApplicantRow key={app.id} applicant={app} isDark={isDark} />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">No active tasks or applicants.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/40 p-4">
          <div className={cn("relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300", isDark ? "bg-[#1C1C1E] border border-white/10" : "bg-white")}>
            <PostJob />
            <button onClick={() => setShowPostJobModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-black"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}

      {showPostEventModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/40 p-4">
          <div className={cn("relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300", isDark ? "bg-[#1C1C1E] border border-white/10" : "bg-white")}>
            <PostEventForm onClose={() => setShowPostEventModal(false)} />
          </div>
        </div>
      )}

    </PageLayout>
  );
}