import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
} from 'rxjs';
import { AuthStateService } from '../core/services/auth-state.service';
import {
  FriendSearchResult,
  FriendsApiService,
  IncomingFriendRequest,
} from '../features/friends/services/friends-api.service';
import { FriendsRealtimeService } from '../features/friends/services/friends-realtime.service';
import { FriendshipStateService } from '../features/friends/services/friendship-state.service';

@Component({
  selector: 'app-site-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './site-layout.component.html',
  styleUrl: './site-layout.component.css',
})
export class SiteLayoutComponent {
  readonly showFriendSearch = input(true);
  readonly brandRoute = input('/');
  readonly primaryLinkLabel = input('Home');
  readonly primaryLinkRoute = input('/');
  readonly secondaryLinkLabel = input('');
  readonly secondaryLinkRoute = input('');
  readonly profileRoute = input('/profile');

  private readonly authState = inject(AuthStateService);
  private readonly friendsApi = inject(FriendsApiService);
  private readonly friendsRealtime = inject(FriendsRealtimeService);
  private readonly friendshipState = inject(FriendshipStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  protected readonly currentUser = this.authState.currentUser;
  protected readonly isLoggedIn = this.authState.isLoggedIn;
  protected currentUrl = this.router.url;
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<FriendSearchResult[]>([]);
  protected readonly searchLoading = signal(false);
  protected readonly searchError = signal('');
  protected readonly requestMessage = signal('');
  protected readonly sendingRequestId = signal('');
  protected readonly incomingRequests = signal<IncomingFriendRequest[]>([]);
  protected readonly incomingRequestsCount = signal(0);
  protected readonly requestsLoading = signal(false);
  protected readonly requestsError = signal('');
  protected readonly requestsOpen = signal(false);
  protected readonly respondingRequestId = signal('');

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
      });

    this.searchTerms
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          const user = this.currentUser();
          const normalizedQuery = query.trim();

          if (!user || !normalizedQuery) {
            this.searchLoading.set(false);
            this.searchResults.set([]);
            this.searchError.set('');
            return of<FriendSearchResult[]>([]);
          }

          return this.fetchSearchResults(user.id, normalizedQuery);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.searchLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.searchError.set(
            error.error?.message ?? 'Unable to search for accounts right now.',
          );
          this.searchLoading.set(false);
        },
      });

    this.friendsRealtime.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const user = this.currentUser();
        if (!user) {
          this.incomingRequests.set([]);
          this.incomingRequestsCount.set(0);
          return;
        }

        this.refreshIncomingRequests(user.id);

        const query = this.searchQuery().trim();
        if (query) {
          this.searchLoading.set(true);
          this.fetchSearchResults(user.id, query).subscribe({
            next: (results) => {
              this.searchResults.set(results);
              this.searchLoading.set(false);
            },
            error: (error: HttpErrorResponse) => {
              this.searchError.set(
                error.error?.message ?? 'Unable to search for accounts right now.',
              );
              this.searchLoading.set(false);
            },
          });
        }
      });

    const initialUser = this.currentUser();
    if (initialUser) {
      this.refreshIncomingRequests(initialUser.id);
    }
  }

  protected logout() {
    this.authState.logout();
    this.clearSearch();
    this.incomingRequests.set([]);
    this.incomingRequestsCount.set(0);
    this.requestsOpen.set(false);
    this.router.navigate(['/']);
  }

  protected isActive(path: string) {
    return this.currentUrl === path;
  }

  protected onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.requestMessage.set('');

    if (!query.trim()) {
      this.clearSearch(false);
      return;
    }

    this.searchTerms.next(query);
  }

  protected sendFriendRequest(result: FriendSearchResult) {
    const user = this.currentUser();
    if (!user || result.relationshipStatus !== 'none') {
      return;
    }

    this.requestMessage.set('');
    this.sendingRequestId.set(result.id);
    this.friendsApi.sendFriendRequest(user.id, result.id).subscribe({
      next: (response) => {
        this.searchResults.update((results) =>
          results.map((item) =>
            item.id === result.id
              ? { ...item, relationshipStatus: response.relationshipStatus }
              : item,
          ),
        );
        this.requestMessage.set(response.message);
        this.sendingRequestId.set('');
        this.friendshipState.notifyChanged();
      },
      error: (error: HttpErrorResponse) => {
        this.searchError.set(
          error.error?.message ?? 'Unable to send this friend request right now.',
        );
        this.sendingRequestId.set('');
      },
    });
  }

  protected cancelFriendRequest(result: FriendSearchResult) {
    const user = this.currentUser();
    if (!user || result.relationshipStatus !== 'pending_sent') {
      return;
    }

    this.requestMessage.set('');
    this.sendingRequestId.set(result.id);
    this.friendsApi.cancelFriendRequest(user.id, result.id).subscribe({
      next: (response) => {
        this.searchResults.update((results) =>
          results.map((item) =>
            item.id === result.id
              ? { ...item, relationshipStatus: response.relationshipStatus }
              : item,
          ),
        );
        this.requestMessage.set(response.message);
        this.sendingRequestId.set('');
        this.friendshipState.notifyChanged();
      },
      error: (error: HttpErrorResponse) => {
        this.searchError.set(
          error.error?.message ?? 'Unable to cancel this friend request right now.',
        );
        this.sendingRequestId.set('');
      },
    });
  }

  protected toggleRequestsDropdown() {
    const nextState = !this.requestsOpen();
    this.requestsOpen.set(nextState);

    const user = this.currentUser();
    if (nextState && user) {
      this.refreshIncomingRequests(user.id);
    }
  }

  protected respondToRequest(
    request: IncomingFriendRequest,
    action: 'accept' | 'reject',
  ) {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.respondingRequestId.set(request.requestId);
    this.requestsError.set('');
    this.requestMessage.set('');
    this.friendsApi.respondToRequest(user.id, request.requestId, action).subscribe({
      next: (response) => {
        this.incomingRequests.update((items) =>
          items.filter((item) => item.requestId !== request.requestId),
        );
        this.incomingRequestsCount.update((count) => Math.max(0, count - 1));
        this.searchResults.update((results) =>
          results.map((item) =>
            item.id === response.senderUserId
              ? { ...item, relationshipStatus: response.relationshipStatus }
              : item,
          ),
        );
        this.requestMessage.set(response.message);
        this.respondingRequestId.set('');
        this.friendshipState.notifyChanged();
      },
      error: (error: HttpErrorResponse) => {
        this.requestsError.set(
          error.error?.message ?? 'Unable to update this friend request right now.',
        );
        this.respondingRequestId.set('');
      },
    });
  }

  protected profileInitial(name: string) {
    return name.trim().charAt(0).toUpperCase();
  }

  protected searchActionLabel(result: FriendSearchResult) {
    switch (result.relationshipStatus) {
      case 'pending_sent':
        return 'x';
      case 'pending_received':
        return 'Requested you';
      case 'friends':
        return 'Friend';
      default:
        return '+';
    }
  }

  protected isSearchActionButton(result: FriendSearchResult) {
    return result.relationshipStatus === 'none' || result.relationshipStatus === 'pending_sent';
  }

  private clearSearch(resetQuery = true) {
    if (resetQuery) {
      this.searchQuery.set('');
    }
    this.searchResults.set([]);
    this.searchError.set('');
    this.searchLoading.set(false);
    this.requestMessage.set('');
    this.sendingRequestId.set('');
  }

  private fetchSearchResults(userId: string, query: string) {
    this.searchLoading.set(true);
    this.searchError.set('');
    return this.friendsApi.searchUsers(userId, query);
  }

  private refreshIncomingRequests(userId: string) {
    this.requestsLoading.set(true);
    this.friendsApi.getIncomingRequests(userId).subscribe({
      next: (response) => {
        this.incomingRequests.set(response.requests);
        this.incomingRequestsCount.set(response.count);
        this.requestsLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.requestsError.set(
          error.error?.message ?? 'Unable to load friend requests right now.',
        );
        this.requestsLoading.set(false);
      },
    });
  }
}
