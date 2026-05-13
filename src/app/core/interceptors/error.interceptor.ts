import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

import { TokenStorageService } from "../services/token-storage.service";

/**
 * On 401 responses, clear stored tokens and redirect the user to login.
 * Other errors are passed through for the calling code to surface a UI
 * message via its own component-level error state.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokens = inject(TokenStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 401 &&
        !req.url.toLowerCase().includes("/auth/login")
      ) {
        tokens.clear();
        void router.navigate(["/auth/login"], {
          queryParams: { reason: "session_expired" },
        });
      }
      return throwError(() => err);
    }),
  );
};
