import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method === "POST") {

    const rules = (await redis.get("rules")) || [];

    const event = {
      id: Date.now(),
      ...req.body,
    };

    const matches =
      rules.length === 0 ||
      rules.some((rule: any) => {
        if (!rule.enabled) return false;

        if (rule.deviceId && rule.deviceId !== event.deviceId)
          return false;

        const value = event[rule.field] || "";
        return value.includes(rule.match);
      });

    if (matches) {
      await redis.lpush("events", JSON.stringify(event));
      await redis.ltrim("events", 0, 100);
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const events = await redis.lrange("events", 0, 50);

    return res.status(200).json(
      events.map((e) => JSON.parse(e as string))
    );
  }

  res.status(405).end();
}