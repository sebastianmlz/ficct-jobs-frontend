import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";

import { Role } from "../../../core/models";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";

interface WizardStep {
  title: string;
  body: string;
}

const STEPS: Record<Role, WizardStep[]> = {
  candidate: [
    {
      title: "Bienvenido a FICCT Jobs",
      body: "Este es el canal institucional para estudiantes y egresados de la FICCT-UAGRM.",
    },
    {
      title: "Postúlese a vacantes relevantes",
      body: "Use la barra de búsqueda para encontrar vacantes. Los resultados se ordenan según la relevancia para su perfil.",
    },
    {
      title: "Haga seguimiento a sus postulaciones",
      body: "Cada postulación tiene una línea de tiempo. Recibirá notificaciones en la aplicación y por correo.",
    },
  ],
  company_rep: [
    {
      title: "Bienvenido, representante",
      body: "Publique, edite y cierre las vacantes de su empresa desde este panel.",
    },
    {
      title: "Flujo de selección",
      body: "Mueva las postulaciones entre etapas, programe entrevistas y los candidatos recibirán notificaciones automáticas.",
    },
    {
      title: "Análisis y exportaciones",
      body: "Consulte los postulantes, ejecute el análisis de compatibilidad y exporte los resultados en CSV.",
    },
  ],
  admin_ficct: [
    {
      title: "Bienvenido, administrador FICCT",
      body: "Valide candidatos y empresas, apruebe vacantes y consulte la bitácora de auditoría.",
    },
    {
      title: "Visibilidad operativa",
      body: "Métricas en tiempo real y estado del sistema de la plataforma.",
    },
    {
      title: "Información estratégica",
      body: "Demanda de habilidades del mercado y procesos de selección cerrados con su historial completo.",
    },
  ],
};

import { ModalHostDirective } from "../../directives/modal-host.directive";

@Component({
  selector: "app-onboarding-wizard",
  standalone: true,
  imports: [ModalHostDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./onboarding-wizard.component.html",
})
export class OnboardingWizardComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly stepIndexSignal = signal(0);
  private readonly busySignal = signal(false);

  protected readonly stepIndex = this.stepIndexSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly steps = computed<WizardStep[]>(() => {
    const role = this.auth.role();
    return role ? STEPS[role] : STEPS.candidate;
  });
  protected readonly totalSteps = computed(() => this.steps().length);
  protected readonly currentStep = computed(
    () => this.steps()[this.stepIndex()],
  );

  protected readonly open = computed(() => {
    const u = this.auth.user();
    if (!u) return false;
    return !u.onboarding_completed_at;
  });

  protected next(): void {
    this.stepIndexSignal.update((i) => Math.min(i + 1, this.totalSteps() - 1));
  }

  protected skip(): void {
    this.finish();
  }

  protected finish(): void {
    if (this.busySignal()) {
      return;
    }
    this.busySignal.set(true);
    this.auth.completeOnboarding().subscribe({
      next: () => {
        this.busySignal.set(false);
        this.stepIndexSignal.set(0);
      },
      error: () => {
        this.busySignal.set(false);
        this.toast.warning(
          "No se pudo guardar el progreso",
          "Puede continuar usando la plataforma.",
        );
      },
    });
  }
}
