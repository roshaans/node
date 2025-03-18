import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { storeTrade, isUserWhitelisted } from "./redisClient";
import { CONFIG } from "./config";

const lastProcessedLines: Record<string, number> = {};

export function watchTradeFiles() {
  console.log("🚀 Watching for new trades...");

  const watcher = chokidar.watch(CONFIG.TRADE_DIRECTORY, {
    persistent: true,
    ignoreInitial: false,
    depth: 3, // Ensures new hourly files are detected
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  });

  watcher.on("add", async (filePath) => {
    console.log(`🆕 New trade file detected: ${filePath}`);
    processTradeFile(filePath);
  });

  watcher.on("change", async (filePath) => {
    console.log(`✍ Trade file updated: ${filePath}`);
    processTradeFile(filePath);
  });

  watcher.on("error", (error) => console.error(`❌ Watcher error: ${error}`));
}

async function processTradeFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return;

    const lines = content.split("\n");
    const lastLineIndex = lastProcessedLines[filePath] || 0;
    const newLines = lines.slice(lastLineIndex); // Read only new lines

    for (const line of newLines) {
      const trade = JSON.parse(line);

      // ✅ Check if at least one user in the trade is whitelisted
      for (const side of trade.side_info) {
        if (await isUserWhitelisted(side.user)) {
          await storeTrade(trade);
          break; // No need to check further
        }
      }
    }

    lastProcessedLines[filePath] = lines.length;
    console.log(`✅ Processed ${newLines.length} new trades from ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}: ${error}`);
  }
}
