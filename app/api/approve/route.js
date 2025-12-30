// app/api/approve/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = process.env.HF_APPROVE_SECRET;

  if (!id || typeof id !== "string" || id.length !== 12 || !/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ status: "error", msg: "Invalid device ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!secret) {
    return new Response(JSON.stringify({ status: "error", msg: "Missing HF_APPROVE_SECRET" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const hfRes = await fetch(
      "https://your-hf-username-your-space.hf.space/run/predict/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [id, secret]
        })
      }
    );

    if (!hfRes.ok) throw new Error(`HF error: ${hfRes.status}`);

    const result = await hfRes.json();
    const output = result.data?.[0];

    return new Response(JSON.stringify(output || { status: "error", msg: "Unexpected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("HF API error:", e);
    return new Response(JSON.stringify({ status: "error", msg: "AI system unreachable" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
