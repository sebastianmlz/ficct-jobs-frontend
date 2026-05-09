import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApplicationItem, Vacancy } from '../../../core/models';
import { JobsService } from '../../../core/services/jobs.service';
import { RankedCandidate, RankingService } from '../../../core/services/ranking.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';

@Component({
  selector: 'app-rep-applicants',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    StageBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rep-applicants.component.html',
})
export class RepApplicantsComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly ranker = inject(RankingService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  private readonly vacancySignal = signal<Vacancy | null>(null);
  private readonly applicantsSignal = signal<ApplicationItem[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly rankingSignal = signal<RankedCandidate[]>([]);
  private readonly rankingBusySignal = signal(false);

  protected readonly vacancy = this.vacancySignal.asReadonly();
  protected readonly applicants = this.applicantsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();
  protected readonly ranking = this.rankingSignal.asReadonly();
  protected readonly rankingBusy = this.rankingBusySignal.asReadonly();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.jobs.getVacancy(id).subscribe({
      next: (v) => this.vacancySignal.set(v),
      error: () => this.toast.danger('Vacante no encontrada'),
    });
    this.jobs.vacancyApplications(id).subscribe({
      next: (items) => {
        this.applicantsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }

  protected csvUrl(): string {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.jobs.rankingCsvUrl(id) : '#';
  }

  protected loadRanking(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.rankingBusySignal()) {
      return;
    }
    this.rankingBusySignal.set(true);
    this.ranker.ranking(id, 20).subscribe({
      next: (r) => {
        this.rankingSignal.set(r.ranked ?? []);
        this.rankingBusySignal.set(false);
        if ((r.ranked ?? []).length === 0) {
          this.toast.info('Aún no hay coincidencias', 'Invite a los candidatos a subir su CV.');
        }
      },
      error: (err) => {
        this.rankingBusySignal.set(false);
        this.toast.danger('Análisis no disponible', err?.error?.error?.message ?? '');
      },
    });
  }
}
