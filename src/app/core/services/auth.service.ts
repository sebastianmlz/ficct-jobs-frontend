import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

import { AuthTokens, RegisterPayload, Role, User } from "../models";
import { ApiService } from "./api.service";
import { TokenStorageService } from "./token-storage.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(this.readStoredUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.user() !== null && this.tokens.access() !== null,
  );
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);

  constructor() {
    effect(() => {
      const u = this.userSignal();
      if (u) {
        try {
          localStorage.setItem("ficct.user", JSON.stringify(u));
        } catch {
          /* storage unavailable */
        }
      } else {
        try {
          localStorage.removeItem("ficct.user");
        } catch {
          /* ignore */
        }
      }
    });
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api.post<User>("/auth/register/", payload);
  }

  login(email: string, password: string): Observable<AuthTokens> {
    return this.api.post<AuthTokens>("/auth/login/", { email, password }).pipe(
      tap((tokens) => {
        this.tokens.set(tokens.access, tokens.refresh);
        this.userSignal.set(tokens.user);
      }),
    );
  }

  refresh(): Observable<{ access: string; refresh?: string }> {
    const refresh = this.tokens.refresh();
    if (!refresh) {
      throw new Error("No refresh token");
    }
    return this.api.post<{ access: string; refresh?: string }>(
      "/auth/refresh/",
      { refresh },
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.api.post<void>("/auth/password-reset/request/", { email });
  }

  confirmPasswordReset(token: string, newPassword: string): Observable<void> {
    return this.api.post<void>("/auth/password-reset/confirm/", {
      token,
      new_password: newPassword,
    });
  }

  fetchMe(): Observable<User> {
    return this.api
      .get<User>("/auth/me/")
      .pipe(tap((u) => this.userSignal.set(u)));
  }

  completeOnboarding(): Observable<User> {
    return this.api
      .post<User>("/auth/me/onboarding/")
      .pipe(tap((u) => this.userSignal.set(u)));
  }

  deleteAccount(password: string): Observable<void> {
    return this.api.post<void>("/auth/me/delete/", { password });
  }

  logout(): void {
    const refresh = this.tokens.refresh();
    const access = this.tokens.access();
    if (refresh && access) {
      this.api.post<void>("/auth/logout/", { refresh }).subscribe({
        next: () => this.clearAndRedirect(),
        error: () => this.clearAndRedirect(),
      });
    } else {
      this.clearAndRedirect();
    }
  }

  private clearAndRedirect(): void {
    this.tokens.clear();
    this.userSignal.set(null);
    void this.router.navigate(["/"]);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem("ficct.user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
