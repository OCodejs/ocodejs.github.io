const targets = [
  ["OCodeJS docs", "https://ocodejs.co/docs/"],
  ["OCodeJS homepage", "https://ocodejs.co/"],
  ["OCodeJS www", "https://www.ocodejs.co/"],
  ["OCodeJS CLI Hub custom route", "https://ocodejs.co/cli-hub/"],
  ["OCodeJS CLI Hub canonical Pages", "https://ocodejs.github.io/cli-hub/"],
  ["Ask OCodeJS Pages", "https://zskbot.github.io/ask-ocodejs/"],
  ["VelclawHost Pages", "https://velclaw.github.io/VelclawHost/"],
];

const results = await Promise.all(
  targets.map(async ([name, requestedUrl]) => {
    try {
      const response = await fetch(requestedUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
        headers: { "user-agent": "OCodeJS-Ecosystem-Healthcheck/1.0" },
      });
      const contentType = response.headers.get("content-type") || "";
      const result = {
        name,
        requestedUrl,
        status: response.status,
        finalUrl: response.url,
        contentType,
        ok:
          response.status === 200 &&
          response.url.startsWith("https://") &&
          contentType.includes("text/html"),
      };
      await response.body?.cancel();
      return result;
    } catch (error) {
      return {
        name,
        requestedUrl,
        ok: false,
        error: error?.cause?.code || error?.code || error?.message || "request failed",
      };
    }
  }),
);

const summary = {
  checkedAt: new Date().toISOString(),
  total: results.length,
  passed: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  results,
};
console.log(JSON.stringify(summary, null, 2));
if (summary.failed > 0) process.exitCode = 1;
