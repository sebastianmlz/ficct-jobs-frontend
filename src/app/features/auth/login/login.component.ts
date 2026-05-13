import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import { ApiErrorEnvelope } from "../../../core/models";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = computed(() => {
    if (this.errorSignal()) return this.errorSignal();
    if (this.route.snapshot.queryParamMap.get("reason") === "session_expired") {
      return "Su sesión ha expirado. Por favor inicie sesión nuevamente.";
    }
    return null;
  });

  protected readonly sideFeatures = [
    { text: "Búsqueda inteligente de vacantes por habilidades" },
    { text: "Análisis de compatibilidad de perfil" },
    { text: "Seguimiento completo del proceso de selección" },
    { text: "Plataforma auditada e institucional" },
  ];

  protected submit(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.busySignal.set(true);
    this.errorSignal.set(null);
    this.auth.login(email, password).subscribe({
      next: () => {
        this.busySignal.set(false);
        const redirect =
          this.route.snapshot.queryParamMap.get("redirect") ?? "/dashboard";
        void this.router.navigateByUrl(redirect);
      },
      error: (err) => {
        this.busySignal.set(false);
        const envelope = err?.error as ApiErrorEnvelope | undefined;
        this.errorSignal.set(
          envelope?.error?.message ??
            "Inicio de sesión fallido. Verifique sus credenciales.",
        );
      },
    });
  }
}
