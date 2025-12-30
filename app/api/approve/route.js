import { Buffer } from "buffer"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !/^\d{12}$/.test(id)) {
      return Response.json({ status: "error", msg: "Invalid ID" })
    }

    const {
      GITHUB_TOKEN,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_FILE,
      GITHUB_BRANCH
    } = process.env

    if (!GITHUB_TOKEN) {
      return Response.json({ status: "error", msg: "Missing GitHub token" })
    }

    const api =
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`

    // READ FILE
    const fileRes = await fetch(api, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    })

    const file = await fileRes.json()
    const sha = file.sha
    const list = JSON.parse(
      Buffer.from(file.content, "base64").toString()
    )

    // already exists
    if (list.find(u => u.id === id)) {
      return Response.json({ status: "success", msg: "Already approved" })
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    list.push({
      id,
      name: "Auto Approved",
      expires: expires.toISOString().split("T")[0]
    })

    // WRITE FILE
    await fetch(api, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Auto approve ${id}`,
        content: Buffer.from(JSON.stringify(list, null, 2)).toString("base64"),
        sha,
        branch: GITHUB_BRANCH
      })
    })

    return Response.json({ status: "success" })

  } catch (e) {
    return Response.json({
      status: "error",
      msg: "Auto approval failed"
    })
  }
  }
