import { redis } from "@/lib/redis";

export default async function handler(req, res) {

  if (req.method === "GET") {
    const rules = await redis.get("rules") || [];
    return res.status(200).json(rules);
  }

  if (req.method === "POST") {
    await redis.set("rules", req.body);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}