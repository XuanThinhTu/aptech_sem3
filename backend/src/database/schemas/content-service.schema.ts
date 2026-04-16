import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentServiceDocument = HydratedDocument<ContentService>;

@Schema({
  collection: 'services',
  timestamps: true,
})
export class ContentService {
  @Prop({ required: true, trim: true, lowercase: true, unique: true, maxlength: 80 })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 255 })
  description!: string;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ required: true, min: 0, default: 0 })
  monthlyPrice!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ContentServiceSchema = SchemaFactory.createForClass(ContentService);
