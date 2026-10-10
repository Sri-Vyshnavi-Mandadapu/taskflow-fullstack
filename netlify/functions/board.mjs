import { MongoClient } from 'mongodb';
import { createHash, timingSafeEqual } from 'node:crypto';

let connection;
async function collection() {
  if (!connection) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 3, serverSelectionTimeoutMS: 8000,
    });
    connection = client.connect().catch((error) => { connection = undefined; throw error; });
  }
  return (await connection).db(process.env.MONGODB_DB || 'taskflow').collection('boards');
}

const response = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const digest = (value) => createHash('sha256').update(value).digest();

export function validateBoard(body) {
  if (!body || !Number.isSafeInteger(body.version) || body.version < 0 ||
      !Array.isArray(body.tasks) || body.tasks.length > 500) throw new Error('Invalid board (maximum 500 tasks).');
  const ids = new Set();
  const tasks = body.tasks.map((task) => {
    if (!task || typeof task.id !== 'string' || !/^[\w-]{1,64}$/.test(task.id) || ids.has(task.id)) throw new Error('Invalid or duplicate task ID.');
    ids.add(task.id);
    if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > 200) throw new Error('Title must contain 1–200 characters.');
    if (typeof task.description !== 'string' || task.description.length > 5000) throw new Error('Description must be at most 5000 characters.');
    if (!['todo', 'in-progress', 'done'].includes(task.status) || !['low', 'medium', 'high'].includes(task.priority)) throw new Error('Invalid task status or priority.');
    if (!Array.isArray(task.tags) || task.tags.length > 10 || task.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 40)) throw new Error('Use up to 10 tags, each 1–40 characters.');
    if (!Number.isSafeInteger(task.createdAt) || task.createdAt < 0 || task.createdAt > 8640000000000000) throw new Error('Invalid creation date.');
    return { id: task.id, title: task.title.trim(), description: task.description.trim(), status: task.status,
      priority: task.priority, tags: [...new Set(task.tags.map((tag) => tag.trim()))], createdAt: task.createdAt };
  });
  return { version: body.version, tasks };
}

export function createHandler(getCollection = collection, env = process.env) {
  return async function handler(request) {
    if (!['GET', 'PUT'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, PUT' } });
    if (!env.MONGODB_URI || !env.TASKFLOW_ACCESS_KEY || env.TASKFLOW_ACCESS_KEY.length < 24) {
      return response(503, { error: 'Backend setup is incomplete. Configure MongoDB and a workspace password in Netlify.' });
    }
    const key = request.headers.get('authorization') || '';
    if (!timingSafeEqual(digest(key), digest(`Bearer ${env.TASKFLOW_ACCESS_KEY}`))) return response(401, { error: 'Incorrect workspace password.' });
    let board;
    if (request.method === 'PUT') {
      if (!request.headers.get('content-type')?.includes('application/json')) return response(415, { error: 'Send JSON.' });
      const raw = await request.text();
      if (Buffer.byteLength(raw) > 1000000) return response(413, { error: 'Board is too large.' });
      try { board = validateBoard(JSON.parse(raw)); }
      catch (error) { return response(400, { error: error.message }); }
    }
    try {
      const boards = await getCollection();
      if (request.method === 'GET') {
        const saved = await boards.findOne({ _id: 'workspace' });
        return response(200, { tasks: saved?.tasks || [], version: saved?.version || 0 });
      }
      const next = { ...board, version: board.version + 1, updatedAt: new Date() };
      const result = await boards.updateOne({ _id: 'workspace', version: board.version }, { $set: next }, { upsert: board.version === 0 });
      if (!result.matchedCount && !result.upsertedCount) return response(409, { error: 'The board changed in another tab. Reload the board before saving again.' });
      return response(200, { tasks: next.tasks, version: next.version });
    } catch (error) {
      if (error.code === 11000) return response(409, { error: 'The board changed in another tab. Reload the board before saving again.' });
      console.error('Board database operation failed:', error.name);
      return response(503, { error: 'Database unavailable. Please try again shortly.' });
    }
  };
}

export default createHandler();
