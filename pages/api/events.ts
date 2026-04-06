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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  // =========================
  // POST → recibir eventos
  // =========================
  if (req.method === "POST") {

    const rawRules = await redis.get("rules");
    const groups: RuleGroup[] = Array.isArray(rawRules) ? rawRules : [];

    const event = {
      id: Date.now(),
      ...req.body,
    };

    // 🔥 LÓGICA:
    // - OR entre grupos
    // - AND dentro del grupo
    const matches =
      groups.length === 0 ||
      groups.some((group) => {
        if (!group.enabled) return false;

        return group.rules.every((rule) => {

          function getValue(obj: any, path: string) {
            return path.split(".").reduce((acc, part) => acc?.[part], obj);
          }

          const value = getValue(event, rule.field);

          if (!value) return false;

          return String(value).includes(rule.match);
        });
      });

    if (matches) {
      await redis.lpush("events", JSON.stringify(event));
      await redis.ltrim("events", 0, 100);
    }

    return res.status(200).json({ ok: true });
  }

  // =========================
  // GET → obtener eventos
  // =========================
  if (req.method === "GET") {

    const events = await redis.lrange("events", 0, 50);

    return res.status(200).json(
      events.map((e) => JSON.parse(e as string))
    );
  }

  return res.status(405).end();
}