import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiErrorEnvelope } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset.component.html',
})
export class ResetComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly token = this.route.snapshot.queryParamMap.get('token');
  protected readonly form = new FormGroup({
    new_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = this.errorSignal.asReadonly();

  protected submit(): void {
    if (!this.token || this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    this.auth.confirmPasswordReset(this.token, this.form.controls.new_password.value).subscribe({
      next: () => {
        this.busySignal.set(false);
        void this.router.navigate(['/auth/login'], { queryParams: { reset: '1' } });
      },
      error: (err) => {
        this.busySignal.set(false);
        const envelope = err?.error as ApiErrorEnvelope | undefined;
        this.errorSignal.set(envelope?.error?.message ?? 'No se pudo restablecer la contraseña.');
      },
    });
  }
}
