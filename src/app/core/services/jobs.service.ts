import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApplicationItem, StageCode, Vacancy } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(ApiService);

  listVacancies(): Observable<Vacancy[]> {
    return this.api.get<Vacancy[]>('/jobs/vacancies/');
  }

  getVacancy(id: string): Observable<Vacancy> {
    return this.api.get<Vacancy>(`/jobs/vacancies/${id}/`);
  }

  createVacancy(payload: Partial<Vacancy>): Observable<Vacancy> {
    return this.api.post<Vacancy>('/jobs/vacancies/', payload);
  }

  updateVacancy(id: string, payload: Partial<Vacancy>): Observable<Vacancy> {
    return this.api.patch<Vacancy>(`/jobs/vacancies/${id}/`, payload);
  }

  transitionVacancy(id: string, action: 'activate' | 'close'): Observable<Vacancy> {
    return this.api.post<Vacancy>(`/jobs/vacancies/${id}/transition/`, { action });
  }

  approveVacancy(id: string, action: 'approve' | 'reject', reason?: string): Observable<Vacancy> {
    return this.api.post<Vacancy>(`/jobs/vacancies/${id}/approval/`, { action, reason });
  }

  apply(vacancyId: string, coverLetter = ''): Observable<ApplicationItem> {
    return this.api.post<ApplicationItem>(`/jobs/vacancies/${vacancyId}/apply/`, {
      cover_letter: coverLetter,
    });
  }

  myApplications(): Observable<ApplicationItem[]> {
    return this.api.get<ApplicationItem[]>('/jobs/applications/me/');
  }

  getApplication(id: string): Observable<ApplicationItem> {
    return this.api.get<ApplicationItem>(`/jobs/applications/${id}/`);
  }

  vacancyApplications(vacancyId: string): Observable<ApplicationItem[]> {
    return this.api.get<ApplicationItem[]>(`/jobs/vacancies/${vacancyId}/applications/`);
  }

  withdrawApplication(id: string): Observable<ApplicationItem> {
    return this.api.post<ApplicationItem>(`/jobs/applications/${id}/withdraw/`, {});
  }

  transitionApplication(id: string, stage: StageCode): Observable<ApplicationItem> {
    return this.api.post<ApplicationItem>(`/jobs/applications/${id}/transition/`, { stage });
  }

  notifyApplication(
    id: string,
    payload: { kind?: 'info' | 'success' | 'warning'; title: string; body?: string },
  ): Observable<ApplicationItem> {
    return this.api.post<ApplicationItem>(`/jobs/applications/${id}/notify/`, payload);
  }

  listAttachments(vacancyId: string): Observable<VacancyAttachment[]> {
    return this.api.get<VacancyAttachment[]>(`/jobs/vacancies/${vacancyId}/attachments/`);
  }

  uploadAttachment(vacancyId: string, file: File): Observable<VacancyAttachment> {
    const form = new FormData();
    form.append('file', file);
    return this.api.post<VacancyAttachment>(
      `/jobs/vacancies/${vacancyId}/attachments/`,
      form,
      { isMultipart: true },
    );
  }

  deleteAttachment(attachmentId: string): Observable<void> {
    return this.api.delete(`/jobs/attachments/${attachmentId}/`);
  }

  rankingCsvUrl(vacancyId: string): string {
    return this.api.url(`/jobs/vacancies/${vacancyId}/ranking.csv`);
  }

  listClosedVacancies(): Observable<ClosedVacancy[]> {
    return this.api.get<ClosedVacancy[]>('/jobs/vacancies/closed/');
  }
}

export interface VacancyAttachment {
  id: string;
  vacancy: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  s3_key: string;
  ingest_status: string;
  ingest_error: string;
  created_at: string;
  updated_at: string;
}

export interface ClosedVacancy {
  id: string;
  title: string;
  company_name: string;
  modality: string;
  closed_at: string | null;
  created_at: string;
  applications_total: number;
  applications: {
    id: string;
    candidate_email: string;
    candidate_name: string;
    current_stage: string;
    applied_at: string;
  }[];
}
