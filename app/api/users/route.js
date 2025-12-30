// app/api/users/route.js
export async function GET() {
  try {
    const res = await fetch(
      "https://m-sport-download.static.hf.space/approved_users.json",
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    )

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "HF fetch failed" }),
        { status: 500 }
      )
    }

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Proxy error" }),
      { status: 500 }
    )
  }
}
