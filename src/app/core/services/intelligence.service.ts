import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { ChatResponse, GapAnalysisResult, SearchResult } from "../models";
import { ApiService } from "./api.service";

export interface RecommendedVacancy {
  vacancy_id: string;
  title: string;
  company_name: string;
  modality: string;
  location: string;
  score: number | null;
}

export interface RecommendationsResponse {
  items: RecommendedVacancy[];
  total: number;
  based_on_query: string;
  available: boolean;
}

export interface AffinityDetail {
  application_id: string;
  vacancy_id: string;
  candidate: { profile_id: string; email: string; name: string };
  matched_skills: string[];
  missing_skills: string[];
  coverage: number;
  narrative: string;
  mode: string;
  token_usage: Record<string, number>;
  available: boolean;
  message?: string;
}

@Injectable({ providedIn: "root" })
export class IntelligenceService {
  private readonly api = inject(ApiService);

  search(query: string, topK = 10): Observable<SearchResult> {
    return this.api.post<SearchResult>("/intelligence/search/", {
      query,
      top_k: topK,
    });
  }

  gap(vacancyId: string): Observable<GapAnalysisResult> {
    return this.api.post<GapAnalysisResult>("/intelligence/gap-analysis/", {
      vacancy_id: vacancyId,
    });
  }

  chat(prompt: string): Observable<ChatResponse> {
    return this.api.post<ChatResponse>("/intelligence/chat/", { prompt });
  }

  ranking(vacancyId: string, topK = 20): Observable<unknown> {
    return this.api.post<unknown>(`/intelligence/ranking/${vacancyId}/`, {
      top_k: topK,
    });
  }

  recommendations(topK = 5): Observable<RecommendationsResponse> {
    return this.api.get<RecommendationsResponse>(
      "/intelligence/recommendations/",
      { top_k: topK },
    );
  }

  affinityDetail(applicationId: string): Observable<AffinityDetail> {
    return this.api.get<AffinityDetail>(
      `/intelligence/affinity-detail/${applicationId}/`,
    );
  }
}
