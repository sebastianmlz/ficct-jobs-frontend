import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { ApiService } from "./api.service";

export interface RankedCandidate {
  profile_id: string;
  candidate_email: string;
  candidate_name: string;
  score: number | null;
  document_id: string;
  snippet: string;
}

export interface RankingResult {
  vacancy_id: string;
  ranked: RankedCandidate[];
  total: number;
}

@Injectable({ providedIn: "root" })
export class RankingService {
  private readonly api = inject(ApiService);

  ranking(vacancyId: string, topK = 20): Observable<RankingResult> {
    return this.api.post<RankingResult>(`/intelligence/ranking/${vacancyId}/`, {
      top_k: topK,
    });
  }
}
