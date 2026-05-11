import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { stageLabel } from '../../../core/models/labels';
import {
  AdminService,
  EmployabilityFilters,
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
  imports: [PageHeaderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  protected readonly filtersForm = new FormGroup({
    since: new FormControl<string>('', { nonNullable: true }),
    until: new FormControl<string>('', { nonNullable: true }),
    stage: new FormControl<string>('', { nonNullable: true }),
  });
  private readonly downloadingSignal = signal<'pdf' | 'xlsx' | null>(null);
  protected readonly downloading = this.downloadingSignal.asReadonly();

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
    this.refreshStats();
    this.loadHealth();
    this.admin.microserviceTokens(30).subscribe({
      next: (t) => this.tokensSignal.set(t),
      error: () => undefined,
    });
  }

  protected currentFilters(): EmployabilityFilters {
    const v = this.filtersForm.getRawValue();
    return {
      since: v.since || undefined,
      until: v.until || undefined,
      stage: v.stage || undefined,
    };
  }

  protected refreshStats(): void {
    this.admin.stats(this.currentFilters()).subscribe({
      next: (s) => this.statsSignal.set(s),
      error: () => this.toast.danger('No se pudieron cargar las métricas'),
    });
  }

  protected resetFilters(): void {
    this.filtersForm.reset({ since: '', until: '', stage: '' });
    this.refreshStats();
  }

  protected csvUrl(): string {
    return this.admin.csvExportUrl(this.currentFilters());
  }

  protected downloadPdf(): void {
    if (this.downloadingSignal()) return;
    this.downloadingSignal.set('pdf');
    this.admin.downloadEmployabilityPdf(this.currentFilters()).subscribe({
      next: (blob) => {
        this.downloadingSignal.set(null);
        this.triggerDownload(blob, 'employability.pdf');
      },
      error: () => {
        this.downloadingSignal.set(null);
        this.toast.danger('No se pudo descargar el PDF');
      },
    });
  }

  protected downloadXlsx(): void {
    if (this.downloadingSignal()) return;
    this.downloadingSignal.set('xlsx');
    this.admin.downloadEmployabilityXlsx(this.currentFilters()).subscribe({
      next: (blob) => {
        this.downloadingSignal.set(null);
        this.triggerDownload(blob, 'employability.xlsx');
      },
      error: () => {
        this.downloadingSignal.set(null);
        this.toast.danger('No se pudo descargar el Excel');
      },
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
