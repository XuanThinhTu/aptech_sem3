import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SubscriptionServiceType } from '../enums/database.enums';

export type ServiceContentDocument = HydratedDocument<ServiceContent>;

@Schema({
  collection: 'service_contents', 
  timestamps: true,
})
export class ServiceContent {
  @Prop({ type: String, required: true })
  serviceType!: SubscriptionServiceType; 

  @Prop({ required: true })
  title!: string; 

  @Prop({ required: true })
  content!: string; 

  @Prop({ required: true })
  scheduledTime!: string; 

  @Prop({ default: false })
  @Prop({ required: true })
  isSent!: boolean; 
}

export const ServiceContentSchema = SchemaFactory.createForClass(ServiceContent);