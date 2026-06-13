import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";

import {
  ApiErrorEnvelope,
  GapAnalysisResult,
  Vacancy,
} from "../../../core/models";
import { vacancyStatusLabel } from "../../../core/models/labels";
import { AuthService } from "../../../core/services/auth.service";
import { IntelligenceService } from "../../../core/services/intelligence.service";
import { JobsService } from "../../../core/services/jobs.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-vacancy-detail",
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./vacancy-detail.component.html",
})
export class VacancyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobs = inject(JobsService);
  private readonly intelligence = inject(IntelligenceService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly vacancySignal = signal<Vacancy | null>(null);
  private readonly busySignal = signal(false);
  private readonly appliedSignal = signal(false);
  private readonly applyErrorSignal = signal<string | null>(null);
  private readonly gapSignal = signal<GapAnalysisResult | null>(null);
  private readonly gapBusySignal = signal(false);
  private readonly gapErrorSignal = signal<string | null>(null);

  protected readonly vacancy = this.vacancySignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly applied = this.appliedSignal.asReadonly();
  protected readonly applyError = this.applyErrorSignal.asReadonly();
  protected readonly gap = this.gapSignal.asReadonly();
  protected readonly gapBusy = this.gapBusySignal.asReadonly();
  protected readonly gapError = this.gapErrorSignal.asReadonly();
  protected readonly isCandidate = computed(
    () => this.auth.role() === "candidate",
  );
  protected readonly coverLetter = new FormControl<string>("", {
    nonNullable: true,
  });

  protected vacancyStatus(s: string): string {
    return vacancyStatusLabel(s);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) return;
    this.jobs.getVacancy(id).subscribe({
      next: (v) => this.vacancySignal.set(v),
      error: () => this.vacancySignal.set(null),
    });
  }

  protected apply(): void {
    const v = this.vacancySignal();
    if (!v || this.busySignal()) return;
    this.busySignal.set(true);
    this.applyErrorSignal.set(null);
    this.jobs.apply(v.id, this.coverLetter.value).subscribe({
      next: () => {
        this.appliedSignal.set(true);
        this.busySignal.set(false);
      },
      error: (err) => {
        const envelope = err?.error as ApiErrorEnvelope | undefined;
        this.applyErrorSignal.set(
          envelope?.error?.message ??
            "No se pudo enviar la postulación. Intente de nuevo.",
        );
        this.busySignal.set(false);
      },
    });
  }

  protected runGap(): void {
    const v = this.vacancySignal();
    if (!v || this.gapBusySignal()) return;
    this.gapBusySignal.set(true);
    this.gapErrorSignal.set(null);
    this.intelligence.gap(v.id).subscribe({
      next: (result) => {
        this.gapSignal.set(result);
        this.gapBusySignal.set(false);
      },
      error: (err) => {
        // Previously the error path only cleared the spinner, so a 500 / RAG
        // outage / missing-CV looked like a dead "Analizar" button. Surface a
        // message inline and via toast instead.
        this.gapBusySignal.set(false);
        const envelope = err?.error as ApiErrorEnvelope | undefined;
        const message =
          envelope?.error?.message ??
          "No se pudo generar el análisis de compatibilidad. Intente de nuevo.";
        this.gapErrorSignal.set(message);
        this.toast.danger("Análisis no disponible", message);
      },
    });
  }
}
