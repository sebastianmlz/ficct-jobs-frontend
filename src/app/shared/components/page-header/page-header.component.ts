import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: "app-page-header",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      @if (eyebrow) {
        <p class="heading-eyebrow">{{ eyebrow }}</p>
      }
      <h1
        class="mt-1 font-display text-2xl font-bold tracking-tight text-institution-navy sm:text-3xl"
      >
        {{ title }}
      </h1>
      @if (description) {
        <p
          class="mt-2 max-w-2xl text-sm leading-relaxed text-institution-text-secondary"
        >
          {{ description }}
        </p>
      }
      <ng-content></ng-content>
    </header>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title = "";
  @Input() eyebrow = "";
  @Input() description = "";
}
