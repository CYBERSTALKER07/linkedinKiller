export interface User {
  id: string;
  email: string;
  role: 'student' | 'employer' | 'admin';
  name?: string;
  company?: string;
  profile?: StudentProfile | EmployerProfile | AdminProfile;
  university_id?: string;
  subscription_tier?: 'free' | 'student_premium' | 'university_premium';
}

export interface University {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  location?: string;
  subscription_tier: 'free' | 'premium' | 'enterprise';
  created_at: string;
}

export interface StudentProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  major?: string;
  graduation_year?: number;
  gpa?: number;
  skills?: string[];
  resume_url?: string;
  created_at: string;
  updated_at: string;
  university_id?: string;
  subscription_tier?: 'free' | 'student_premium';
}

export interface EmployerProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  website?: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  contact_title?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  department?: string;
  position?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  university_id?: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  company_logo?: string;
  company_id?: number;
  description: string;
  location: string;
  type: string;
  salary_range?: string;
  requirements: string[]; // text[] in DB
  skills: string[]; // text[] in DB
  benefits?: string;
  is_remote?: boolean;
  experience_level?: string;
  department?: string;
  contact_email?: string;
  status: string; // character varying
  applications_count?: number;
  views_count?: number;
  posted_at: string; // timestamp with time zone
  deadline?: string;
  updated_at: string;
  created_at: string;
  country?: string;
  city?: string;
  street_address?: string;

  // Frontend-only or aliased properties (optional for compatibility)
  salary?: string;
  posted_date?: string;
  employer?: {
    id: string;
    company_name?: string;
    name?: string;
    avatar_url?: string;
    verified?: boolean;
  };
}


export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  timestamp: string;
  read: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'career_fair' | 'workshop' | 'info_session' | 'webinar' | 'networking';
  location: string;
  virtual_link?: string;
  start_date: string;
  end_date: string;
  capacity?: number;
  registered_count: number;
  organizer_id: string;
  organizer_type: 'admin' | 'employer';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  requirements?: string[];
  tags?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  registered_date: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'application_update' | 'event_reminder' | 'message' | 'announcement' | 'deadline';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'template' | 'guide' | 'faq';
  category: 'resume' | 'interview' | 'career_planning' | 'networking' | 'general';
  content?: string;
  file_url?: string;
  author_id: string;
  published: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Digital Learning Passport & Skills Audit System Types
export interface DigitalPassport {
  id: string;
  student_id: string;
  created_at: string;
  updated_at: string;
  academic_achievements: AcademicAchievement[];
  co_curricular_activities: CoCurricularActivity[];
  internships: InternshipExperience[];
  volunteer_work: VolunteerWork[];
  micro_credentials: MicroCredential[];
  career_milestones: CareerMilestone[];
  skills_audit: SkillsAudit;
  reflections: PassportReflection[];
  goals: StudentGoal[];
  badges: DigitalBadge[];
  portfolio_items: PortfolioItem[];
}

export interface SkillsAudit {
  id: string;
  student_id: string;
  foundational_skills: SkillAssessment;
  digital_tech_skills: SkillAssessment;
  professionalism_ethics: SkillAssessment;
  entrepreneurship_innovation: SkillAssessment;
  global_intercultural: SkillAssessment;
  overall_score: number;
  last_assessment_date: string;
  next_assessment_due: string;
  assessments_history: SkillAssessmentHistory[];
}

export interface SkillAssessment {
  category: string;
  skills: IndividualSkill[];
  category_score: number;
  self_assessment_score: number;
  instructor_score?: number;
  peer_score?: number;
  employer_score?: number;
  improvement_areas: string[];
  strengths: string[];
}

export interface IndividualSkill {
  name: string;
  level: 'beginner' | 'developing' | 'proficient' | 'advanced' | 'expert';
  score: number;
  evidence: string[];
  last_updated: string;
  validation_source: 'self' | 'instructor' | 'peer' | 'employer' | 'project';
}

export interface AcademicAchievement {
  id: string;
  type: 'course' | 'project' | 'research' | 'award' | 'honor';
  title: string;
  description: string;
  course_code?: string;
  grade?: string;
  gpa_impact?: number;
  skills_demonstrated: string[];
  date_completed: string;
  instructor?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  evidence_files: string[];
}

export interface CoCurricularActivity {
  id: string;
  type: 'club' | 'leadership' | 'competition' | 'event' | 'sports' | 'arts';
  title: string;
  organization: string;
  role: string;
  description: string;
  skills_developed: string[];
  start_date: string;
  end_date?: string;
  hours_committed: number;
  achievements: string[];
  reflection: string;
  evidence_files: string[];
}

