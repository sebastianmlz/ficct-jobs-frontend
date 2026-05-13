import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { environment } from "../../../environments/environment";
import { CandidateProfile, DocumentItem } from "../../core/models";
import {
  EducationItem,
  ProfilesService,
  SkillItem,
} from "../../core/services/profiles.service";
import { ToastService } from "../../core/services/toast.service";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
  private readonly service = inject(ProfilesService);
  private readonly toast = inject(ToastService);

  protected readonly form = new FormGroup({
    full_name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.minLength(2)],
    }),
    headline: new FormControl("", { nonNullable: true }),
    career: new FormControl("", { nonNullable: true }),
    graduation_year: new FormControl<number | null>(null, {
      nonNullable: false,
    }),
    phone: new FormControl("", { nonNullable: true }),
    city: new FormControl("", { nonNullable: true }),
    bio: new FormControl("", { nonNullable: true }),
    linkedin_url: new FormControl("", { nonNullable: true }),
    github_url: new FormControl("", { nonNullable: true }),
  });

  protected readonly eduForm = new FormGroup({
    institution: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    degree: new FormControl("", { nonNullable: true }),
    start_year: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(1950),
        Validators.max(2100),
      ],
    }),
    end_year: new FormControl<number | null>(null),
    is_ongoing: new FormControl(false, { nonNullable: true }),
  });

  protected readonly skillForm = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    level: new FormControl(3, { nonNullable: true }),
    years_experience: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(50)],
    }),
  });

  private readonly busySignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly documentsSignal = signal<DocumentItem[]>([]);
  private readonly uploadErrorSignal = signal<string | null>(null);
  private readonly profileSignal = signal<CandidateProfile | null>(null);
  private readonly educationsSignal = signal<EducationItem[]>([]);
  private readonly skillsSignal = signal<SkillItem[]>([]);

  protected readonly busy = this.busySignal.asReadonly();
  protected readonly errorMessage = this.errorSignal.asReadonly();
  protected readonly documents = this.documentsSignal.asReadonly();
  protected readonly uploadError = this.uploadErrorSignal.asReadonly();
  protected readonly educations = this.educationsSignal.asReadonly();
  protected readonly skills = this.skillsSignal.asReadonly();

  protected cvNotReachable(): boolean {
    return !environment.cvBuilderUrl;
  }

  ngOnInit(): void {
    this.refreshProfile();
    this.refreshDocuments();
    this.refreshEducation();
    this.refreshSkills();
  }

  protected humanSize(bytes: number): string {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  protected save(): void {
    if (this.busySignal()) {
      return;
    }
    this.busySignal.set(true);
    this.errorSignal.set(null);
    this.service
      .updateMyProfile(this.form.getRawValue() as Partial<CandidateProfile>)
      .subscribe({
        next: () => {
          this.busySignal.set(false);
          this.toast.success("Perfil guardado");
        },
        error: (err) => {
          this.busySignal.set(false);
          this.errorSignal.set(
            err?.error?.error?.message ?? "No se pudo guardar el perfil.",
          );
        },
      });
  }

  protected onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadErrorSignal.set(null);
    this.service.uploadDocument(file).subscribe({
      next: () => {
        this.refreshDocuments();
        this.toast.success("Documento subido", "Procesamiento iniciado.");
        input.value = "";
      },
      error: (err) => {
        const code = err?.error?.error?.code;
        const msg = err?.error?.error?.message;
        const text =
          msg ?? (code ? `Error: ${code}` : "No se pudo subir el documento.");
        this.uploadErrorSignal.set(text);
        this.toast.danger("Error al subir", text);
      },
    });
  }

  protected remove(id: string): void {
    if (
      !confirm(
        "¿Eliminar este documento y sus entradas asociadas? Esta acción es irreversible.",
      )
    ) {
      return;
    }
    this.service.deleteDocument(id).subscribe({
      next: () => {
        this.refreshDocuments();
        this.toast.warning("Documento eliminado");
      },
      error: () => this.toast.danger("No se pudo eliminar el documento"),
    });
  }

  protected addEducation(): void {
    if (this.eduForm.invalid) {
      this.eduForm.markAllAsTouched();
      return;
    }
    const value = this.eduForm.getRawValue();
    this.service
      .addEducation({
        institution: value.institution,
        degree: value.degree,
        field_of_study: "",
        start_year: value.start_year as number,
        end_year: value.is_ongoing ? null : (value.end_year ?? null),
        is_ongoing: value.is_ongoing,
        description: "",
      })
      .subscribe({
        next: () => {
          this.eduForm.reset({ is_ongoing: false });
          this.refreshEducation();
          this.toast.success("Formación agregada");
        },
        error: (err) =>
          this.toast.danger(
            "No se pudo agregar la formación",
            err?.error?.error?.message ?? "",
          ),
      });
  }

  protected removeEducation(id: string): void {
    this.service.removeEducation(id).subscribe({
      next: () => this.refreshEducation(),
      error: () => undefined,
    });
  }

  protected addSkill(): void {
    if (this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      return;
    }
    const value = this.skillForm.getRawValue();
    this.service
      .addSkill({
        name: value.name,
        level: value.level,
        years_experience: value.years_experience,
      })
      .subscribe({
        next: () => {
          this.skillForm.reset({ level: 3, years_experience: 1 });
          this.refreshSkills();
          this.toast.success("Habilidad agregada");
        },
        error: (err) =>
          this.toast.danger(
            "No se pudo agregar la habilidad",
            err?.error?.error?.message ?? "",
          ),
      });
  }

  protected removeSkill(id: string): void {
    this.service.removeSkill(id).subscribe({
      next: () => this.refreshSkills(),
      error: () => undefined,
    });
  }

  private refreshProfile(): void {
    this.service.getMyProfile().subscribe({
      next: (p) => {
        this.profileSignal.set(p);
        this.form.patchValue({
          full_name: p.full_name,
          headline: p.headline,
          career: p.career,
          graduation_year: p.graduation_year,
          phone: p.phone,
          city: p.city,
          bio: p.bio,
          linkedin_url: p.linkedin_url,
          github_url: p.github_url,
        });
      },
      error: () => undefined,
    });
  }

  private refreshDocuments(): void {
    this.service.listDocuments().subscribe({
      next: (items) => this.documentsSignal.set(items),
      error: () => undefined,
    });
  }

  private refreshEducation(): void {
    this.service.listEducation().subscribe({
      next: (items) => this.educationsSignal.set(items),
      error: () => undefined,
    });
  }

  private refreshSkills(): void {
    this.service.listSkills().subscribe({
      next: (items) => this.skillsSignal.set(items),
      error: () => undefined,
    });
  }

  protected cvBuilderHref(): string {
    const base = environment.cvBuilderUrl;
    if (!base) {
      return "#";
    }
    const p = this.profileSignal();
    if (!p) {
      return `${base}/builder`;
    }
    const params = new URLSearchParams();
    const append = (key: string, value: string | null | undefined) => {
      if (value && String(value).trim() !== "") {
        params.set(key, String(value).trim());
      }
    };
    append("prefill_name", p.full_name);
    append("prefill_email", p.email);
    append("prefill_title", p.headline || p.career);
    append("prefill_city", p.city);
    append("prefill_linkedin", p.linkedin_url);
    append("prefill_github", p.github_url);
    const qs = params.toString();
    return qs ? `${base}/builder?${qs}` : `${base}/builder`;
  }

  protected trackCvOpen(): void {
    this.toast.info(
      "Abriendo CV Builder",
      "Sus datos se envían como parámetros de URL y permanecen en su navegador.",
    );
  }
}
