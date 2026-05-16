import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import {
  ChatCandidateEntity,
  ChatSource,
  ChatVacancyEntity,
  Role,
} from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { inject } from "@angular/core";

@Component({
  selector: "app-chat-source-card",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = source();
    @let vacancy = s.doc_type === "vacancy" ? asVacancy(s.entity) : null;
    @let candidate = s.doc_type === "candidate" ? asCandidate(s.entity) : null;

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
            @if (s.snippet) {
              <p
                class="mt-2 line-clamp-3 border-l-2 border-ficct-100 pl-2 text-xs italic text-institution-text-secondary"
              >
                {{ s.snippet }}
              </p>
            }
          </div>
          <a
            class="btn-secondary btn-sm shrink-0"
            [routerLink]="['/vacancies', v.id]"
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
            @if (s.snippet) {
              <p
                class="mt-2 line-clamp-3 border-l-2 border-ficct-100 pl-2 text-xs italic text-institution-text-secondary"
              >
                {{ s.snippet }}
              </p>
            }
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
        <span class="badge-neutral mr-2">Fuente</span>
        @if (s.snippet) {
          <span class="line-clamp-2 align-middle italic">{{ s.snippet }}</span>
        } @else {
          <span class="align-middle">Sin extracto disponible.</span>
        }
      </div>
    }
  `,
})
export class ChatSourceCardComponent {
  private readonly auth = inject(AuthService);
  readonly source = input.required<ChatSource>();

  /** Resolved primary action for a candidate card.
   *
   * For a company representative we navigate to the candidate's most
   * recent application detail in their own company — that's the page
   * where they can read the CV, schedule interviews, change stage, etc.
   * For other roles (candidate, admin) there is no candidate-detail
   * destination in the current product, so the card stays informational
   * and we deliberately render no CTA rather than send the user to a
   * page where they cannot act. */
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
