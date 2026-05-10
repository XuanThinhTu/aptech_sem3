import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ContentService,
  ContentServiceSchema,
} from '../database/schemas/content-service.schema';
import { Payment, PaymentSchema } from '../database/schemas/payment.schema';
import {
  ServiceSubscription,
  ServiceSubscriptionSchema,
} from '../database/schemas/service-subscription.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { FriendsModule } from '../friends/friends.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ServiceContent, ServiceContentSchema } from 'src/database/schemas/service-content.schema';
import { Message, MessageSchema } from 'src/database/schemas/message.schema';

@Module({
  imports: [
    FriendsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ContentService.name, schema: ContentServiceSchema },
      { name: ServiceSubscription.name, schema: ServiceSubscriptionSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: ServiceContent.name, schema: ServiceContentSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
