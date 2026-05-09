import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() destructive = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly openSignal = signal(false);
  protected readonly open = this.openSignal.asReadonly();

  show(): void {
    this.openSignal.set(true);
  }
  hide(): void {
    this.openSignal.set(false);
  }
  protected confirm(): void {
    this.openSignal.set(false);
    this.confirmed.emit();
  }
  protected cancel(): void {
    this.openSignal.set(false);
    this.cancelled.emit();
  }
}
