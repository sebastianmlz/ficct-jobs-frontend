import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";

import { AuthService } from "../../core/services/auth.service";
import { IconComponent } from "../../shared/components/icon/icon.component";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./landing.component.html",
})
export class LandingComponent {
  private readonly auth = inject(AuthService);
  protected readonly signedIn = computed(() => this.auth.isAuthenticated());

  protected readonly heroMatches = [
    { title: "Dev Frontend", score: 97 },
    { title: "Analista de Datos", score: 94 },
    { title: "Dev Backend", score: 91 },
  ];

  protected readonly trustSignals = [
    "Plataforma institucional",
    "Búsqueda inteligente",
    "Sin costo",
  ];

  protected readonly stats = [
    { value: "IA", label: "Inteligencia artificial" },
    { value: "100%", label: "Acceso libre" },
    { value: "3", label: "Perfiles de usuario" },
    { value: "FICCT", label: "Plataforma FICCT" },
  ];

  protected readonly techStack = ["Angular", "IA", "Embeddings", "Workflow"];

  protected readonly audiences = [
    {
      key: "candidate",
      tag: "Candidato",
      badgeClass: "bg-ficct-50 text-ficct-700",
      iconBg: "bg-ficct-50",
      iconColor: "text-ficct-600",
      icon: "user",
      title: "Encuentre oportunidades que se ajusten a su perfil",
      description:
        "Complete su perfil, suba su CV y postúlese a vacantes que correspondan con sus habilidades y formación.",
    },
    {
      key: "company",
      tag: "Empresa",
      badgeClass: "bg-emerald-50 text-emerald-700",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      icon: "building",
      title: "Conecte directamente con egresados de la FICCT",
      description:
        "Publique vacantes, reciba candidatos calificados y gestione un proceso de selección estructurado.",
    },
    {
      key: "admin",
      tag: "Administrador",
      badgeClass: "bg-amber-50 text-amber-700",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: "shield-check",
      title: "Administre el canal institucional",
      description:
        "Valide candidatos y empresas, apruebe vacantes y consulte métricas auditables de empleabilidad.",
    },
  ];

  protected readonly features = [
    {
      key: "semantic",
      title: "Búsqueda inteligente",
      description:
        "Las consultas en lenguaje natural devuelven las vacantes más relevantes para cada candidato.",
      icon: "search",
    },
    {
      key: "gap",
      title: "Análisis de brechas",
      description:
        "Visualice qué habilidades tiene y cuáles requiere cada vacante para planificar su desarrollo.",
      icon: "chart-bar",
    },
    {
      key: "workflow",
      title: "Flujo de selección",
      description:
        "Etapas, entrevistas y notificaciones sincronizadas entre candidato, empresa y FICCT.",
      icon: "clipboard-check",
    },
    {
      key: "audit",
      title: "Trazabilidad auditable",
      description:
        "Cada cambio queda registrado de forma inmutable para la trazabilidad institucional.",
      icon: "document",
    },
  ];
}
