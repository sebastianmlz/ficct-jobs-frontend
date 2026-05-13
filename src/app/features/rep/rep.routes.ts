import { Routes } from "@angular/router";

import { roleGuard } from "../../core/guards/auth.guard";

export const repRoutes: Routes = [
  {
    path: "",
    canActivate: [roleGuard(["company_rep"])],
    children: [
      {
        path: "vacancies",
        loadComponent: () =>
          import("./vacancies/rep-vacancies.component").then(
            (m) => m.RepVacanciesComponent,
          ),
      },
      {
        path: "vacancies/new",
        loadComponent: () =>
          import("./vacancy-form/rep-vacancy-form.component").then(
            (m) => m.RepVacancyFormComponent,
          ),
      },
      {
        path: "vacancies/:id/edit",
        loadComponent: () =>
          import("./vacancy-form/rep-vacancy-form.component").then(
            (m) => m.RepVacancyFormComponent,
          ),
      },
      {
        path: "vacancies/:id/applicants",
        loadComponent: () =>
          import("./applicants/rep-applicants.component").then(
            (m) => m.RepApplicantsComponent,
          ),
      },
      {
        path: "applications/:id",
        loadComponent: () =>
          import("./application-detail/rep-application-detail.component").then(
            (m) => m.RepApplicationDetailComponent,
          ),
      },
      {
        path: "",
        pathMatch: "full",
        redirectTo: "vacancies",
      },
    ],
  },
];
