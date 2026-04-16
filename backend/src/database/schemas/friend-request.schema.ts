import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { FriendRequestStatus } from '../enums/database.enums';
import { User } from './user.schema';

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

@Schema({
  collection: 'friend_requests',
  timestamps: true,
})
export class FriendRequest {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  senderUserId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  receiverUserId!: Types.ObjectId;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 120 })
  receiverEmail!: string;

  @Prop({ enum: FriendRequestStatus, default: FriendRequestStatus.PENDING })
  status!: FriendRequestStatus;

  @Prop()
  respondedAt?: Date;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index(
  { senderUserId: 1, receiverUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: FriendRequestStatus.PENDING },
  },
);
