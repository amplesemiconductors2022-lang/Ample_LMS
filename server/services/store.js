import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const COLLECTIONS = ['courses', 'trainees', 'tapeouts', 'cohorts', 'users', 'enquiries'];

/**
 * Creates a dual-mode persistence layer supporting MongoDB Atlas (when MONGODB_URI is set)
 * and JSON file storage (local disk in dev, /tmp fallback on Vercel when MONGODB_URI is unset).
 */
export function createStore({ initialData, dataFilePath, hashPassword }) {
  const isVercel = Boolean(process.env.VERCEL);
  const effectiveFilePath = isVercel ? '/tmp/ample-store.json' : dataFilePath;

  function ensureSeededPasswords(data) {
    let changed = false;
    (data.users || []).forEach((u) => {
      if (u.password && !String(u.password).startsWith('scrypt$')) {
        u.password = hashPassword(u.password);
        changed = true;
      }
    });
    return changed;
  }

  function cloneSeed() {
    const seeded = JSON.parse(JSON.stringify(initialData));
    ensureSeededPasswords(seeded);
    return seeded;
  }

  function getStorageMode() {
    if (process.env.MONGODB_URI) return 'mongodb';
    return isVercel ? 'tmp-json' : 'local-json';
  }

  async function getMongoDb() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;
    if (!globalThis.__ampleMongoPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      globalThis.__ampleMongoPromise = client.connect().catch((err) => {
        globalThis.__ampleMongoPromise = null;
        throw err;
      });
    }
    const client = await globalThis.__ampleMongoPromise;
    return client.db(process.env.MONGODB_DB || 'ample_lms');
  }

  function readJsonStore() {
    try {
      const candidatePath = fs.existsSync(effectiveFilePath)
        ? effectiveFilePath
        : dataFilePath;

      if (fs.existsSync(candidatePath)) {
        const parsed = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        if (parsed && Array.isArray(parsed.courses) && parsed.courses.length > 0) {
          if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
            parsed.users = cloneSeed().users;
          }
          const changed = ensureSeededPasswords(parsed);
          if (changed || (isVercel && !fs.existsSync(effectiveFilePath))) {
            saveJsonStore(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('[store] Error reading JSON store, falling back to seed:', err.message);
    }
    const seeded = cloneSeed();
    saveJsonStore(seeded);
    return seeded;
  }

  function saveJsonStore(data) {
    try {
      fs.mkdirSync(path.dirname(effectiveFilePath), { recursive: true });
      const tempPath = `${effectiveFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, effectiveFilePath);
    } catch (err) {
      console.error('[store] Error saving JSON store:', err.message);
    }
  }

  async function syncCollection(db, name, items) {
    const col = db.collection(name);
    const list = Array.isArray(items) ? items : [];
    const ids = list.map((item) => item.id).filter(Boolean);
    await col.deleteMany(ids.length > 0 ? { id: { $nin: ids } } : {});
    if (list.length > 0) {
      const ops = list.map((doc) => ({
        replaceOne: {
          filter: { id: doc.id },
          replacement: doc,
          upsert: true,
        },
      }));
      await col.bulkWrite(ops, { ordered: false });
    }
  }

  async function readStore() {
    const db = await getMongoDb();
    if (!db) return readJsonStore();

    const result = {};
    await Promise.all(
      COLLECTIONS.map(async (name) => {
        result[name] = await db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
      })
    );

    if (result.courses.length === 0 || result.users.length === 0) {
      const seed = readJsonStore();
      for (const name of COLLECTIONS) {
        if (!result[name] || result[name].length === 0) {
          result[name] = seed[name] || [];
          await syncCollection(db, name, result[name]);
        }
      }
    } else if (ensureSeededPasswords(result)) {
      await syncCollection(db, 'users', result.users);
    }

    return result;
  }

  async function saveStore(data) {
    const db = await getMongoDb();
    if (!db) {
      saveJsonStore(data);
      return;
    }

    await Promise.all(
      COLLECTIONS.map((name) =>
        Array.isArray(data[name]) ? syncCollection(db, name, data[name]) : Promise.resolve()
      )
    );
  }

  return { readStore, saveStore, getStorageMode, cloneSeed };
}

