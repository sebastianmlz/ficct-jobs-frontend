import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface CompanySummary {
  id: string;
  legal_name: string;
  trade_name: string;
  tax_id: string;
  sector: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  status: 'pending_validation' | 'active' | 'suspended';
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyPayload {
  legal_name: string;
  sector?: string;
  description?: string;
  contact_email: string;
  rep_email: string;
  rep_full_name: string;
  rep_title?: string;
}

export interface CreateCompanyResponse extends CompanySummary {
  representative: { id: string; user_id: string; email: string; full_name: string; title: string };
  one_time_password: string;
}

@Injectable({ providedIn: 'root' })
export class RecruitmentService {
  private readonly api = inject(ApiService);

  list(): Observable<CompanySummary[]> {
    return this.api.get<CompanySummary[]>('/recruitment/companies/');
  }

  register(payload: CreateCompanyPayload): Observable<CreateCompanyResponse> {
    return this.api.post<CreateCompanyResponse>('/recruitment/companies/', payload);
  }

  setStatus(id: string, action: 'suspend' | 'reactivate', reason?: string): Observable<CompanySummary> {
    return this.api.post<CompanySummary>(`/recruitment/companies/${id}/status/`, { action, reason });
  }
}
