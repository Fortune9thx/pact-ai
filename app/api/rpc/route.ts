/**
 * RPC Proxy — fixes wallet ↔ Bradbury incompatibility.
 *
 * Some wallets generate UUID string IDs for JSON-RPC (e.g. "id":"a1b2-...").
 * Bradbury's Go RPC server only accepts integer IDs and rejects strings.
 * This proxy converts any string ID to a numeric timestamp before forwarding.
 */

import { NextRequest } from "next/server";

const BRADBURY_RPC = "https://rpc-bradbury.genlayer.com";

function patchId(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(patchId);
  if (body !== null && typeof body === "object") {
    const b = body as Record<string, unknown>;
    return { ...b, id: typeof b.id === "string" ? Date.now() : b.id };
  }
  return body;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patched = patchId(body);

    const upstream = await fetch(BRADBURY_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patched),
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RPC proxy error";
    return Response.json({ jsonrpc: "2.0", error: { code: -32603, message }, id: null }, { status: 502 });
  }
}

// Some EVM tooling sends OPTIONS pre-flight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
