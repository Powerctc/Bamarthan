// app/api/approve/route.js

export const runtime = "edge"; // ✅ deprecated fix

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !/^\d{12}$/.test(id)) {
      return new Response(
        JSON.stringify({ status: "error", msg: "Invalid device ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_SECRET = process.env.HF_APPROVE_SECRET;

    if (!HF_TOKEN || !HF_SECRET) {
      return new Response(
        JSON.stringify({ status: "error", msg: "Server not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hfRes = await fetch(
      "https://livesportmm-s4itmm-tv-approver.hf.space/run/predict",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [id, HF_SECRET]
        })
      }
    );

    if (!hfRes.ok) {
      throw new Error("HF request failed");
    }

    const result = await hfRes.json();
    const output = result?.data?.[0];

    return new Response(
      JSON.stringify(output || { status: "error", msg: "Invalid HF response" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        status: "error",
        msg: "Approval service unavailable"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
