import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-toast-host",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./toast-host.component.html",
})
export class ToastHostComponent {
  private readonly service = inject(ToastService);
  protected readonly items = this.service.items;

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }

  protected border(kind: string): string {
    if (kind === "success") return "border-l-status-success";
    if (kind === "warning") return "border-l-status-warning";
    if (kind === "danger") return "border-l-status-danger";
    return "border-l-ficct-500";
  }

  protected text(kind: string): string {
    if (kind === "success") return "text-emerald-700";
    if (kind === "warning") return "text-amber-700";
    if (kind === "danger") return "text-rose-700";
    return "text-ficct-700";
  }
}
