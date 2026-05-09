import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { NotificationItem } from '../../core/models';
import { NotificationsService } from '../../core/services/notifications.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, EmptyStateComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  private readonly service = inject(NotificationsService);

  private readonly itemsSignal = signal<NotificationItem[]>([]);
  private readonly loadingSignal = signal(true);
  protected readonly items = this.itemsSignal.asReadonly();
  protected readonly loading = this.loadingSignal.asReadonly();

  ngOnInit(): void {
    this.refresh();
  }

  protected kindBg(kind: string): string {
    const map: Record<string, string> = { success: 'bg-emerald-50', warning: 'bg-amber-50', error: 'bg-red-50' };
    return map[kind] ?? 'bg-ficct-50';
  }

  protected kindIconColor(kind: string): string {
    const map: Record<string, string> = { success: 'text-emerald-600', warning: 'text-amber-600', error: 'text-red-600' };
    return map[kind] ?? 'text-ficct-600';
  }

  protected kindIcon(kind: string): string {
    if (kind === 'success') return 'check-circle';
    if (kind === 'warning') return 'exclamation-triangle';
    if (kind === 'error') return 'exclamation-circle';
    return 'information-circle';
  }

  protected markRead(n: NotificationItem): void {
    this.service.markRead(n.id).subscribe({
      next: () => this.refresh(),
      error: () => undefined,
    });
  }

  private refresh(): void {
    this.loadingSignal.set(true);
    this.service.refresh().subscribe({
      next: (items) => { this.itemsSignal.set(items); this.loadingSignal.set(false); },
      error: () => this.loadingSignal.set(false),
    });
  }
}
