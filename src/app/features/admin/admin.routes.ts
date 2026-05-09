import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['admin_ficct'])],
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./overview/admin-overview.component').then((m) => m.AdminOverviewComponent),
      },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./candidates/admin-candidates.component').then((m) => m.AdminCandidatesComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./companies/admin-companies.component').then((m) => m.AdminCompaniesComponent),
      },
      {
        path: 'vacancies',
        loadComponent: () =>
          import('./vacancies/admin-vacancies.component').then((m) => m.AdminVacanciesComponent),
      },
      {
        path: 'parameters',
        loadComponent: () =>
          import('./parameters/admin-parameters.component').then((m) => m.AdminParametersComponent),
      },
      {
        path: 'audit',
        loadComponent: () => import('./audit/admin-audit.component').then((m) => m.AdminAuditComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
    ],
  },
];
