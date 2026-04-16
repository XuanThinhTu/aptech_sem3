import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderStatus, PaymentProvider, PaymentStatus } from '../enums/database.enums';
import { User } from './user.schema';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({
  collection: 'payments',
  timestamps: true,
})
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ enum: PaymentProvider, default: PaymentProvider.VNPAY })
  provider!: PaymentProvider;

  @Prop({ required: true, trim: true, unique: true })
  txnRef!: string;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ required: true, trim: true, uppercase: true, default: 'VND' })
  currency!: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  orderStatus!: OrderStatus;

  @Prop({ type: [String], default: [] })
  serviceTypes!: string[];

  @Prop({ trim: true })
  orderInfo?: string;

  @Prop({ trim: true })
  responseCode?: string;

  @Prop()
  paidAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
