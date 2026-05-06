import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  MessageDeliveryStatus,
  MessageRecipientType,
} from '../enums/database.enums';
import { User } from './user.schema';
import { Conversation } from './conversation.schema';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  collection: 'messages',
  timestamps: true,
})
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  senderUserId!: Types.ObjectId;

  // --- CHAT 1-1 ---
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name })
  recipientUserId?: Types.ObjectId;

  @Prop({ required: true, trim: true, match: /^\d{10}$/ })
  recipientPhoneNumber!: string;

  @Prop({ trim: true, maxlength: 120 })
  recipientName?: string;

  // --- CHAT NHÓM ---
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Conversation.name, required: false })
  conversationId?: Types.ObjectId; 

  // --- NỘI DUNG & LOẠI TIN NHẮN ---
  @Prop({ required: true, trim: true, maxlength: 120 })
  content!: string;

  @Prop({ enum: MessageRecipientType, required: true })
  recipientType!: MessageRecipientType;

  // --- TRẠNG THÁI & PHÍ (DÀNH CHO LOGIC CŨ) ---
  @Prop({ default: false })
  isFree!: boolean;

  @Prop({ default: 0 })
  chargeAmount!: number;

  @Prop({ default: false })
  countedAgainstDailyFreeLimit!: boolean;

  @Prop({ enum: MessageDeliveryStatus, default: MessageDeliveryStatus.QUEUED })
  deliveryStatus!: MessageDeliveryStatus;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop()
  readAt?: Date;

  @Prop()
  sentAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

/**
 * INDEXES
 */

// Index cho chat 1-1 (Giữ nguyên logic cũ)
MessageSchema.index({ senderUserId: 1, recipientPhoneNumber: 1, createdAt: -1 });
MessageSchema.index({ recipientUserId: 1, senderUserId: 1, isRead: 1, createdAt: -1 });

// Index cho chat nhóm (Mới thêm)
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Index hỗ trợ tìm kiếm tin nhắn theo người gửi
MessageSchema.index({ senderUserId: 1, createdAt: -1 });