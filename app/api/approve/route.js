export const runtime = "edge";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !/^\d{12}$/.test(id)) {
      return new Response(
        JSON.stringify({ status: "error", msg: "Invalid device ID" }),
        { status: 400 }
      );
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_SECRET = process.env.HF_APPROVE_SECRET;

    if (!HF_TOKEN || !HF_SECRET) {
      return new Response(
        JSON.stringify({ status: "error", msg: "Missing server secrets" }),
        { status: 500 }
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

    const result = await hfRes.json();
    const output = result?.data?.[0];

    if (!output) {
      throw new Error("Invalid HF response");
    }

    return new Response(
      JSON.stringify(output),
      { status: 200 }
    );

  } catch (err) {
    console.error("APPROVE ERROR:", err);

    return new Response(
      JSON.stringify({
        status: "error",
        msg: "Approval service unavailable"
      }),
      { status: 500 }
    );
  }
}
