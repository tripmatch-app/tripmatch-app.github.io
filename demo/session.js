/**
 * Mint a session token the worker will accept, in the same format as its own
 * mintSession: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 *
 * The demo signs with a throwaway secret that exists only in the page. A
 * token made here is worthless against the real API, whose secret never
 * leaves Cloudflare.
 */
const b64url = (bytes) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export async function mintDemoSession(secret, user) {
  const enc = new TextEncoder();
  const body = b64url(enc.encode(JSON.stringify({
    email: user.email, name: user.name, exp: Date.now() + 14 * 86400000,
  })));
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return body + "." + b64url(new Uint8Array(sig));
}
