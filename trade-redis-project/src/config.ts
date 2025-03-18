import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  TRADE_DIRECTORY: process.env.PROD == "false" ? "./hl/data/node_trades/hourly/" : "/home/hluser/hl/data/node_trades/hourly/",
  ORDER_DIRECTORY: "/home/hluser/hl/data/node_order_statuses/hourly/",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
};
