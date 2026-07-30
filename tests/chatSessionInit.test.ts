import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChatSessionInitRepository,
  resolveChatSession,
} from '../src/services/chat-session-init.service';

class InMemoryChatSessionRepository implements ChatSessionInitRepository {
  readonly sessions = new Map<string, { estado: string; contexto: string }>();
  readonly consultations = new Set<string>();

  private key(botId: string, sessionId: string) {
    return `${botId}:${sessionId}`;
  }

  async hasPreviousConsultation(botId: string, sessionId: string) {
    return this.consultations.has(this.key(botId, sessionId));
  }

  async ensureSession(botId: string, sessionId: string) {
    const key = this.key(botId, sessionId);
    await Promise.resolve();
    if (!this.sessions.has(key)) {
      this.sessions.set(key, { estado: 'BOT_ACTIVO', contexto: 'INICIO' });
    }
  }

  addConsultation(botId: string, sessionId: string) {
    this.consultations.add(this.key(botId, sessionId));
  }

  addSession(botId: string, sessionId: string, estado = 'HUMANO_ATENDIENDO', contexto = 'ENVIAR_DATOS') {
    this.sessions.set(this.key(botId, sessionId), { estado, contexto });
  }

  getSession(botId: string, sessionId: string) {
    return this.sessions.get(this.key(botId, sessionId));
  }
}

const botId = 'bot-1';

test('sessionId nuevo sin sesión ni consulta crea la sesión', async () => {
  const repository = new InMemoryChatSessionRepository();

  const result = await resolveChatSession({
    botId,
    requestedSessionId: 'session-new',
    repository,
  });

  assert.deepEqual(result, { sessionId: 'session-new', hasHistory: false });
  assert.deepEqual(repository.getSession(botId, 'session-new'), {
    estado: 'BOT_ACTIVO',
    contexto: 'INICIO',
  });
});

test('sessionId con sesión existente pero sin consulta se reutiliza sin sobrescribirla', async () => {
  const repository = new InMemoryChatSessionRepository();
  repository.addSession(botId, 'session-existing');

  const result = await resolveChatSession({
    botId,
    requestedSessionId: 'session-existing',
    repository,
  });

  assert.deepEqual(result, { sessionId: 'session-existing', hasHistory: false });
  assert.deepEqual(repository.getSession(botId, 'session-existing'), {
    estado: 'HUMANO_ATENDIENDO',
    contexto: 'ENVIAR_DATOS',
  });
});

test('sessionId con consulta previa genera otro ID y garantiza su SesionChat', async () => {
  const repository = new InMemoryChatSessionRepository();
  repository.addConsultation(botId, 'session-with-history');

  const result = await resolveChatSession({
    botId,
    requestedSessionId: 'session-with-history',
    repository,
    createSessionId: () => 'generated-session',
  });

  assert.deepEqual(result, { sessionId: 'generated-session', hasHistory: true });
  assert.ok(repository.getSession(botId, 'generated-session'));
});

test('dos llamadas consecutivas con el mismo sessionId son idempotentes', async () => {
  const repository = new InMemoryChatSessionRepository();

  const first = await resolveChatSession({ botId, requestedSessionId: 'same-session', repository });
  const second = await resolveChatSession({ botId, requestedSessionId: 'same-session', repository });

  assert.deepEqual(first, second);
  assert.equal(repository.sessions.size, 1);
});

test('dos llamadas simultáneas con el mismo sessionId no duplican la sesión', async () => {
  const repository = new InMemoryChatSessionRepository();

  const results = await Promise.all([
    resolveChatSession({ botId, requestedSessionId: 'concurrent-session', repository }),
    resolveChatSession({ botId, requestedSessionId: 'concurrent-session', repository }),
  ]);

  assert.deepEqual(results[0], results[1]);
  assert.equal(repository.sessions.size, 1);
});
