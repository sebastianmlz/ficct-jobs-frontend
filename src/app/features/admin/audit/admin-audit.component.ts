import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AdminService, AuditEntry } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [DatePipe, JsonPipe, ReactiveFormsModule, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-audit.component.html',
})
export class AdminAuditComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly filters = new FormGroup({
    entity_type: new FormControl('', { nonNullable: true }),
    action: new FormControl('', { nonNullable: true }),
    limit: new FormControl<number>(100, { nonNullable: true }),
  });

  private readonly entriesSignal = signal<AuditEntry[]>([]);
  private readonly loadingSignal = signal(true);
  protected readonly entries = this.entriesSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected refresh(): void {
    this.loadingSignal.set(true);
    const value = this.filters.getRawValue();
    this.admin
      .audit({
        entity_type: value.entity_type || undefined,
        action: value.action || undefined,
        limit: value.limit || 100,
      })
      .subscribe({
        next: (rows) => {
          this.entriesSignal.set(rows);
          this.loadingSignal.set(false);
        },
        error: () => {
          this.loadingSignal.set(false);
          this.toast.danger('No se pudo cargar la bitácora de auditoría');
        },
      });
  }

  protected hasPayload(e: AuditEntry): boolean {
    return e.payload !== null && typeof e.payload === 'object' && Object.keys(e.payload).length > 0;
  }
}
