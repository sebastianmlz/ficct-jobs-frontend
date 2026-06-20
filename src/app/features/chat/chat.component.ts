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
  private readonly confirmingNewChatSignal = signal(false);
  protected readonly turns = this.turnsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly confirmingNewChat = this.confirmingNewChatSignal.asReadonly();
  protected readonly hasTurns = computed(() => this.turnsSignal().length > 0);

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

  /** Ask to start a new chat (only when there is context to lose). */
  protected requestNewChat(): void {
    if (!this.hasTurns() || this.busySignal()) return;
    this.confirmingNewChatSignal.set(true);
  }

  protected cancelNewChat(): void {
    this.confirmingNewChatSignal.set(false);
  }

  /**
   * Clears ONLY the in-memory conversation context. Does not touch the
   * candidate profile, CV, applications, vacancies or any persisted data —
   * chat history is client-side only and not stored server-side.
   */
  protected confirmNewChat(): void {
    this.turnsSignal.set([]);
    this.promptCtrl.setValue("");
    this.confirmingNewChatSignal.set(false);
    this.toast.info(
      "Nueva conversación",
      "Se borró el contexto de la conversación actual.",
    );
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
