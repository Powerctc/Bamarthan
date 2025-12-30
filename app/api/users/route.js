import { Buffer } from "buffer"

export async function GET(req) {
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

  try {
    const api = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`

    // READ
    const res = await fetch(api, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    })

    const json = await res.json()
    const content = JSON.parse(
      Buffer.from(json.content, "base64").toString()
    )

    const exists = content.find(u => u.id === id)
    if (exists) {
      return Response.json({ status: "success", msg: "Already approved" })
    }

    // ADD NEW USER
    content.push({
      id,
      name: "Auto Approved",
      expires: "2026-12-31"
    })

    // WRITE BACK
    await fetch(api, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `auto approve ${id}`,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
        sha: json.sha,
        branch: GITHUB_BRANCH
      })
    })

    return Response.json({ status: "success", msg: "Approved" })
  } catch (e) {
    return Response.json({
      status: "error",
      msg: "Approval service unavailable"
    })
  }
}
