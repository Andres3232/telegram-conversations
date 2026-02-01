export const AI_RESPONDER = 'AIResponder';

export interface GenerateReplyInput {
  incomingText: string;
}

export interface AIResponder {
  generateReply(input: GenerateReplyInput): Promise<string>;
}
