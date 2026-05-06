import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  collection: 'conversations',
  timestamps: true,
})
export class Conversation {
  @Prop({ required: true, trim: true, maxlength: 100 })
  title!: string; 

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: User.name }] })
  memberIds!: Types.ObjectId[]; 

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  adminId!: Types.ObjectId; 

  @Prop({ default: true })
  isGroup!: boolean;

  @Prop({ trim: true })
  groupAvatar?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Index để tìm kiếm như SQL server
ConversationSchema.index({ memberIds: 1 });