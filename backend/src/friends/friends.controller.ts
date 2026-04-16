import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CancelFriendRequestDto } from './dto/cancel-friend-request.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get('search')
  searchUsers(
    @Query('userId') userId: string,
    @Query('query') query: string,
  ) {
    return this.friendsService.searchUsers(userId, query);
  }

  @Post('request')
  sendFriendRequest(@Body() dto: SendFriendRequestDto) {
    return this.friendsService.sendFriendRequest(dto.userId, dto.friendUserId);
  }

  @Post('request/cancel')
  cancelFriendRequest(@Body() dto: CancelFriendRequestDto) {
    return this.friendsService.cancelFriendRequest(dto.userId, dto.friendUserId);
  }

  @Post('remove')
  removeFriend(@Body() dto: RemoveFriendDto) {
    return this.friendsService.removeFriend(dto.userId, dto.friendUserId);
  }

  @Get('requests')
  getIncomingRequests(@Query('userId') userId: string) {
    return this.friendsService.getIncomingRequests(userId);
  }

  @Post('requests/respond')
  respondToRequest(@Body() dto: RespondFriendRequestDto) {
    return this.friendsService.respondToRequest(dto.userId, dto.requestId, dto.action);
  }
}
