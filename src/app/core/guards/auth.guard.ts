import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { Role } from "../models";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    void router.navigate(["/auth/login"]);
    return false;
  }
  return true;
};

export const roleGuard = (allowed: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      void router.navigate(["/auth/login"]);
      return false;
    }
    const role = auth.role();
    if (!role || !allowed.includes(role)) {
      void router.navigate(["/dashboard"]);
      return false;
    }
    return true;
  };
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    void router.navigate(["/dashboard"]);
    return false;
  }
  return true;
};
