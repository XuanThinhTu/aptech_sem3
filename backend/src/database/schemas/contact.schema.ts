import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema';

export type ContactDocument = HydratedDocument<Contact>;

@Schema({
  collection: 'contacts',
  timestamps: true,
})
export class Contact {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
  ownerUserId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  firstName!: string;

  @Prop({ trim: true, maxlength: 80 })
  lastName?: string;

  @Prop({ required: true, trim: true, match: /^\d{10}$/ })
  contactNumber!: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index({ ownerUserId: 1, contactNumber: 1 }, { unique: true });
