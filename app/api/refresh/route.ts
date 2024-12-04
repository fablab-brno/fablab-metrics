import { hashPassword } from "fablab-metrics/auth/hasher";
import { cookies } from "next/headers";
import { exec } from "node:child_process";

export async function POST(req: Request) {
  const data = await req.json().catch((err: Error) => ({}));

  const hash = (await cookies()).get(process.env.COOKIE_AUTH!)?.value;
  const expected = await hashPassword(process.env.AUTH_PASSWORD!);

  if (
    (hash == null && data.key == null) ||
    (hash && hash !== expected) ||
    (data.key && data.key !== process.env.API_KEY)
  ) {
    return new Response(null, { status: 403 });
  }

  const output = await new Promise((resolve, reject) =>
    exec("poetry run python dataloader/main.py", (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        reject({
          status: "error",
          error: err,
        });
      } else {
        console.log(`The stdout Buffer from shell: ${stdout.toString()}`);
        console.log(`The stderr Buffer from shell: ${stderr.toString()}`);
        resolve({
          status: "success",
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      }
    }),
  );

  return Response.json(output);
}
