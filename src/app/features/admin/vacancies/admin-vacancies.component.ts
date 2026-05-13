import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";

import { Vacancy } from "../../../core/models";
import { vacancyStatusLabel } from "../../../core/models/labels";
import { JobsService } from "../../../core/services/jobs.service";
import { ToastService } from "../../../core/services/toast.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

const STATUS_CLASS: Record<string, string> = {
  draft: "badge-neutral",
  pending_review: "badge-warning",
  active: "badge-success",
  rejected: "badge-danger",
  closed: "badge-neutral",
};

type FilterKey = "pending_review" | "active" | "rejected" | "closed" | "all";

interface Filter {
  key: FilterKey;
  label: string;
}

@Component({
  selector: "app-admin-vacancies",
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./admin-vacancies.component.html",
})
export class AdminVacanciesComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly toast = inject(ToastService);

  protected readonly filters: Filter[] = [
    { key: "pending_review", label: "En revisión" },
    { key: "active", label: "Activas" },
    { key: "rejected", label: "Rechazadas" },
    { key: "closed", label: "Cerradas" },
    { key: "all", label: "Todas" },
  ];
  private readonly activeSignal = signal<FilterKey>("pending_review");
  private readonly itemsSignal = signal<Vacancy[]>([]);
  private readonly loadingSignal = signal(true);
  private readonly busyIdSignal = signal<string | null>(null);

  protected readonly active = this.activeSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();
  protected readonly busyId = this.busyIdSignal.asReadonly();
  protected readonly visible = computed(() => {
    const items = this.itemsSignal();
    const f = this.activeSignal();
    return f === "all" ? items : items.filter((v) => v.status === f);
  });

  ngOnInit(): void {
    this.refresh();
  }

  protected badgeClass(status: string): string {
    return STATUS_CLASS[status] ?? "badge-neutral";
  }

  protected statusLabel(s: string): string {
    return vacancyStatusLabel(s);
  }

  protected setFilter(f: FilterKey): void {
    this.activeSignal.set(f);
  }

  protected approve(v: Vacancy): void {
    this.busyIdSignal.set(v.id);
    this.jobs.approveVacancy(v.id, "approve").subscribe({
      next: () => {
        this.busyIdSignal.set(null);
        this.toast.success("Vacante aprobada");
        this.refresh();
      },
      error: (err) => {
        this.busyIdSignal.set(null);
        this.toast.danger(
          "No se pudo aprobar la vacante",
          err?.error?.error?.message ?? "",
        );
      },
    });
  }

  protected reject(v: Vacancy): void {
    const reason = prompt("Motivo del rechazo:")?.trim();
    if (!reason) {
      this.toast.warning("Rechazo cancelado", "Se requiere un motivo.");
      return;
    }
    this.busyIdSignal.set(v.id);
    this.jobs.approveVacancy(v.id, "reject", reason).subscribe({
      next: () => {
        this.busyIdSignal.set(null);
        this.toast.warning("Vacante rechazada");
        this.refresh();
      },
      error: (err) => {
        this.busyIdSignal.set(null);
        this.toast.danger(
          "No se pudo rechazar la vacante",
          err?.error?.error?.message ?? "",
        );
      },
    });
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.jobs.listVacancies().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }
}
