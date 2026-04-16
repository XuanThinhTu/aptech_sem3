import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../database/schemas/message.schema';
import { Friendship, FriendshipSchema } from '../database/schemas/friendship.schema';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
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
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
