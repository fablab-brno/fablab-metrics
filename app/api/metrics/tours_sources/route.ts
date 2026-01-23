import { DATA_PATH } from "fablab-metrics/env";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const filename = path.join(DATA_PATH, "tours_info_source.json");

  const data = await fs
    .readFile(filename, "utf8")
    .then((content) => JSON.parse(content))
    .catch(() => []);

  return Response.json(data);
}
