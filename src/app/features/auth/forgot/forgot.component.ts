import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot.component.html',
})
export class ForgotComponent {
  private readonly auth = inject(AuthService);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  private readonly busySignal = signal(false);
  private readonly sentSignal = signal(false);
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly sent = this.sentSignal.asReadonly();

  protected submit(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    this.auth.requestPasswordReset(this.form.controls.email.value).subscribe({
      next: () => {
        this.busySignal.set(false);
        this.sentSignal.set(true);
      },
      error: () => {
        this.busySignal.set(false);
        this.sentSignal.set(true);
      },
    });
  }
}
