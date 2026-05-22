/**
 * Returns the full invite URL a buyer sends to their creative.
 * Works both client-side (window.location) and falls back to env origin.
 */
export function getInviteUrl(dealId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/invite/${dealId}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://pact-ai.vercel.app";
  return `${base}/invite/${dealId}`;
}
