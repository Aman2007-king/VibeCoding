// Generates strong, random values for the secrets this app requires
// (ENCRYPTION_KEY, SESSION_SECRET) so you never have to hand-roll one.
//
// Usage:
//   npm run generate-secrets
//
// Paste the output into your local .env file, and/or into your hosting
// provider's environment variable settings (e.g. Render dashboard) for
// production. Run it again any time you want to rotate a secret — just be
// aware that rotating ENCRYPTION_KEY makes any previously-stored encrypted
// API keys undecryptable, so users would need to re-enter theirs.

import crypto from "crypto";

function generate(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

console.log("\nGenerated secrets — copy these into your .env file or hosting provider:\n");
console.log(`ENCRYPTION_KEY=${generate(16)}`); // 16 bytes -> 32 hex chars, matches server's 32-char key exactly
console.log(`SESSION_SECRET=${generate(32)}`);
console.log("\nDon't commit these to source control. Keep .env in .gitignore (it already is).\n");
