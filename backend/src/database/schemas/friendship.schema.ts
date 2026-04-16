import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema';

export type FriendshipDocument = HydratedDocument<Friendship>;

@Schema({
  collection: 'friendships',
  timestamps: true,
})
export class Friendship {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  friendUserId!: Types.ObjectId;

  @Prop()
  becameFriendsAt?: Date;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

FriendshipSchema.index({ userId: 1, friendUserId: 1 }, { unique: true });
