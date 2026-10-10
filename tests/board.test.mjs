import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../netlify/functions/board.mjs';

const env = { MONGODB_URI: 'mongodb://test', TASKFLOW_ACCESS_KEY: 'test-workspace-password-123456789' };
const task = { id: 'task-1', title: 'Test task', description: '', status: 'todo', priority: 'medium', tags: ['Test'], createdAt: 1000 };
function setup() {
  let board;
  const handler = createHandler(async () => ({
    findOne: async () => board,
    updateOne: async (filter, update, options) => {
      if (board && board.version !== filter.version) {
        if (options.upsert) throw Object.assign(new Error('duplicate'), { code: 11000 });
        return { matchedCount: 0, upsertedCount: 0 };
      }
      const exists = Boolean(board); board = update.$set;
      return { matchedCount: exists ? 1 : 0, upsertedCount: exists ? 0 : 1 };
    },
  }), env);
  return (method = 'GET', body, key = env.TASKFLOW_ACCESS_KEY) => handler(new Request('https://example.com/api/board', {
    method, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
}

test('requires password before database access', async () => {
  assert.equal((await setup()('GET', undefined, 'wrong')).status, 401);
});
test('unconfigured backend fails closed', async () => {
  const handler = createHandler(() => { throw new Error('must not connect'); }, {});
  assert.equal((await handler(new Request('https://example.com'))).status, 503);
});
test('create, read, edit, move, and delete persist with revisions', async () => {
  const call = setup();
  assert.deepEqual(await (await call()).json(), { tasks: [], version: 0 });
  assert.equal((await call('PUT', { tasks: [task], version: 0 })).status, 200);
  const edited = { ...task, title: 'Edited', status: 'done' };
  assert.equal((await call('PUT', { tasks: [edited], version: 1 })).status, 200);
  assert.deepEqual(await (await call()).json(), { tasks: [edited], version: 2 });
  assert.equal((await call('PUT', { tasks: [], version: 2 })).status, 200);
  assert.deepEqual(await (await call()).json(), { tasks: [], version: 3 });
});
test('stale writes and concurrent first saves do not overwrite the board', async () => {
  const call = setup();
  await call('PUT', { tasks: [task], version: 0 });
  assert.equal((await call('PUT', { tasks: [], version: 0 })).status, 409);
  await call('PUT', { tasks: [task], version: 1 });
  assert.equal((await call('PUT', { tasks: [], version: 1 })).status, 409);
  assert.equal((await (await call()).json()).tasks.length, 1);
});
test('rejects invalid fields, duplicate IDs, excessive tasks, and injected objects', async () => {
  const call = setup();
  for (const bad of [{ title: '' }, { status: 'bad' }, { priority: 'bad' }, { tags: ['$'.repeat(41)] }, { title: { $ne: null } }, { createdAt: -1 }]) {
    assert.equal((await call('PUT', { tasks: [{ ...task, ...bad }], version: 0 })).status, 400);
  }
  assert.equal((await call('PUT', { tasks: [task, task], version: 0 })).status, 400);
  assert.equal((await call('PUT', { tasks: Array(501).fill(task), version: 0 })).status, 400);
});
test('rejects unsupported methods, malformed JSON, and oversized bodies', async () => {
  assert.equal((await setup()('DELETE')).status, 405);
  const handler = createHandler(() => { throw new Error('must not connect'); }, env);
  for (const [body, status] of [['{', 400], ['x'.repeat(1000001), 413]]) {
    const result = await handler(new Request('https://example.com', { method: 'PUT', headers: { authorization: `Bearer ${env.TASKFLOW_ACCESS_KEY}`, 'content-type': 'application/json' }, body }));
    assert.equal(result.status, status);
  }
});
test('database failures return a safe service error without credentials', async () => {
  const handler = createHandler(async () => { throw new Error('secret-connection-string'); }, env);
  const result = await handler(new Request('https://example.com', { headers: { authorization: `Bearer ${env.TASKFLOW_ACCESS_KEY}` } }));
  assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /secret-connection/);
});
