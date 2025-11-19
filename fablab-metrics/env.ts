import path from "path";

export const DATA_PATH =
  process.env.DATA_PATH ?? path.join(process.cwd(), "data");
