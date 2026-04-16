import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FriendshipStateService {
  private readonly versionSignal = signal(0);

  readonly version = computed(() => this.versionSignal());

  notifyChanged() {
    this.versionSignal.update((value) => value + 1);
  }
}
