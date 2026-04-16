import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequestStatus } from '../database/enums/database.enums';
import { FriendRequest, FriendRequestDocument } from '../database/schemas/friend-request.schema';
import { Friendship, FriendshipDocument } from '../database/schemas/friendship.schema';
import { Profile, ProfileDocument } from '../database/schemas/profile.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from './friends-realtime.service';

@Injectable()
export class FriendsService {
  private readonly backendBaseUrl: string;
  private readonly defaultAvatarPath = '/uploads/no-image.jpg';

  constructor(
    private readonly configService: ConfigService,
    private readonly friendsRealtimeService: FriendsRealtimeService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
  ) {
    this.backendBaseUrl =
      this.configService.get<string>('BACKEND_BASE_URL') ?? 'http://127.0.0.1:3000';
  }

  async searchUsers(userId: string, rawQuery: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const query = rawQuery?.trim();
    if (!query) {
      return [];
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');
    const currentUserId = new Types.ObjectId(userId);

    const [userMatches, profileMatches] = await Promise.all([
      this.userModel
        .find({
          _id: { $ne: currentUserId },
          $or: [{ username: regex }, { mobileNumber: regex }, { email: regex }],
        })
        .select('username email mobileNumber')
        .limit(12)
        .lean(),
      this.profileModel
        .find({ name: regex, userId: { $ne: currentUserId } })
        .select('userId name imageUrl')
        .limit(12)
        .lean(),
    ]);

    const matchedUserIds = new Set<string>();
    for (const user of userMatches) {
      matchedUserIds.add(String(user._id));
    }
    for (const profile of profileMatches) {
      matchedUserIds.add(String(profile.userId));
    }

    if (!matchedUserIds.size) {
      return [];
    }

    const userIds = Array.from(matchedUserIds).map((id) => new Types.ObjectId(id));
    const [users, profiles, friendships, pendingRequests] = await Promise.all([
      this.userModel
        .find({ _id: { $in: userIds } })
        .select('username email mobileNumber')
        .lean(),
      this.profileModel
        .find({ userId: { $in: userIds } })
        .select('userId name imageUrl')
        .lean(),
      this.friendshipModel
        .find({ userId: currentUserId, friendUserId: { $in: userIds } })
        .select('friendUserId')
        .lean(),
      this.friendRequestModel
        .find({
          status: FriendRequestStatus.PENDING,
          $or: [
            {
              senderUserId: currentUserId,
              receiverUserId: { $in: userIds },
            },
            {
              senderUserId: { $in: userIds },
              receiverUserId: currentUserId,
            },
          ],
        })
        .select('senderUserId receiverUserId status')
        .lean(),
    ]);

    const profileMap = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );
    const friendIds = new Set(friendships.map((friendship) => String(friendship.friendUserId)));
    const outgoingRequestIds = new Set(
      pendingRequests
        .filter((request) => String(request.senderUserId) === userId)
        .map((request) => String(request.receiverUserId)),
    );
    const incomingRequestIds = new Set(
      pendingRequests
        .filter((request) => String(request.receiverUserId) === userId)
        .map((request) => String(request.senderUserId)),
    );

    return users
      .map((user) => {
        const profile = profileMap.get(String(user._id));
        const targetUserId = String(user._id);
        const relationshipStatus = friendIds.has(targetUserId)
          ? 'friends'
          : outgoingRequestIds.has(targetUserId)
            ? 'pending_sent'
            : incomingRequestIds.has(targetUserId)
              ? 'pending_received'
              : 'none';
        return {
          id: targetUserId,
          displayName: profile?.name ?? user.username,
          username: user.username,
          email: user.email,
          mobileNumber: user.mobileNumber,
          avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
          relationshipStatus,
        };
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .slice(0, 12);
  }

  async sendFriendRequest(userId: string, friendUserId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(friendUserId)) {
      throw new BadRequestException('Invalid user id.');
    }

    if (userId === friendUserId) {
      throw new BadRequestException('You cannot add yourself as a friend.');
    }

    const [user, friend] = await Promise.all([
      this.userModel.findById(userId),
      this.userModel.findById(friendUserId),
    ]);

    if (!user || !friend) {
      throw new NotFoundException('User account was not found.');
    }

    const [existingFriendship, outgoingRequest, incomingRequest] = await Promise.all([
      this.friendshipModel.exists({
        userId: new Types.ObjectId(userId),
        friendUserId: new Types.ObjectId(friendUserId),
      }),
      this.friendRequestModel.findOne({
        senderUserId: new Types.ObjectId(userId),
        receiverUserId: new Types.ObjectId(friendUserId),
        status: FriendRequestStatus.PENDING,
      }),
      this.friendRequestModel.findOne({
        senderUserId: new Types.ObjectId(friendUserId),
        receiverUserId: new Types.ObjectId(userId),
        status: FriendRequestStatus.PENDING,
      }),
    ]);

    if (existingFriendship) {
      return {
        message: 'You are already friends.',
        relationshipStatus: 'friends',
      };
    }

    if (outgoingRequest) {
      return {
        message: 'Friend request is waiting for confirmation.',
        relationshipStatus: 'pending_sent',
      };
    }

    if (incomingRequest) {
      return {
        message: 'This account already sent you a friend request.',
        relationshipStatus: 'pending_received',
      };
    }

    await this.friendRequestModel.create({
      senderUserId: user._id,
      receiverUserId: friend._id,
      receiverEmail: friend.email,
      status: FriendRequestStatus.PENDING,
    });

    this.friendsRealtimeService.emitToUsers(
      [String(user._id), String(friend._id)],
      'friend-request-created',
      {
        senderUserId: String(user._id),
        receiverUserId: String(friend._id),
      },
    );

    return {
      message: 'Friend request sent successfully.',
      relationshipStatus: 'pending_sent',
    };
  }

  async cancelFriendRequest(userId: string, friendUserId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(friendUserId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const request = await this.friendRequestModel.findOne({
      senderUserId: new Types.ObjectId(userId),
      receiverUserId: new Types.ObjectId(friendUserId),
      status: FriendRequestStatus.PENDING,
    });

    if (!request) {
      throw new NotFoundException('Pending friend request was not found.');
    }

    request.status = FriendRequestStatus.REJECTED;
    request.respondedAt = new Date();
    await request.save();

    this.friendsRealtimeService.emitToUsers(
      [userId, friendUserId],
      'friend-request-cancelled',
      {
        senderUserId: userId,
        receiverUserId: friendUserId,
      },
    );

    return {
      message: 'Friend request cancelled successfully.',
      relationshipStatus: 'none',
      friendUserId,
    };
  }

  async removeFriend(userId: string, friendUserId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(friendUserId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const [removedForward, removedReverse] = await Promise.all([
      this.friendshipModel.deleteOne({
        userId: new Types.ObjectId(userId),
        friendUserId: new Types.ObjectId(friendUserId),
      }),
      this.friendshipModel.deleteOne({
        userId: new Types.ObjectId(friendUserId),
        friendUserId: new Types.ObjectId(userId),
      }),
    ]);

    if (!removedForward.deletedCount && !removedReverse.deletedCount) {
      throw new NotFoundException('Friendship was not found.');
    }

    this.friendsRealtimeService.emitToUsers(
      [userId, friendUserId],
      'friends-updated',
      {
        userId,
        friendUserId,
        relationshipStatus: 'none',
      },
    );

    return {
      message: 'Friend removed successfully.',
      relationshipStatus: 'none',
      friendUserId,
    };
  }

  async getIncomingRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id.');
    }

    const receiverUserId = new Types.ObjectId(userId);
    const requests = await this.friendRequestModel
      .find({
        receiverUserId,
        status: FriendRequestStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!requests.length) {
      return {
        count: 0,
        requests: [],
      };
    }

    const senderIds = requests.map((request) => request.senderUserId);
    const [users, profiles] = await Promise.all([
      this.userModel
        .find({ _id: { $in: senderIds } })
        .select('username email mobileNumber')
        .lean(),
      this.profileModel
        .find({ userId: { $in: senderIds } })
        .select('userId name imageUrl')
        .lean(),
    ]);

    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const profileMap = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );

    return {
      count: requests.length,
      requests: requests
        .map((request) => {
          const sender = userMap.get(String(request.senderUserId));
          if (!sender) {
            return null;
          }

          const profile = profileMap.get(String(request.senderUserId));
          return {
            requestId: String(request._id),
            senderUserId: String(request.senderUserId),
            displayName: profile?.name ?? sender.username,
            username: sender.username,
            email: sender.email,
            mobileNumber: sender.mobileNumber,
            avatarUrl: this.toPublicAssetUrl(profile?.imageUrl ?? this.defaultAvatarPath),
          };
        })
        .filter(Boolean),
    };
  }

  async respondToRequest(userId: string, requestId: string, action: 'accept' | 'reject') {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request id.');
    }

    const request = await this.friendRequestModel.findOne({
      _id: new Types.ObjectId(requestId),
      receiverUserId: new Types.ObjectId(userId),
      status: FriendRequestStatus.PENDING,
    });

    if (!request) {
      throw new NotFoundException('Friend request was not found.');
    }

    request.status =
      action === 'accept'
        ? FriendRequestStatus.ACCEPTED
        : FriendRequestStatus.REJECTED;
    request.respondedAt = new Date();
    await request.save();

    if (action === 'accept') {
      const now = new Date();
      await this.friendshipModel.bulkWrite([
        {
          updateOne: {
            filter: {
              userId: request.senderUserId,
              friendUserId: request.receiverUserId,
            },
            update: { $setOnInsert: { becameFriendsAt: now } },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: {
              userId: request.receiverUserId,
              friendUserId: request.senderUserId,
            },
            update: { $setOnInsert: { becameFriendsAt: now } },
            upsert: true,
          },
        },
      ]);
    }

    this.friendsRealtimeService.emitToUsers(
      [userId, String(request.senderUserId)],
      action === 'accept' ? 'friends-updated' : 'friend-request-responded',
      {
        senderUserId: String(request.senderUserId),
        receiverUserId: String(request.receiverUserId),
        action,
      },
    );

    return {
      message:
        action === 'accept'
          ? 'Friend request accepted successfully.'
          : 'Friend request cancelled successfully.',
      relationshipStatus: action === 'accept' ? 'friends' : 'none',
      senderUserId: String(request.senderUserId),
      requestId: String(request._id),
    };
  }

  private toPublicAssetUrl(path?: string) {
    if (!path) {
      return '';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
