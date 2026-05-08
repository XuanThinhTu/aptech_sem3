import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../services/chat-api.service';

export interface ChatPopupFriend {
  id: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  isGroup?: boolean;
  adminId?: string;
  conversationId?: string;
  memberIds?: string[]; 
}

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-popup.component.html',
  styleUrl: './chat-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPopupComponent {
  readonly friend = input.required<ChatPopupFriend>();
  readonly messages = input<ChatMessage[]>([]);
  readonly isLoading = input(false);
  readonly isSending = input(false);
  readonly errorMessage = input('');
  readonly myId = input<string>('');
  readonly draft = signal('');
  readonly viewMembers = output<void>();
  readonly close = output<void>();
  readonly sendMessage = output<string>();
  readonly kickMember = output<{ conversationId: string; targetUserId: string }>();
  readonly disbandGroup = output<string>();

  readonly canSend = computed(
    () => !!this.draft().trim() && !this.isSending(),
  );

  readonly isAdmin = computed(() => 
    this.friend().isGroup === true && String(this.friend().adminId) === String(this.myId())
  );

  protected send() {
    const content = this.draft().trim();
    if (!content || this.isSending()) {
      return;
    }

    this.sendMessage.emit(content);
    this.draft.set('');
  }

 protected onKick(targetUserId: string) {
  const conversationId = this.friend().conversationId || this.friend().id; 
  
  if (conversationId) {
    this.kickMember.emit({ conversationId, targetUserId });
  } else {
    console.error('Không tìm thấy ID của cuộc hội thoại để Kick');
  }
}
protected onHeaderClick() {
    if (this.friend().isGroup) {
      this.viewMembers.emit();
    }
  }
protected onDisband() {
  const conversationId = this.friend().conversationId || this.friend().id;

  if (conversationId) {
    console.log('Đang emit giải tán cho ID:', conversationId);
    this.disbandGroup.emit(conversationId);
  } else {
    console.error('Không tìm thấy ID của nhóm để Giải tán');
  }
}

  protected chatInitial(name: string) {
    return name.trim().charAt(0).toUpperCase();
  }

  protected messageTime(value: string) {
    const date = new Date(value);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}