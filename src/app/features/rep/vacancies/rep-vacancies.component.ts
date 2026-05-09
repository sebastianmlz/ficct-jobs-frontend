import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Vacancy } from '../../../core/models';
import { vacancyStatusLabel } from '../../../core/models/labels';
import { JobsService } from '../../../core/services/jobs.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-neutral',
  pending_review: 'badge-warning',
  active: 'badge-success',
  rejected: 'badge-danger',
  closed: 'badge-neutral',
};

@Component({
  selector: 'app-rep-vacancies',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rep-vacancies.component.html',
})
export class RepVacanciesComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly toast = inject(ToastService);

  private readonly vacanciesSignal = signal<Vacancy[]>([]);
  private readonly loadingSignal = signal(true);
  protected readonly vacancies = this.vacanciesSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected badgeClass(status: string): string {
    return STATUS_CLASS[status] ?? 'badge-neutral';
  }

  protected statusLabel(s: string): string {
    return vacancyStatusLabel(s);
  }

  protected activate(v: Vacancy): void {
    this.jobs.transitionVacancy(v.id, 'activate').subscribe({
      next: () => {
        this.toast.success('Vacante publicada');
        this.refresh();
      },
      error: (err) => this.toast.danger('No se pudo publicar la vacante', err?.error?.error?.message ?? ''),
    });
  }

  protected close(v: Vacancy): void {
    if (!confirm('¿Cerrar esta vacante? Esta acción es irreversible.')) {
      return;
    }
    this.jobs.transitionVacancy(v.id, 'close').subscribe({
      next: () => {
        this.toast.success('Vacante cerrada');
        this.refresh();
      },
      error: (err) => this.toast.danger('No se pudo cerrar la vacante', err?.error?.error?.message ?? ''),
    });
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.jobs.listVacancies().subscribe({
      next: (items) => {
        this.vacanciesSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }
}
