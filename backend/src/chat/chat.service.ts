import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MessageDeliveryStatus,
  MessageRecipientType,
} from '../database/enums/database.enums';
import { Friendship, FriendshipDocument } from '../database/schemas/friendship.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { Profile, ProfileDocument } from '../database/schemas/profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';

@Injectable()
export class ChatService {
  private readonly backendBaseUrl: string;
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';

  constructor(
    private readonly configService: ConfigService,
    private readonly friendsRealtimeService: FriendsRealtimeService,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
  }

  async getConversation(userId: string, friendUserId: string) {
    const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
    await this.ensureFriends(currentUserObjectId, friendUserObjectId);

    const messages = await this.messageModel
      .find({
        recipientType: MessageRecipientType.FRIEND,
        $or: [
          {
            senderUserId: currentUserObjectId,
            recipientUserId: friendUserObjectId,
          },
          {
            senderUserId: friendUserObjectId,
            recipientUserId: currentUserObjectId,
          },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return {
      messages: messages.map((message) => this.toConversationMessage(message, userId)),
    };
  }

  async getUnreadCounts(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const unreadItems = await this.messageModel.aggregate<{
      friendUserId: Types.ObjectId;
      unreadCount: number;
    }>([
      {
        $match: {
          recipientUserId: new Types.ObjectId(userId),
          recipientType: MessageRecipientType.FRIEND,
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$senderUserId',
          unreadCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          friendUserId: '$_id',
          unreadCount: 1,
        },
      },
    ]);

    return unreadItems.map((item) => ({
      friendUserId: String(item.friendUserId),
      unreadCount: item.unreadCount,
    }));
  }

  async sendMessage(userId: string, friendUserId: string, rawContent: string) {
    const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('Message content is required.');
    }

    await this.ensureFriends(currentUserObjectId, friendUserObjectId);

    const [sender, recipient, recipientProfile] = await Promise.all([
      this.userModel.findById(currentUserObjectId),
      this.userModel.findById(friendUserObjectId),
      this.profileModel.findOne({ userId: friendUserObjectId }).lean(),
    ]);

    if (!sender || !recipient) {
      throw new BadRequestException('Chat account was not found.');
    }

    const message = await this.messageModel.create({
      senderUserId: sender._id,
      recipientUserId: recipient._id,
      recipientPhoneNumber: recipient.mobileNumber,
      recipientName: recipientProfile?.name ?? recipient.username,
      content,
      recipientType: MessageRecipientType.FRIEND,
      isFree: true,
      chargeAmount: 0,
      countedAgainstDailyFreeLimit: false,
      deliveryStatus: MessageDeliveryStatus.SENT,
      isRead: false,
      sentAt: new Date(),
    });

    const payload = await this.buildRealtimeMessagePayload(message, userId, friendUserId);

    this.friendsRealtimeService.emitToUsers(
      [userId, friendUserId],
      'chat-message',
      payload,
    );
    this.friendsRealtimeService.emitToUsers(
      [friendUserId],
      'unread-counts-updated',
      { friendUserId: userId },
    );

    return {
      message: 'Message sent successfully.',
      chatMessage: payload,
    };
  }

  async markConversationRead(userId: string, friendUserId: string) {
    const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
    await this.ensureFriends(currentUserObjectId, friendUserObjectId);

    const readAt = new Date();
    await this.messageModel.updateMany(
      {
        senderUserId: friendUserObjectId,
        recipientUserId: currentUserObjectId,
        recipientType: MessageRecipientType.FRIEND,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt,
        },
      },
    );

    this.friendsRealtimeService.emitToUsers(
      [userId, friendUserId],
      'conversation-read',
      {
        userId,
        friendUserId,
        readAt: readAt.toISOString(),
      },
    );
    this.friendsRealtimeService.emitToUsers(
      [userId],
      'unread-counts-updated',
      { friendUserId },
    );

    return {
      message: 'Conversation marked as read.',
    };
  }

  private validateIds(userId: string, friendUserId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(friendUserId)) {
      throw new BadRequestException('Invalid user id.');
    }

    if (userId === friendUserId) {
      throw new BadRequestException('You cannot chat with yourself.');
    }

    return [new Types.ObjectId(userId), new Types.ObjectId(friendUserId)] as const;
  }

  private async ensureFriends(userId: Types.ObjectId, friendUserId: Types.ObjectId) {
    const friendship = await this.friendshipModel.exists({
      userId,
      friendUserId,
    });

    if (!friendship) {
      throw new ForbiddenException('You can only chat with connected friends.');
    }
  }

  private async buildRealtimeMessagePayload(
    message: MessageDocument,
    currentUserId: string,
    friendUserId: string,
  ) {
    const [sender, recipient, senderProfile, recipientProfile] = await Promise.all([
      this.userModel.findById(message.senderUserId).lean(),
      this.userModel.findById(message.recipientUserId).lean(),
      this.profileModel.findOne({ userId: message.senderUserId }).lean(),
      this.profileModel.findOne({ userId: message.recipientUserId }).lean(),
    ]);

    return {
      id: String(message._id),
      senderUserId: String(message.senderUserId),
      recipientUserId: String(message.recipientUserId),
      friendUserId:
        String(message.senderUserId) === currentUserId ? friendUserId : String(message.senderUserId),
      content: message.content,
      createdAt:
        (
          (message as unknown as { createdAt?: Date }).createdAt ??
          message.sentAt ??
          new Date()
        ).toISOString(),
      isOwnMessage: String(message.senderUserId) === currentUserId,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() ?? null,
      senderDisplayName: senderProfile?.name ?? sender?.username ?? 'User',
      senderAvatarUrl: this.toPublicAssetUrl(senderProfile?.imageUrl ?? this.defaultAvatarPath),
      recipientDisplayName: recipientProfile?.name ?? recipient?.username ?? 'User',
      recipientAvatarUrl: this.toPublicAssetUrl(
        recipientProfile?.imageUrl ?? this.defaultAvatarPath,
      ),
    };
  }

  private toConversationMessage(
    message: Partial<Message> & {
      _id?: Types.ObjectId | string;
      senderUserId?: Types.ObjectId;
      recipientUserId?: Types.ObjectId;
      createdAt?: Date;
      readAt?: Date;
    },
    currentUserId: string,
  ) {
    const senderUserId = String(message.senderUserId);
    return {
      id: String(message._id),
      senderUserId,
      recipientUserId: String(message.recipientUserId),
      content: message.content ?? '',
      createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
      isOwnMessage: senderUserId === currentUserId,
      isRead: message.isRead ?? false,
      readAt: message.readAt?.toISOString() ?? null,
    };
  }

  private toPublicAssetUrl(path?: string) {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
