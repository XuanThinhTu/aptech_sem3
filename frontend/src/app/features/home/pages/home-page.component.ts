import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ChatPopupComponent } from '../../chat/components/chat-popup.component';
import { ChatApiService, ChatMessage } from '../../chat/services/chat-api.service';
import { FriendsApiService } from '../../friends/services/friends-api.service';
import { FriendsRealtimeMessage, FriendsRealtimeService } from '../../friends/services/friends-realtime.service';
import { FriendshipStateService } from '../../friends/services/friendship-state.service';
import { HomeApiService, HomeFriend, HomeServiceCard, SubscriptionCheckoutPayload } from '../services/home-api.service';
import { SiteLayoutComponent } from '../../../layout/site-layout.component';
import { FriendProfileResponse, ProfileApiService } from '../../profile/services/profile-api.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SiteLayoutComponent, ChatPopupComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit {
  private static readonly friendsPerPage = 7;
  private readonly homeApi = inject(HomeApiService);
  private readonly authState = inject(AuthStateService);
  private readonly chatApi = inject(ChatApiService);
  private readonly friendsApi = inject(FriendsApiService);
  private readonly friendsRealtime = inject(FriendsRealtimeService);
  private readonly friendshipState = inject(FriendshipStateService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly currentUser = this.authState.currentUser;
  protected readonly isLoggedIn = this.authState.isLoggedIn;
  protected readonly services = signal<HomeServiceCard[]>([]);
  protected readonly friends = signal<HomeFriend[]>([]);
  protected readonly servicesError = signal('');
  protected readonly friendsError = signal('');
  protected readonly servicesLoading = signal(true);
  protected readonly friendsLoading = signal(false);
  protected readonly friendsSearchQuery = signal('');
  protected readonly currentFriendsPage = signal(1);
  protected readonly removingFriendId = signal('');
  protected readonly friendPendingRemoval = signal<HomeFriend | null>(null);
  protected readonly friendProfileTarget = signal<HomeFriend | null>(null);
  protected readonly friendProfileDetails = signal<FriendProfileResponse | null>(null);
  protected readonly friendProfileLoading = signal(false);
  protected readonly friendProfileError = signal('');
  protected readonly activeChatFriend = signal<HomeFriend | null>(null);
  protected readonly chatMessages = signal<ChatMessage[]>([]);
  protected readonly chatLoading = signal(false);
  protected readonly chatSending = signal(false);
  protected readonly chatError = signal('');
  protected readonly selectedServiceIds = signal<string[]>([]);
  protected readonly serviceActionMessage = signal('');
  protected readonly checkoutErrorMessage = signal('');
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly isCreatingCheckout = signal(false);
  protected readonly selectedProvider = signal<'VNPAY' | 'PAYPAL'>('PAYPAL');   
  protected readonly servicesCountLabel = computed(
    () => `${this.services().length} services available`,
  );
  protected readonly connectedFriendsCount = computed(
    () => this.friends().filter((friend) => friend.isOnline).length,
  );
  protected readonly sortedFriends = computed(() =>
    [...this.friends()].sort((left, right) => {
      if (right.unreadCount !== left.unreadCount) {
        return right.unreadCount - left.unreadCount;
      }

      if (left.isOnline !== right.isOnline) {
        return Number(right.isOnline) - Number(left.isOnline);
      }

      return left.displayName.localeCompare(right.displayName);
    }),
  );
  protected readonly filteredFriends = computed(() => {
    const query = this.friendsSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.sortedFriends();
    }

    return this.sortedFriends().filter((friend) =>
      friend.displayName.toLowerCase().includes(query),
    );
  });
  protected readonly totalFriendsPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredFriends().length / HomePageComponent.friendsPerPage)),
  );
  protected readonly paginatedFriends = computed(() => {
    const currentPage = Math.min(this.currentFriendsPage(), this.totalFriendsPages());
    const startIndex = (currentPage - 1) * HomePageComponent.friendsPerPage;
    return this.filteredFriends().slice(
      startIndex,
      startIndex + HomePageComponent.friendsPerPage,
    );
  });
  protected readonly friendPageNumbers = computed(() =>
    Array.from({ length: this.totalFriendsPages() }, (_, index) => index + 1),
  );
  protected readonly selectedServicesLabel = computed(
    () => `${this.selectedServiceIds().length} selected`,
  );
  protected readonly selectedServices = computed(() =>
    this.services().filter((service) => this.selectedServiceIds().includes(service.id)),
  );
  protected readonly selectedServicesTotal = computed(() =>
    this.selectedServices().reduce((sum, service) => sum + service.monthlyPrice, 0),
  );

  constructor() {
    effect(() => {
      const totalPages = this.totalFriendsPages();
      const currentPage = this.currentFriendsPage();

      if (currentPage > totalPages) {
        this.currentFriendsPage.set(totalPages);
      }
    });

    effect(() => {
      const user = this.currentUser();
      this.friendshipState.version();

      if (!user) {
        this.friends.set([]);
        this.friendsError.set('');
        this.friendsLoading.set(false);
        return;
      }

      this.loadFriends(user.id);
    });

    this.friendsRealtime.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((realtimeMessage) => {
        const user = this.currentUser();
        if (!user) {
          return;
        }

        if (realtimeMessage.event === 'services-updated') {
          this.loadServices();
        }

        this.handleRealtimeMessage(realtimeMessage, user.id);
      });
  }

  ngOnInit() {
    this.loadServices();
  }

  protected profileInitial(name: string) {
    return name.trim().charAt(0).toUpperCase();
  }

  protected toggleService(serviceId: string, checked: boolean) {
    const current = this.selectedServiceIds();
    if (checked) {
      if (!current.includes(serviceId)) {
        this.selectedServiceIds.set([...current, serviceId]);
      }
      return;
    }

    this.selectedServiceIds.set(current.filter((id) => id !== serviceId));
  }

  protected isServiceSelected(serviceId: string) {
    return this.selectedServiceIds().includes(serviceId);
  }

  protected onFriendsSearchChange(query: string) {
    this.friendsSearchQuery.set(query);
    this.currentFriendsPage.set(1);
  }

  protected openFriendProfile(friend: HomeFriend) {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.friendProfileLoading.set(true);
    this.friendProfileError.set('');
    this.friendProfileTarget.set(friend);
    this.friendProfileDetails.set(null);
    this.profileApi.getFriendProfile(user.id, friend.id).subscribe({
      next: (response) => {
        this.friendProfileDetails.set(response);
        this.friendProfileLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.friendProfileError.set(
          error.error?.message ?? 'Unable to load this friend profile right now.',
        );
        this.friendProfileLoading.set(false);
      },
    });
  }

  protected closeFriendProfileDialog() {
    if (this.friendProfileLoading()) {
      return;
    }

    this.friendProfileTarget.set(null);
    this.friendProfileDetails.set(null);
    this.friendProfileError.set('');
  }

  protected openChat(friend: HomeFriend) {
    const currentFriend = this.activeChatFriend();
    if (currentFriend?.id === friend.id) {
      return;
    }

    this.activeChatFriend.set(friend);
    this.chatMessages.set([]);
    this.chatError.set('');
    this.loadConversation(friend.id);
  }

  protected closeChat() {
    this.activeChatFriend.set(null);
    this.chatMessages.set([]);
    this.chatError.set('');
  }

  protected sendChatMessage(content: string) {
    const user = this.currentUser();
    const friend = this.activeChatFriend();
    if (!user || !friend || !content.trim()) {
      return;
    }

    this.chatSending.set(true);
    this.chatError.set('');
    this.chatApi.sendMessage(user.id, friend.id, content).subscribe({
      next: (response) => {
        this.upsertChatMessage(this.normalizeChatMessage(response.chatMessage, user.id));
        this.chatSending.set(false);
        this.loadFriends(user.id, false);
      },
      error: (error: HttpErrorResponse) => {
        this.chatError.set(
          error.error?.message ?? 'Unable to send this message right now.',
        );
        this.chatSending.set(false);
      },
    });
  }

  protected goToFriendsPage(page: number) {
    if (page < 1 || page > this.totalFriendsPages() || page === this.currentFriendsPage()) {
      return;
    }

    this.currentFriendsPage.set(page);
  }

  protected shouldShowUnreadBadge(friend: HomeFriend) {
    return friend.unreadCount > 0 && this.activeChatFriend()?.id !== friend.id;
  }

  protected openRemoveFriendDialog(friend: HomeFriend) {
    this.friendPendingRemoval.set(friend);
    this.friendsError.set('');
  }

  protected closeRemoveFriendDialog() {
    if (this.removingFriendId()) {
      return;
    }

    this.friendPendingRemoval.set(null);
  }

  protected confirmRemoveFriend() {
    const user = this.currentUser();
    const friend = this.friendPendingRemoval();
    if (!user || !friend) {
      return;
    }

    this.removingFriendId.set(friend.id);
    this.friendsApi.removeFriend(user.id, friend.id).subscribe({
      next: () => {
        this.friends.update((items) => items.filter((item) => item.id !== friend.id));
        this.friendshipState.notifyChanged();
        this.removingFriendId.set('');
        this.friendPendingRemoval.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.friendsError.set(
          error.error?.message ?? 'Unable to remove this friend right now.',
        );
        this.removingFriendId.set('');
      },
    });
  }

  protected subscribeSelectedServices() {
    const selectedCount = this.selectedServiceIds().length;
    if (!selectedCount) {
      return;
    }

    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.checkoutErrorMessage.set('');
    this.serviceActionMessage.set('');
    this.showSubscriptionDialog.set(true);
  }

  protected closeSubscriptionDialog() {
    if (this.isCreatingCheckout()) {
      return;
    }

    this.showSubscriptionDialog.set(false);
    this.checkoutErrorMessage.set('');
  }

  // protected confirmSubscriptionCheckout() {
  //   const user = this.currentUser();
  //   const serviceIds = this.selectedServiceIds();
  //   if (!user || !serviceIds.length) {
  //     return;
  //   }

  //   this.isCreatingCheckout.set(true);
  //   this.checkoutErrorMessage.set('');

  //   this.homeApi
  //     .createSubscriptionCheckout({
  //       userId: user.id,
  //       serviceIds,
  //     })
  //     .subscribe({
  //       next: (response) => {
  //         window.location.href = response.paymentUrl;
  //       },
  //       error: (error: HttpErrorResponse) => {
  //         this.checkoutErrorMessage.set(
  //           error.error?.message ?? 'Unable to prepare your VNPay checkout right now.',
  //         );
  //         this.isCreatingCheckout.set(false);
  //       },
  //     });
  // }
