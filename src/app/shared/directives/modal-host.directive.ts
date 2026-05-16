import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
} from "@angular/core";

/**
 * Attach to the modal-panel element of any `.modal-overlay` so that, while
 * the panel is in the DOM:
 *
 *  - the document body is scroll-locked (`body.scroll-locked` toggled
 *    via a refcount so two stacked modals can co-exist),
 *  - the panel itself receives keyboard focus on the next microtask so
 *    screen-reader + Tab navigation start *inside* the dialog,
 *  - the element that opened the modal is remembered as
 *    ``previousActiveElement`` and re-focused when the directive is
 *    destroyed (the modal closes), preserving the user's focus
 *    position.
 *
 * The directive is lifecycle-driven, not signal-driven, because every
 * modal in this app is rendered under an `@if` block so it enters and
 * leaves the DOM cleanly. That means `ngAfterViewInit` ↔ "modal opened"
 * and `ngOnDestroy` ↔ "modal closed" without any extra wiring.
 */
@Directive({
  selector: "[appModalHost]",
  standalone: true,
})
export class ModalHostDirective implements AfterViewInit, OnDestroy {
  private static openCount = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private previousActiveElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    if (typeof document === "undefined") {
      return;
    }
    const active = document.activeElement;
    this.previousActiveElement =
      active instanceof HTMLElement ? active : null;

    ModalHostDirective.openCount += 1;
    document.body.classList.add("scroll-locked");

    // Defer focus so the modal-panel is fully laid out and `tabindex="-1"`
    // is applied before we call focus(). preventScroll keeps the page
    // from jumping on mobile when the keyboard would otherwise re-flow.
    queueMicrotask(() => {
      const el = this.host.nativeElement;
      if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    });
  }

  ngOnDestroy(): void {
    if (typeof document === "undefined") {
      return;
    }
    ModalHostDirective.openCount = Math.max(
      0,
      ModalHostDirective.openCount - 1,
    );
    if (ModalHostDirective.openCount === 0) {
      document.body.classList.remove("scroll-locked");
    }
    const restore = this.previousActiveElement;
    if (restore && document.body.contains(restore)) {
      try {
        restore.focus({ preventScroll: true });
      } catch {
        // Some elements throw on focus(); silently swallow — the worst
        // outcome is focus goes to body, which is acceptable.
      }
    }
    this.previousActiveElement = null;
  }
}
