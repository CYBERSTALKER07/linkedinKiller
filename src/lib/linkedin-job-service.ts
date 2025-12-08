import axios from 'axios';
import { Job } from '../types';

export interface LinkedInJobPost {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId: string;
  location: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';
  seniorityLevel: 'INTERNSHIP' | 'ENTRY_LEVEL' | 'ASSOCIATE' | 'MID_SENIOR' | 'DIRECTOR' | 'EXECUTIVE';
  jobFunction: string[];
  industries: string[];
  skills: string[];
  salaryRange?: {
    currency: string;
    min: number;
    max: number;
  };
  applicationMethod: {
    type: 'EXTERNAL' | 'SIMPLE_ON_SITE' | 'COMPLEX_ON_SITE';
    url?: string;
    email?: string;
  };
  postedAt: string;
  expiresAt: string;
  applicantCount?: number;
  viewCount?: number;
}

export interface LinkedInApplication {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'PENDING' | 'VIEWED' | 'IN_PROCESS' | 'HIRED' | 'REJECTED';
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  candidateProfile: {
    firstName: string;
    lastName: string;
    headline: string;
    profilePictureUrl?: string;
    email: string;
    location?: string;
    skills: string[];
    experience: {
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }[];
    education: {
      school: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate?: string;
    }[];
  };
}

export interface LinkedInCompany {
  id: string;
  name: string;
  description?: string;
  industry: string;
  logo?: string;
  website?: string;
  size: string;
  headquarters: {
    country: string;
    city?: string;
  };
}

