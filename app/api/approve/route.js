// app/api/approve/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = process.env.HF_APPROVE_SECRET;

  // Input validation
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
    // ✅ သင့် Hugging Face Gradio Space URL ကို အစားထိုးပါ
    const hfUrl = "https://livesportmm-s4itmm-auto-approver.hf.space/run/predict/";

    const hfRes = await fetch(hfUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [id, secret] // ✅ Gradio က data key ကို လိုအပ်ပါတယ်
      })
    });

    if (!hfRes.ok) {
      console.error("HF API error:", hfRes.status, await hfRes.text());
      throw new Error(`HF returned ${hfRes.status}`);
    }

    const result = await hfRes.json();
    const output = result.data?.[0];

    return new Response(JSON.stringify(output || { status: "error", msg: "Unexpected response from AI" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("HF API error:", e);
    return new Response(JSON.stringify({ 
      status: "error", 
      msg: "Auto-approve system is currently unavailable. Please try again later." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
