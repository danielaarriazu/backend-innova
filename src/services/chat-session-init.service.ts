import { v4 as uuidv4 } from 'uuid';

export interface ChatSessionInitRepository {
  hasPreviousConsultation(botId: string, sessionId: string): Promise<boolean>;
  ensureSession(botId: string, sessionId: string): Promise<void>;
}

interface ResolveChatSessionInput {
  botId: string;
  requestedSessionId?: string;
  repository: ChatSessionInitRepository;
  createSessionId?: () => string;
}

export const resolveChatSession = async ({
  botId,
  requestedSessionId,
  repository,
  createSessionId = uuidv4,
}: ResolveChatSessionInput): Promise<{ sessionId: string; hasHistory: boolean }> => {
  const hasHistory = requestedSessionId
    ? await repository.hasPreviousConsultation(botId, requestedSessionId)
    : false;

  const sessionId = !requestedSessionId || hasHistory
    ? createSessionId()
    : requestedSessionId;

  await repository.ensureSession(botId, sessionId);

  return { sessionId, hasHistory };
};