class LinkedInJobService {
  private baseURL = 'https://api.linkedin.com/rest';
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('linkedin_access_token');
  }

  /**
   * Initialize LinkedIn OAuth flow
   */
  initiateAuth(): string {
    const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/linkedin-callback`);
    const scope = encodeURIComponent([
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'rw_jobs',
      'r_organization_social',
      'rw_organization_admin'
    ].join(' '));

    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('linkedin_oauth_state', state);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    window.location.href = authUrl;
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<string> {
    const storedState = localStorage.getItem('linkedin_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state parameter');
    }

    try {
      const response = await axios.post('/api/linkedin/token', {
        code,
        redirect_uri: `${window.location.origin}/linkedin-callback`,
        client_id: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
        client_secret: process.env.REACT_APP_LINKEDIN_CLIENT_SECRET,
        grant_type: 'authorization_code'
      });

      const { access_token } = response.data;
      this.accessToken = access_token;
      localStorage.setItem('linkedin_access_token', access_token);
      localStorage.removeItem('linkedin_oauth_state');

      return access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Set access token manually
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('linkedin_access_token', token);
  }

  /**
   * Get authenticated user profile
   */
  async getUserProfile(): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}/people/~`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's organizations (companies they can post jobs for)
   */
  async getUserOrganizations(): Promise<LinkedInCompany[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}/organizationAcls`, {
        params: {
          q: 'roleAssignee',
          role: 'ADMINISTRATOR',
          projection: '(elements*(organization~(id,name,vanityName,logoV2(original~:playableStreams))))'
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309'
        }
      });

      return response.data.elements.map((element: any) => ({
        id: element.organization.id,
        name: element.organization.name,
        logo: element.organization.logoV2?.original?.elements?.[0]?.identifiers?.[0]?.identifier
      }));
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      throw error;
    }
  }

  /**
   * Post a job to LinkedIn
   */
  async postJob(jobData: {
    companyId: string;
    title: string;
    description: string;
    location: string;
    employmentType: LinkedInJobPost['employmentType'];
    seniorityLevel: LinkedInJobPost['seniorityLevel'];
    jobFunction: string[];
    skills: string[];
    applicationMethod: LinkedInJobPost['applicationMethod'];
    expiresAt?: string;
  }): Promise<LinkedInJobPost> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const jobPostData = {
        author: `urn:li:organization:${jobData.companyId}`,
        jobPostingOperationType: 'CREATE',
        integrationContext: 'urn:li:organization:' + jobData.companyId,
        companyApplyUrl: jobData.applicationMethod.url,
        description: jobData.description,
        employmentStatus: jobData.employmentType,
        experienceLevel: jobData.seniorityLevel,
        externalJobPostingId: `external-${Date.now()}`,
        jobFunctions: jobData.jobFunction,
        jobLocation: {
          countryCode: 'US', // You might want to parse this from location
          city: jobData.location
        },
        listedAt: Date.now(),
        jobTitle: jobData.title,
        skills: jobData.skills.map(skill => ({ name: skill })),
        ...(jobData.expiresAt && {
          expiresAt: new Date(jobData.expiresAt).getTime()
        })
      };

      const response = await axios.post(`${this.baseURL}/simpleJobPostings`, jobPostData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309',
          'Content-Type': 'application/json'
        }
      });

      return this.transformLinkedInJobPost(response.data);
    } catch (error) {
      console.error('Error posting job:', error);
      throw error;
    }
  }

  /**
   * Get jobs posted by user's organizations
   */
  async getCompanyJobs(companyId: string, limit: number = 50): Promise<LinkedInJobPost[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}/simpleJobPostings`, {
        params: {
          q: 'author',
          author: `urn:li:organization:${companyId}`,
          count: limit,
          projection: '(elements*(author,companyApplyUrl,description,employmentStatus,experienceLevel,jobFunctions,jobLocation,jobTitle,listedAt,expiresAt,jobSeeker))'
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309'
        }
      });

      return response.data.elements.map((job: any) => this.transformLinkedInJobPost(job));
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      throw error;
    }
  }

  /**
   * Get job applications for a specific job
   */
  async getJobApplications(jobId: string): Promise<LinkedInApplication[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`${this.baseURL}/simpleJobApplications`, {
        params: {
          q: 'jobPosting',
          jobPosting: `urn:li:simpleJobPosting:${jobId}`,
          projection: '(elements*(jobPosting,person~(firstName,lastName,headline,profilePicture(displayImage~:playableStreams)),submittedAt,jobApplicationStatus))'
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309'
        }
      });

      return response.data.elements.map((app: any) => this.transformLinkedInApplication(app));
    } catch (error) {
      console.error('Error fetching job applications:', error);
      throw error;
    }
  }

  /**
   * Apply to a job on behalf of the user
   */
  async applyToJob(jobId: string, applicationData: {
    coverLetter?: string;
    resumeUrl?: string;
  }): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.post(`${this.baseURL}/simpleJobApplications`, {
        jobPosting: `urn:li:simpleJobPosting:${jobId}`,
        person: 'urn:li:person:{personId}', // This would be the authenticated user's ID
        ...(applicationData.coverLetter && { coverLetter: applicationData.coverLetter }),
        ...(applicationData.resumeUrl && { resume: applicationData.resumeUrl })
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  }

  /**
   * Search for jobs on LinkedIn
   */
  async searchJobs(params: {
    keywords?: string;
    location?: string;
    companyId?: string;
    jobFunction?: string[];
    experienceLevel?: string[];
    employmentType?: string[];
    limit?: number;
  }): Promise<LinkedInJobPost[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const queryParams: any = {
        count: params.limit || 25
      };

      if (params.keywords) queryParams.keywords = params.keywords;
      if (params.location) queryParams.location = params.location;
      if (params.companyId) queryParams.companyId = params.companyId;
      if (params.jobFunction?.length) queryParams.jobFunction = params.jobFunction.join(',');
      if (params.experienceLevel?.length) queryParams.experienceLevel = params.experienceLevel.join(',');
      if (params.employmentType?.length) queryParams.employmentType = params.employmentType.join(',');

      const response = await axios.get(`${this.baseURL}/jobSearch`, {
        params: queryParams,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'LinkedIn-Version': '202309'
        }
      });

      return response.data.elements.map((job: any) => this.transformLinkedInJobPost(job));
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  /**
   * Import LinkedIn jobs into your platform's format
   */
  async importJobsToPlatform(jobs: LinkedInJobPost[]): Promise<Job[]> {
    const importedJobs: Job[] = [];

    for (const linkedinJob of jobs) {
      try {
        const platformJob: Job = {
          id: `linkedin_${linkedinJob.id}`,
          title: linkedinJob.title,
          company: linkedinJob.company,
          type: this.mapEmploymentType(linkedinJob.employmentType),
          location: linkedinJob.location,
          salary: linkedinJob.salaryRange ?
            `${linkedinJob.salaryRange.currency} ${linkedinJob.salaryRange.min.toLocaleString()} - ${linkedinJob.salaryRange.max.toLocaleString()}` :
            undefined,
          description: linkedinJob.description,
          requirements: [], // LinkedIn doesn't separate requirements
          skills: linkedinJob.skills || [],
          posted_date: linkedinJob.postedAt,
          deadline: linkedinJob.expiresAt,
          applications_count: linkedinJob.applicantCount,
          employer_id: linkedinJob.companyId,
          status: 'active',
          views: linkedinJob.viewCount,
          experience_level: this.mapSeniorityLevel(linkedinJob.seniorityLevel),
          created_at: linkedinJob.postedAt,
          updated_at: new Date().toISOString()
        };

        // Save to your database
        const savedJob = await this.saveJobToPlatform(platformJob);
        importedJobs.push(savedJob);
      } catch (error) {
        console.error(`Error importing job ${linkedinJob.id}:`, error);
      }
    }

    return importedJobs;
  }

  /**
   * Enable "Apply with LinkedIn" for external applications
   */
  async createApplyWithLinkedInUrl(jobData: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    jobLocation: string;
    applicationUrl: string;
  }): Promise<string> {
    const params = new URLSearchParams({
      companyName: jobData.companyName,
      jobTitle: jobData.jobTitle,
      jobDescription: jobData.jobDescription.substring(0, 200) + '...',
      jobLocation: jobData.jobLocation,
      applyUrl: jobData.applicationUrl
    });

    return `https://www.linkedin.com/jobs/apply-with-linkedin?${params.toString()}`;
  }

  /**
   * Transform LinkedIn job post to internal format
   */
  private transformLinkedInJobPost(linkedinJob: any): LinkedInJobPost {
    return {
      id: linkedinJob.id || linkedinJob.jobPostingId,
      title: linkedinJob.jobTitle || linkedinJob.title,
      description: linkedinJob.description,
      company: linkedinJob.author?.name || 'Unknown Company',
      companyId: linkedinJob.author?.id || linkedinJob.companyId,
      location: linkedinJob.jobLocation?.city || linkedinJob.location || 'Remote',
      employmentType: linkedinJob.employmentStatus || 'FULL_TIME',
      seniorityLevel: linkedinJob.experienceLevel || 'ENTRY_LEVEL',
      jobFunction: linkedinJob.jobFunctions || [],
      industries: linkedinJob.industries || [],
      skills: linkedinJob.skills?.map((skill: any) => skill.name) || [],
      applicationMethod: {
        type: linkedinJob.companyApplyUrl ? 'EXTERNAL' : 'SIMPLE_ON_SITE',
        url: linkedinJob.companyApplyUrl
      },
      postedAt: linkedinJob.listedAt ? new Date(linkedinJob.listedAt).toISOString() : new Date().toISOString(),
      expiresAt: linkedinJob.expiresAt ? new Date(linkedinJob.expiresAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      applicantCount: linkedinJob.applicantCount,
      viewCount: linkedinJob.viewCount
    };
  }

  /**
   * Transform LinkedIn application to internal format
   */
  private transformLinkedInApplication(linkedinApp: any): LinkedInApplication {
    const person = linkedinApp.person;

    return {
      id: linkedinApp.id,
      jobId: linkedinApp.jobPosting?.id,
      candidateId: person?.id,
      status: linkedinApp.jobApplicationStatus || 'PENDING',
      appliedAt: linkedinApp.submittedAt ? new Date(linkedinApp.submittedAt).toISOString() : new Date().toISOString(),
      candidateProfile: {
        firstName: person?.firstName || '',
        lastName: person?.lastName || '',
        headline: person?.headline || '',
        profilePictureUrl: person?.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
        email: person?.email || '',
        location: person?.location || '',
        skills: person?.skills || [],
        experience: person?.experience || [],
        education: person?.education || []
      }
    };
  }

  /**
   * Map LinkedIn employment type to platform format
   */
  private mapEmploymentType(linkedinType: LinkedInJobPost['employmentType']): Job['type'] {
    const mapping: Record<LinkedInJobPost['employmentType'], Job['type']> = {
      'FULL_TIME': 'full-time',
      'PART_TIME': 'part-time',
      'CONTRACT': 'contract',
      'TEMPORARY': 'part-time',
      'INTERNSHIP': 'internship'
    };
    return mapping[linkedinType] || 'full-time';
  }

  /**
   * Map LinkedIn seniority level to platform format
   */
  private mapSeniorityLevel(linkedinLevel: LinkedInJobPost['seniorityLevel']): string {
    const mapping: Record<LinkedInJobPost['seniorityLevel'], string> = {
      'INTERNSHIP': 'entry',
      'ENTRY_LEVEL': 'entry',
      'ASSOCIATE': 'junior',
      'MID_SENIOR': 'mid',
      'DIRECTOR': 'senior',
      'EXECUTIVE': 'senior'
    };
    return mapping[linkedinLevel] || 'entry';
  }

  /**
   * Save imported job to platform database
   */
  private async saveJobToPlatform(job: Job): Promise<Job> {
    // This would typically make an API call to your backend
    try {
      const response = await axios.post('/api/jobs', job);
      return response.data;
    } catch (error) {
      console.error('Error saving job to platform:', error);
      throw error;
    }
  }

  /**
   * Sync applications from LinkedIn to platform
   */
  async syncApplications(jobId: string): Promise<void> {
    try {
      const linkedinApplications = await this.getJobApplications(jobId);

      for (const app of linkedinApplications) {
        // Convert to platform format and save
        await this.saveApplicationToPlatform(app);
      }
    } catch (error) {
      console.error('Error syncing applications:', error);
      throw error;
    }
  }

  /**
   * Save LinkedIn application to platform
   */
  private async saveApplicationToPlatform(application: LinkedInApplication): Promise<void> {
    try {
      await axios.post('/api/applications', {
        job_id: application.jobId,
        linkedin_application_id: application.id,
        candidate_data: application.candidateProfile,
        status: application.status.toLowerCase(),
        applied_date: application.appliedAt,
        cover_letter: application.coverLetter,
        source: 'linkedin'
      });
    } catch (error) {
      console.error('Error saving application to platform:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const linkedInJobService = new LinkedInJobService();