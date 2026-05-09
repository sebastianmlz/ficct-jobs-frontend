import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;
  protected readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });
  private readonly confirmingSignal = signal(false);
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  protected readonly confirming = this.confirmingSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = this.errorSignal.asReadonly();

  protected statusClass(status?: string): string {
    if (status === 'active') return 'badge-success';
    if (status === 'suspended') return 'badge-danger';
    return 'badge-warning';
  }

  protected askConfirm(): void {
    this.confirmingSignal.set(true);
  }

  protected cancel(): void {
    this.confirmingSignal.set(false);
    this.passwordControl.reset();
    this.errorSignal.set(null);
  }

  protected confirmDelete(): void {
    const password = this.passwordControl.value;
    if (!password) { this.passwordControl.markAsTouched(); return; }
    this.busySignal.set(true);
    this.errorSignal.set(null);
    this.auth.deleteAccount(password).subscribe({
      next: () => {
        this.busySignal.set(false);
        this.toast.success('Cuenta eliminada', 'Cerrando sesión…');
        this.auth.logout();
      },
      error: (err) => {
        this.busySignal.set(false);
        const code = err?.error?.error?.code;
        if (code === 'wrong_password') this.errorSignal.set('Contraseña incorrecta.');
        else if (code === 'has_active_vacancies') this.errorSignal.set('Cierre sus vacantes activas antes de eliminar la cuenta.');
        else this.errorSignal.set(err?.error?.error?.message ?? 'No se pudo eliminar la cuenta.');
      },
    });
  }
}
