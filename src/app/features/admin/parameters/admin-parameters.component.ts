import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService, SystemParameter } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-parameters',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-parameters.component.html',
})
export class AdminParametersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly form = new FormGroup({
    key: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(1)] }),
    value: new FormControl('', { nonNullable: true }),
    value_type: new FormControl<'string' | 'int' | 'float' | 'bool' | 'json'>('string', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly itemsSignal = signal<SystemParameter[]>([]);
  private readonly busySignal = signal(false);
  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected loadIntoForm(p: SystemParameter): void {
    this.form.setValue({
      key: p.key,
      value: p.value,
      value_type: p.value_type,
      description: p.description,
    });
  }

  protected save(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    const value = this.form.getRawValue();
    this.admin
      .setParameter(value.key, {
        value: value.value,
        value_type: value.value_type,
        description: value.description,
      })
      .subscribe({
        next: () => {
          this.busySignal.set(false);
          this.toast.success('Parámetro guardado');
          this.refresh();
        },
        error: (err) => {
          this.busySignal.set(false);
          this.toast.danger('No se pudo guardar', err?.error?.error?.message ?? '');
        },
      });
  }

  private refresh(): void {
    this.admin.parameters().subscribe({
      next: (items) => this.itemsSignal.set(items),
      error: () => this.toast.danger('No se pudieron cargar los parámetros'),
    });
  }
}
