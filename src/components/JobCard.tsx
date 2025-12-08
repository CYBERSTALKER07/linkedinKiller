import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Check,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cva';

export interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | string;
  salary_range?: string;
  description?: string;
  skills?: string[];
  posted_at: string;
  is_remote?: boolean;
  employer?: {
    id: string;
    name: string;
    avatar_url?: string;
    company_name?: string;
    verified?: boolean;
  };
  onApply?: () => void;
}

export default function JobCard({
  id,
  title,
  company,
  location,
  type,
  salary_range,
  posted_at,
  employer,
  onApply
}: JobCardProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Format Date: "28 Mar 2023"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate Time Ago for the "Exp/Time" tag
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="block h-full group cursor-pointer" onClick={() => onApply?.()}>
      <div
        className={cn(
          'h-[360px] w-[380px] flex flex-col p-7 rounded-[2rem] border transition-all duration-300 relative',
          isDark
            ? 'bg-[#121212] border-gray-800 text-white shadow-black/50'
            : 'bg-white border-gray-100 text-gray-900 shadow-gray-200/50'
        )}
      >
        {/* --- Header: Logo & Titles --- */}
        <div className="flex items-center gap-5 mb-8">
          {/* Logo Container */}
          <div className="relative shrink-0">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border bg-white p-1",
              isDark ? "border-gray-700" : "border-gray-50"
            )}>
              {employer?.avatar_url ? (
                <img
                  src={employer.avatar_url}
                  alt={company}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-800">
                  {company ? company.charAt(0).toUpperCase() : 'C'}
                </span>
              )}
            </div>

            {/* Verified Badge (Solid Green with White Check) */}
            {/* {employer?.verified && ( */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-600 rounded-full p-[3px]">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            </div>
            {/* )} */}
          </div>

          {/* Texts */}
          <div className="flex flex-col gap-1">
            <span className={cn(
              "text-base font-medium  mb-0.5",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {company}
            </span>
            <h3 className={cn(
              "text-2xl font-bold leading-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {title}
            </h3>
          </div>
        </div>

        {/* --- Info Badges Row --- */}
        <div className="flex items-center gap-x-2 gap-y-3 mb-8">

          {/* Location Badge (Gray) */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-400"
            )}>
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <span className={cn("font-thin text-xs", isDark ? "text-gray-300" : "text-gray-900")}>
              {location ? location.split(',')[0] : 'Remote'}
            </span>
          </div>

          {/* Job Type Badge (Purple w/ Dollar Sign) */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isDark ? "bg-[#3B3058] text-[#8B5CF6]" : "bg-[#F3F0FF] text-[#7C3AED]"
            )}>
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className={cn("font-thin text-xs", isDark ? "text-gray-300" : "text-gray-900")}>
              {type ? type.replace('-', ' ') : 'Full Time'}
            </span>
          </div>

          {/* Time/Exp Badge (Red) */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isDark ? "bg-[#4C2D32] text-[#F43F5E]" : "bg-[#FFF1F2] text-[#F43F5E]"
            )}>
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className={cn("font-thin text-xs", isDark ? "text-gray-300" : "text-gray-900")}>
              {timeAgo(posted_at).replace(' ago', '')} exp.
            </span>
          </div>

        </div>

        {/* --- Spacer --- */}
        {/* <div className="flex-grow" /> */}

        {/* --- Salary & Date --- */}
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-baseline">
            <span className={cn(
              "text-3xl font-bold tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {salary_range ? salary_range.split('-')[0] : 'Competitive'}
            </span>
            <span className={cn(
              "text-lg font-normal ml-1",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              {salary_range ? '/year' : ''}
            </span>
          </div>
          <span className={cn(
            "font-thin text-xs mb-1.5",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            {formatDate(posted_at)}
          </span>
        </div>

        {/* --- Footer Buttons --- */}
        <div className="grid grid-cols-2 gap-4 ">
          <button
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm transition-all border",
              isDark
                ? "border-gray-700 text-white hover:bg-gray-800"
                : "border-gray-200 text-gray-800 hover:bg-gray-50 bg-white"
            )}
            onClick={(e) => {
              e.preventDefault();
              onApply?.();
            }}
          >
            View Details
          </button>

          {user?.id === employer?.id ? (
            <Link
              to={`/job/${id}/applicants`}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-lg flex items-center justify-center",
                "bg-purple-600 text-white border border-transparent hover:bg-purple-700"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              View Applicants
            </Link>
          ) : (
            <button
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:shadow-lg",
                "bg-[#0EA5E9] text-white border border-transparent"
              )}
              onClick={(e) => {
                e.preventDefault();
                onApply?.();
              }}
            >
              Apply now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}