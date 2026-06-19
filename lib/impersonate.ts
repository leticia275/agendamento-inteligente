import { createHmac } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret";
const TTL_MS = 60_000; // token válido por 60 segundos

type Payload = {
  targetUserId: string;
  adminId:      string;
  exp:          number;
  isRestore?:   boolean;
};

function sign(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function createImpersonateToken(targetUserId: string, adminId: string): string {
  return sign({ targetUserId, adminId, exp: Date.now() + TTL_MS });
}

export function createRestoreToken(adminId: string): string {
  return sign({ targetUserId: adminId, adminId, exp: Date.now() + TTL_MS, isRestore: true });
}

export function verifyImpersonateToken(token: string): Payload | null {
  try {
    const [data, sig] = token.split(".");
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
    if (sig !== expected) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
