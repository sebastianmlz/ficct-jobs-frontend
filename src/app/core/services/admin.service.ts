import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface CandidateRoster {
  profile_id: string;
  user_id: string;
  email: string;
  full_name: string;
  career: string;
  graduation_year: number | null;
  status: 'unvalidated' | 'approved' | 'rejected';
  reviewed_at: string | null;
  created_at: string;
}

export interface SystemParameter {
  id: string;
  key: string;
  value: string;
  value_type: 'string' | 'int' | 'float' | 'bool' | 'json';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface EmployabilityStats {
  active_vacancies: number;
  applications_total: number;
  candidates_total: number;
  candidates_validated: number;
  companies_total: number;
  applications_by_stage: Record<string, number>;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_email: string | null;
  ip: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface MicroserviceHealth {
  reachable: boolean;
  status_code?: number;
  body?: Record<string, unknown>;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  candidates(): Observable<CandidateRoster[]> {
    return this.api.get<CandidateRoster[]>('/admin/candidates/');
  }

  validateCandidate(profileId: string, action: 'approved' | 'rejected', reason = ''): Observable<unknown> {
    return this.api.post(`/admin/candidates/${profileId}/validate/`, { action, reason });
  }

  stats(): Observable<EmployabilityStats> {
    return this.api.get<EmployabilityStats>('/admin/stats/employability/');
  }

  csvExportUrl(): string {
    return this.api.url('/admin/stats/employability.csv');
  }

  parameters(): Observable<SystemParameter[]> {
    return this.api.get<SystemParameter[]>('/admin/params/');
  }

  setParameter(
    key: string,
    payload: { value: string; value_type: SystemParameter['value_type']; description?: string },
  ): Observable<SystemParameter> {
    return this.api.put<SystemParameter>(`/admin/params/${key}/`, payload);
  }

  audit(filters: { entity_type?: string; action?: string; limit?: number } = {}): Observable<AuditEntry[]> {
    return this.api.get<AuditEntry[]>('/admin/audit/', filters);
  }

  microserviceHealth(): Observable<MicroserviceHealth> {
    return this.api.get<MicroserviceHealth>('/admin/microservice/health/');
  }

  microserviceTokens(days = 30): Observable<TokenUsageReport> {
    return this.api.get<TokenUsageReport>('/admin/microservice/tokens/', { days });
  }

  skillsDemand(): Observable<SkillsDemandResponse> {
    return this.api.get<SkillsDemandResponse>('/intelligence/skills-demand/');
  }

  notifyUser(payload: { recipient_id: string; kind: string; title: string; body?: string }): Observable<unknown> {
    return this.api.post('/admin/notifications/', payload);
  }
}

export interface TokenUsageReport {
  period_days: number;
  totals: { calls?: number; input_tokens?: number; output_tokens?: number; total_tokens?: number };
  by_operation: Record<
    string,
    { calls: number; input_tokens: number; output_tokens: number; total_tokens: number }
  >;
  generated_at: string;
}

export interface SkillsDemandResponse {
  available: boolean;
  answer?: string;
  skills?: string[];
  sources?: { document_id: string; snippet: string }[];
  message?: string;
  error?: string;
  token_usage?: Record<string, number>;
}
