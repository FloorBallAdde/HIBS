// Supabase client & helpers
const SB_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/ /g, "") || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function hdrs(tok) {
  return {
    apikey: SB_KEY,
    Authorization: "Bearer " + (tok || SB_KEY),
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export async function sbAuth(path, body) {
  const r = await fetch(SB_URL + "/auth/v1/" + path, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function sbRefresh(refreshToken) {
  const r = await fetch(SB_URL + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return r.json();
}

export async function sbGet(table, query, tok) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(
      SB_URL + "/rest/v1/" + table + "?" + (query || "order=created_at.desc"),
      { headers: hdrs(tok), signal: ctrl.signal }
    );
    return r.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function sbPost(table, body, tok) {
  const r = await fetch(SB_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: hdrs(tok),
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function sbPatch(table, id, body, tok) {
  const r = await fetch(SB_URL + "/rest/v1/" + table + "?id=eq." + id, {
    method: "PATCH",
    headers: hdrs(tok),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.message || "sbPatch failed: " + r.status);
  }
  return r.json();
}

export async function sbDel(table, id, tok) {
  await fetch(SB_URL + "/rest/v1/" + table + "?id=eq." + id, {
    method: "DELETE",
    headers: hdrs(tok),
  });
}
