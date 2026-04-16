import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../enums/database.enums';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true, unique: true, minlength: 3, maxlength: 30 })
  username!: string;

  @Prop({ required: true, minlength: 8 })
  passwordHash!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true, maxlength: 120 })
  email!: string;

  @Prop({ required: true, trim: true, unique: true, match: /^\d{10}$/ })
  mobileNumber!: string;

  @Prop({ default: false })
  mobileVerified!: boolean;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ trim: true, maxlength: 10 })
  captchaCode?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
