import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingRegistrationDocument = HydratedDocument<PendingRegistration>;

@Schema({
  collection: 'pending_registrations',
  timestamps: true,
})
export class PendingRegistration {
  @Prop({ required: true, trim: true, unique: true, minlength: 3, maxlength: 30 })
  username!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email!: string;

  @Prop({ required: true, trim: true, match: /^\d{10}$/ })
  mobileNumber!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, match: /^\d{6}$/ })
  otpCode!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: 0 })
  attempts!: number;
}

export const PendingRegistrationSchema =
  SchemaFactory.createForClass(PendingRegistration);

PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
