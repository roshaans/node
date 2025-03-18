import { getUserTrades } from "./redisClient";

async function main() {
    const user = "0x31ca8395cf837de08b24da3f660e77761dfb974b";
    const trades = await getUserTrades(user);
    console.log(trades.map((trade: string) => JSON.parse(trade)));
}

main().catch(console.error);
