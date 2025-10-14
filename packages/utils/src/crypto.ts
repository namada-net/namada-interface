/**
 * Compute SHA256 hash from byte array, return as hexadecimal string
 * @param msg - byte array
 * @returns hash string
 */
export const sha256Hash = async (msg: Uint8Array): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
