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

function getValue(obj: any, path: string) {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    if (!current) return undefined;

    const part = parts[i];

    // 🔥 intentar acceso normal
    if (current[part] !== undefined) {
      current = current[part];
      continue;
    }

    // 🔥 intentar clave con punto (caso Gmail)
    const remainingPath = parts.slice(i).join(".");
    if (current[remainingPath] !== undefined) {
      return current[remainingPath];
    }

    return undefined;
  }

  return current;
}

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

      function safeParseRules(data: any): RuleGroup[] {
      if (!data) return [];

      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch {
          return [];
        }
      }

      if (Array.isArray(data)) {
        return data;
      }

      return [];
    }

    const rawRules = await redis.get("rules");
    const groups = safeParseRules(rawRules);

      const event = {
        id: Date.now(),
        ...req.body,
      };

      console.log("EVENT:", JSON.stringify(event, null, 2));
      console.log("RULES:", JSON.stringify(rules, null, 2));

      console.log("EVENT:", JSON.stringify(event, null, 2));
console.log("RULES:", JSON.stringify(rules, null, 2));

const matches = rules.length === 0 || rules.some((group: any) => {
  if (!group.enabled) return false;

  console.log("Checking group:", group.name);

  const result = group.rules.every((rule: any) => {

    const value = getValue(event, rule.field);

    console.log("---- RULE ----");
    console.log("FIELD:", rule.field);
    console.log("EXPECTED:", rule.match);
    console.log("VALUE:", value);

    if (!value) return false;

    return String(value).includes(rule.match);
  });

  console.log("GROUP RESULT:", result);

  return result;
});

console.log("FINAL MATCH:", matches);
      
      return res.status(200).json({ ok: true });
    }

    // =========================
    // GET
    // =========================
    if (req.method === "GET") {

      const since = Number(req.query.since || 0);

      const events = await redis.lrange("events", 0, 50);

      const parsed = events.map((e) => safeParse(e));

      const filtered = parsed.filter((e: any) => e.id > since);

      return res.status(200).json(filtered);
    }

    return res.status(405).end();

  } catch (err: any) {
    console.error("ERROR API EVENTS:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
}