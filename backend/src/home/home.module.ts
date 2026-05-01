import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService, ContentServiceSchema } from '../database/schemas/content-service.schema';
import { Friendship, FriendshipSchema } from '../database/schemas/friendship.schema';
import { Message, MessageSchema } from '../database/schemas/message.schema';
import { Payment, PaymentSchema } from '../database/schemas/payment.schema';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import {
  ServiceSubscription,
  ServiceSubscriptionSchema,
} from '../database/schemas/service-subscription.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { FriendsModule } from '../friends/friends.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PaypalService } from '../payments/payment.service'; // 
@Module({
  imports: [
    FriendsModule,
    MongooseModule.forFeature([
      { name: ContentService.name, schema: ContentServiceSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: ServiceSubscription.name, schema: ServiceSubscriptionSchema },
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService, PaypalService],
})
export class HomeModule {}
