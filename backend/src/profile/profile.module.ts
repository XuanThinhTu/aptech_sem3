import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Friendship, FriendshipSchema } from '../database/schemas/friendship.schema';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friendship.name, schema: FriendshipSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
