import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStateService } from '../../../core/services/auth-state.service';
import { SiteLayoutComponent } from '../../../layout/site-layout.component';

import { ChatPopupComponent } from '../../chat/components/chat-popup.component';
import { ChatApiService, ChatMessage } from '../../chat/services/chat-api.service';

import { FriendsApiService } from '../../friends/services/friends-api.service';
import {
  FriendsRealtimeMessage,
  FriendsRealtimeService,
} from '../../friends/services/friends-realtime.service';
import { FriendshipStateService } from '../../friends/services/friendship-state.service';

import {
  FriendProfileResponse,
  ProfileApiService,
} from '../../profile/services/profile-api.service';

import {
  HomeApiService,
  HomeFriend,
  HomeGroup,
  HomeOrder,
  HomeServiceCard,
} from '../services/home-api.service';

import { ReaderPageComponent } from './reader/reader-page.component';

const ADMIN_INFO = {
  id: '69e219439a52b345c0c82898',
  email: 'admin@gmail.com',
  displayName: 'Hệ thống (Admin)',
  avatarUrl: '',
};

type HomeView = 'messages' | 'services' | 'history';
type HistoryStatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'CANCELED';
type NormalizedOrderStatus = 'APPROVED' | 'PENDING' | 'CANCELED';

interface HistoryUiStatus {
  key: NormalizedOrderStatus;
  label: string;
  actionLabel: string;
  icon: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SiteLayoutComponent,
    ChatPopupComponent,
    ReaderPageComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit {
  private static readonly friendsPerPage = 7;

  private readonly homeApi = inject(HomeApiService);
  private readonly authState = inject(AuthStateService);
  private readonly chatApi = inject(ChatApiService);
  private readonly chatApiService = inject(ChatApiService);
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
  protected readonly groups = signal<HomeGroup[]>([]);

  protected readonly servicesError = signal('');
  protected readonly friendsError = signal('');
  protected readonly ordersError = signal('');

  protected readonly servicesLoading = signal(true);
  protected readonly friendsLoading = signal(false);
  protected readonly ordersLoading = signal(false);

  protected readonly friendsSearchQuery = signal('');
  protected readonly currentFriendsPage = signal(1);

  protected readonly removingFriendId = signal('');
  protected readonly friendPendingRemoval = signal<HomeFriend | null>(null);

  protected readonly friendProfileTarget = signal<HomeFriend | null>(null);
  protected readonly friendProfileDetails = signal<FriendProfileResponse | null>(null);
  protected readonly friendProfileLoading = signal(false);
  protected readonly friendProfileError = signal('');

  protected readonly activeChatFriend = signal<HomeFriend | null>(null);
  protected readonly activeGroup = signal<HomeGroup | null>(null);

  protected readonly chatMessages = signal<ChatMessage[]>([]);
  protected readonly groupMessages = signal<ChatMessage[]>([]);

  protected readonly chatLoading = signal(false);
  protected readonly chatSending = signal(false);
  protected readonly chatError = signal('');

  protected readonly selectedServiceIds = signal<string[]>([]);
  protected readonly selectedService = signal<any>(null);

  protected readonly serviceActionMessage = signal('');
  protected readonly checkoutErrorMessage = signal('');
  protected readonly showSubscriptionDialog = signal(false);
  protected readonly isCreatingCheckout = signal(false);
  protected readonly selectedProvider = signal<'VNPAY' | 'PAYPAL'>('PAYPAL');

  protected readonly activeHomeView = signal<HomeView>('messages');

  protected readonly myOrders = signal<any[]>([]);
  protected readonly selectedOrder = signal<HomeOrder | null>(null);

  protected readonly historyPage = signal(1);
  protected readonly historyPageSize = 4;
  protected readonly historyStatusFilter = signal<HistoryStatusFilter>('ALL');

  protected readonly showCreateGroupModal = signal(false);
  protected readonly newGroupTitle = signal('');
  protected readonly selectedMemberIds = signal<string[]>([]);
  protected readonly isCreatingGroup = signal(false);

  protected readonly groupPendingMembers = signal<any | null>(null);

  private isUserAlreadyOwned = false;

  protected readonly servicesCountLabel = computed(
    () => `${this.services().length} services available`,
  );

  protected readonly connectedFriendsCount = computed(
    () => this.friends().filter((friend) => friend.isOnline).length,
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
    const allFriends = this.sortedFriends();

    const hasAdmin = allFriends.some((friend) => friend.id === ADMIN_INFO.id);

    let finalSidebarList: HomeFriend[] = [...allFriends];

    if (!hasAdmin) {
      const adminAccount = {
        ...ADMIN_INFO,
        isOnline: true,
        unreadCount: 0,
        lastMessage: 'Hỗ trợ dịch vụ...',
      } as any as HomeFriend;

      finalSidebarList = [adminAccount, ...allFriends];
    }

    if (!query) {
      return finalSidebarList;
    }

    return finalSidebarList.filter((friend) => {
      const displayName = friend.displayName?.toLowerCase() ?? '';
      const email = (friend as any).email?.toLowerCase() ?? '';

      return displayName.includes(query) || email.includes(query);
    });
  });

