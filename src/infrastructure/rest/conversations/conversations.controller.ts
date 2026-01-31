import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ListConversationsUseCase } from '@src/application/use-cases/conversations/list-conversations.use-case';
import { ListMessagesUseCase } from '@src/application/use-cases/conversations/list-messages.use-case';
import { JwtAuthGuard } from '@src/infrastructure/rest/auth/jwt-auth.guard';
import { RestController } from '@src/infrastructure/rest/shared/rest.decorator';

import { PaginationQueryDto } from './dto/pagination.dto';
import { ListConversationsResponseDto } from './dto/conversations.dto';
import { ListMessagesResponseDto } from './dto/messages.dto';

@RestController('conversations')
@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly listConversations: ListConversationsUseCase,
    private readonly listMessages: ListMessagesUseCase,
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
}
