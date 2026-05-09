import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { stageLabel } from '../../../core/models/labels';
import {
  AdminService,
  EmployabilityStats,
  MicroserviceHealth,
  SkillsDemandResponse,
  TokenUsageReport,
} from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface MetricKey {
  key: keyof EmployabilityStats;
  label: string;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly stageLabel = stageLabel;
  protected readonly metrics: MetricKey[] = [
    { key: 'active_vacancies', label: 'Vacantes activas' },
    { key: 'applications_total', label: 'Postulaciones totales' },
    { key: 'candidates_total', label: 'Candidatos' },
    { key: 'candidates_validated', label: 'Candidatos validados' },
    { key: 'companies_total', label: 'Empresas' },
  ];

  private readonly statsSignal = signal<EmployabilityStats | null>(null);
  private readonly healthSignal = signal<MicroserviceHealth | null>(null);
  private readonly tokensSignal = signal<TokenUsageReport | null>(null);
  private readonly skillsSignal = signal<SkillsDemandResponse | null>(null);
  private readonly skillsBusySignal = signal(false);

  protected readonly health = this.healthSignal.asReadonly();
  protected readonly tokens = this.tokensSignal.asReadonly();
  protected readonly skills = this.skillsSignal.asReadonly();
  protected readonly skillsBusy = this.skillsBusySignal.asReadonly();
  protected readonly stages = computed(() => {
    const s = this.statsSignal();
    if (!s?.applications_by_stage) {
      return [];
    }
    return Object.entries(s.applications_by_stage).map(([stage, count]) => ({ stage, count }));
  });
  protected readonly tokenOperations = computed(() => {
    const t = this.tokensSignal();
    if (!t) {
      return [];
    }
    return Object.entries(t.by_operation).map(([operation, row]) => ({ operation, ...row }));
  });

  protected readonly healthEntries = computed(() => {
    const h = this.healthSignal();
    if (!h?.body) {
      return [];
    }
    return Object.entries(h.body).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  });

  ngOnInit(): void {
    this.admin.stats().subscribe({
      next: (s) => this.statsSignal.set(s),
      error: () => this.toast.danger('No se pudieron cargar las métricas'),
    });
    this.loadHealth();
    this.admin.microserviceTokens(30).subscribe({
      next: (t) => this.tokensSignal.set(t),
      error: () => undefined,
    });
  }

  protected csvUrl(): string {
    return this.admin.csvExportUrl();
  }

  protected value(key: keyof EmployabilityStats): string {
    const s = this.statsSignal();
    if (!s) {
      return '—';
    }
    const v = s[key];
    return typeof v === 'number' ? String(v) : '—';
  }

  protected loadHealth(): void {
    this.admin.microserviceHealth().subscribe({
      next: (h) => this.healthSignal.set(h),
      error: () => this.healthSignal.set({ reachable: false, error: 'Health probe failed.' }),
    });
  }

  protected loadSkills(): void {
    if (this.skillsBusySignal()) {
      return;
    }
    this.skillsBusySignal.set(true);
    this.admin.skillsDemand().subscribe({
      next: (s) => {
        this.skillsSignal.set(s);
        this.skillsBusySignal.set(false);
      },
      error: (err) => {
        this.skillsBusySignal.set(false);
        this.skillsSignal.set({
          available: false,
          message: err?.error?.message ?? 'El motor de inteligencia no está disponible temporalmente.',
        });
      },
    });
  }
}
