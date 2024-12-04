export async function hashPassword(password: string, iterations = 720000) {
  const pwUtf8 = new TextEncoder().encode(password);
  const pwKey = await crypto.subtle.importKey("raw", pwUtf8, "PBKDF2", false, [
    "deriveBits",
  ]);

  const salt = new TextEncoder().encode(process.env.SECRET_KEY);

  const params = {
    name: "PBKDF2",
    hash: "SHA-512",
    salt,
    iterations,
  };
  const keyBuffer = await crypto.subtle.deriveBits(params, pwKey, 256);

  const keyArray = Array.from(new Uint8Array(keyBuffer));
  const compositeStr = keyArray
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa("v01" + compositeStr);
}
