import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  kind: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description?: string;
  ttl: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly itemsSignal = signal<ToastMessage[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  push(kind: ToastMessage['kind'], title: string, description?: string, ttl = 4500): void {
    const id = ++this.nextId;
    const message: ToastMessage = { id, kind, title, description, ttl };
    this.itemsSignal.update((current) => [...current, message]);
    if (ttl > 0) {
      setTimeout(() => this.dismiss(id), ttl);
    }
  }

  success(title: string, description?: string): void {
    this.push('success', title, description);
  }
  info(title: string, description?: string): void {
    this.push('info', title, description);
  }
  warning(title: string, description?: string): void {
    this.push('warning', title, description);
  }
  danger(title: string, description?: string): void {
    this.push('danger', title, description, 6000);
  }

  dismiss(id: number): void {
    this.itemsSignal.update((current) => current.filter((m) => m.id !== id));
  }
}
