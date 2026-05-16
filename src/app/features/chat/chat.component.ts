import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";

import { ChatResponse, ChatScope, ChatSource, Role } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { IntelligenceService } from "../../core/services/intelligence.service";
import { ToastService } from "../../core/services/toast.service";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

import { ChatSourceCardComponent } from "./chat-source-card.component";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  scope?: ChatScope;
  at: number;
}

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    ChatSourceCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chat.component.html",
})
export class ChatComponent {
  private readonly intel = inject(IntelligenceService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly promptCtrl = new FormControl("", {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });
  private readonly turnsSignal = signal<ChatTurn[]>([]);
  private readonly busySignal = signal(false);
  protected readonly turns = this.turnsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();

  protected readonly scopeLabel = computed(() => {
    const r: Role | null = this.auth.role();
    if (r === "candidate") return "Vacantes disponibles";
    if (r === "company_rep") return "Candidatos de tu empresa";
    if (r === "admin_ficct") return "Acervo global (vacantes y candidatos)";
    return "Conocimiento institucional";
  });

  protected readonly suggestedPrompts = computed<string[]>(() => {
    const r: Role | null = this.auth.role();
    if (r === "company_rep") {
      return [
        "¿Qué candidatos tienen experiencia en backend Python?",
        "Muéstrame postulantes con perfil de frontend Angular",
        "¿Quiénes tienen habilidades en análisis de datos?",
      ];
    }
    if (r === "admin_ficct") {
      return [
        "¿Qué vacantes activas hay y qué perfiles las cubren mejor?",
        "Muestra candidatos destacados de los últimos procesos",
        "¿Qué empresas publican más vacantes en frontend?",
      ];
    }
    return [
      "¿Qué vacantes hay de desarrollo frontend?",
      "Sugiéreme vacantes acordes a mi perfil",
      "¿Qué habilidades piden más las empresas?",
    ];
  });

  protected trackSource = (_: number, s: ChatSource): string =>
    s.document_id || s.snippet;

  protected usePrompt(text: string): void {
    this.promptCtrl.setValue(text);
    this.ask();
  }

  protected ask(): void {
    if (this.promptCtrl.invalid || this.busySignal()) return;
    const message = this.promptCtrl.value.trim();
    if (!message) return;
    this.turnsSignal.update((t) => [
      ...t,
      { role: "user", content: message, at: Date.now() },
    ]);
    this.promptCtrl.setValue("");
    this.busySignal.set(true);
    this.intel.chat(message).subscribe({
      next: (response: ChatResponse) => {
        this.turnsSignal.update((t) => [
          ...t,
          {
            role: "assistant",
            content: response.answer || "(sin respuesta)",
            sources: response.sources,
            scope: response.scope,
            at: Date.now(),
          },
        ]);
        this.busySignal.set(false);
      },
      error: (err) => {
        this.busySignal.set(false);
        this.toast.danger(
          "Asistente no disponible",
          err?.error?.error?.message ?? "Intente de nuevo más tarde.",
        );
      },
    });
  }
}
