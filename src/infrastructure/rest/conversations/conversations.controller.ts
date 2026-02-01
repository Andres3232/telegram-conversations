import { Body, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListConversationsUseCase } from '@src/application/use-cases/conversations/list-conversations.use-case';
import { ListMessagesUseCase } from '@src/application/use-cases/conversations/list-messages.use-case';
import { SendMessageUseCase } from '@src/application/use-cases/conversations/send-message.use-case';
import { JwtAuthGuard } from '@src/infrastructure/rest/auth/jwt-auth.guard';
import { RestController } from '@src/infrastructure/rest/shared/rest.decorator';
import { PaginationQueryDto } from './dto/pagination.dto';
import { ListConversationsResponseDto } from './dto/conversations.dto';
import { ListMessagesResponseDto } from './dto/messages.dto';
import { SendMessageRequestDto, SendMessageResponseDto } from './dto/send-message.dto';

@RestController('conversations')
@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly listConversations: ListConversationsUseCase,
    private readonly listMessages: ListMessagesUseCase,
  private readonly sendMessage: SendMessageUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations' })
  @ApiOkResponse({ type: ListConversationsResponseDto })
  async list(
    @Query() query: PaginationQueryDto,
  ): Promise<ListConversationsResponseDto> {
    return this.listConversations.execute({
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages of a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation id (uuid)' })
  @ApiOkResponse({ type: ListMessagesResponseDto })
  async messages(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ListMessagesResponseDto> {
    return this.listMessages.execute({
      conversationId: id,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to an existing conversation' })
  @ApiParam({ name: 'id', description: 'Conversation id (uuid)' })
  @ApiCreatedResponse({ type: SendMessageResponseDto })
  async send(
    @Param('id') id: string,
    @Body() body: SendMessageRequestDto,
  ): Promise<SendMessageResponseDto> {
    return this.sendMessage.execute({ conversationId: id, text: body.text });
  }
}
