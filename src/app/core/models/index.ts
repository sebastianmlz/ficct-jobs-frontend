export type Role = "candidate" | "company_rep" | "admin_ficct";

export type AccountStatus = "pending_verification" | "active" | "suspended";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: AccountStatus;
  last_login_at: string | null;
  created_at: string;
  onboarding_completed_at?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  consent_terms_version: string;
  accepted_terms: boolean;
}

export interface CandidateProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  career: string;
  graduation_year: number | null;
  headline: string;
  bio: string;
  country: string;
  city: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  created_at: string;
  updated_at: string;
}

export type DocumentKind = "cv" | "certificate" | "other";
export type DocumentIngestStatus =
  | "pending"
  | "ingesting"
  | "ingested"
  | "failed"
  | "deleted";

export interface DocumentItem {
  id: string;
  kind: DocumentKind;
  file_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  s3_key: string;
  file_url: string | null;
  ingest_status: DocumentIngestStatus;
  ingest_error: string;
  ingest_external_id: string;
  created_at: string;
  updated_at: string;
}

export type VacancyStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rejected"
  | "closed";
export type WorkModality = "onsite" | "remote" | "hybrid";

export interface Vacancy {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  requirements: string;
  modality: WorkModality;
  location: string;
  salary_currency: string;
  salary_min: string | null;
  salary_max: string | null;
  opens_at: string | null;
  closes_at: string | null;
  status: VacancyStatus;
  reject_reason: string;
  activated_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StageCode =
  | "received"
  | "preselected"
  | "interview_scheduled"
  | "interview_done"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface ApplicationItem {
  id: string;
  vacancy_id: string;
  vacancy_title: string;
  company_name: string;
  current_stage: StageCode;
  history: { stage: StageCode; at: string; by?: string }[];
  cover_letter: string;
  applied_at: string;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  kind: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  read_at: string | null;
  related_entity_type: string;
  related_entity_id: string;
  created_at: string;
}

export interface SearchHit {
  vacancy_id: string;
  score: number | null;
  snippet: string;
  vacancy: {
    id: string;
    title: string;
    company_name: string;
    modality: string;
    location: string;
  } | null;
}

export interface SearchResult {
  answer: string;
  mode: string;
  results: SearchHit[];
  total: number;
}

export interface GapAnalysisResult {
  vacancy_id: string;
  candidate_profile_id: string;
  matched_skills: string[];
  missing_skills: string[];
  coverage: number;
  summary: string;
}

export interface ChatResponse {
  answer: string;
  mode: string;
  sources: { document_id: string; snippet: string }[];
  token_usage: Record<string, number>;
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}
