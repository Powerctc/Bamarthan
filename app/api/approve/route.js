export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch(
      "https://m-sport-download.static.hf.space/approved_users.json",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    if (!res.ok) {
      throw new Error("HF fetch failed");
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({
      status: "error",
      msg: "Approval service unavailable"
    }), { status: 500 });
  }
}
