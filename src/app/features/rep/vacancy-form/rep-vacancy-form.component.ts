import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiErrorEnvelope, Vacancy } from '../../../core/models';
import { JobsService } from '../../../core/services/jobs.service';
import { ToastService } from '../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-rep-vacancy-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rep-vacancy-form.component.html',
})
export class RepVacancyFormComponent implements OnInit {
  private readonly jobs = inject(JobsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] }),
    requirements: new FormControl('', { nonNullable: true }),
    modality: new FormControl<'onsite' | 'remote' | 'hybrid'>('remote', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true }),
    salary_currency: new FormControl('', { nonNullable: true }),
    salary_min: new FormControl<number | null>(null),
    salary_max: new FormControl<number | null>(null),
  });

  private readonly idSignal = signal<string | null>(null);
  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  protected readonly editing = computed(() => this.idSignal() !== null);
  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = this.errorSignal.asReadonly();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idSignal.set(id);
      this.jobs.getVacancy(id).subscribe({
        next: (v) => this.form.patchValue(this.toForm(v)),
        error: () => this.toast.danger('Vacante no encontrada'),
      });
    }
  }

  protected save(): void {
    if (this.form.invalid || this.busySignal()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busySignal.set(true);
    this.errorSignal.set(null);
    const payload = this.form.getRawValue();
    const id = this.idSignal();
    const obs = id
      ? this.jobs.updateVacancy(id, payload as Partial<Vacancy>)
      : this.jobs.createVacancy(payload as Partial<Vacancy>);
    obs.subscribe({
      next: () => {
        this.busySignal.set(false);
        this.toast.success(id ? 'Vacante actualizada' : 'Vacante creada');
        void this.router.navigate(['/rep/vacancies']);
      },
      error: (err) => {
        this.busySignal.set(false);
        const env = err?.error as ApiErrorEnvelope | undefined;
        this.errorSignal.set(env?.error?.message ?? 'No se pudo guardar la vacante.');
      },
    });
  }

  private toForm(v: Vacancy) {
    return {
      title: v.title,
      description: v.description,
      requirements: v.requirements,
      modality: v.modality,
      location: v.location,
      salary_currency: v.salary_currency,
      salary_min: v.salary_min ? Number(v.salary_min) : null,
      salary_max: v.salary_max ? Number(v.salary_max) : null,
    };
  }
}
