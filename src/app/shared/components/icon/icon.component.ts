import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-icon",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: "display: contents", "aria-hidden": "true" },
  template: `
    <svg
      [class]="size() + ' shrink-0'"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <use [attr.href]="'/icons.svg#icon-' + name()" />
    </svg>
  `,
})
export class IconComponent {
  name = input.required<string>();
  size = input("h-4 w-4");
}
