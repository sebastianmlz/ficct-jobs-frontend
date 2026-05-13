import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";

import { ApplicationItem } from "../../core/models";
import { stageLabel } from "../../core/models/labels";
import { JobsService } from "../../core/services/jobs.service";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StageBadgeComponent } from "../../shared/components/stage-badge/stage-badge.component";

@Component({
  selector: "app-applications",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    StageBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./applications.component.html",
})
export class ApplicationsComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly itemsSignal = signal<ApplicationItem[]>([]);
  private readonly loadingSignal = signal(true);
  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected stage(s: string): string {
    return stageLabel(s);
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.jobs.myApplications().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false),
    });
  }

  protected canWithdraw(a: ApplicationItem): boolean {
    return a.current_stage === "received" || a.current_stage === "preselected";
  }

  protected withdraw(id: string): void {
    this.jobs.withdrawApplication(id).subscribe({
      next: () => this.refresh(),
      error: () => undefined,
    });
  }
}
