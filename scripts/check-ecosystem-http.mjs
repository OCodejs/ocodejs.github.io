// Diagnostic-only smoke test; this branch is not intended for production deployment.
const targets = [
  { name: "OCodeJS docs custom domain", url: "https://ocodejs.co/docs/" },
  { name: "OCodeJS homepage custom domain", url: "https://ocodejs.co/" },
  { name: "OCodeJS CLI Hub custom route", url: "https://ocodejs.co/cli-hub/" },
  { name: "OCodeJS CLI Hub canonical Pages", url: "https://ocodejs.github.io/cli-hub/" },
  { name: "Ask OCodeJS Pages", url: "https://zskbot.github.io/ask-ocodejs/" },
  { name: "VelclawHost Pages overview", url: "https://velclaw.github.io/VelclawHost/#/overview" }
];

const results = await Promise.all(targets.map(async (target) => {
  try {
    const response = await fetch(target.url, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "OCodeJS-Ecosystem-HTTP-Smoke/1.0", accept: "text/html,application/xhtml+xml" }
    });
    const body = await response.text();
    let title = null;
    const lowerBody = body.toLowerCase();
    const titleStart = lowerBody.indexOf("<title");
    if (titleStart >= 0) {
      const titleOpen = lowerBody.indexOf(">", titleStart);
      const titleClose = lowerBody.indexOf("</title>", titleOpen + 1);
      if (titleOpen >= 0 && titleClose > titleOpen) {
        title = body.slice(titleOpen + 1, titleClose).replaceAll("\\n", " ").replaceAll("\\r", " ").trim();
      }
    }
    return {
      name: target.name,
      requestedUrl: target.url,
      status: response.status,
      ok: response.status === 200,
      finalUrl: response.url,
      contentType: response.headers.get("content-type"),
      bytes: Buffer.byteLength(body),
      title
    };
  } catch (error) {
    return { name: target.name, requestedUrl: target.url, ok: false, error: error?.cause?.code || error?.message || "fetch failed" };
  }
}));

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), total: results.length, passed: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length, results }, null, 2));
if (results.some((item) => !item.ok)) process.exitCode = 1;
