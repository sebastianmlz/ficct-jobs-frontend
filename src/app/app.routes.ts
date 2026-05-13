import { Routes } from "@angular/router";

import { authGuard, guestGuard, roleGuard } from "./core/guards/auth.guard";

export const appRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.authRoutes),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./shared/layout/app-shell.component").then(
        (m) => m.AppShellComponent,
      ),
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "vacancies",
        loadChildren: () =>
          import("./features/vacancies/vacancies.routes").then(
            (m) => m.vacanciesRoutes,
          ),
      },
      {
        path: "applications",
        canActivate: [roleGuard(["candidate"])],
        loadComponent: () =>
          import("./features/applications/applications.component").then(
            (m) => m.ApplicationsComponent,
          ),
      },
      {
        path: "profile",
        canActivate: [roleGuard(["candidate"])],
        loadComponent: () =>
          import("./features/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: "chat",
        loadComponent: () =>
          import("./features/chat/chat.component").then((m) => m.ChatComponent),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("./features/notifications/notifications.component").then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: "closed-history",
        canActivate: [roleGuard(["admin_ficct", "company_rep"])],
        loadComponent: () =>
          import("./features/closed-history/closed-history.component").then(
            (m) => m.ClosedHistoryComponent,
          ),
      },
      {
        path: "rep",
        loadChildren: () =>
          import("./features/rep/rep.routes").then((m) => m.repRoutes),
      },
      {
        path: "admin",
        loadChildren: () =>
          import("./features/admin/admin.routes").then((m) => m.adminRoutes),
      },
    ],
  },
  {
    path: "**",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
