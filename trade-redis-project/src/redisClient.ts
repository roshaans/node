import Redis from "ioredis";
import { CONFIG } from "./config";

const redis = new Redis(CONFIG.REDIS_URL);

export async function storeTrade(trade: any) {
  const timestamp = new Date(trade.time).getTime();
  const tradeKey = `trade:${trade.hash}`;

  // ❌ Skip if trade already exists in Redis
  if (await redis.exists(tradeKey)) return;

  // ✅ Store trade in user's sorted set
  for (const side of trade.side_info) {
    const userKey = `user_trades:${side.user}`;
    await redis.zadd(userKey, timestamp, JSON.stringify(trade));
  }

  // ✅ Mark trade as processed (Expire in 7 days)
  await redis.set(tradeKey, "1", "EX", 604800);
}

// Retrieve a user's trade history in chronological order
export async function getUserTrades(user: string, startTime?: number, endTime?: number) {
  const userKey = `user_trades:${user}`;
  return await redis.zrangebyscore(userKey, startTime || "-inf", endTime || "+inf");
}

export default redis;
