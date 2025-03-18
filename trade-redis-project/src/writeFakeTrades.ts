import * as fs from "fs";
import * as path from "path";
import { CONFIG } from "./config";

let currentMinuteFolder = ""; // Tracks the latest folder we are writing to

function generateRandomTrade() {
  const users = [
    "0x31ca8395cf837de08b24da3f660e77761dfb974b",
    "0x023a3d058020fb76cca98f01b3c48c8938a22355",
    "0x010461c14e146ac35fe42271bdc1134ee31c703a",
    "0x03b9a189e2480d1e4c3007080b29f362282130fa"
  ];

  const randomUser1 = users[Math.floor(Math.random() * users.length)];
  let randomUser2 = users[Math.floor(Math.random() * users.length)];
  while (randomUser2 === randomUser1) {
    randomUser2 = users[Math.floor(Math.random() * users.length)];
  }

  return {
    coin: ["BTC", "ETH", "SOL", "AVAX", "NEAR"][Math.floor(Math.random() * 5)],
    side: ["B", "A"][Math.floor(Math.random() * 2)],
    time: new Date().toISOString(),
    px: (Math.random() * 1000).toFixed(4),
    sz: (Math.random() * 50).toFixed(2),
    hash: `0x${Math.random().toString(16).substring(2, 42)}`,
    trade_dir_override: "Na",
    side_info: [
      { user: randomUser1, start_pos: (Math.random() * 10000).toFixed(1), oid: Math.floor(Math.random() * 100000000), twap_id: null, cloid: null },
      { user: randomUser2, start_pos: (Math.random() * -10000).toFixed(1), oid: Math.floor(Math.random() * 100000000), twap_id: null, cloid: `0x${Math.random().toString(16).substring(2, 42)}` }
    ]
  };
}

// Function to create a new folder every minute
function updateMinuteFolder() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
  const hourMinuteStr = `${now.getHours()}${now.getMinutes().toString().padStart(2, "0")}`; // HHMM (e.g., "2315" for 23:15)

  const newFolder = path.join(CONFIG.TRADE_DIRECTORY, dateStr, hourMinuteStr);

  if (newFolder !== currentMinuteFolder) {
    currentMinuteFolder = newFolder;

    // Ensure the directory exists
    if (!fs.existsSync(newFolder)) {
      fs.mkdirSync(newFolder, { recursive: true });
      console.log(`📂 Created new trade folder: ${newFolder}`);
    }
  }
}

// Function to write batch trades
function writeBatchTradesToFile(batchSize: number) {
  updateMinuteFolder(); // Ensure we are writing into the latest folder

  const tradeFilePath = path.join(currentMinuteFolder, "trades"); // Single file named "trades" in each folder

  // Generate multiple trades at once
  let tradesBatch = "";
  for (let i = 0; i < batchSize; i++) {
    tradesBatch += JSON.stringify(generateRandomTrade()) + "\n";
  }

  // Append multiple trades at once to minimize disk I/O
  fs.appendFileSync(tradeFilePath, tradesBatch, "utf8");
  console.log(`✅ Wrote ${batchSize} trades to ${tradeFilePath}`);
}

// Increase the batch size & reduce the interval for higher load testing
const BATCH_SIZE = 100; // Number of trades per batch
const INTERVAL_MS = 1000; // Every 1 second

setInterval(() => writeBatchTradesToFile(BATCH_SIZE), INTERVAL_MS);

// Ensure we start with a fresh minute folder
updateMinuteFolder();
