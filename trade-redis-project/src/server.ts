import express, { Application, Request, Response } from "express";
import cors from "cors";
import { addUserToWhitelist, removeUserFromWhitelist, getAllowedUsers, getUserTrades, getLatestTradeTimestamp } from "./redisClient";
import { CONFIG } from "./config";
import path from "path";
import fs from "fs";

const app: Application = express(); // Define app as Express Application

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * ✅ Health check endpoint to monitor latest block
 */
app.get("/health", async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔍 Get latest file modified in the trade directory
    const latestFile = getLatestTradeFile(CONFIG.TRADE_DIRECTORY);

    // 🔍 Get latest processed trade timestamp from Redis
    const latestTradeTime = await getLatestTradeTimestamp();

    res.json({
      status: "healthy",
      latest_file_written: latestFile,
      latest_trade_processed: latestTradeTime ? new Date(latestTradeTime).toISOString() : "No trades processed yet",
    });
  } catch (error) {
    console.error("❌ Error fetching health status:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});


/**
 * 📜 Get the latest modified trade file in the directory
 */
function getLatestTradeFile(tradeDir: string): string | null {
  try {
    const dateFolders = fs.readdirSync(tradeDir).filter((name) => /^\d{8}$/.test(name)); // YYYYMMDD format
    if (dateFolders.length === 0) return null;

    // Get the most recent date folder
    const latestDateFolder = dateFolders.sort().reverse()[0];
    const hourFilesPath = path.join(tradeDir, latestDateFolder);

    // Get all hour files in the latest date folder
    const hourFiles = fs.readdirSync(hourFilesPath).filter((name) => /^\d{1,2}$/.test(name)); // Hour format (0-23)
    if (hourFiles.length === 0) return null;

    // Get the latest modified file
    const latestFile = hourFiles
      .map((hour) => ({ hour, time: fs.statSync(path.join(hourFilesPath, hour)).mtimeMs }))
      .sort((a, b) => b.time - a.time)[0];

    return path.join(latestDateFolder, latestFile.hour);
  } catch (error) {
    console.error("❌ Error finding latest trade file:", error);
    return null;
  }
}
/**
 * ✅ Add a user to the whitelist
 */
app.post("/allow-user", async (req: Request, res: Response): Promise<void> => {
  const { user } = req.body;
  if (!user) {
    res.status(400).json({ error: "User address required." });
    return;
  }

  await addUserToWhitelist(user);
  res.json({ message: `✅ User ${user} added to allowed list.` });
});

/**
 * ❌ Remove a user from the whitelist
 */
app.post("/remove-user", async (req: Request, res: Response): Promise<void> => {
  const { user } = req.body;
  if (!user) {
    res.status(400).json({ error: "User address required." });
    return;
  }

  await removeUserFromWhitelist(user);
  res.json({ message: `❌ User ${user} removed from allowed list.` });
});

/**
 * 📜 Get all whitelisted users
 */
app.get("/allowed-users", async (req: Request, res: Response): Promise<void> => {
  const users = await getAllowedUsers();
  res.json(users);
});

/**
 * 📈 Get user's trade history
 */
app.get("/user-trades/:user", async (req: Request, res: Response): Promise<void> => {
  const { user } = req.params;
  const trades = await getUserTrades(user);
  res.json(trades);
});

/**
 * 🚀 Start the server
 */
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

export default app;
