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
  readonly draft = signal('');

  readonly close = output<void>();
  readonly sendMessage = output<string>();

  readonly canSend = computed(
    () => !!this.draft().trim() && !this.isSending(),
  );

  protected send() {
    const content = this.draft().trim();
    if (!content || this.isSending()) {
      return;
    }

    this.sendMessage.emit(content);
    this.draft.set('');
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
