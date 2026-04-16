import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Gender, MaritalStatus, WorkStatus } from '../enums/database.enums';
import { User } from './user.schema';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({
  collection: 'profiles',
  timestamps: true,
})
export class Profile {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ trim: true, maxlength: 120 })
  name?: string;

  @Prop({ enum: Gender, default: Gender.MALE })
  gender?: Gender;

  @Prop()
  dob?: Date;

  @Prop({ trim: true, maxlength: 255 })
  address?: string;

  @Prop({ enum: MaritalStatus, default: MaritalStatus.SINGLE })
  maritalStatus!: MaritalStatus;

  @Prop({ trim: true, lowercase: true, maxlength: 120 })
  emailAddress?: string;

  @Prop({ type: [String], default: [] })
  hobbies!: string[];

  @Prop({ type: [String], default: [] })
  likes!: string[];

  @Prop({ type: [String], default: [] })
  dislikes!: string[];

  @Prop({ type: [String], default: [] })
  cuisines!: string[];

  @Prop({ type: [String], default: [] })
  sports!: string[];

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ trim: true, maxlength: 120 })
  qualification?: string;

  @Prop({ trim: true, maxlength: 120 })
  school?: string;

  @Prop({ trim: true, maxlength: 120 })
  college?: string;

  @Prop({ enum: WorkStatus, default: WorkStatus.STUDENT })
  workStatus!: WorkStatus;

  @Prop({ trim: true, maxlength: 120 })
  organization?: string;

  @Prop({ trim: true, maxlength: 120 })
  designation?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
