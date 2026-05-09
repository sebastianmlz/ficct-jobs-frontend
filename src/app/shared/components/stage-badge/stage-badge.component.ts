import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { StageCode } from '../../../core/models';
import { STAGE_LABEL } from '../../../core/models/labels';

const STAGE_CLASS: Record<StageCode, string> = {
  received: 'badge-neutral',
  preselected: 'badge-info',
  interview_scheduled: 'badge-info',
  interview_done: 'badge-info',
  offer: 'badge-warning',
  hired: 'badge-success',
  rejected: 'badge-danger',
  withdrawn: 'badge-neutral',
};

@Component({
  selector: 'app-stage-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="cssClass()">{{ label() }}</span>`,
})
export class StageBadgeComponent {
  private readonly stageSignal = signal<StageCode>('received');

  @Input({ required: true })
  set value(v: StageCode) {
    this.stageSignal.set(v);
  }

  protected readonly stage = this.stageSignal.asReadonly();
  protected readonly cssClass = computed(() => STAGE_CLASS[this.stage()] ?? 'badge-neutral');
  protected readonly label = computed(() => STAGE_LABEL[this.stage()] ?? this.stage());
}
