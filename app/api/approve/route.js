// app/api/approve/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = process.env.HF_APPROVE_SECRET;
  const token = process.env.HF_TOKEN;

  if (!id || typeof id !== "string" || id.length !== 12 || !/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ status: "error", msg: "Invalid device ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!secret || !token) {
    return new Response(JSON.stringify({ status: "error", msg: "Missing secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // ✅ သင့် real space name ကို အသုံးပြုပါ
    const hfRes = await fetch(
      "https://livesportmm-s4itmm-tv-approver.hf.space",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          data: [id, secret]
        })
      }
    );

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error("HF API Error:", hfRes.status, errText);
      throw new Error(`HF returned ${hfRes.status}`);
    }

    const result = await hfRes.json();
    const output = result.data?.[0];

    return new Response(JSON.stringify(output || { status: "error", msg: "Unexpected response" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Auto-approve error:", e.message);
    return new Response(JSON.stringify({ 
      status: "error", 
      msg: "Auto-approve system is currently unavailable. Please try again later." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
