// app/api/users/route.js

export async function GET() {
  try {
    // 🔹 Hugging Face static JSON (READ ONLY)
    const HF_JSON =
      "https://m-sport-download.static.hf.space/approved_users.json"

    const res = await fetch(HF_JSON, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          status: "error",
          msg: "Unable to fetch approved users"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const users = await res.json()

    // 🔹 MUST be array
    if (!Array.isArray(users)) {
      return new Response(
        JSON.stringify({
          status: "error",
          msg: "Invalid users data format"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    })
  } catch (e) {
    return new Response(
      JSON.stringify({
        status: "error",
        msg: "Users service unavailable"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
      }
