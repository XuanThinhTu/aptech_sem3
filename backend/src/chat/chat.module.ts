import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../database/schemas/message.schema';
import { Friendship, FriendshipSchema } from '../database/schemas/friendship.schema';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { Conversation, ConversationSchema } from '../database/schemas/conversation.schema';
import { ServiceContent, ServiceContentSchema } from '../database/schemas/service-content.schema';
import { ServiceSubscription, ServiceSubscriptionSchema } from '../database/schemas/service-subscription.schema';
import { FriendsModule } from '../friends/friends.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    FriendsModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: ServiceContent.name, schema: ServiceContentSchema },
      { name: ServiceSubscription.name, schema: ServiceSubscriptionSchema },
      
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], 
})
export class ChatModule {}