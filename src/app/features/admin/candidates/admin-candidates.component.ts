import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService, CandidateRoster } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const STATUS_CLASS: Record<string, string> = {
  unvalidated: 'badge-neutral',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

const STATUS_LABEL: Record<string, string> = {
  unvalidated: 'Sin validar',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

@Component({
  selector: 'app-admin-candidates',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-candidates.component.html',
})
export class AdminCandidatesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  private readonly itemsSignal = signal<CandidateRoster[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly busyIdSignal = signal<string | null>(null);
  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();
  protected readonly busyId = this.busyIdSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected badgeClass(status: string): string {
    return STATUS_CLASS[status] ?? 'badge-neutral';
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s] ?? s;
  }

  protected approve(c: CandidateRoster): void {
    this.act(c.profile_id, 'approved', '');
  }

  protected reject(c: CandidateRoster): void {
    const reason = prompt('Motivo del rechazo (opcional):') ?? '';
    this.act(c.profile_id, 'rejected', reason);
  }

  private act(id: string, action: 'approved' | 'rejected', reason: string): void {
    this.busyIdSignal.set(id);
    this.admin.validateCandidate(id, action, reason).subscribe({
      next: () => {
        this.busyIdSignal.set(null);
        this.toast.success(action === 'approved' ? 'Candidato aprobado' : 'Candidato rechazado');
        this.refresh();
      },
      error: (err) => {
        this.busyIdSignal.set(null);
        this.toast.danger('No se pudo actualizar el candidato', err?.error?.error?.message ?? '');
      },
    });
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.admin.candidates().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }
}
