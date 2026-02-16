export type ApplicantStatus = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export type ApplicantPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Applicant {
  id: string;
  number: string;
  fullName: string;
  email: string;
  phone?: string;
  positionId: string;
  positionName: string;
  departmentName?: string;
  status: ApplicantStatus;
  priority: ApplicantPriority;
  stageId?: string;
  stageName?: string;
  source?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  experienceYears?: number;
  notes?: string;
  recruiterId?: string;
  recruiterName?: string;
  interviewCount: number;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosition {
  id: string;
  code: string;
  title: string;
  departmentName?: string;
  location?: string;
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'FILLED' | 'CANCELLED';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  applicantCount: number;
  responsibleName?: string;
  publishedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentStage {
  id: string;
  name: string;
  sequence: number;
  isDefault: boolean;
  applicantCount: number;
}

export interface Interview {
  id: string;
  applicantId: string;
  applicantName: string;
  positionName: string;
  interviewerName: string;
  scheduledAt: string;
  duration: number;
  type: 'phone' | 'video' | 'onsite' | 'TECHNICAL' | 'hr';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  rating?: number;
  feedback?: string;
  createdAt: string;
}
