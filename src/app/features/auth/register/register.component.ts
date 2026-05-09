import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { ApiErrorEnvelope } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    full_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    accepted_terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = this.errorSignal.asReadonly();

  protected submit(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.busySignal.set(true);
    this.errorSignal.set(null);
    this.auth
      .register({ ...value, consent_terms_version: environment.consentTermsVersion })
      .subscribe({
        next: () => {
          this.auth.login(value.email, value.password).subscribe({
            next: () => {
              this.busySignal.set(false);
              void this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.busySignal.set(false);
              void this.router.navigate(['/auth/login']);
            },
          });
        },
        error: (err) => {
          this.busySignal.set(false);
          const envelope = err?.error as ApiErrorEnvelope | undefined;
          this.errorSignal.set(envelope?.error?.message ?? 'El registro falló. Intente de nuevo.');
        },
      });
  }
}
