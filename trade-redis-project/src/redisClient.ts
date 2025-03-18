import Redis from "ioredis";
import { CONFIG } from "./config";

const redis = new Redis(CONFIG.REDIS_URL);

/**
 * ✅ Store trade in Redis only for allowed users
 */
export async function storeTrade(trade: any) {
  const timestamp = new Date(trade.time).getTime();
  const tradeKey = `trade:${trade.hash}`;

  // ❌ Skip if trade already exists
  if (await redis.exists(tradeKey)) return;

  for (const side of trade.side_info) {
    const user = side.user;
    const userKey = `user_trades:${user}`;

    // 🔍 Check if the user is whitelisted
    if (await isUserWhitelisted(user)) {
      await redis.zadd(userKey, timestamp, JSON.stringify(trade));
    }
  }

  // ✅ Mark trade as processed (Expire in 7 days)
  await redis.set(tradeKey, "1", "EX", 604800);
}

/**
 * 📜 Retrieve a user's trade history in chronological order
 */
export async function getUserTrades(user: string, startTime?: number, endTime?: number) {
  const userKey = `user_trades:${user}`;
  return await redis.zrangebyscore(userKey, startTime || "-inf", endTime || "+inf");
}

/**
 * ✅ Add a user to the whitelist
 */
export async function addUserToWhitelist(user: string) {
  await redis.sadd("allowed_users", user);
  console.log(`✅ Added ${user} to allowed users`);
}

/**
 * ❌ Remove a user from the whitelist
 */
export async function removeUserFromWhitelist(user: string) {
  await redis.srem("allowed_users", user);
  console.log(`❌ Removed ${user} from allowed users`);
}

/**
 * 📜 Get all whitelisted users
 */
export async function getAllowedUsers() {
  return await redis.smembers("allowed_users");
}

/**
 * 🔍 Check if a user is whitelisted
 */
export async function isUserWhitelisted(user: string): Promise<boolean> {
  return (await redis.sismember("allowed_users", user)) === 1;
}

export async function getLatestTradeTimestamp(): Promise<number | null> {
  try {
    // Get all user trades and find the latest timestamp
    const users = await redis.smembers("allowed_users");
    let latestTimestamp: number | null = null;

    for (const user of users) {
      const userKey = `user_trades:${user}`;
      const latestTrade = await redis.zrevrangebyscore(userKey, "+inf", "-inf", "LIMIT", 0, 1);

      if (latestTrade.length > 0) {
        const trade = JSON.parse(latestTrade[0]);
        const tradeTimestamp = new Date(trade.time).getTime();
        if (!latestTimestamp || tradeTimestamp > latestTimestamp) {
          latestTimestamp = tradeTimestamp;
        }
      }
    }

    return latestTimestamp;
  } catch (error) {
    console.error("❌ Error fetching latest trade timestamp:", error);
    return null;
  }
}
export default redis;
