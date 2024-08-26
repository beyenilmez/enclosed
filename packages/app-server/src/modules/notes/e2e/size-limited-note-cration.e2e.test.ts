import { describe, expect, test } from 'vitest';
import { createServer } from '../../app/server';
import { createMemoryStorage } from '../../storage/factories/memory.storage';
import { overrideConfig } from '../../app/config/config.test-utils';

describe('e2e', () => {
  describe('body limit note creation', async () => {
    test('a note with an encrypted content larger than the limit configured using maxEncryptedContentLength cannot be created', async () => {
      const { storage } = createMemoryStorage();

      const { app } = createServer({
        storageFactory: () => ({ storage }),
        config: overrideConfig({
          notes: {
            maxEncryptedContentLength: 1024 * 1024,
          },
        }),
      });

      const note = {
        isPasswordProtected: false,
        deleteAfterReading: false,
        ttlInSeconds: 600,
        content: 'a'.repeat(1024 * 1024 + 1),
      };

      const createNoteResponse = await app.request(
        '/api/notes',
        {
          method: 'POST',
          body: JSON.stringify(note),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        },
      );

      const reply = await createNoteResponse.json<any>();

      expect(createNoteResponse.status).to.eql(413);
      expect(reply).to.eql({
        error: {
          code: 'note.content_too_large',
          message: 'Note content is too large',
        },
      });
    });
  });
});