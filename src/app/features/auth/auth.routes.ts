import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
    title: 'FICCT Jobs · Iniciar sesión',
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'FICCT Jobs · Crear cuenta',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot/forgot.component').then((m) => m.ForgotComponent),
    title: 'FICCT Jobs · Recuperar acceso',
  },
  {
    path: 'reset',
    loadComponent: () => import('./reset/reset.component').then((m) => m.ResetComponent),
    title: 'FICCT Jobs · Nueva contraseña',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
