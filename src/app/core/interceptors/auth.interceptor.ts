import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorageService } from '../services/token-storage.service';

/**
 * Attaches the JWT access token (RNF04 / §3.3.4) to outgoing API calls.
 * Skips Authorization header when the request already provides one or when
 * the URL is the login/refresh/recover endpoint.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const url = req.url.toLowerCase();
  if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/password-reset')) {
    return next(req);
  }

  const tokens = inject(TokenStorageService);
  const access = tokens.access();
  if (!access) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } }));
};
