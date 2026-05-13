import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";

import { ApplicationItem, NotificationItem, Vacancy } from "../../core/models";
import { vacancyStatusLabel } from "../../core/models/labels";
import { AuthService } from "../../core/services/auth.service";
import {
  IntelligenceService,
  RecommendedVacancy,
} from "../../core/services/intelligence.service";
import { JobsService } from "../../core/services/jobs.service";
import { NotificationsService } from "../../core/services/notifications.service";
import {
  ProfileCompletion,
  ProfilesService,
} from "../../core/services/profiles.service";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StageBadgeComponent } from "../../shared/components/stage-badge/stage-badge.component";
import { IconComponent } from "../../shared/components/icon/icon.component";

const SECTION_LABEL: Record<keyof ProfileCompletion["sections"], string> = {
  full_name: "Nombre completo",
  headline_or_bio: "Titular o biografía",
  career: "Carrera",
  has_cv: "CV cargado",
  education: "Formación",
  skills: "Habilidades (3 o más)",
};

const ROLE_LABEL = {
  candidate: "Candidato",
  company_rep: "Representante de empresa",
  admin_ficct: "Administrador FICCT",
} as const;

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    StageBadgeComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly jobs = inject(JobsService);
  private readonly notifs = inject(NotificationsService);
  private readonly profiles = inject(ProfilesService);
  private readonly intelligence = inject(IntelligenceService);
  protected readonly sectionLabel = SECTION_LABEL;

  protected readonly user = this.auth.user;
  protected readonly role = this.auth.role;

  protected readonly firstName = computed(() => {
    const name = this.auth.user()?.full_name ?? "";
    return name.split(" ")[0] ?? name;
  });

  protected readonly roleLabel = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABEL[r] : "";
  });

  private readonly applicationsSignal = signal<ApplicationItem[]>([]);
  private readonly vacanciesSignal = signal<Vacancy[]>([]);
  private readonly notificationsSignal = signal<NotificationItem[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly completionSignal = signal<ProfileCompletion | null>(null);
  private readonly recommendationsSignal = signal<RecommendedVacancy[]>([]);
  private readonly recommendationsBusySignal = signal(false);
  private readonly recommendationsAvailableSignal = signal(true);
  protected readonly applications = this.applicationsSignal.asReadonly();
  protected readonly vacancies = this.vacanciesSignal.asReadonly();
  protected readonly notifications = this.notificationsSignal.asReadonly();
  protected readonly loading = computed(() => this.loadingSignal());
  protected readonly completion = this.completionSignal.asReadonly();
  protected readonly recommendations = this.recommendationsSignal.asReadonly();
  protected readonly recommendationsBusy =
    this.recommendationsBusySignal.asReadonly();
  protected readonly recommendationsAvailable =
    this.recommendationsAvailableSignal.asReadonly();
  protected readonly missingSections = computed<
    Array<keyof ProfileCompletion["sections"]>
  >(() => {
    const c = this.completionSignal();
    if (!c) return [];
    return (
      Object.entries(c.sections) as Array<
        [keyof ProfileCompletion["sections"], boolean]
      >
    )
      .filter(([, ok]) => !ok)
      .map(([k]) => k);
  });

  protected readonly candidateActions = [
    {
      label: "Vacantes",
      path: "/vacancies",
      icon: "briefcase",
      iconBg: "bg-ficct-50",
      iconColor: "text-ficct-600",
    },
    {
      label: "Mis postulaciones",
      path: "/applications",
      icon: "clipboard-check",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Mi perfil",
      path: "/profile",
      icon: "user",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Asistente",
      path: "/chat",
      icon: "chat",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  protected readonly repActions = [
    {
      label: "Nueva vacante",
      path: "/rep/vacancies/new",
      icon: "plus",
      iconBg: "bg-ficct-50",
      iconColor: "text-ficct-600",
    },
    {
      label: "Mis vacantes",
      path: "/rep/vacancies",
      icon: "briefcase",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Asistente",
      path: "/chat",
      icon: "chat",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  protected readonly adminActions = [
    {
      label: "Resumen",
      description: "Métricas en tiempo real del canal",
      path: "/admin/overview",
      icon: "chart-bar",
      iconBg: "bg-ficct-50",
      iconColor: "text-ficct-600",
    },
    {
      label: "Candidatos",
      description: "Validar y gestionar cuentas",
      path: "/admin/candidates",
      icon: "users",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Cola de vacantes",
      description: "Aprobar publicaciones pendientes",
      path: "/admin/vacancies",
      icon: "clipboard-list",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Empresas",
      description: "Registrar y gestionar aliados",
      path: "/admin/companies",
      icon: "building",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Auditoría",
      description: "Bitácora inmutable de operaciones",
      path: "/admin/audit",
      icon: "document",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
    {
      label: "Parámetros",
      description: "Configuración del sistema",
      path: "/admin/parameters",
      icon: "cog",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  protected vacancyStatus(status: string): string {
    return vacancyStatusLabel(status);
  }

  protected vacancyStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: "badge-success",
      draft: "badge-neutral",
      pending_review: "badge-warning",
      rejected: "badge-danger",
      closed: "badge-neutral",
    };
    return map[status] ?? "badge-neutral";
  }

  protected notifDotClass(kind: string): string {
    const map: Record<string, string> = {
      info: "status-dot-info",
      success: "status-dot-success",
      warning: "status-dot-warning",
      error: "status-dot-danger",
    };
    return map[kind] ?? "status-dot-neutral";
  }

  ngOnInit(): void {
    const role = this.auth.role();
    if (role === "candidate") {
      this.jobs.myApplications().subscribe({
        next: (items) => {
          this.applicationsSignal.set(items);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
      this.profiles.getCompletion().subscribe({
        next: (c) => this.completionSignal.set(c),
        error: () => this.completionSignal.set(null),
      });
      this.recommendationsBusySignal.set(true);
      this.intelligence.recommendations(5).subscribe({
        next: (r) => {
          this.recommendationsSignal.set(r.items ?? []);
          this.recommendationsAvailableSignal.set(r.available);
          this.recommendationsBusySignal.set(false);
        },
        error: () => {
          this.recommendationsAvailableSignal.set(false);
          this.recommendationsBusySignal.set(false);
        },
      });
    } else if (role === "company_rep") {
      this.jobs.listVacancies().subscribe({
        next: (items) => {
          this.vacanciesSignal.set(items);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
    } else {
      this.loadingSignal.set(false);
    }
    this.notifs.refresh().subscribe({
      next: (items) => this.notificationsSignal.set(items),
      error: () => undefined,
    });
  }
}