  protected readonly totalFriendsPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredFriends().length / HomePageComponent.friendsPerPage)),
  );

  protected readonly paginatedFriends = computed(() => {
    const currentPage = Math.min(this.currentFriendsPage(), this.totalFriendsPages());
    const startIndex = (currentPage - 1) * HomePageComponent.friendsPerPage;

    return this.filteredFriends().slice(startIndex, startIndex + HomePageComponent.friendsPerPage);
  });

  protected readonly friendPageNumbers = computed(() =>
    Array.from({ length: this.totalFriendsPages() }, (_, index) => index + 1),
  );

  protected readonly filteredOrders = computed(() => {
    const filter = this.historyStatusFilter();

    if (filter === 'ALL') {
      return this.myOrders();
    }

    return this.myOrders().filter((order) => this.normalizedOrderStatus(order) === filter);
  });

  protected readonly totalHistoryPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredOrders().length / this.historyPageSize)),
  );

  protected readonly paginatedOrders = computed(() => {
    const safePage = Math.min(this.historyPage(), this.totalHistoryPages());
    const start = (safePage - 1) * this.historyPageSize;

    return this.filteredOrders().slice(start, start + this.historyPageSize);
  });

  protected readonly historyPageNumbers = computed(() =>
    Array.from({ length: this.totalHistoryPages() }, (_, index) => index + 1),
  );

  protected readonly approvedOrdersCount = computed(
    () =>
      this.myOrders().filter((order) => this.normalizedOrderStatus(order) === 'APPROVED').length,
  );

  protected readonly pendingOrdersCount = computed(
    () => this.myOrders().filter((order) => this.normalizedOrderStatus(order) === 'PENDING').length,
  );

  protected readonly canceledOrdersCount = computed(
    () =>
      this.myOrders().filter((order) => this.normalizedOrderStatus(order) === 'CANCELED').length,
  );

  protected readonly ownedServiceIds = computed(() => {
    const ownedNames: string[] = [];

    this.myOrders()
      .filter((order) => this.normalizedOrderStatus(order) === 'APPROVED')
      .forEach((order) => {
        const title = String(order.serviceTitle || order.serviceName || '');

        const cleanTitle = title
          .replace(/Buy:/gi, '')
          .replace(/Subscription order:/gi, '')
          .trim();

        if (!cleanTitle) {
          return;
        }

        const parts = cleanTitle
          .split(',')
          .map((part: string) => part.trim())
          .filter(Boolean);

        ownedNames.push(...parts);
      });

    return ownedNames;
  });

  constructor() {
    effect(() => {
      const totalPages = this.totalFriendsPages();
      const currentPage = this.currentFriendsPage();

      if (currentPage > totalPages) {
        this.currentFriendsPage.set(totalPages);
      }
    });

    effect(() => {
      const totalPages = this.totalHistoryPages();
      const currentPage = this.historyPage();

      if (currentPage > totalPages) {
        this.historyPage.set(totalPages);
      }
    });

    effect(() => {
      const user = this.currentUser();

      this.friendshipState.version();

      if (!user) {
        this.friends.set([]);
        this.friendsError.set('');
        this.friendsLoading.set(false);
        this.groups.set([]);
        this.myOrders.set([]);
        return;
      }

      this.loadFriends(user.id);
      this.loadGroups();
      this.loadOrderHistory();
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
          this.loadOrderHistory();
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

  protected isServiceOwned(serviceTitle: string): boolean {
    if (!serviceTitle) {
      return false;
    }

    return this.ownedServiceIds().some(
      (ownedTitle) => ownedTitle.trim().toLowerCase() === serviceTitle.trim().toLowerCase(),
    );
  }

  protected openServiceContent(service: any) {
    this.selectedService.set(service);
  }

  protected openQuickSend(service: any) {
    console.log('Gửi nhanh gói:', service.title);
  }

  protected onFriendsSearchChange(query: string) {
    this.friendsSearchQuery.set(query);
    this.currentFriendsPage.set(1);
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

    this.activeGroup.set(null);
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
        this.chatError.set(error.error?.message ?? 'Unable to send this message right now.');
        this.chatSending.set(false);
      },
    });
  }

  protected openGroupChat(group: HomeGroup) {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    const groupId = (group as any)._id || group.id;
    const currentActiveId = (this.activeGroup() as any)?._id || this.activeGroup()?.id;

    if (currentActiveId === groupId && groupId !== undefined) {
      return;
    }

    this.activeChatFriend.set(null);
    this.activeGroup.set(group);
    this.groupMessages.set([]);
    this.chatError.set('');
    this.chatLoading.set(true);

    this.chatApi.getGroupMessages(groupId, user.id).subscribe({
      next: (res) => {
        this.groupMessages.set(res.messages || []);
        this.chatLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.chatError.set(error.error?.message ?? 'Không thể tải tin nhắn nhóm.');
        this.chatLoading.set(false);
      },
    });
  }

  protected closeGroupChat() {
    this.activeGroup.set(null);
    this.groupMessages.set([]);
    this.chatError.set('');
  }

  protected sendGroupChatMessage(content: string) {
    const user = this.currentUser();
    const group = this.activeGroup();

    if (!user || !group || !content.trim()) {
      return;
    }

    const groupId = (group as any)._id || group.id;

    this.chatSending.set(true);
    this.chatError.set('');

    this.chatApi.sendGroupMessage(user.id, groupId, content).subscribe({
      next: (response) => {
        this.groupMessages.update((messages) => [...messages, response.chatMessage]);
        this.chatSending.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.chatError.set(error.error?.message ?? 'Lỗi gửi tin nhắn vào nhóm.');
        this.chatSending.set(false);
      },
    });
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
        this.friendsError.set(error.error?.message ?? 'Unable to remove this friend right now.');
        this.removingFriendId.set('');
      },
    });
  }

  protected subscribeSelectedServices() {
    const selectedServices = this.services().filter((service) =>
      this.isServiceSelected(service.id),
    );
    const serviceKeys = selectedServices.map((service) => service.key);

    const user = this.currentUser();

    if (!user || serviceKeys.length === 0) {
      return;
    }

    this.isCreatingCheckout.set(true);

    this.homeApi.checkServiceOwnership(user.id, serviceKeys).subscribe({
      next: (response) => {
        this.isCreatingCheckout.set(false);

        if (response.owned) {
          this.isUserAlreadyOwned = true;

          this.activeHomeView.set('messages');

          const admin = this.filteredFriends().find((friend) => friend.id === ADMIN_INFO.id);

          if (admin) {
            this.openChat(admin);
          }

          alert('Bạn đã sở hữu các gói dịch vụ này rồi!');
          return;
        }

        this.isUserAlreadyOwned = false;
        this.showSubscriptionDialog.set(true);
      },
      error: (error) => {
        console.error('Lỗi kiểm tra sở hữu:', error);

        this.isCreatingCheckout.set(false);
        this.isUserAlreadyOwned = false;
        this.showSubscriptionDialog.set(true);
      },
    });
  }

  protected closeSubscriptionDialog() {
    if (this.isCreatingCheckout()) {
      return;
    }

    this.showSubscriptionDialog.set(false);
    this.checkoutErrorMessage.set('');
  }

  protected confirmSubscriptionCheckout() {
    if (this.isUserAlreadyOwned) {
      this.closeSubscriptionDialog();
      this.activeHomeView.set('messages');
      return;
    }

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
          this.isCreatingCheckout.set(false);

          if (error.status === 400 && error.error?.message === 'ALREADY_OWNED') {
            this.closeSubscriptionDialog();
            this.activeHomeView.set('messages');

            const admin = this.filteredFriends().find((friend) => friend.id === ADMIN_INFO.id);

            if (admin) {
              this.openChat(admin);
            }

            return;
          }

          const providerName = provider === 'PAYPAL' ? 'PayPal' : 'VNPay';
          const serverMessage =
            error.error?.message ?? `Unable to prepare your ${providerName} checkout.`;

          this.checkoutErrorMessage.set(serverMessage);
        },
      });
  }

  protected setHistoryFilter(filter: HistoryStatusFilter) {
    this.historyStatusFilter.set(filter);
    this.historyPage.set(1);
  }

  protected goToHistoryPage(page: number) {
    const safePage = Math.min(Math.max(page, 1), this.totalHistoryPages());
    this.historyPage.set(safePage);
  }

  protected orderUiStatus(order: any): HistoryUiStatus {
    const status = this.normalizedOrderStatus(order);

    if (status === 'APPROVED') {
      return {
        key: 'APPROVED',
        label: 'Approved',
        actionLabel: 'Completed',
        icon: '✓',
      };
    }

    if (status === 'CANCELED') {
      return {
        key: 'CANCELED',
        label: 'Canceled',
        actionLabel: 'Canceled',
        icon: '×',
      };
    }

    return {
      key: 'PENDING',
      label: 'Pending',
      actionLabel: 'Processing',
      icon: '•',
    };
  }

  viewOrderDetails(order: HomeOrder) {
    this.selectedOrder.set(order);
  }

  closeDetails() {
    this.selectedOrder.set(null);
  }

  protected openCreateGroupDialog() {
    this.newGroupTitle.set('');
    this.selectedMemberIds.set([]);
    this.showCreateGroupModal.set(true);
  }

  protected closeCreateGroupDialog() {
    this.showCreateGroupModal.set(false);
  }

  protected toggleMemberSelection(friendId: string) {
    const current = this.selectedMemberIds();

    if (current.includes(friendId)) {
      this.selectedMemberIds.set(current.filter((id) => id !== friendId));
      return;
    }

    this.selectedMemberIds.set([...current, friendId]);
  }

  protected confirmCreateGroup() {
    const user = this.currentUser();
    const title = this.newGroupTitle().trim();

    if (!user || !title) {
      return;
    }

    this.isCreatingGroup.set(true);

    this.chatApi.createGroup(title, user.id, this.selectedMemberIds()).subscribe({
      next: () => {
        this.isCreatingGroup.set(false);
        this.showCreateGroupModal.set(false);
        this.loadGroups();
        this.newGroupTitle.set('');
        this.selectedMemberIds.set([]);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi khi tạo nhóm:', error);
        this.isCreatingGroup.set(false);
        alert('Không thể tạo nhóm. Vui lòng kiểm tra lại kết nối!');
      },
    });
  }

  getMemberName(userId: string): string {
    if (userId === this.currentUser()?.id) {
      return 'Bạn';
    }

    const friend = this.friends().find((item) => item.id === userId);

    return friend ? friend.displayName : `Người dùng (${userId.substring(0, 4)})`;
  }

  handleKickMember(event: { conversationId: string; targetUserId: string }) {
    const currentUser = this.currentUser();

    if (!currentUser) {
      return;
    }

    if (confirm('Bạn có chắc chắn muốn mời thành viên này ra khỏi nhóm?')) {
      this.chatApiService
        .kickGroupMember(event.conversationId, event.targetUserId, currentUser.id)
        .subscribe({
          next: () => {
            this.loadGroups();
            alert('Đã mời thành viên ra khỏi nhóm.');
          },
          error: (error: HttpErrorResponse) => {
            alert(error.error?.message || 'Lỗi khi mời thành viên ra khỏi nhóm.');
          },
        });
    }
  }

  openViewMembersDialog(group: any) {
    this.groupPendingMembers.set(group);
  }

  closeViewMembersDialog() {
    this.groupPendingMembers.set(null);
  }

  onKickFromList(groupId: string, userId: string) {
    this.handleKickMember({ conversationId: groupId, targetUserId: userId });
  }

  handleDisbandGroup(groupId: string) {
    const currentUser = this.currentUser();

    if (!currentUser) {
      return;
    }

    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn giải tán nhóm này? Mọi tin nhắn sẽ bị xóa.')) {
      this.chatApi.disbandGroup(groupId, currentUser.id).subscribe({
        next: () => {
          this.closeGroupChat();
          this.loadGroups();
          alert('Nhóm đã được giải tán thành công.');
        },
        error: (error: HttpErrorResponse) => {
          alert(error.error?.message || 'Lỗi khi giải tán nhóm.');
        },
      });
    }
  }

  private loadServices() {
    this.servicesLoading.set(true);

    this.homeApi.getServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.serviceActionMessage.set('');
        this.servicesError.set('');
        this.servicesLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.servicesError.set(error.error?.message ?? 'Unable to load services right now.');
        this.servicesLoading.set(false);
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
        this.friendsError.set(error.error?.message ?? 'Unable to load friends right now.');

        if (showLoading) {
          this.friendsLoading.set(false);
        }
      },
    });
  }

  private loadGroups() {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.chatApiService.getUserGroups(user.id).subscribe({
      next: (groups) => {
        this.groups.set(groups);
      },
      error: (error) => {
        console.error('Lỗi khi tải nhóm:', error);
      },
    });
  }

  private loadOrderHistory() {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.ordersLoading.set(true);
    this.ordersError.set('');

    this.homeApi.getOrderHistory(user.id).subscribe({
      next: (orders) => {
        this.myOrders.set(Array.isArray(orders) ? orders : []);
        this.ordersLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.ordersError.set(error.error?.message ?? 'Unable to load order history right now.');
        this.ordersLoading.set(false);
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
        if (friendUserId === ADMIN_INFO.id) {
          this.chatError.set('');
          this.chatMessages.set([]);
        } else {
          this.chatError.set(error.error?.message ?? 'Unable to load this conversation right now.');
        }

        this.chatLoading.set(false);
      },
    });
  }

  private handleRealtimeMessage(realtimeMessage: FriendsRealtimeMessage, userId: string) {
    const activeFriend = this.activeChatFriend();

    const payload = realtimeMessage.payload as Partial<ChatMessage> & {
      userId?: string;
      friendUserId?: string;
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
              ? {
                  ...message,
                  isRead: true,
                  readAt: String(payload.readAt ?? new Date().toISOString()),
                }
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
              ? {
                  ...message,
                  isRead: true,
                  readAt: message.readAt ?? new Date().toISOString(),
                }
              : message,
          ),
        );

        if (reloadFriends) {
          this.loadFriends(user.id, false);
        }
      },
      error: () => {},
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
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    });
  }

  private normalizedOrderStatus(order: any): NormalizedOrderStatus {
    const rawStatus = String(
      order?.status ?? order?.orderStatus ?? order?.paymentStatus ?? order?.transactionStatus ?? '',
    )
      .trim()
      .toLowerCase();

    if (
      rawStatus === 'approved' ||
      rawStatus === 'success' ||
      rawStatus === 'completed' ||
      rawStatus === 'complete' ||
      rawStatus === 'paid'
    ) {
      return 'APPROVED';
    }

    if (
      rawStatus === 'cancelled' ||
      rawStatus === 'canceled' ||
      rawStatus === 'cancel' ||
      rawStatus === 'failed' ||
      rawStatus === 'rejected'
    ) {
      return 'CANCELED';
    }

    return 'PENDING';
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
      readAt: !payload.readAt ? null : String(payload.readAt),
      senderDisplayName: payload.senderDisplayName ? String(payload.senderDisplayName) : undefined,
      senderAvatarUrl: payload.senderAvatarUrl ? String(payload.senderAvatarUrl) : undefined,
      recipientDisplayName: payload.recipientDisplayName
        ? String(payload.recipientDisplayName)
        : undefined,
      recipientAvatarUrl: payload.recipientAvatarUrl
        ? String(payload.recipientAvatarUrl)
        : undefined,
    };
  }
}