protected confirmSubscriptionCheckout() {
  const user = this.currentUser();
  const serviceIds = this.selectedServiceIds();
  const provider = this.selectedProvider(); 

  if (!user || !serviceIds.length) {
    return;
  }

  this.isCreatingCheckout.set(true);
  this.checkoutErrorMessage.set('');

  this.homeApi
    .createSubscriptionCheckout({
      userId: user.id,
      serviceIds,
      provider, 
    })
    .subscribe({
      next: (response) => {
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        }
      },
      error: (error: HttpErrorResponse) => {
        const msg = provider === 'PAYPAL' ? 'PayPal' : 'VNPay';
        this.checkoutErrorMessage.set(
          error.error?.message ?? `Unable to prepare your ${msg} checkout right now.`
        );
        this.isCreatingCheckout.set(false);
      },
    });
}

  private loadServices() {
    this.homeApi.getServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.serviceActionMessage.set('');
        this.servicesLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.servicesError.set(
          error.error?.message ?? 'Unable to load services right now.',
        );
        this.servicesLoading.set(false);
      },
    });
  }

  private loadConversation(friendUserId: string) {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.chatLoading.set(true);
    this.chatError.set('');
    this.chatApi.getConversation(user.id, friendUserId).subscribe({
      next: (response) => {
        this.chatMessages.set(response.messages);
        this.chatLoading.set(false);
        this.markConversationRead(friendUserId);
      },
      error: (error: HttpErrorResponse) => {
        this.chatError.set(
          error.error?.message ?? 'Unable to load this conversation right now.',
        );
        this.chatLoading.set(false);
      },
    });
  }

  private loadFriends(userId: string, showLoading = true) {
    if (showLoading) {
      this.friendsLoading.set(true);
    }
    this.homeApi.getFriends(userId).subscribe({
      next: (friends) => {
        this.friends.set(friends);
        this.friendsError.set('');
        if (showLoading) {
          this.friendsLoading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.friendsError.set(
          error.error?.message ?? 'Unable to load friends right now.',
        );
        if (showLoading) {
          this.friendsLoading.set(false);
        }
      },
    });
  }

  private handleRealtimeMessage(realtimeMessage: FriendsRealtimeMessage, userId: string) {
    const activeFriend = this.activeChatFriend();
    const payload = realtimeMessage.payload as Partial<ChatMessage> & {
      userId?: string;
      friendUserId?: string;
      senderDisplayName?: string;
      senderAvatarUrl?: string;
      recipientDisplayName?: string;
      recipientAvatarUrl?: string;
      readAt?: string | null;
    };

    if (realtimeMessage.event === 'chat-message') {
      if (payload.senderUserId && payload.recipientUserId) {
        const normalizedMessage = this.normalizeChatMessage(payload, userId);

        if (activeFriend?.id === normalizedMessage.friendUserId) {
          this.upsertChatMessage(normalizedMessage);
          if (!normalizedMessage.isOwnMessage) {
            this.markConversationRead(normalizedMessage.friendUserId, false);
          }
        }
      }
    }

    if (realtimeMessage.event === 'conversation-read' && activeFriend) {
      if (payload.userId === activeFriend.id) {
        this.chatMessages.update((messages) =>
          messages.map((message) =>
            message.isOwnMessage
              ? { ...message, isRead: true, readAt: String(payload.readAt ?? new Date().toISOString()) }
              : message,
          ),
        );
      }
    }

    this.loadFriends(userId, false);
  }

  private markConversationRead(friendUserId: string, reloadFriends = true) {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.chatApi.markConversationRead(user.id, friendUserId).subscribe({
      next: () => {
        this.chatMessages.update((messages) =>
          messages.map((message) =>
            !message.isOwnMessage
              ? { ...message, isRead: true, readAt: message.readAt ?? new Date().toISOString() }
              : message,
          ),
        );
        if (reloadFriends) {
          this.loadFriends(user.id, false);
        }
      },
      error: () => {
        // Keep the chat usable even if the read receipt update fails.
      },
    });
  }

  private upsertChatMessage(message: ChatMessage) {
    this.chatMessages.update((messages) => {
      const existingIndex = messages.findIndex((item) => item.id === message.id);
      if (existingIndex >= 0) {
        const nextMessages = [...messages];
        nextMessages[existingIndex] = message;
        return nextMessages;
      }

      return [...messages, message].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    });
  }

  private normalizeChatMessage(payload: Partial<ChatMessage>, currentUserId: string): ChatMessage {
    const senderUserId = String(payload.senderUserId ?? '');
    const recipientUserId = String(payload.recipientUserId ?? '');
    const isOwnMessage = senderUserId === currentUserId;

    return {
      id: String(payload.id ?? ''),
      senderUserId,
      recipientUserId,
      friendUserId: isOwnMessage ? recipientUserId : senderUserId,
      content: String(payload.content ?? ''),
      createdAt: String(payload.createdAt ?? new Date().toISOString()),
      isOwnMessage,
      isRead: Boolean(payload.isRead),
      readAt:
        payload.readAt === null || payload.readAt === undefined
          ? null
          : String(payload.readAt),
      senderDisplayName:
        payload.senderDisplayName === undefined
          ? undefined
          : String(payload.senderDisplayName),
      senderAvatarUrl:
        payload.senderAvatarUrl === undefined
          ? undefined
          : String(payload.senderAvatarUrl),
      recipientDisplayName:
        payload.recipientDisplayName === undefined
          ? undefined
          : String(payload.recipientDisplayName),
      recipientAvatarUrl:
        payload.recipientAvatarUrl === undefined
          ? undefined
          : String(payload.recipientAvatarUrl),
    };
  }
}
