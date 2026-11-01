import { createSign } from "node:crypto";

// Google Wallet loyalty card: one class per company (name, logo, branch locations
// for "you're near" reminders), one object per member (points, tier).
// Env: GOOGLE_WALLET_ISSUER_ID and GOOGLE_WALLET_SERVICE_ACCOUNT (the key JSON).

const API = "https://walletobjects.googleapis.com/walletobjects/v1";

const account = () => {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;
  return raw ? (JSON.parse(raw) as { client_email: string; private_key: string }) : null;
};

export const googleWalletEnabled = () => !!process.env.GOOGLE_WALLET_ISSUER_ID && !!account();

const b64 = (v: string | Buffer) => Buffer.from(v).toString("base64url");

function sign(claims: object) {
  const sa = account()!;
  const body = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify(claims))}`;
  return `${body}.${createSign("RSA-SHA256").update(body).sign(sa.private_key, "base64url")}`;
}

let token: { value: string; exp: number } | null = null;
async function accessToken() {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const assertion = sign({
    iss: account()!.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`Google token: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

async function call(method: string, path: string, body: object) {
  return fetch(`${API}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// PATCH, or insert when Google doesn't have it yet.
async function upsert(kind: "loyaltyClass" | "loyaltyObject", body: { id: string }) {
  let res = await call("PATCH", `${kind}/${body.id}`, body);
  if (res.status === 404) res = await call("POST", kind, body);
  if (!res.ok) throw new Error(`${kind}: ${res.status} ${await res.text()}`);
}

const issuer = () => process.env.GOOGLE_WALLET_ISSUER_ID!;
const classId = (companyId: string) => `${issuer()}.c_${companyId}`;
const objectId = (userId: string, companyId: string) => `${issuer()}.m_${userId}_${companyId}`;

export type CardInput = {
  companyId: string;
  title: string; // "A1 Bistro & Kiya's Restaurant"
  logoUrl: string;
  locations: { lat: number; lng: number }[];
  userId: string;
  memberName: string;
  points: number;
  tier: string | null;
  rewardsUrl: string;
};

// Creates or refreshes the class and the member's card, and returns the
// "Save to Google Wallet" link (a signed reference to the card).
export async function saveCardUrl(c: CardInput, origin: string) {
  await upsert("loyaltyClass", {
    id: classId(c.companyId),
    issuerName: c.title,
    programName: "Rewards",
    programLogo: { sourceUri: { uri: c.logoUrl } },
    hexBackgroundColor: "#CA2851",
    reviewStatus: "UNDER_REVIEW",
    merchantLocations: c.locations.slice(0, 10).map((l) => ({ latitude: l.lat, longitude: l.lng })), // Google's cap
  } as { id: string });
  const id = objectId(c.userId, c.companyId);
  await upsert("loyaltyObject", {
    id,
    classId: classId(c.companyId),
    state: "ACTIVE",
    accountId: c.userId.slice(0, 8).toUpperCase(),
    accountName: c.memberName,
    loyaltyPoints: { label: "Points", balance: { int: c.points } },
    textModulesData: c.tier ? [{ id: "tier", header: "Tier", body: c.tier }] : [],
    linksModuleData: { uris: [{ id: "rewards", uri: c.rewardsUrl, description: "See rewards" }] },
  } as { id: string });
  const jwt = sign({
    iss: account()!.client_email,
    aud: "google",
    typ: "savetowallet",
    origins: [origin],
    payload: { loyaltyObjects: [{ id }] },
  });
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

// New balance onto a saved card. Members who never saved one 404, which is fine.
export async function pushPoints(userId: string, companyId: string, points: number) {
  const res = await call("PATCH", `loyaltyObject/${objectId(userId, companyId)}`, {
    loyaltyPoints: { label: "Points", balance: { int: points } },
  });
  if (!res.ok && res.status !== 404) throw new Error(`loyaltyObject: ${res.status} ${await res.text()}`);
}
