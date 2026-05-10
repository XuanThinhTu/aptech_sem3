import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MessageDeliveryStatus,
  MessageRecipientType,
  SubscriptionStatus,
} from '../database/enums/database.enums';
import { Friendship, FriendshipDocument } from '../database/schemas/friendship.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { Profile, ProfileDocument } from '../database/schemas/profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema';
import { FriendsRealtimeService } from '../friends/friends-realtime.service';
import { ServiceContent, ServiceContentDocument } from 'src/database/schemas/service-content.schema';
import { ServiceSubscription, ServiceSubscriptionDocument } from 'src/database/schemas/service-subscription.schema';
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
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ServiceContent.name)
    private readonly serviceContentModel: Model<ServiceContentDocument>,
    @InjectModel(ServiceSubscription.name)
    private readonly subscriptionModel: Model<ServiceSubscriptionDocument>,
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

  // async sendMessage(userId: string, friendUserId: string, rawContent: string) {
  //   const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
  //   const content = rawContent.trim();
  //   if (!content) {
  //     throw new BadRequestException('Message content is required.');
  //   }

  //   await this.ensureFriends(currentUserObjectId, friendUserObjectId);

  //   const [sender, recipient, recipientProfile] = await Promise.all([
  //     this.userModel.findById(currentUserObjectId),
  //     this.userModel.findById(friendUserObjectId),
  //     this.profileModel.findOne({ userId: friendUserObjectId }).lean(),
  //   ]);

  //   if (!sender || !recipient) {
  //     throw new BadRequestException('Chat account was not found.');
  //   }

  //   const message = await this.messageModel.create({
  //     senderUserId: sender._id,
  //     recipientUserId: recipient._id,
  //     recipientPhoneNumber: recipient.mobileNumber,
  //     recipientName: recipientProfile?.name ?? recipient.username,
  //     content,
  //     recipientType: MessageRecipientType.FRIEND,
  //     isFree: true,
  //     chargeAmount: 0,
  //     countedAgainstDailyFreeLimit: false,
  //     deliveryStatus: MessageDeliveryStatus.SENT,
  //     isRead: false,
  //     sentAt: new Date(),
  //   });

  //   const payload = await this.buildRealtimeMessagePayload(message, userId, friendUserId);

  //   this.friendsRealtimeService.emitToUsers(
  //     [userId, friendUserId],
  //     'chat-message',
  //     payload,
  //   );
  //   this.friendsRealtimeService.emitToUsers(
  //     [friendUserId],
  //     'unread-counts-updated',
  //     { friendUserId: userId },
  //   );

  //   return {
  //     message: 'Message sent successfully.',
  //     chatMessage: payload,
  //   };
  // }
  // Thêm hàm này vào Service của bro để dùng chung
  async sendMessage(userId: string, friendUserId: string, rawContent: string) {
  const [currentUserObjectId, friendUserObjectId] = this.validateIds(userId, friendUserId);
  const content = rawContent.trim();
  if (!content) throw new BadRequestException('Message content is required.');

  // Chat thường thì vẫn cần check bạn bè
  await this.ensureFriends(currentUserObjectId, friendUserObjectId);

  const [sender, recipient, recipientProfile] = await Promise.all([
    this.userModel.findById(currentUserObjectId),
    this.userModel.findById(friendUserObjectId),
    this.profileModel.findOne({ userId: friendUserObjectId }).lean(),
  ]);

  if (!sender || !recipient) throw new BadRequestException('Chat account was not found.');

  // Gọi hàm Core
  const payload = await this.processAndEmitMessage(sender, recipient, content, recipientProfile);

  return { message: 'Message sent successfully.', chatMessage: payload };
}
  async processAndEmitMessage(sender: any, recipient: any, content: string, recipientProfile: any) {
  // 1. Tạo Message trong DB
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

  // 2. Build Payload chuẩn để FE nhận diện được
  const payload = await this.buildRealtimeMessagePayload(
    message, 
    sender._id.toString(), 
    recipient._id.toString()
  );

  // 3. Bắn Socket (Đây là lý do UI sẽ tự nhảy tin nhắn)
  this.friendsRealtimeService.emitToUsers(
    [sender._id.toString(), recipient._id.toString()],
    'chat-message', // Tên sự kiện mà FE đang chờ
    payload,
  );

  this.friendsRealtimeService.emitToUsers(
    [recipient._id.toString()],
    'unread-counts-updated',
    { friendUserId: sender._id.toString() },
  );

  return payload;
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

  async createGroup(title: string, adminId: string, memberIds: string[]) {
    if (!Types.ObjectId.isValid(adminId)) {
      throw new BadRequestException('Invalid admin id.');
    }

    const uniqueMemberIds = [...new Set([...memberIds, adminId])]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    return this.conversationModel.create({
      title: title.trim(),
      adminId: new Types.ObjectId(adminId),
      memberIds: uniqueMemberIds,
      isGroup: true,
    });
  }

  async getUserGroups(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }
    return this.conversationModel.find({
      memberIds: new Types.ObjectId(userId)
    }).lean();
  }

  async getGroupMessages(conversationId: string, userId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation id.');
    }

    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .lean();

    return {
      messages: messages.map((m) => this.toConversationMessage(m, userId)),
    };
  }

  async sendGroupMessage(senderUserId: string, conversationId: string, content: string) {
    if (!Types.ObjectId.isValid(senderUserId) || !Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid IDs.');
    }

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Group conversation not found.');
    }

    const isMember = conversation.memberIds.some(id => String(id) === senderUserId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group.');
    }

    const sender = await this.userModel.findById(senderUserId);
    const senderProfile = await this.profileModel.findOne({ userId: new Types.ObjectId(senderUserId) }).lean();

    const message = await this.messageModel.create({
      senderUserId: new Types.ObjectId(senderUserId),
      conversationId: new Types.ObjectId(conversationId),
      recipientPhoneNumber: '0000000000',
      content: content.trim(),
      recipientType: MessageRecipientType.GROUP,
      deliveryStatus: MessageDeliveryStatus.SENT,
      sentAt: new Date(),
    });

    // Tạo payload chung
    const basePayload = {
      id: String(message._id),
      conversationId,
      senderUserId,
      content: message.content,
      senderDisplayName: senderProfile?.name ?? sender?.username ?? 'User',
      senderAvatarUrl: this.toPublicAssetUrl(senderProfile?.imageUrl ?? this.defaultAvatarPath),
      createdAt: new Date().toISOString(),
      recipientType: MessageRecipientType.GROUP
    };

    // Gửi Socket cho NHỮNG NGƯỜI KHÁC trong nhóm (lọc sender ra)
    const otherMemberStrings = conversation.memberIds
      .map(id => String(id))
      .filter(id => id !== senderUserId);

    if (otherMemberStrings.length > 0) {
      this.friendsRealtimeService.emitToUsers(
        otherMemberStrings, 
        'group-message', 
        { ...basePayload, isOwnMessage: false }
      );
    }

    // Trả về cho chính người gửi qua API
    return {
      message: 'Group message sent successfully.',
      chatMessage: { ...basePayload, isOwnMessage: true }
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
  // 1. Đuổi thành viên khỏi nhóm
  async kickMember(adminId: string, conversationId: string, targetUserId: string) {
    if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid IDs provided.');
    }

    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Group not found.');
    }

    if (String(conversation.adminId) !== adminId) {
      throw new ForbiddenException('Only admin can kick members.');
    }

    if (adminId === targetUserId) {
      throw new BadRequestException('Admin cannot kick themselves. Use disband instead.');
    }

    const updatedConversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { memberIds: new Types.ObjectId(targetUserId) } },
      { new: true }
    );

    this.friendsRealtimeService.emitToUsers(
      [targetUserId],
      'kicked-from-group',
      { conversationId, title: conversation.title }
    );

    const remainingMembers = conversation.memberIds.map(id => String(id)).filter(id => id !== targetUserId);
    this.friendsRealtimeService.emitToUsers(
      remainingMembers,
      'member-kicked',
      { conversationId, kickedUserId: targetUserId }
    );

    return { message: 'Member kicked successfully.' };
  }

  async disbandGroup(adminId: string, conversationId: string) {
    if (!Types.ObjectId.isValid(adminId) || !Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid IDs.');
    }

    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Group not found.');
    }

    if (String(conversation.adminId) !== adminId) {
      throw new ForbiddenException('Only admin can disband the group.');
    }

    const memberIdsStrings = conversation.memberIds.map(id => String(id));

    await this.conversationModel.deleteOne({ _id: new Types.ObjectId(conversationId) });

    await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });

    this.friendsRealtimeService.emitToUsers(
      memberIdsStrings,
      'group-disbanded',
      { conversationId, title: conversation.title }
    );

    return { message: 'Group disbanded successfully.' };
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
@Cron(CronExpression.EVERY_MINUTE)
async handleAdminScheduledBroadcast() {
  const now = new Date();
  // Chuyển đổi sang múi giờ VN (GMT+7)
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const hours = vnTime.getUTCHours().toString().padStart(2, '0');
  const minutes = vnTime.getUTCMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  console.log(`\n[${new Date().toLocaleString()}] 🔍 --- HỆ THỐNG ĐANG QUÉT TIN NHẮN ---`);
  console.log(`⏱️ Giờ VN hiện tại: "${currentTime}"`);

  // 1. Tìm tin nhắn đến giờ bay (Chỉ tìm những tin CHƯA GỬI và KHỚP GIỜ)
  const pendingContents = await this.serviceContentModel.find({
    scheduledTime: { $regex: new RegExp(`^\\s*${currentTime}\\s*$`) },
    isSent: false,
  }).lean();

  if (pendingContents.length === 0) {
    const nextMsg = await this.serviceContentModel.findOne({ isSent: false }).sort({ scheduledTime: 1 });
    if (nextMsg) {
      console.log(`   🔸 Đang chờ đến: [${nextMsg.scheduledTime}] để gửi tin: "${nextMsg.title}"`);
    } else {
      console.log(`   📭 Không có tin nhắn nào đang chờ trong hàng đợi.`);
    }
    return;
  }

  // 2. Lấy thông tin Admin (người gửi)
  const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
  const admin = await this.userModel.findOne({ email: adminEmail });

  if (!admin) {
    console.error('   ❌ LỖI: Không tìm thấy Admin trong DB. Vui lòng check ADMIN_EMAIL trong .env');
    return;
  }

  // 3. Xử lý từng tin nhắn khớp giờ
  for (const item of pendingContents) {
    console.log(`🚀 KHỚP GIỜ! Bắt đầu xử lý chiến dịch: "${item.title}"`);
    
    // 4. Tìm tất cả người dùng có gói đăng ký ACTIVE cho dịch vụ này
    // Sử dụng Regex để chấp cả "active" và "ACTIVE"
    const activeSubs = await this.subscriptionModel.find({
      serviceType: item.serviceType.toString().trim(),
      status: { $regex: new RegExp('^active$', 'i') }
    }).lean();

    console.log(`   📊 Tìm thấy ${activeSubs.length} người đăng ký phù hợp.`);

    if (activeSubs.length === 0) {
      console.log(`   ⚠️ Bỏ qua: Không có ai đăng ký hoặc không có ai ở trạng thái ACTIVE.`);
      // Đánh dấu true luôn để tránh việc nó quét đi quét lại một tin không có người nhận
      await this.serviceContentModel.findByIdAndUpdate(item._id, { isSent: true });
      continue;
    }

    // 5. Vòng lặp gửi tin nhắn tới từng người dùng
    for (const sub of activeSubs) {
      try {
        // Lấy thông tin User đầy đủ từ DB để lấy Username/Mobi (tránh lỗi Socket cần data thật)
        const recipient = await this.userModel.findById(sub.userId).lean();
        
        if (!recipient) {
          console.warn(`      ⏩ Bỏ qua UserID ${sub.userId} (Không tìm thấy trong bảng User)`);
          continue;
        }

        // Thực hiện gửi tin nhắn (Lưu DB Message + Emit Socket)
        await this.processAndEmitMessage(
          admin,
          recipient,
          `[${item.title}]\n${item.content}`,
          null // recipientProfile (có thể để null nếu hàm xử lý được)
        );

        console.log(`      ✅ Đã gửi tới: ${recipient.username || recipient.email || sub.userId}`);
      } catch (err) {
        console.error(`      ❌ Lỗi khi gửi tới User ${sub.userId}:`, err.message);
      }
    }

    // 6. CẬP NHẬT TRẠNG THÁI: Đã gửi thành công
    await this.serviceContentModel.findByIdAndUpdate(item._id, { isSent: true });
    console.log(`🏁 HOÀN TẤT: Đã gửi xong chiến dịch "${item.title}"`);
  }
  console.log(`--------------------------------------------------------\n`);
}
async sendWelcomeServiceMessage(userId: string, serviceType: string) {
  const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
  const admin = await this.userModel.findOne({ email: adminEmail });

  if (!admin) return;

  const welcomeContent = `Cảm ơn bạn đã đăng ký gói dịch vụ [${serviceType}]. Hệ thống đã kích hoạt thành công, nội dung sẽ được gửi đến bạn định kỳ hàng ngày!`;

  const newMessage = await this.messageModel.create({
    senderUserId: admin._id,
    recipientUserId: new Types.ObjectId(userId),
    content: welcomeContent,
    recipientType: MessageRecipientType.FRIEND,
    deliveryStatus: MessageDeliveryStatus.SENT,
    sentAt: new Date(),
    isRead: false,
  });

  const payload = await this.buildRealtimeMessagePayload(
    newMessage,
    String(admin._id),
    userId
  );

  this.friendsRealtimeService.emitToUsers(
    [userId], 
    'chat-message', 
    payload
  );

  this.friendsRealtimeService.emitToUsers(
    [userId],
    'unread-counts-updated',
    { friendUserId: String(admin._id) },
  );

  return newMessage;
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