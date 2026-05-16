import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";

import { ApplicationItem, StageCode } from "../../../core/models";
import { interviewStatusLabel, stageLabel } from "../../../core/models/labels";
import {
  Interview,
  InterviewsService,
} from "../../../core/services/interviews.service";
import { JobsService } from "../../../core/services/jobs.service";
import { ToastService } from "../../../core/services/toast.service";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { StageBadgeComponent } from "../../../shared/components/stage-badge/stage-badge.component";
import { ModalHostDirective } from "../../../shared/directives/modal-host.directive";

import {
  AffinityDetail,
  IntelligenceService,
} from "../../../core/services/intelligence.service";

const REP_STAGES: StageCode[] = [
  "preselected",
  "interview_done",
  "offer",
  "hired",
  "rejected",
];

@Component({
  selector: "app-rep-application-detail",
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    StageBadgeComponent,
    ModalHostDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./rep-application-detail.component.html",
})
export class RepApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobs = inject(JobsService);
  private readonly interviewService = inject(InterviewsService);
  private readonly intelligence = inject(IntelligenceService);
  private readonly toast = inject(ToastService);

  protected readonly stages = REP_STAGES;
  protected readonly stageLabel = stageLabel;
  protected readonly interviewStatusLabel = interviewStatusLabel;
  protected readonly interviewForm = new FormGroup({
    scheduled_at: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    modality: new FormControl<"onsite" | "remote" | "phone">("remote", {
      nonNullable: true,
    }),
    duration_minutes: new FormControl<number>(45, {
      nonNullable: true,
      validators: [Validators.min(10), Validators.max(480)],
    }),
    location_or_link: new FormControl("", { nonNullable: true }),
    notes: new FormControl("", { nonNullable: true }),
  });
  protected readonly notifyForm = new FormGroup({
    kind: new FormControl<"info" | "success" | "warning">("info", {
      nonNullable: true,
    }),
    title: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    body: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(4000)],
    }),
  });

  private readonly applicationSignal = signal<ApplicationItem | null>(null);
  private readonly interviewsSignal = signal<Interview[]>([]);
  private readonly busySignal = signal(false);
  private readonly notifyOpenSignal = signal(false);
  private readonly affinityOpenSignal = signal(false);
  private readonly affinitySignal = signal<AffinityDetail | null>(null);
  private readonly affinityBusySignal = signal(false);
  private readonly affinityErrorSignal = signal<string | null>(null);
  protected readonly application = this.applicationSignal.asReadonly();
  protected readonly interviews = this.interviewsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  /** Trimmed, whitespace-aware view of the cover letter. Returns null
   * when the field is missing, null, an empty string, or whitespace-only
   * — so the template can branch on a single condition without
   * accidentally rendering "    " as if it were a real letter. */
  protected readonly coverLetterText = computed(() => {
    const raw = this.applicationSignal()?.cover_letter ?? "";
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 ? trimmed : null;
  });
  protected readonly notifyOpen = this.notifyOpenSignal.asReadonly();
  protected readonly affinityOpen = this.affinityOpenSignal.asReadonly();
  protected readonly affinity = this.affinitySignal.asReadonly();
  protected readonly affinityBusy = this.affinityBusySignal.asReadonly();
  protected readonly affinityError = this.affinityErrorSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected moveTo(stage: StageCode): void {
    const id = this.applicationId();
    if (!id || this.busySignal()) {
      return;
    }
    this.busySignal.set(true);
    this.jobs.transitionApplication(id, stage).subscribe({
      next: (a) => {
        this.applicationSignal.set(a);
        this.busySignal.set(false);
        this.toast.success("Etapa actualizada");
      },
      error: (err) => {
        this.busySignal.set(false);
        this.toast.danger(
          "No se pudo cambiar la etapa",
          err?.error?.error?.message ?? "",
        );
      },
    });
  }

  protected schedule(): void {
    const id = this.applicationId();
    if (!id || this.interviewForm.invalid || this.busySignal()) {
      return;
    }
    this.busySignal.set(true);
    const value = this.interviewForm.getRawValue();
    const isoLocal = new Date(value.scheduled_at).toISOString();
    this.interviewService
      .schedule(id, {
        scheduled_at: isoLocal,
        modality: value.modality,
        duration_minutes: value.duration_minutes,
        location_or_link: value.location_or_link,
        notes: value.notes,
      })
      .subscribe({
        next: () => {
          this.busySignal.set(false);
          this.toast.success("Entrevista agendada");
          this.interviewForm.reset({
            duration_minutes: 45,
            modality: "remote",
          });
          this.refresh();
        },
        error: (err) => {
          this.busySignal.set(false);
          this.toast.danger(
            "No se pudo agendar la entrevista",
            err?.error?.error?.message ?? "",
          );
        },
      });
  }

  protected completeInterview(id: string): void {
    this.interviewService.complete(id).subscribe({
      next: () => {
        this.toast.success("Entrevista marcada como realizada");
        this.refresh();
      },
      error: (err) =>
        this.toast.danger(
          "No se pudo marcar la entrevista",
          err?.error?.error?.message ?? "",
        ),
    });
  }

  protected cancelInterview(id: string): void {
    const reason = prompt("¿Motivo de la cancelación? (opcional)") ?? "";
    this.interviewService.cancel(id, reason).subscribe({
      next: () => {
        this.toast.warning("Entrevista cancelada");
        this.refresh();
      },
      error: (err) =>
        this.toast.danger(
          "No se pudo cancelar la entrevista",
          err?.error?.error?.message ?? "",
        ),
    });
  }

  protected openNotifyModal(): void {
    this.notifyForm.reset({ kind: "info", title: "", body: "" });
    this.notifyOpenSignal.set(true);
  }

  protected closeNotifyModal(): void {
    this.notifyOpenSignal.set(false);
  }

  @HostListener("document:keydown.escape")
  protected onEscape(): void {
    if (this.notifyOpenSignal()) {
      this.notifyOpenSignal.set(false);
      return;
    }
    if (this.affinityOpenSignal()) {
      this.affinityOpenSignal.set(false);
    }
  }

  protected sendNotification(): void {
    const id = this.applicationId();
    if (!id || this.notifyForm.invalid || this.busySignal()) {
      this.notifyForm.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    this.jobs.notifyApplication(id, this.notifyForm.getRawValue()).subscribe({
      next: () => {
        this.busySignal.set(false);
        this.notifyOpenSignal.set(false);
        this.toast.success("Notificación enviada al candidato");
      },
      error: (err) => {
        this.busySignal.set(false);
        this.toast.danger(
          "No se pudo enviar la notificación",
          err?.error?.error?.message ?? "",
        );
      },
    });
  }

  protected openAffinityModal(): void {
    const id = this.applicationId();
    if (!id) return;
    this.affinityOpenSignal.set(true);
    this.affinitySignal.set(null);
    this.affinityErrorSignal.set(null);
    this.affinityBusySignal.set(true);
    this.intelligence.affinityDetail(id).subscribe({
      next: (detail) => {
        this.affinitySignal.set(detail);
        this.affinityBusySignal.set(false);
      },
      error: (err) => {
        this.affinityBusySignal.set(false);
        const msg =
          err?.error?.message ??
          err?.error?.error?.message ??
          "El análisis de afinidad no está disponible.";
        this.affinityErrorSignal.set(msg);
      },
    });
  }

  protected closeAffinityModal(): void {
    this.affinityOpenSignal.set(false);
  }

  protected coveragePercent(): number {
    const a = this.affinitySignal();
    return a ? Math.round(a.coverage * 100) : 0;
  }

  private applicationId(): string | null {
    return this.route.snapshot.paramMap.get("id");
  }

  private refresh(): void {
    const id = this.applicationId();
    if (!id) {
      return;
    }
    this.jobs.getApplication(id).subscribe({
      next: (a) => this.applicationSignal.set(a),
      error: () => this.toast.danger("Postulación no encontrada"),
    });
    this.interviewService.list(id).subscribe({
      next: (items) => this.interviewsSignal.set(items),
      error: () => undefined,
    });
  }
}
