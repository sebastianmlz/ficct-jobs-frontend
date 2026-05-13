import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";

import { ChatResponse } from "../../core/models";
import { IntelligenceService } from "../../core/services/intelligence.service";
import { ToastService } from "../../core/services/toast.service";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  sources?: { document_id: string; snippet: string }[];
  at: number;
}

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chat.component.html",
})
export class ChatComponent {
  private readonly intel = inject(IntelligenceService);
  private readonly toast = inject(ToastService);

  protected readonly promptCtrl = new FormControl("", {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });
  private readonly turnsSignal = signal<ChatTurn[]>([]);
  private readonly busySignal = signal(false);
  protected readonly turns = this.turnsSignal.asReadonly();
  protected readonly busy = this.busySignal.asReadonly();

  protected readonly suggestedPrompts = [
    "¿Qué vacantes hay de desarrollo frontend?",
    "¿Cómo funciona el análisis de brechas?",
    "¿Qué habilidades piden más las empresas?",
  ];

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
