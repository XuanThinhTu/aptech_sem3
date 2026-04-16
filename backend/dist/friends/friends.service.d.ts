import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { FriendRequestDocument } from '../database/schemas/friend-request.schema';
import { FriendshipDocument } from '../database/schemas/friendship.schema';
import { ProfileDocument } from '../database/schemas/profile.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { FriendsRealtimeService } from './friends-realtime.service';
export declare class FriendsService {
    private readonly configService;
    private readonly friendsRealtimeService;
    private readonly userModel;
    private readonly profileModel;
    private readonly friendRequestModel;
    private readonly friendshipModel;
    private readonly backendBaseUrl;
    private readonly defaultAvatarPath;
    constructor(configService: ConfigService, friendsRealtimeService: FriendsRealtimeService, userModel: Model<UserDocument>, profileModel: Model<ProfileDocument>, friendRequestModel: Model<FriendRequestDocument>, friendshipModel: Model<FriendshipDocument>);
    searchUsers(userId: string, rawQuery: string): Promise<{
        id: string;
        displayName: string;
        username: string;
        email: string;
        mobileNumber: string;
        avatarUrl: string;
        relationshipStatus: string;
    }[]>;
    sendFriendRequest(userId: string, friendUserId: string): Promise<{
        message: string;
        relationshipStatus: string;
    }>;
    cancelFriendRequest(userId: string, friendUserId: string): Promise<{
        message: string;
        relationshipStatus: string;
        friendUserId: string;
    }>;
    removeFriend(userId: string, friendUserId: string): Promise<{
        message: string;
        relationshipStatus: string;
        friendUserId: string;
    }>;
    getIncomingRequests(userId: string): Promise<{
        count: number;
        requests: ({
            requestId: string;
            senderUserId: string;
            displayName: string;
            username: string;
            email: string;
            mobileNumber: string;
            avatarUrl: string;
        } | null)[];
    }>;
    respondToRequest(userId: string, requestId: string, action: 'accept' | 'reject'): Promise<{
        message: string;
        relationshipStatus: string;
        senderUserId: string;
        requestId: string;
    }>;
    private toPublicAssetUrl;
}
