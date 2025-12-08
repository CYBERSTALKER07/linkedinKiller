import { useState } from 'react';
import {
  Search,
  MapPin,
  ArrowUpRight,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PageLayout from './ui/PageLayout';
import { cn } from '../lib/cva';
import { useJobs } from '../hooks/useJobs';
import Animate from './ui/Animate';
import { useBreakpoint } from '@openai/apps-sdk-ui/hooks/useBreakpoints';
import JobCard from './JobCard';
import { ApplicationModal } from './student-cv/ApplicationModal';

// ==========================================
// 2. SIDEBAR PREVIEW CARD (Floating)
// ==========================================
const PreviewCard = ({ title, company, location, salary, description, tags, logo, isDark }: any) => (
  <div className={cn(
    "absolute right-[105%] top-1/2 -translate-y-1/2 w-80 p-5 rounded-3xl shadow-2xl backdrop-blur-xl border z-[999]",
    "transition-all duration-300 ease-out origin-right",
    "opacity-0 translate-x-8 scale-95 pointer-events-none",
    "group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 group-hover:pointer-events-auto",
    isDark
      ? "bg-gray-900/95 border-gray-700 text-white shadow-black/80"
      : "bg-white/95 border-white/60 text-gray-900 shadow-blue-900/20"
  )}>
    <div className="flex items-center gap-4 mb-4">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border shrink-0",
        isDark ? "bg-black border-gray-800" : "bg-white border-gray-100"
      )}>
        {logo && typeof logo === 'string' && logo.startsWith('http') ? (
          <img src={logo} alt={company} className="w-8 h-8 object-contain" />
        ) : (
          <span>{company ? company[0] : 'J'}</span>
        )}
      </div>
      <div>
        <h4 className="font-bold text-lg leading-tight line-clamp-2">{title}</h4>
        <p className="text-xs opacity-70 font-medium">{company}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mb-4">
      {tags?.map((tag: string, i: number) => (
        <span key={i} className={cn(
          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
          isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
        )}>
          {tag}
        </span>
      ))}
    </div>
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm opacity-80">
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate">{location || "Remote"}</span>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-green-500">
        <DollarSign className="w-3.5 h-3.5" />
        <span>{salary || "Competitive Salary"}</span>
      </div>
    </div>
    <p className="text-xs leading-relaxed opacity-60 line-clamp-3 mb-4">
      {description || "Join our team to help build the future of digital experiences."}
    </p>
    <div className={cn(
      "w-full py-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer hover:opacity-80 transition-opacity",
      isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
    )}>
      Quick View
    </div>
  </div>
);

// ==========================================
// 3. SIDEBAR WIDGETS
// ==========================================

