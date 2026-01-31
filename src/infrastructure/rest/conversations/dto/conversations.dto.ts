import { ApiProperty } from '@nestjs/swagger';

export class ConversationDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: '123456789' })
  telegramChatId: string;

  @ApiProperty({ example: '2026-01-31T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-31T12:00:00.000Z' })
  updatedAt: string;
}

export class ListConversationsResponseDto {
  @ApiProperty({ type: [ConversationDto] })
  items: ConversationDto[];

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}
