import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  displayName: string;
  avatarUrl: string;
}

const STORAGE_KEY = 'project-sem3-auth-user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly currentUserSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());
  readonly isManagementUser = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'admin' || role === 'superadmin';
  });

  setUser(user: AuthUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  updateUser(partialUser: Partial<AuthUser>) {
    const currentUser = this.currentUserSignal();
    if (!currentUser) {
      return;
    }

    this.setUser({
      ...currentUser,
      ...partialUser,
    });
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUserSignal.set(null);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser>;
      if (!parsed.id || !parsed.username || !parsed.email || !parsed.mobileNumber || !parsed.role) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return {
        id: parsed.id,
        username: parsed.username,
        email: parsed.email,
        mobileNumber: parsed.mobileNumber,
        role: parsed.role,
        displayName: parsed.displayName ?? parsed.username,
        avatarUrl: parsed.avatarUrl ?? 'http://127.0.0.1:3000/uploads/no-image.jpg',
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
