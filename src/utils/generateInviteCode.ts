/**
 * Generates a unique 9-character alphanumeric invite code (A-Z, 0-9).
 * Excludes visually confusable characters: 0, O, I, 1.
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(): string {
  let code = '';
  const array = new Uint8Array(9);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += CHARS[byte % CHARS.length];
  }
  return code;
}
