import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * خدمة Redis توفّر قفلاً موزّعاً للمزادات لمنع تزامن المزايدات (Race Conditions).
 * إن لم يتوفر Redis، تسقط تلقائياً إلى قفل داخلي في الذاكرة (مناسب لنسخة واحدة من الخادم).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly localLocks = new Set<string>();

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      try {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: false,
          retryStrategy: () => null, // لا تُغرق السجل بمحاولات إعادة الاتصال
        });
        this.client.on('error', (err) => {
          this.logger.warn(`Redis غير متاح، استخدام القفل الداخلي: ${err.message}`);
          this.client = null;
        });
      } catch (e) {
        this.logger.warn('تعذّر تهيئة Redis، استخدام القفل الداخلي.');
      }
    } else {
      this.logger.warn('REDIS_URL غير محدّد، استخدام القفل الداخلي.');
    }
  }

  /** يحاول الحصول على قفل لمدة ttl بالميلي ثانية. يعيد true إن نجح. */
  async acquireLock(key: string, ttlMs = 5000): Promise<boolean> {
    if (this.client) {
      try {
        const res = await this.client.set(key, '1', 'PX', ttlMs, 'NX');
        return res === 'OK';
      } catch {
        // السقوط للقفل الداخلي
      }
    }
    if (this.localLocks.has(key)) return false;
    this.localLocks.add(key);
    setTimeout(() => this.localLocks.delete(key), ttlMs).unref?.();
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // تجاهل
      }
    }
    this.localLocks.delete(key);
  }

  /** يحاول الحصول على القفل مع إعادة المحاولة لفترة وجيزة. */
  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 5000): Promise<T> {
    const deadline = Date.now() + 3000;
    let acquired = false;
    while (Date.now() < deadline) {
      acquired = await this.acquireLock(key, ttlMs);
      if (acquired) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    if (!acquired) {
      throw new Error('تعذّر الحصول على القفل، حاول مجدداً.');
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(key);
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
