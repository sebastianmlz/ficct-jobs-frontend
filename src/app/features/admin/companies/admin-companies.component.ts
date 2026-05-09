import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CompanySummary, RecruitmentService } from '../../../core/services/recruitment.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const STATUS_CLASS: Record<string, string> = {
  active: 'badge-success',
  pending_validation: 'badge-warning',
  suspended: 'badge-danger',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  pending_validation: 'Pendiente',
  suspended: 'Suspendida',
};

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-companies.component.html',
})
export class AdminCompaniesComponent implements OnInit {
  private readonly service = inject(RecruitmentService);
  private readonly toast = inject(ToastService);

  protected readonly form = new FormGroup({
    legal_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sector: new FormControl('', { nonNullable: true }),
    contact_email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    rep_email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    rep_full_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
  });

  private readonly itemsSignal = signal<CompanySummary[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly busySignal = signal(false);
  private readonly busyIdSignal = signal<string | null>(null);
  private readonly otpSignal = signal<string | null>(null);

  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly busyId = this.busyIdSignal.asReadonly();
  protected readonly lastOtp = this.otpSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected badgeClass(status: string): string {
    return STATUS_CLASS[status] ?? 'badge-neutral';
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s] ?? s;
  }

  protected register(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    this.service.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.busySignal.set(false);
        this.otpSignal.set(response.one_time_password);
        this.toast.success('Empresa registrada', 'Se aprovisionó una cuenta para el representante.');
        this.form.reset({ legal_name: '', sector: '', contact_email: '', rep_email: '', rep_full_name: '' });
        this.refresh();
      },
      error: (err) => {
        this.busySignal.set(false);
        this.toast.danger('No se pudo registrar la empresa', err?.error?.error?.message ?? '');
      },
    });
  }

  protected setStatus(c: CompanySummary, action: 'suspend' | 'reactivate'): void {
    const reason = action === 'suspend' ? prompt('Motivo de la suspensión (opcional):') ?? '' : '';
    this.busyIdSignal.set(c.id);
    this.service.setStatus(c.id, action, reason).subscribe({
      next: () => {
        this.busyIdSignal.set(null);
        this.toast.success(action === 'suspend' ? 'Empresa suspendida' : 'Empresa reactivada');
        this.refresh();
      },
      error: (err) => {
        this.busyIdSignal.set(null);
        this.toast.danger('No se pudo cambiar el estado', err?.error?.error?.message ?? '');
      },
    });
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.service.list().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }
}
