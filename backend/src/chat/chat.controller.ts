import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
}
