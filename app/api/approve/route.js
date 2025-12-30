// app/api/approve/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const secret = process.env.HF_APPROVE_SECRET;
  const token = process.env.HF_TOKEN;

  try {
    const hfRes = await fetch(
      "https://livesportmm-s4itmm-auto-approver.hf.space/run/predict/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ ဒီလိုထည့်ပါ
        },
        body: JSON.stringify({
          data: [id, secret] // ✅ ဒီလိုပဲ
        })
      }
    );

    if (!hfRes.ok) throw new Error(`HF error: ${hfRes.status}`);

    const result = await hfRes.json();
    const output = result.data?.[0];

    return new Response(JSON.stringify(output), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ status: "error", msg: "AI system unreachable" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
      }
