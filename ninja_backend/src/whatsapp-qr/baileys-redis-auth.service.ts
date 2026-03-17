import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Mutex } from 'async-mutex';
import { ConfigService } from '../config/config.service';

/** TTL for each auth key: 30 days; refreshed on write and on connect */
const AUTH_KEY_TTL_SEC = 30 * 24 * 60 * 60;

/**
 * Redis-backed auth state mirroring Baileys useMultiFileAuthState (multi-file layout).
 * Keys: baileys:auth:{userId}:{file} where file is creds.json or {type}-{id}.json
 * Spec: WHATSAPP-QR-ENTERPRISE-SPEC — persist auth in Redis (no Docker disk reliance).
 */
@Injectable()
export class BaileysRedisAuthService implements OnModuleDestroy {
  private readonly logger = new Logger(BaileysRedisAuthService.name);
  private client: Redis | null = null;
  private readonly fileLocks = new Map<string, Mutex>();

  constructor(private readonly config: ConfigService) {}

  private getRedis(): Redis | null {
    if (this.client) return this.client;
    const url = this.config.get('REDIS_URL');
    if (!url) return null;
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      return this.client;
    } catch (e) {
      this.logger.warn(`Redis init failed: ${e}`);
      return null;
    }
  }

  keyPrefix(userId: string): string {
    return `baileys:auth:${userId}`;
  }

  private redisKey(userId: string, file: string): string {
    const safe = file.replace(/\//g, '__').replace(/:/g, '-');
    return `${this.keyPrefix(userId)}:${safe}`;
  }

  private getLock(filePath: string): Mutex {
    let m = this.fileLocks.get(filePath);
    if (!m) {
      m = new Mutex();
      this.fileLocks.set(filePath, m);
    }
    return m;
  }

  /**
   * Load auth state from Redis or init empty. Returns Baileys-compatible state + saveCreds.
   * Uses dynamic import for Baileys ESM (BufferJSON, initAuthCreds, proto).
   */
  async useRedisAuthState(userId: string): Promise<{
    state: { creds: any; keys: any };
    saveCreds: () => Promise<void>;
  } | null> {
    const redis = this.getRedis();
    if (!redis) {
      this.logger.warn('REDIS_URL not set; cannot persist Baileys auth');
      return null;
    }
    await redis.connect().catch(() => {});

    const baileys = await import('@whiskeysockets/baileys');
    const { initAuthCreds, BufferJSON, proto } = baileys as any;

    const writeData = async (data: any, file: string) => {
      const rkey = this.redisKey(userId, file);
      const mutex = this.getLock(rkey);
      await mutex.runExclusive(async () => {
        await redis.set(rkey, JSON.stringify(data, BufferJSON.replacer));
        await redis.expire(rkey, AUTH_KEY_TTL_SEC);
      });
    };

    const readData = async (file: string): Promise<any | null> => {
      try {
        const rkey = this.redisKey(userId, file);
        const mutex = this.getLock(rkey);
        return await mutex.runExclusive(async () => {
          const raw = await redis.get(rkey);
          if (!raw) return null;
          return JSON.parse(raw, BufferJSON.reviver);
        });
      } catch {
        return null;
      }
    };

    const removeData = async (file: string) => {
      try {
        const rkey = this.redisKey(userId, file);
        const mutex = this.getLock(rkey);
        await mutex.runExclusive(async () => {
          await redis.del(rkey);
        });
      } catch {
        // ignore
      }
    };

    const creds = (await readData('creds.json')) || initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async (type: string, ids: string[]) => {
            const data: Record<string, any> = {};
            await Promise.all(
              ids.map(async (id) => {
                let value = await readData(`${type}-${id}.json`);
                if (type === 'app-state-sync-key' && value) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
              }),
            );
            return data;
          },
          set: async (data: Record<string, Record<string, any>>) => {
            const tasks: Promise<void>[] = [];
            for (const category of Object.keys(data)) {
              for (const id of Object.keys(data[category] || {})) {
                const value = data[category][id];
                const file = `${category}-${id}.json`;
                tasks.push(
                  value ? writeData(value, file) : removeData(file),
                );
              }
            }
            await Promise.all(tasks);
          },
        },
      },
      saveCreds: async () => writeData(creds, 'creds.json'),
    };
  }

  /**
   * Remove all auth keys for user (logout / disconnect).
   */
  async clearAuth(userId: string): Promise<void> {
    const redis = this.getRedis();
    if (!redis) {
      this.logger.warn('REDIS_URL not set; clearAuth no-op');
      return;
    }
    await redis.connect().catch(() => {});
    const pattern = `${this.keyPrefix(userId)}:*`;
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
    this.logger.log(`clearAuth: removed Redis keys for user ${userId}`);
  }

  /**
   * Refresh TTL on all auth keys for user (call on successful connect).
   */
  async refreshAuthTtl(userId: string): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;
    await redis.connect().catch(() => {});
    const pattern = `${this.keyPrefix(userId)}:*`;
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = next;
      for (const k of keys) {
        await redis.expire(k, AUTH_KEY_TTL_SEC).catch(() => {});
      }
    } while (cursor !== '0');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.client = null;
    }
  }
}
