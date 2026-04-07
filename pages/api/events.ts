import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";

type Rule = {
  field: string;
  match: string;
};

type RuleGroup = {
  name: string;
  enabled: boolean;
  rules: Rule[];
};

// 🔥 helper seguro
function safeParse(e: any) {
  if (typeof e === "string") {
    try {
      return JSON.parse(e);
    } catch {
      return { raw: e };
    }
  }
  return e;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    // =========================
    // POST
    // =========================
    if (req.method === "POST") {

      const rawRules = await redis.get("rules");
      const groups: RuleGroup[] = Array.isArray(rawRules) ? rawRules : [];

      const event = {
        id: Date.now(),
        ...req.body,
      };

      const matches =
        groups.length === 0 ||
        groups.some((group) => {
          if (!group.enabled) return false;

          return group.rules.every((rule) => {
            const value = (event as any)[rule.field];
            if (!value) return false;
            return String(value).includes(rule.match);
          });
        });

      if (matches) {
        await redis.lpush("events", JSON.stringify(event));
        await redis.ltrim("events", 0, 100);
      }

      console.log("EVENT TO SAVE:", event);
      console.log("TYPE:", typeof event);
      const serialized = JSON.stringify(event);
      console.log("SERIALIZED:", serialized);
      
      
      return res.status(200).json({ ok: true });
    }

    // =========================
    // GET
    // =========================
    if (req.method === "GET") {

      const events = await redis.lrange("events", 0, 50);

      const parsed = events.map((e) => safeParse(e));

      return res.status(200).json(parsed);
    }

    return res.status(405).end();

  } catch (err: any) {
    console.error("ERROR API EVENTS:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
}