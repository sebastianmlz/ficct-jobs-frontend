import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type Params = Record<string, string | number | boolean | undefined | null>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  get<T>(path: string, params?: Params): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.params(params) });
  }

  getBlob(path: string, params?: Params): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.params(params),
      responseType: 'blob',
    });
  }

  post<T>(path: string, body?: unknown, options?: { isMultipart?: boolean }): Observable<T> {
    if (options?.isMultipart) {
      return this.http.post<T>(this.url(path), body);
    }
    return this.http.post<T>(this.url(path), body, { headers: this.jsonHeaders() });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body, { headers: this.jsonHeaders() });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body, { headers: this.jsonHeaders() });
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  url(path: string): string {
    return path.startsWith('http') ? path : `${this.base}${this.normalizePath(path)}`;
  }

  private normalizePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }

  private params(params?: Params): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let result = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      result = result.set(key, String(value));
    }
    return result;
  }

  private jsonHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
}
