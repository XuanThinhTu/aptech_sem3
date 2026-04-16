import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { Contact, ContactSchema } from './schemas/contact.schema';
import {
  ContentService,
  ContentServiceSchema,
} from './schemas/content-service.schema';
import { FriendRequest, FriendRequestSchema } from './schemas/friend-request.schema';
import { Friendship, FriendshipSchema } from './schemas/friendship.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import {
  ServiceSubscription,
  ServiceSubscriptionSchema,
} from './schemas/service-subscription.schema';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: ContentService.name, schema: ContentServiceSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ServiceSubscription.name, schema: ServiceSubscriptionSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
