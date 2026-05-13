import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { AuthService } from "../../core/services/auth.service";
import { OnboardingWizardComponent } from "../components/onboarding-wizard/onboarding-wizard.component";
import { IconComponent } from "../components/icon/icon.component";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    OnboardingWizardComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app-shell.component.html",
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;

  protected readonly userInitials = computed(() => {
    const name = this.auth.user()?.full_name ?? this.auth.user()?.email ?? "";
    return (
      name
        .split(/[\s@]/)
        .slice(0, 2)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase() || "?"
    );
  });

  protected readonly nav = computed<NavItem[]>(() => {
    const role = this.auth.role();
    if (role === "candidate") {
      return [
        { label: "Panel", path: "/dashboard", icon: "dashboard" },
        { label: "Vacantes", path: "/vacancies", icon: "briefcase" },
        {
          label: "Postulaciones",
          path: "/applications",
          icon: "clipboard-check",
        },
        { label: "Perfil", path: "/profile", icon: "user" },
        { label: "Asistente", path: "/chat", icon: "chat" },
      ];
    }
    if (role === "company_rep") {
      return [
        { label: "Panel", path: "/dashboard", icon: "dashboard" },
        { label: "Mis vacantes", path: "/rep/vacancies", icon: "briefcase" },
        {
          label: "Procesos cerrados",
          path: "/closed-history",
          icon: "archive",
        },
        { label: "Asistente", path: "/chat", icon: "chat" },
      ];
    }
    if (role === "admin_ficct") {
      return [
        { label: "Panel", path: "/dashboard", icon: "dashboard" },
        { label: "Resumen", path: "/admin/overview", icon: "chart-bar" },
        {
          label: "Revisión de candidatos",
          path: "/admin/candidates",
          icon: "users",
        },
        { label: "Empresas", path: "/admin/companies", icon: "building" },
        {
          label: "Cola de vacantes",
          path: "/admin/vacancies",
          icon: "clipboard-list",
        },
        {
          label: "Procesos cerrados",
          path: "/closed-history",
          icon: "archive",
        },
        { label: "Auditoría", path: "/admin/audit", icon: "document" },
      ];
    }
    return [];
  });

  ngOnInit(): void {
    this.auth
      .fetchMe()
      .subscribe({ next: () => undefined, error: () => undefined });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
