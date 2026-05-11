import { HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CandidateProfile, DocumentItem } from '../models';
import { ApiService } from './api.service';

export interface SkillItem {
  id: string;
  name: string;
  level: number;
  years_experience: number;
  created_at: string;
  updated_at: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year: number | null;
  is_ongoing: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileCompletion {
  percent: number;
  total_sections: number;
  completed_sections: number;
  sections: {
    full_name: boolean;
    headline_or_bio: boolean;
    career: boolean;
    has_cv: boolean;
    education: boolean;
    skills: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly api = inject(ApiService);

  getMyProfile(): Observable<CandidateProfile> {
    return this.api.get<CandidateProfile>('/profile/me/');
  }

  updateMyProfile(payload: Partial<CandidateProfile>): Observable<CandidateProfile> {
    return this.api.patch<CandidateProfile>('/profile/me/', payload);
  }

  getCompletion(): Observable<ProfileCompletion> {
    return this.api.get<ProfileCompletion>('/profile/me/completion/');
  }

  listEducation(): Observable<EducationItem[]> {
    return this.api.get<EducationItem[]>('/profile/me/education/');
  }

  addEducation(payload: Omit<EducationItem, 'id' | 'created_at' | 'updated_at'>): Observable<EducationItem> {
    return this.api.post<EducationItem>('/profile/me/education/', payload);
  }

  removeEducation(id: string): Observable<void> {
    return this.api.delete(`/profile/me/education/${id}/`);
  }

  listSkills(): Observable<SkillItem[]> {
    return this.api.get<SkillItem[]>('/profile/me/skills/');
  }

  addSkill(payload: { name: string; level: number; years_experience: number }): Observable<SkillItem> {
    return this.api.post<SkillItem>('/profile/me/skills/', payload);
  }

  removeSkill(id: string): Observable<void> {
    return this.api.delete(`/profile/me/skills/${id}/`);
  }

  listDocuments(): Observable<DocumentItem[]> {
    return this.api.get<DocumentItem[]>('/profile/me/documents/');
  }

  uploadDocument(file: File, kind = 'cv'): Observable<HttpEvent<DocumentItem> | DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return this.api.post<DocumentItem>('/profile/me/documents/', form, { isMultipart: true });
  }

  deleteDocument(id: string): Observable<void> {
    return this.api.delete(`/profile/me/documents/${id}/`);
  }
}
