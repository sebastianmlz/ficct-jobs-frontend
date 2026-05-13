import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { ApiService } from "./api.service";

export type InterviewModality = "onsite" | "remote" | "phone";
export type InterviewStatus = "scheduled" | "done" | "cancelled";

export interface Interview {
  id: string;
  application: string;
  scheduled_at: string;
  duration_minutes: number;
  modality: InterviewModality;
  location_or_link: string;
  notes: string;
  status: InterviewStatus;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInterviewPayload {
  scheduled_at: string;
  duration_minutes?: number;
  modality?: InterviewModality;
  location_or_link?: string;
  notes?: string;
}

@Injectable({ providedIn: "root" })
export class InterviewsService {
  private readonly api = inject(ApiService);

  list(applicationId: string): Observable<Interview[]> {
    return this.api.get<Interview[]>(
      `/jobs/applications/${applicationId}/interviews/`,
    );
  }

  schedule(
    applicationId: string,
    payload: ScheduleInterviewPayload,
  ): Observable<Interview> {
    return this.api.post<Interview>(
      `/jobs/applications/${applicationId}/interviews/`,
      payload,
    );
  }

  complete(interviewId: string, notes?: string): Observable<Interview> {
    return this.api.post<Interview>(`/jobs/interviews/${interviewId}/`, {
      action: "complete",
      notes: notes ?? "",
    });
  }

  cancel(interviewId: string, reason?: string): Observable<Interview> {
    return this.api.post<Interview>(`/jobs/interviews/${interviewId}/`, {
      action: "cancel",
      reason: reason ?? "",
    });
  }
}