export interface InternshipExperience {
  id: string;
  company: string;
  position: string;
  department: string;
  description: string;
  skills_applied: string[];
  skills_learned: string[];
  start_date: string;
  end_date: string;
  hours_completed: number;
  supervisor_name: string;
  supervisor_evaluation?: SupervisorEvaluation;
  projects_completed: string[];
  reflection: string;
  evidence_files: string[];
}

export interface VolunteerWork {
  id: string;
  organization: string;
  role: string;
  cause_area: string;
  description: string;
  skills_utilized: string[];
  impact_metrics: string[];
  start_date: string;
  end_date?: string;
  hours_contributed: number;
  reflection: string;
  evidence_files: string[];
}

export interface MicroCredential {
  id: string;
  title: string;
  issuer: string;
  type: 'certification' | 'course' | 'workshop' | 'bootcamp' | 'webinar';
  platform: string;
  skills_covered: string[];
  completion_date: string;
  expiry_date?: string;
  credential_url: string;
  verification_code?: string;
  hours_invested: number;
  grade_achieved?: string;
}

export interface CareerMilestone {
  id: string;
  type: 'resume_workshop' | 'mock_interview' | 'networking_event' | 'career_fair' | 'mentorship' | 'job_shadow';
  title: string;
  description: string;
  facilitator?: string;
  date_completed: string;
  skills_practiced: string[];
  feedback_received: string;
  action_items: string[];
  follow_up_completed: boolean;
}

export interface DigitalBadge {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  issuer: string;
  issue_date: string;
  badge_image_url: string;
  verification_url: string;
  skills_represented: string[];
  category: 'academic' | 'professional' | 'leadership' | 'innovation' | 'service';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface PassportReflection {
  id: string;
  semester: string;
  year: number;
  key_learnings: string;
  challenges_overcome: string;
  skills_developed: string;
  goals_achieved: string[];
  goals_missed: string[];
  areas_for_improvement: string;
  career_insights: string;
  next_semester_goals: string[];
  advisor_feedback?: string;
  date_created: string;
}

export interface StudentGoal {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'career' | 'skill' | 'personal' | 'professional';
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress_percentage: number;
  milestones: GoalMilestone[];
  skills_to_develop: string[];
  resources_needed: string[];
  mentor_assigned?: string;
  reflection_notes: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  completion_date?: string;
  evidence: string[];
}

export interface PortfolioItem {
  id: string;
  type: 'project' | 'assignment' | 'research' | 'creative_work' | 'presentation';
  title: string;
  description: string;
  tags: string[];
  skills_demonstrated: string[];
  course_related?: string;
  file_urls: string[];
  thumbnail_url?: string;
  visibility: 'private' | 'public' | 'advisor_only' | 'employers_only';
  featured: boolean;
  created_date: string;
  last_updated: string;
}

export interface SkillAssessmentHistory {
  id: string;
  assessment_date: string;
  assessment_type: 'self' | 'instructor' | 'peer' | 'employer' | '360_review';
  assessor_id?: string;
  scores: Record<string, number>;
  feedback: string;
  improvement_plan: string[];
}

export interface SupervisorEvaluation {
  technical_skills_rating: number;
  communication_rating: number;
  teamwork_rating: number;
  initiative_rating: number;
  professionalism_rating: number;
  overall_rating: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendation: string;
  would_rehire: boolean;
  comments: string;
}

export interface Post {

  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    verified?: boolean;
  };
  created_at: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  has_liked: boolean;
  has_retweeted: boolean;
  has_bookmarked: boolean;
  visibility: 'public' | 'connections' | 'private';
  media?: { type: 'image' | 'video'; url: string; alt?: string }[];
  reply_to?: { id: string; author: { name: string; username: string } };
  is_retweet?: boolean;
  is_quote_retweet?: boolean;
  quote_content?: string;
  original_post?: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      username: string;
      avatar_url?: string;
      verified?: boolean;
    };
    created_at: string;
    replies_count?: number;
    media?: { type: 'image' | 'video'; url: string; alt?: string }[];
    likes_count?: number;
    retweets_count?: number;
  };
  retweeted_by?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface NewPost {
  content: string;
  media_type: 'text' | 'image' | 'video';
  visibility: 'public' | 'connections' | 'private';
  location?: string;
  tags?: string[];
  image_url?: string;
  video_url?: string;
}

export interface StudentCV {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  university?: string;
  major?: string;
  graduation_year?: number;
  skills?: string[];
  experience?: CVExperience[];
  education?: CVEducation[];
  created_at: string;
  updated_at: string;
}

export interface CVExperience {
  id: string;
  company: string;
  role: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year?: number;
  current: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  student_id: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'interview';
  applied_date: string;
  cover_letter?: string;
  application_data?: Record<string, unknown>; // JSONB data
  type?: 'standard_cv' | 'custom_form';
  student?: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}