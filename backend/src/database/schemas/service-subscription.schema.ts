import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  SubscriptionServiceType,
  SubscriptionStatus,
} from '../enums/database.enums';
import { User } from './user.schema';

export type ServiceSubscriptionDocument = HydratedDocument<ServiceSubscription>;

@Schema({
  collection: 'service_subscriptions',
  timestamps: true,
})
export class ServiceSubscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ enum: SubscriptionServiceType, required: true })
  serviceType!: SubscriptionServiceType;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status!: SubscriptionStatus;

  @Prop({ default: false })
  autoRenew!: boolean;

  @Prop()
  activatedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: 0 })
  priceAmount!: number;
}

export const ServiceSubscriptionSchema =
  SchemaFactory.createForClass(ServiceSubscription);

ServiceSubscriptionSchema.index({ userId: 1, serviceType: 1 }, { unique: true });
