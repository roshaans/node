import express, { Application, Request, Response } from "express";
import cors from "cors";
import { addUserToWhitelist, removeUserFromWhitelist, getAllowedUsers, getUserTrades } from "./redisClient";

const app: Application = express(); // Define app as Express Application

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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
