import { CancelFriendRequestDto } from './dto/cancel-friend-request.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsService } from './friends.service';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    searchUsers(userId: string, query: string): Promise<{
        id: string;
        displayName: string;
        username: string;
        email: string;
        mobileNumber: string;
        avatarUrl: string;
        relationshipStatus: string;
    }[]>;
    sendFriendRequest(dto: SendFriendRequestDto): Promise<{
        message: string;
        relationshipStatus: string;
    }>;
    cancelFriendRequest(dto: CancelFriendRequestDto): Promise<{
        message: string;
        relationshipStatus: string;
        friendUserId: string;
    }>;
    removeFriend(dto: RemoveFriendDto): Promise<{
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
    respondToRequest(dto: RespondFriendRequestDto): Promise<{
        message: string;
        relationshipStatus: string;
        senderUserId: string;
        requestId: string;
    }>;
}