// Best Matches
const BestMatchesWidget = ({ isDark, jobs }: { isDark: boolean; jobs: any[] }) => {
  // Use first 3 jobs as "best matches" for now
  const matches = jobs.slice(0, 3).map(job => ({
    title: job.title,
    company: job.company || job.employer?.company_name || 'Inc.',
    location: job.location,
    match: Math.floor(Math.random() * (99 - 85) + 85), // Random high match score for demo
    logo: job.employer?.avatar_url || null,
    logoColor: isDark ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
  }));

  if (matches.length === 0) return null;

  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border shadow-xs transition-all mb-6",
      isDark ? "bg-black border-gray-800" : "bg-white border-white shadow-gray-200/50"
    )}>
      <h3 className={cn("font-bold text-2xl  mb-6 font-serif", isDark ? "text-white" : "text-gray-900")}>
        Best Matches
      </h3>
      <div className="space-y-6">
        {matches.map((job, i) => (
          <div key={i} className="group relative cursor-pointer">
            <PreviewCard
              isDark={isDark}
              title={job.title}
              company={job.company}
              location={job.location}
              logo={job.logo}
              salary="Competitive"
              tags={['Full Time', 'Match']}
            />
            <div className="flex items-start gap-4 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold transition-transform group-hover:scale-110 shadow-sm overflow-hidden",
                job.logoColor,
                isDark && !job.logo ? "bg-gray-800 text-white" : ""
              )}>
                {job.logo ? <img src={job.logo} className="w-full h-full object-cover" /> : job.company[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-gray-900")}>{job.title}</h4>
                <p className="text-xs text-gray-400 truncate">{job.company}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Job Status
const JobStatusWidget = ({ isDark, jobs }: { isDark: boolean; jobs: any[] }) => {
  const activeJobs = jobs.slice(0, 3).map(job => ({
    title: job.title,
    company: job.company || 'Unknown',
    location: job.location,
    hours: job.type || 'Full Time',
    logo: job.employer?.avatar_url || null,
    bg: isDark ? "bg-gray-800" : "bg-gray-100 text-gray-900"
  }));

  if (activeJobs.length === 0) return null;

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border shadow-xs mb-6",
      isDark ? "bg-black border-gray-800" : "bg-white border-white shadow-gray-200/50"
    )}>

      <div className="mb-8">
        <h4 className="text-black font-bold font-serif text-2xl mb-4 flex items-center gap-2">
          {/* <span className="w-2 h-2 rounded-full bg-black animate-pulse" /> */}
          Active Jobs
        </h4>
        <div className="space-y-6">
          {activeJobs.map((job, i) => (
            <div key={i} className="flex items-center gap-4 group relative cursor-pointer">
              <PreviewCard
                isDark={isDark}
                title={job.title}
                company={job.company}
                location={job.location}
                tags={['Active', 'Ongoing']}
                salary={job.hours}
              />
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-xl overflow-hidden",
                job.bg,
                isDark && !job.logo ? "text-white" : "text-gray-900"
              )}>
                {job.logo ? <img src={job.logo} className="w-full h-full object-cover" /> : job.company[0]}
              </div>
              <div>
                <h5 className={cn("font-bold text-base", isDark ? "text-white" : "text-black")}>{job.title}</h5>
                <p className="text-sm text-gray-400">{job.location}</p>
                <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-gray-500" : "text-gray-500")}>{job.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Widget: Employers
const EmployersWidget = ({ isDark, jobs }: { isDark: boolean; jobs: any[] }) => {
  const employerCounts = jobs.reduce((acc: any, job) => {
    const id = job.employer_id;
    if (!id || !job.employer) return acc;

    if (!acc[id]) {
      acc[id] = {
        name: job.employer.name || job.employer.company_name || 'Unknown',
        logo: job.employer.avatar_url || null,
        items: 0,
        id: id
      };
    }
    acc[id].items++;
    return acc;
  }, {});

  const employers = Object.values(employerCounts)
    .sort((a: any, b: any) => b.items - a.items)
    .slice(0, 3) as any[];

  if (employers.length === 0) return null;

  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border shadow-xs mb-6",
      isDark ? "bg-black border-gray-800" : "bg-white border-white shadow-gray-200/50"
    )}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn("font-bold text-xl", isDark ? "text-white" : "text-gray-900")}>
          Employers
        </h3>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowUpRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="space-y-4">
        {employers.map((emp, i) => (
          <div key={i} className="flex items-center justify-between group relative cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-2xl transition-colors">
            <div className={cn(
              "absolute right-[105%] top-1/2 -translate-y-1/2 w-64 p-5 rounded-3xl shadow-2xl backdrop-blur-xl border z-[999]",
              "transition-all duration-300 ease-out origin-right pointer-events-none opacity-0 translate-x-8 scale-95",
              "group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100",
              isDark ? "bg-gray-900/95 border-gray-700 text-white" : "bg-white/95 border-white text-black"
            )}>
              <div className="flex items-center gap-3 mb-3">
                {emp.logo ? <img src={emp.logo} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 flex items-center justify-center font-bold bg-gray-200 rounded">{emp.name[0]}</div>}
                <span className="font-bold text-lg">{emp.name}</span>
              </div>
              <p className="text-xs mb-4 opacity-70 leading-relaxed">
                {emp.items} open roles available.
              </p>
              <button className="w-full py-2 rounded-xl bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20">
                View Company Page
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center p-2 border overflow-hidden",
                isDark ? "bg-white border-gray-700" : "bg-white border-gray-100"
              )}>
                {emp.logo ? <img src={emp.logo} className="w-full h-full object-contain" /> : <span className="text-black font-bold">{emp.name[0]}</span>}
              </div>
              <div>
                <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-gray-900")}>{emp.name}</p>
                <p className="text-xs text-gray-400">{emp.items} Openings</p>
              </div>
            </div>
            <button className={cn(
              "text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors uppercase tracking-wide",
              isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"
            )}>
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================
export default function JobsPage() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const isMd = useBreakpoint('md');
  const isMobile = !isMd;

  const { jobs: jobsData = [], loading, error } = useJobs();

  if (error) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center p-4',
        isDark ? 'bg-black text-white' : 'bg-gray-50 text-black'
      )}>
        <div className="text-center space-y-4">
          <div className="text-red-500 font-bold text-xl">Error loading jobs</div>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredJobs = (jobsData || []).filter(job => {
    const matchesSearch =
      (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      isDark ? 'bg-black text-white' : 'bg-gray-50/50 text-black'
    )}>
      <PageLayout maxWidth="7xl" padding={isMobile ? 'sm' : 'md'}>
        <div className="py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

          {/* -----------------------------------------------------------------
              LEFT COLUMN: SEARCH & FEED (8 Cols)
          ----------------------------------------------------------------- */}
          <div className="lg:col-span-8 flex flex-col gap-6 z-10">



            <div className={cn(
              "sticky top-4 z-40 p-4 rounded-[2rem] border backdrop-blur-md transition-all mb-2",
              isDark
                ? "bg-black/80 border-gray-800 shadow-2xl shadow-black/50"
                : "bg-white/80 border-white shadow-xl shadow-gray-200/50"
            )}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for jobs, companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-xl outline-hidden transition-all",
                      isDark
                        ? "bg-gray-900 focus:bg-gray-800 text-white placeholder-gray-500"
                        : "bg-gray-100 focus:bg-white focus:ring-2 ring-blue-100 text-black"
                    )}
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {['all', 'full-time', 'contract'].map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap capitalize transition-all",
                        typeFilter === type
                          ? (isDark ? "bg-white text-black" : "bg-black text-white")
                          : (isDark ? "bg-gray-900 text-gray-400 hover:bg-gray-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200")
                      )}
                    >
                      {type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:hidden mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'full-time', 'part-time', 'contract'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap capitalize border",
                      typeFilter === type
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs Feed Grid - UPDATED TO 3 COLUMNS */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn("h-80 rounded-[2rem] animate-pulse", isDark ? "bg-gray-900" : "bg-gray-200")} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2  gap-5">
                {filteredJobs.map((job, index) => (
                  <Animate
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    enter={{ opacity: 1, y: 0, duration: 400, delay: index * 50 }}
                  >
                    <JobCard
                      id={job.id}
                      title={job.title}
                      company={job.company}
                      location={job.location}
                      type={job.type}
                      salary_range={job.salary_range}
                      posted_at={job.created_at}
                      skills={job.skills || []}
                      is_remote={job.is_remote}
                      employer={job.employer}
                      onApply={() => setSelectedJob(job)}
                    />
                  </Animate>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-50">
                    <Briefcase className="w-12 h-12 mx-auto mb-4" />
                    <p>No jobs found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              RIGHT COLUMN: SIDEBAR (4 Cols)
          ----------------------------------------------------------------- */}
          <div className={cn(
            "hidden lg:block lg:col-span-4 w-[] relative z-20  ml-0",
            selectedJob ? "invisible" : ""
          )}>
            <div className="sticky top-6 pb-10">
              <BestMatchesWidget isDark={isDark} jobs={jobsData} />
              <JobStatusWidget isDark={isDark} jobs={jobsData} />
              <EmployersWidget isDark={isDark} jobs={jobsData} />

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-gray-400 px-6 mt-8">
                <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-gray-600 transition-colors">Help</a>
                <span>© 2024 JobBoard</span>
              </div>
            </div>
          </div>

        </div>
      </PageLayout>

      {selectedJob && (
        <ApplicationModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          employerName={selectedJob.company || selectedJob.employer?.company_name || 'Company'}
        />
      )}
    </div>
  );
}