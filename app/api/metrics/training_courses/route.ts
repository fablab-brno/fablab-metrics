import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const filename = path.join(process.cwd(), "data", "training_courses.json");

  const data = await fs
    .readFile(filename, "utf8")
    .then((content) => JSON.parse(content))
    .catch(() => []);

  return Response.json(data);
}
