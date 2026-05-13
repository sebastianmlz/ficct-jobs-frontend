import { Routes } from "@angular/router";

export const vacanciesRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./list/vacancy-list.component").then(
        (m) => m.VacancyListComponent,
      ),
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./detail/vacancy-detail.component").then(
        (m) => m.VacancyDetailComponent,
      ),
  },
];
