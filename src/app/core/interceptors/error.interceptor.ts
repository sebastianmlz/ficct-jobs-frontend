import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from "rxjs";

import { AuthService } from "../services/auth.service";
import { TokenStorageService } from "../services/token-storage.service";

/**
 * Single-flight refresh shared across concurrent 401s. The backend rotates and
 * blacklists refresh tokens (ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION),
 * so two parallel refreshes would invalidate each other and force a logout.
 * One in-flight refresh is reused by every request that 401s while it runs.
 */
let refreshInFlight$: Observable<string> | null = null;

function isAuthFlowUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("/auth/login") ||
    u.includes("/auth/refresh") ||
    u.includes("/auth/password-reset")
  );
}

/**
 * On a 401 for a normal API call:
 *  - if a refresh token exists, transparently refresh once and retry the
 *    original request with the new access token;
 *  - only hard-logout (clear tokens + redirect with reason=session_expired)
 *    when the refresh itself fails, or when there was a real session but no
 *    refresh token;
 *  - a never-authenticated visitor (no tokens at all) is sent to login WITHOUT
 *    a misleading "session expired" message.
 * Non-401 errors pass through for component-level handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokens = inject(TokenStorageService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthFlowUrl(req.url)) {
        return throwError(() => err);
      }

      const hadSession = !!tokens.access();
      const refreshToken = tokens.refresh();

      if (refreshToken) {
        if (!refreshInFlight$) {
          refreshInFlight$ = auth.refresh().pipe(
            map((res) => {
              tokens.set(res.access, res.refresh ?? refreshToken);
              return res.access;
            }),
            catchError((refreshErr) => {
              tokens.clear();
              void router.navigate(["/auth/login"], {
                queryParams: { reason: "session_expired" },
              });
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              refreshInFlight$ = null;
            }),
            shareReplay(1),
          );
        }
        return refreshInFlight$.pipe(
          switchMap((access) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } })),
          ),
        );
      }

      // No refresh token available.
      tokens.clear();
      if (hadSession) {
        void router.navigate(["/auth/login"], {
          queryParams: { reason: "session_expired" },
        });
      } else {
        void router.navigate(["/auth/login"]);
      }
      return throwError(() => err);
    }),
  );
};
