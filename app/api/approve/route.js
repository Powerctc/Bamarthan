// app/api/approve/route.js

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const HF_SECRET = process.env.HF_APPROVE_SECRET
    const HF_TOKEN = process.env.HF_TOKEN

    /* =============================
       VALIDATION
    ============================= */
    if (!id || typeof id !== 'string') {
      return json(
        { status: 'error', msg: 'Missing device ID' },
        400
      )
    }

    if (!/^\d{12}$/.test(id)) {
      return json(
        { status: 'error', msg: 'Invalid device ID format' },
        400
      )
    }

    if (!HF_SECRET || !HF_TOKEN) {
      return json(
        { status: 'error', msg: 'Server configuration error' },
        500
      )
    }

    /* =============================
       CALL HF SPACE (GRADIO)
       Space: livesportmm/s4itmm-tv-approver
    ============================= */
    const hfRes = await fetch(
      'https://livesportmm-s4itmm-tv-approver.hf.space/run/predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify({
          data: [id, HF_SECRET]
        })
      }
    )

    if (!hfRes.ok) {
      const text = await hfRes.text()
      console.error('HF error:', hfRes.status, text)

      return json(
        {
          status: 'error',
          msg: 'Approval service unavailable'
        },
        502
      )
    }

    const hfJson = await hfRes.json()

    /* =============================
       EXPECTED HF RESPONSE
       { data: [ { status, msg } ] }
    ============================= */
    const output = hfJson?.data?.[0]

    if (!output || typeof output !== 'object') {
      return json(
        {
          status: 'error',
          msg: 'Invalid response from approval server'
        },
        500
      )
    }

    return json(
      {
        status: output.status || 'error',
        msg: output.msg || 'Unknown response'
      },
      200
    )
  } catch (err) {
    console.error('Approve API error:', err)

    return json(
      {
        status: 'error',
        msg: 'Auto-approve system error'
      },
      500
    )
  }
}

/* =============================
   HELPER
============================= */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}
