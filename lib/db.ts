import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

/**
 * Small key/value store for the shop's data (bookings, chats, wallet settings, QR images).
 * With POSTGRES_URL set (Vercel + Supabase) values live in one Postgres table, so they survive on serverless hosting.
 * Without it (local development) they are JSON files under data/kv.
 */
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

let client: ReturnType<typeof postgres> | undefined;
let ready: Promise<unknown> | undefined;

function sql() {
  if (!client) {
    const u = new URL(url);
    u.search = ""; // the Supabase integration adds pooler options the driver does not understand
    client = postgres(u.toString(), { ssl: "require", prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  }
  return client;
}

async function table() {
  ready ??= sql()`create table if not exists adhz_kv (key text primary key, value jsonb not null)`.catch((e) => {
    ready = undefined;
    throw e;
  });
  await ready;
  return sql();
}

const DIR = path.join(process.cwd(), "data", "kv");
const file = (key: string) => path.join(DIR, key.replace(/[^\w-]/g, "_") + ".json");

export async function kvGet<T>(key: string): Promise<T | null> {
  if (url) {
    const rows = await (await table())`select value from adhz_kv where key = ${key}`;
    return (rows[0]?.value as T) ?? null;
  }
  try {
    return JSON.parse(fs.readFileSync(file(key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (url) {
    const db = await table();
    await db`insert into adhz_kv (key, value) values (${key}, ${db.json(value as never)}) on conflict (key) do update set value = excluded.value`;
    return;
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(file(key), JSON.stringify(value));
}

export async function kvDel(key: string): Promise<void> {
  if (url) {
    await (await table())`delete from adhz_kv where key = ${key}`;
    return;
  }
  try {
    fs.unlinkSync(file(key));
  } catch {
    /* nothing saved */
  }
}
