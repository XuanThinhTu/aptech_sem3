import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetConversationDto } from './dto/get-conversation.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversation')
  getConversation(@Query() dto: GetConversationDto) {
    return this.chatService.getConversation(dto.userId, dto.friendUserId);
  }

  @Get('unread')
  getUnreadCounts(@Query('userId') userId: string) {
    return this.chatService.getUnreadCounts(userId);
  }

  @Post('send')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto.userId, dto.friendUserId, dto.content);
  }

  @Post('read')
  markConversationRead(@Body() dto: MarkReadDto) {
    return this.chatService.markConversationRead(dto.userId, dto.friendUserId);
  }


  @Post('group/create')
  createGroup(@Body() body: { title: string; adminId: string; memberIds: string[] }) {
    return this.chatService.createGroup(body.title, body.adminId, body.memberIds);
  }

  @Get('groups/:userId')
  getUserGroups(@Param('userId') userId: string) {
    return this.chatService.getUserGroups(userId);
  }

  @Get('group/messages')
  getGroupMessages(@Query('conversationId') conversationId: string, @Query('userId') userId: string) {
    return this.chatService.getGroupMessages(conversationId, userId);
  }

  @Post('group/send')
  sendGroupMessage(@Body() body: { senderUserId: string; conversationId: string; content: string }) {
    return this.chatService.sendGroupMessage(body.senderUserId, body.conversationId, body.content);
  }
}