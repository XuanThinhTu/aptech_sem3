import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsModule } from '../friends/friends.module';
import { Profile, ProfileSchema } from '../database/schemas/profile.schema';
import { User, UserSchema } from '../database/schemas/user.schema';
import {
  PendingRegistration,
  PendingRegistrationSchema,
} from './schemas/pending-registration.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    FriendsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: PendingRegistration.name, schema: PendingRegistrationSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
