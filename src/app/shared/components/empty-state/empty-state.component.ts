import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-institution-border bg-white px-8 py-14 text-center">
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-institution-surface">
        <svg class="h-6 w-6 text-institution-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
      </div>
      <h3 class="font-display text-base font-semibold text-institution-text-primary">{{ title }}</h3>
      @if (description) {
        <p class="mt-1.5 max-w-xs text-sm text-institution-text-secondary">{{ description }}</p>
      }
      <div class="mt-5">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
}
