// app/api/approve/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = process.env.HF_APPROVE_SECRET;
  const token = process.env.HF_TOKEN;

  // ✅ Input validation ထပ်ထည့်ပေးပါတယ်
  if (!id || typeof id !== "string" || id.length !== 12 || !/^\d+$/.test(id)) {
    return new Response(
      JSON.stringify({ status: "error", msg: "Invalid device ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!secret || !token) {
    return new Response(
      JSON.stringify({ status: "error", msg: "Missing secrets" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // ✅ URL နောက်က space ဖျက်ပြီး
    const hfRes = await fetch(
      "https://livesportmm-s4itmm-auto-approver.hf.space/run/predict/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          data: [id, secret] // ✅ Gradio က ဒီပုံစံကိုလိုအပ်
        })
      }
    );

    // ✅ Error စစ်ပါ
    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error("HF API error:", hfRes.status, errText);
      throw new Error(`HF returned ${hfRes.status}`);
    }

    const result = await hfRes.json();
    const output = result.data?.[0];

    return new Response(JSON.stringify(output || { status: "error", msg: "Unexpected response" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Auto-approve system error:", e.message);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        msg: "Auto-approve system is temporarily unavailable. Please try again later." 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
      }
