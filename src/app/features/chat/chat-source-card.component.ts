import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";

import {
  ChatCandidateEntity,
  ChatSource,
  ChatVacancyEntity,
  Role,
} from "../../core/models";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-chat-source-card",
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = source();
    @let vacancy = s.doc_type === "vacancy" ? asVacancy(s.entity) : null;
    @let candidate = s.doc_type === "candidate" ? asCandidate(s.entity) : null;

    <!-- Reusable evidence snippet with expand/collapse + show more/less. -->
    <ng-template #snippetBlock>
      @if (s.snippet) {
        <p
          [id]="snippetId()"
          class="mt-2 border-l-2 border-ficct-100 pl-2 text-xs italic text-institution-text-secondary"
          [class.line-clamp-3]="!expanded()"
        >
          {{ s.snippet }}
        </p>
        @if (canToggle()) {
          <button
            type="button"
            class="mt-1 inline-flex min-h-[44px] items-center gap-1 rounded text-[11px] font-medium text-ficct-700 hover:text-ficct-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ficct-400 sm:min-h-0"
            [attr.aria-expanded]="expanded()"
            [attr.aria-controls]="snippetId()"
            (click)="toggle()"
          >
            {{ expanded() ? "Ver menos" : "Ver más" }}
          </button>
        }
      }
    </ng-template>

    @if (vacancy; as v) {
      <article
        class="group rounded-lg border border-institution-border bg-white p-3 shadow-sm transition hover:border-ficct-300 hover:shadow-card sm:p-4"
        [attr.aria-label]="'Vacante: ' + v.title"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="badge-info">Vacante</span>
              @if (v.modality) {
                <span class="badge-neutral">{{ v.modality }}</span>
              }
              @if (v.status && v.status !== "ACTIVE") {
                <span class="badge-warning">{{ v.status }}</span>
              }
              @if (relevance() !== null) {
                <span
                  class="text-[10px] text-institution-text-secondary"
                  [title]="'Relevancia de la coincidencia'"
                >
                  {{ relevance() }}% relevancia
                </span>
              }
              @if (s.chunk_count > 1) {
                <span
                  class="text-[10px] text-institution-text-secondary"
                  title="Coincidencias en este documento"
                >
                  · {{ s.chunk_count }} coincidencias
                </span>
              }
            </div>
            <h4
              class="mt-2 font-display text-sm font-semibold leading-snug text-institution-text-primary"
            >
              {{ v.title }}
            </h4>
            <p class="mt-0.5 text-xs text-institution-text-secondary">
              {{ v.company_name }}
              @if (v.location) {
                <span class="text-slate-400">·</span> {{ v.location }}
              }
            </p>
            <ng-container [ngTemplateOutlet]="snippetBlock"></ng-container>
          </div>
          <a
            class="btn-secondary btn-sm shrink-0"
            [routerLink]="vacancyLink()"
          >
            <span class="hidden sm:inline">Ver vacante</span>
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </article>
    } @else if (candidate) {
      @let c = candidate;
      <article
        class="group rounded-lg border border-institution-border bg-white p-3 shadow-sm transition hover:border-ficct-300 hover:shadow-card sm:p-4"
        [attr.aria-label]="'Candidato: ' + (c.name || c.headline || 'perfil')"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ficct-100 text-xs font-bold text-ficct-700"
            aria-hidden="true"
          >
            {{ initials(c.name) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="badge-accent">Candidato</span>
              @if (c.career) {
                <span class="badge-neutral">{{ c.career }}</span>
              }
              @if (relevance() !== null) {
                <span
                  class="text-[10px] text-institution-text-secondary"
                  [title]="'Relevancia de la coincidencia'"
                >
                  {{ relevance() }}% relevancia
                </span>
              }
              @if (s.chunk_count > 1) {
                <span
                  class="text-[10px] text-institution-text-secondary"
                  title="Coincidencias en el CV"
                >
                  · {{ s.chunk_count }} coincidencias
                </span>
              }
            </div>
            <h4
              class="mt-2 font-display text-sm font-semibold leading-snug text-institution-text-primary"
            >
              {{ c.name || "Perfil candidato" }}
            </h4>
            @if (c.headline) {
              <p class="mt-0.5 text-xs text-institution-text-secondary">
                {{ c.headline }}
                @if (c.city) {
                  <span class="text-slate-400">·</span> {{ c.city }}
                }
              </p>
            }
            <ng-container [ngTemplateOutlet]="snippetBlock"></ng-container>
            @if (candidateAction(); as action) {
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <a
                  class="btn-secondary btn-sm"
                  [routerLink]="action.routerLink"
                  [attr.aria-label]="action.ariaLabel"
                >
                  {{ action.label }}
                  <svg
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
                @if (action.context) {
                  <span class="text-[11px] text-institution-text-secondary">
                    {{ action.context }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      </article>
    } @else {
      <div
        class="rounded-md border border-institution-border bg-white px-3 py-2 text-xs text-institution-text-secondary"
      >
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="badge-neutral">{{ sourceTypeLabel() }}</span>
          @if (relevance() !== null) {
            <span class="text-[10px]">{{ relevance() }}% relevancia</span>
          }
        </div>
        @if (s.title) {
          <p
            class="mt-1 font-display text-sm font-semibold leading-snug text-institution-text-primary"
          >
            {{ s.title }}
          </p>
        }
        <ng-container [ngTemplateOutlet]="snippetBlock"></ng-container>
        @if (!s.snippet) {
          <span class="align-middle">Sin extracto disponible.</span>
        }
      </div>
    }
  `,
})
export class ChatSourceCardComponent {
  private readonly auth = inject(AuthService);
  readonly source = input.required<ChatSource>();

  /** Local, card-scoped expand state. Kept inside the component (never lifted
   * into the conversation state) so expanding a source never resets the chat
   * and survives re-renders when a new message is appended. */
  private readonly expandedSignal = signal(false);
  protected readonly expanded = this.expandedSignal.asReadonly();

  protected toggle(): void {
    this.expandedSignal.update((v) => !v);
  }

  /** Stable, unique id for the snippet element so aria-controls resolves. */
  protected readonly snippetId = computed(() => {
    const s = this.source();
    return `chat-src-${s.source_id || s.document_id || "x"}`;
  });

  /** Only offer a toggle when the snippet is long enough to be clamped. */
  protected readonly canToggle = computed(() => (this.source().snippet?.length ?? 0) > 140);

  /** Spanish label for the source type, used by the generic fallback card. */
  protected sourceTypeLabel(): string {
    const t = this.source().doc_type;
    return t === "vacancy" ? "Vacante" : t === "candidate" ? "Candidato" : "Fuente";
  }

  /** Relevance as a 0..100 percentage, or null when no usable score. */
  protected readonly relevance = computed(() => {
    const score = this.source().score;
    if (!score || score <= 0) {
      return null;
    }
    return Math.round(Math.min(1, score) * 100);
  });

  /** Vacancy link: prefer the server-authoritative route, else build it. */
  protected readonly vacancyLink = computed(() => {
    const s = this.source();
    if (s.route) {
      return s.route;
    }
    const v = this.asVacancy(s.entity);
    return v ? ["/vacancies", v.id] : ["/vacancies"];
  });

  /** Resolved primary action for a candidate card.
   *
   * For a company representative we navigate to the candidate's most recent
   * application detail in their own company. For other roles there is no
   * candidate-detail destination, so the card stays informational and renders
   * no CTA rather than leaking CV content or sending the user nowhere. */
  protected readonly candidateAction = computed(() => {
    const s = this.source();
    if (s.doc_type !== "candidate") {
      return null;
    }
    const c = this.asCandidate(s.entity);
    if (!c) {
      return null;
    }
    const role: Role | null = this.auth.role();
    if (role === "company_rep" && c.application_id) {
      return {
        routerLink: ["/rep/applications", c.application_id],
        label: "Ver postulación",
        ariaLabel: `Ver postulación de ${c.name || "candidato"}`,
        context: c.application_vacancy_title
          ? `para ${c.application_vacancy_title}`
          : "",
      };
    }
    return null;
  });

  protected asVacancy(entity: ChatSource["entity"]): ChatVacancyEntity | null {
    return entity && entity.kind === "vacancy" ? entity : null;
  }

  protected asCandidate(
    entity: ChatSource["entity"],
  ): ChatCandidateEntity | null {
    return entity && entity.kind === "candidate" ? entity : null;
  }

  protected initials(name: string): string {
    if (!name) return "?";
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0] ?? "")
        .join("")
        .toUpperCase() || "?"
    );
  }
}
