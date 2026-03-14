/**
 * match-summary — Netlify serverless function
 * Tar emot matchdata + tränarnotering och genererar 3 texter via Claude API.
 * Returnerar { spelare, foraldrar, tranare } till React-appen.
 * Inga målskyttar eller passningsspelare inkluderas (11-åringar).
 */
export default async function handler(req, context) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY saknas" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ogiltig JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { match, note } = body;
  if (!match) {
    return new Response(JSON.stringify({ error: "match saknas i body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Bygg matchfakta (UTAN målskyttar/assist — känsligt med 11-åringar)
  const result = match.result
    ? `HIBS ${match.result.us} – ${match.result.them} mot ${match.opponent}`
    : `vs ${match.opponent}`;

  const lagmal =
    Array.isArray(match.teamGoals) && match.teamGoals.length > 0
      ? match.teamGoals.join(", ")
      : null;

  const datumStr = match.date || "";
  const serie = match.serie || "";

  const matchInfo = [
    `Resultat: ${result}`,
    datumStr ? `Datum: ${datumStr}` : null,
    serie ? `Serie: ${serie}` : null,
    lagmal ? `Lagmål: ${lagmal}` : null,
    note ? `Tränarens notering: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Du är assistent för ett innebandylag för 11-åringar (HIBS P2015).
Baserat på följande matchinformation, skriv tre separata texter:

${matchInfo}

TEXT 1 - SPELARE (WhatsApp till spelarna):
Energisk, rolig, engagerande. Max 4 meningar. Peppa laget efter matchen. Nämn lagmålen om de finns. Inga individuella utmärkelser.

TEXT 2 - FÖRÄLDRAR (WhatsApp till föräldragruppen):
Varm, uppskattande och glad. Max 4 meningar. Tacka för stödet, lyft lagandan. Nämn lagmålen om de finns.

TEXT 3 - TRÄNARE (inför nästa träning):
Analytisk och konstruktiv. Max 5 meningar. Lyft vad som fungerade bra, vad som kan övas på nästa träning. Använd tränarens notering som underlag.

Svara EXAKT i detta JSON-format, inga extra kommentarer:
{"spelare":"...","foraldrar":"...","tranare":"..."}`;

  let claudeRes;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    claudeRes = await resp.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Kunde inte nå Claude API: " + e.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const raw = claudeRes?.content?.[0]?.text || "";
  let parsed;
  try {
    // Extrahera JSON ur svaret (Claude kan lägga text runt det)
    const match2 = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match2 ? match2[0] : raw);
  } catch {
    return new Response(
      JSON.stringify({ error: "Claude svarade inte i rätt format", raw }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
