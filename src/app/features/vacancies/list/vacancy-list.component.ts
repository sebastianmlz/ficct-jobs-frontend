import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SearchHit, Vacancy } from '../../../core/models';
import { IntelligenceService } from '../../../core/services/intelligence.service';
import { JobsService } from '../../../core/services/jobs.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-vacancy-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vacancy-list.component.html',
})
export class VacancyListComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly intelligence = inject(IntelligenceService);

  protected readonly query = new FormControl<string>('', { nonNullable: true });
  private readonly vacanciesSignal = signal<Vacancy[]>([]);
  private readonly hitsSignal = signal<SearchHit[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly searchingSignal = signal(false);
  private readonly semanticActiveSignal = signal(false);

  protected readonly visibleVacancies = this.vacanciesSignal.asReadonly();
  protected readonly visibleHits = this.hitsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();
  protected readonly searching = this.searchingSignal.asReadonly();
  protected readonly semanticActive = this.semanticActiveSignal.asReadonly();

  protected readonly cards = computed(() => {
    if (this.semanticActiveSignal()) {
      return this.hitsSignal()
        .filter((h) => h.vacancy)
        .map((h) => ({
          id: h.vacancy_id,
          title: h.vacancy?.title ?? '',
          companyName: h.vacancy?.company_name ?? '',
          modality: h.vacancy?.modality ?? '',
          location: h.vacancy?.location ?? '',
          snippet: h.snippet,
          score: h.score,
        }));
    }
    return this.vacanciesSignal().map((v) => ({
      id: v.id,
      title: v.title,
      companyName: v.company_name,
      modality: v.modality,
      location: v.location,
      snippet: '',
      score: null as number | null,
    }));
  });

  ngOnInit(): void {
    this.jobs.listVacancies().subscribe({
      next: (items) => { this.vacanciesSignal.set(items); this.loadingSignal.set(false); },
      error: () => this.loadingSignal.set(false),
    });
  }

  protected runSearch(): void {
    const q = this.query.value.trim();
    if (q.length < 2 || this.searchingSignal()) return;
    this.searchingSignal.set(true);
    this.semanticActiveSignal.set(true);
    this.intelligence.search(q, 12).subscribe({
      next: (result) => { this.hitsSignal.set(result.results ?? []); this.searchingSignal.set(false); },
      error: () => this.searchingSignal.set(false),
    });
  }

  protected reset(): void {
    this.query.setValue('');
    this.semanticActiveSignal.set(false);
    this.hitsSignal.set([]);
  }

  protected scoreLabel(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
}
