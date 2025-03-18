import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import { storeTrade } from "./redisClient";
import { CONFIG } from "./config";

// Store last processed line per file
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
    processTradeFile(filePath, true);
  });

  watcher.on("change", async (filePath) => {
    console.log(`✍ Trade file updated: ${filePath}`);
    processTradeFile(filePath, false);
  });

  watcher.on("error", (error) => console.error(`❌ Watcher error: ${error}`));
}

async function processTradeFile(filePath: string, isNewFile: boolean) {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return;

    const lines = content.split("\n");

    // Get the last processed line index
    const lastLineIndex = lastProcessedLines[filePath] || 0;
    const newLines = lines.slice(lastLineIndex); // Read only new lines

    for (const line of newLines) {
      const trade = JSON.parse(line);
      await storeTrade(trade);
    }

    // Update last processed line count
    lastProcessedLines[filePath] = lines.length;

    console.log(`✅ Processed ${newLines.length} new trades from ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}: ${error}`);
  }
}
