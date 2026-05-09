import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ChatResponse, GapAnalysisResult, SearchResult } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class IntelligenceService {
  private readonly api = inject(ApiService);

  search(query: string, topK = 10): Observable<SearchResult> {
    return this.api.post<SearchResult>('/intelligence/search/', { query, top_k: topK });
  }

  gap(vacancyId: string): Observable<GapAnalysisResult> {
    return this.api.post<GapAnalysisResult>('/intelligence/gap-analysis/', { vacancy_id: vacancyId });
  }

  chat(prompt: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>('/intelligence/chat/', { prompt });
  }

  ranking(vacancyId: string, topK = 20): Observable<unknown> {
    return this.api.post<unknown>(`/intelligence/ranking/${vacancyId}/`, { top_k: topK });
  }
}
