import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";

import { stageLabel } from "../../core/models/labels";
import { ClosedVacancy, JobsService } from "../../core/services/jobs.service";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-closed-history",
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./closed-history.component.html",
})
export class ClosedHistoryComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly itemsSignal = signal<ClosedVacancy[]>([]);
  private readonly loadingSignal = signal(true);
  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();

  protected stage(s: string): string {
    return stageLabel(s);
  }

  ngOnInit(): void {
    this.jobs.listClosedVacancies().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }
}
