import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  LocationOn,
  Schedule,
  People,
  AttachMoney,
  School,
  Work,
  Visibility,
  RocketLaunch,
  Star,
  Business,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import Badge from './Badge';
import Button from './Button';
import { cn } from '../../lib/cva';

// Simple cn utility function to combine class names
const cn2 = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'x-style';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  animated?: boolean;
  rotation?: number;
  delay?: number;
  scale?: number;
  clickable?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<any>;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  animated?: boolean;
  delay?: number;
  rotation?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary_range?: string;
    posted_date: string;
    description: string;
    requirements?: string[];
    applications_count?: number;
  };
  onView: () => void;
  onApply: () => void;
  className?: string;
}

// Material Design 3 Card Component
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'x-style',
  padding = 'md',
  interactive = false,
  animated = true,
  rotation = 0,
  delay = 0,
  scale = 1,
  clickable = false,
  onClick,
  hover = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!animated || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, {
        scale: 0.95,
        opacity: 0,
        y: 8,
        rotation: rotation + (Math.random() - 0.5) * 1
      });

      gsap.to(cardRef.current, {
        scale: scale,
        opacity: 1,
        y: 0,
        rotation: rotation,
        duration: 0.3,
        delay: delay,
        ease: 'power2.out'
      });
    }, cardRef);

    return () => ctx.revert();
  }, [animated, rotation, delay, scale]);

  const baseClasses = `
    transition-all duration-200 ease-material-standard
    rounded-none
    ${clickable ? 'cursor-pointer' : ''}
    ${interactive ? 'hover:shadow-elevation-2 active:shadow-elevation-1' : ''}
  `;

  const variantClasses = {
    default: 'bg-white dark:bg-gray-900',
    elevated: isDark
      ? "bg-dark-surface shadow-elevation-1 hover:shadow-elevation-2 border-0"
      : "bg-surface-50 shadow-elevation-1 hover:shadow-elevation-2 border-0",
    filled: isDark
      ? "bg-dark-bg border-0 shadow-none"
      : "bg-surface-200 border-0 shadow-none",
    outlined: isDark
      ? "bg-dark-surface border border-gray-600 shadow-none hover:shadow-elevation-1"
      : "bg-surface-50 border border-gray-200 shadow-none hover:shadow-elevation-1",
    'x-style': 'border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const interactiveClasses = interactive
    ? "hover:scale-[1.02] active:scale-[0.98] transform"
    : "";

  const hoverClasses = hover && variant === 'x-style' ? 'hover:bg-gray-50/50 dark:hover:bg-gray-950/50' : '';

  const cardClasses = cn2(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    interactiveClasses,
    hoverClasses,
    className
  );

  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Material Design 3 Stats Card
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'primary',
  animated = true,
  delay = 0,
  rotation = 0,
  trend,
  trendValue
}) => {
  const { isDark } = useTheme();

  const colorClasses = {
    primary: isDark ? 'text-lime' : 'text-lime',
    secondary: isDark ? 'text-secondary-300' : 'text-secondary-600',
    success: 'text-success-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-info-600'
  };

  const iconBackgroundClasses = {
    primary: isDark ? 'bg-lime/10' : 'bg-lime/10',
    secondary: isDark ? 'bg-secondary-300/10' : 'bg-secondary-600/10',
    success: 'bg-success-600/10',
    error: 'bg-error-600/10',
    warning: 'bg-warning-600/10',
    info: 'bg-info-600/10'
  };

  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: isDark ? 'text-dark-muted' : 'text-gray-500'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;

  return (
    <Card
      variant="elevated"
      animated={animated}
      delay={delay}
      rotation={rotation}
      interactive
      className="group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-label-medium font-medium ${isDark ? 'text-dark-muted' : 'text-gray-600'
            }`}>
            {title}
          </p>
          <p className={`text-display-small font-normal mt-1 ${isDark ? 'text-dark-text' : 'text-gray-900'
            }`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-body-small mt-1 ${isDark ? 'text-dark-muted' : 'text-gray-500'
              }`}>
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-label-medium ${trendColors[trend]}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-4 rounded-2xl ${iconBackgroundClasses[color]
            } group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
          </div>
        )}
      </div>
    </Card>
  );
};

// Material Design 3 Job Card
export const JobCard: React.FC<JobCardProps> = ({
  job,
  onView,
  onApply,
  className = ''
}) => {
  const { isDark } = useTheme();

  const getJobTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'full-time':
        return 'success';
      case 'part-time':
        return 'info';
      case 'internship':
        return 'warning';
      case 'contract':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      variant="elevated"
      className={`group ${className}`}
      interactive
      clickable
      onClick={onView}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge
                color={getJobTypeColor(job.type) as any}
                variant="tonal"
                className="capitalize"
              >
                {job.type.replace('-', ' ')}
              </Badge>
              {job.applications_count && job.applications_count > 50 && (
                <Badge color="error" variant="outlined">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <h3 className={`text-title-large font-medium mb-1 group-hover:${isDark ? 'text-lime' : 'text-lime'
              } transition-colors ${isDark ? 'text-dark-text' : 'text-gray-900'
              }`}>
              {job.title}
            </h3>
            <div className="flex items-center space-x-1 mb-2">
              <Business className={`h-4 w-4 ${isDark ? 'text-dark-muted' : 'text-gray-500'
                }`} />
              <p className={`text-body-medium font-medium ${isDark ? 'text-lime' : 'text-lime'
                }`}>
                {job.company}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-lime/10' : 'bg-lime/10'
            } group-hover:scale-110 transition-transform duration-200`}>
            <Work className={`h-6 w-6 ${isDark ? 'text-lime' : 'text-lime'
              }`} />
          </div>
        </div>

        {/* Job Details */}
        <div className={`flex flex-wrap items-center gap-4 text-body-medium ${isDark ? 'text-dark-muted' : 'text-gray-600'
          }`}>
          <div className="flex items-center space-x-1">
            <LocationOn className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Schedule className="h-4 w-4" />
            <span>{formatDate(job.posted_date)}</span>
          </div>
          {job.salary_range && (
            <div className="flex items-center space-x-1">
              <AttachMoney className="h-4 w-4" />
              <span>{job.salary_range}</span>
            </div>
          )}
          {job.applications_count && (
            <div className="flex items-center space-x-1">
              <People className="h-4 w-4" />
              <span>{job.applications_count} applicants</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`text-body-medium leading-relaxed line-clamp-3 ${isDark ? 'text-dark-muted' : 'text-gray-600'
          }`}>
          {job.description}
        </p>

        {/* Requirements Preview */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 text-label-small rounded-full ${isDark
                  ? 'bg-dark-bg text-dark-text border border-gray-600'
                  : 'bg-surface-200 text-gray-700 border border-gray-200'
                  }`}
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className={`text-label-small ${isDark ? 'text-dark-muted' : 'text-gray-500'
                }`}>
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-opacity-20">
          <Button
            variant="outlined"
            size="small"
            startIcon={Visibility}
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="filled"
            size="small"
            startIcon={RocketLaunch}
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className="flex-1"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Card;