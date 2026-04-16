import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendRequest, FriendRequestSchema } from '../database/schemas/friend-request.schema';
import { Friendship, FriendshipSchema } from '../database/schemas/friendship.schema';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { FriendsController } from './friends.controller';
import { FriendsRealtimeService } from './friends-realtime.service';
import { FriendsService } from './friends.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: Friendship.name, schema: FriendshipSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsRealtimeService],
  exports: [FriendsRealtimeService],
})
export class FriendsModule {}
