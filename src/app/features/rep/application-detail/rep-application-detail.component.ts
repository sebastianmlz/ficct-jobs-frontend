import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApplicationItem, StageCode } from '../../../core/models';
import { interviewStatusLabel, stageLabel } from '../../../core/models/labels';
import { Interview, InterviewsService } from '../../../core/services/interviews.service';
import { JobsService } from '../../../core/services/jobs.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';

const REP_STAGES: StageCode[] = ['preselected', 'interview_done', 'offer', 'hired', 'rejected'];

@Component({
  selector: 'app-rep-application-detail',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    StageBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rep-application-detail.component.html',
})
export class RepApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobs = inject(JobsService);
  private readonly interviewService = inject(InterviewsService);
  private readonly toast = inject(ToastService);

  protected readonly stages = REP_STAGES;
  protected readonly stageLabel = stageLabel;
  protected readonly interviewStatusLabel = interviewStatusLabel;
  protected readonly interviewForm = new FormGroup({
    scheduled_at: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modality: new FormControl<'onsite' | 'remote' | 'phone'>('remote', { nonNullable: true }),
    duration_minutes: new FormControl<number>(45, { nonNullable: true, validators: [Validators.min(10), Validators.max(480)] }),
    location_or_link: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  private readonly applicationSignal = signal<ApplicationItem | null>(null);
  private readonly interviewsSignal = signal<Interview[]>([]);
  private readonly busySignal = signal(false);
  protected readonly application = this.applicationSignal.asReadonly();
  protected readonly interviews = this.interviewsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();

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
        this.toast.success('Etapa actualizada');
      },
      error: (err) => {
        this.busySignal.set(false);
        this.toast.danger('No se pudo cambiar la etapa', err?.error?.error?.message ?? '');
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
          this.toast.success('Entrevista agendada');
          this.interviewForm.reset({ duration_minutes: 45, modality: 'remote' });
          this.refresh();
        },
        error: (err) => {
          this.busySignal.set(false);
          this.toast.danger('No se pudo agendar la entrevista', err?.error?.error?.message ?? '');
        },
      });
  }

  protected completeInterview(id: string): void {
    this.interviewService.complete(id).subscribe({
      next: () => {
        this.toast.success('Entrevista marcada como realizada');
        this.refresh();
      },
      error: (err) => this.toast.danger('No se pudo marcar la entrevista', err?.error?.error?.message ?? ''),
    });
  }

  protected cancelInterview(id: string): void {
    const reason = prompt('¿Motivo de la cancelación? (opcional)') ?? '';
    this.interviewService.cancel(id, reason).subscribe({
      next: () => {
        this.toast.warning('Entrevista cancelada');
        this.refresh();
      },
      error: (err) => this.toast.danger('No se pudo cancelar la entrevista', err?.error?.error?.message ?? ''),
    });
  }

  private applicationId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  private refresh(): void {
    const id = this.applicationId();
    if (!id) {
      return;
    }
    this.jobs.getApplication(id).subscribe({
      next: (a) => this.applicationSignal.set(a),
      error: () => this.toast.danger('Postulación no encontrada'),
    });
    this.interviewService.list(id).subscribe({
      next: (items) => this.interviewsSignal.set(items),
      error: () => undefined,
    });
  }
}
