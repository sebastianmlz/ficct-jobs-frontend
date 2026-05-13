import { Injectable, signal } from "@angular/core";

const ACCESS_KEY = "ficct.jwt.access";
const REFRESH_KEY = "ficct.jwt.refresh";

@Injectable({ providedIn: "root" })
export class TokenStorageService {
  private readonly accessSignal = signal<string | null>(this.read(ACCESS_KEY));
  private readonly refreshSignal = signal<string | null>(
    this.read(REFRESH_KEY),
  );

  readonly access = this.accessSignal.asReadonly();
  readonly refresh = this.refreshSignal.asReadonly();

  set(access: string, refresh: string): void {
    this.accessSignal.set(access);
    this.refreshSignal.set(refresh);
    this.write(ACCESS_KEY, access);
    this.write(REFRESH_KEY, refresh);
  }

  clear(): void {
    this.accessSignal.set(null);
    this.refreshSignal.set(null);
    this.remove(ACCESS_KEY);
    this.remove(REFRESH_KEY);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable; ignore
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
