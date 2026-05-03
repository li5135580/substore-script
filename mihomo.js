function main(config) {
  if (!config.proxies) return config;

  // ===== 初始化 =====
  if (!config.rules) config.rules = [];
  if (!config["proxy-groups"]) config["proxy-groups"] = [];

  const groups = config["proxy-groups"].map(g => g.name);

  // ===== 自动匹配策略组 =====
  const pick = (names, fallback) => {
    for (const n of names) {
      if (groups.includes(n)) return n;
    }
    return fallback;
  };

  const PROXY = pick(["选择代理", "🚀 节点选择", "🚀 总代理"], "DIRECT");
  const DIRECT = pick(["直连", "DIRECT"], "DIRECT");

  // ===== 清理旧规则（防重复）=====
  config.rules = config.rules.filter(
    r =>
      !r.includes("openai.com") &&
      !r.includes("chatgpt.com") &&
      !r.includes("anthropic.com") &&
      !r.includes("perplexity.ai") &&
      !r.includes("gemini") &&
      !r.includes("safebrowsing") &&
      !r.includes("services.googleapis.cn") &&
      !r.includes("DST-PORT,443")
  );

  // ===== 🔥 核心规则（一次性插入）=====
  const newRules = [
    // QUIC 禁用（必须最前）
    "AND,((DST-PORT,443),(NETWORK,UDP)),REJECT",

    // DNS 修复
    `DOMAIN,safebrowsing.googleapis.com,${DIRECT}`,
    `DOMAIN,safebrowsing.urlsec.qq.com,${DIRECT}`,
    `DOMAIN-SUFFIX,services.googleapis.cn,${DIRECT}`,

    // AI
    `DOMAIN-SUFFIX,openai.com,${PROXY}`,
    `DOMAIN-SUFFIX,chatgpt.com,${PROXY}`,
    `DOMAIN-SUFFIX,anthropic.com,${PROXY}`,
    `DOMAIN-SUFFIX,perplexity.ai,${PROXY}`,
    `DOMAIN-SUFFIX,ai.google.dev,${PROXY}`,
    `DOMAIN-SUFFIX,gemini.google.com,${PROXY}`
  ];

  config.rules.unshift(...newRules);

  // ===== DNS（防泄露加强版）=====
  config.dns = {
    enable: true,
    ipv6: false,
    "prefer-h3": true,
    "enhanced-mode": "fake-ip",
    listen: "0.0.0.0:1053",
    "respect-rules": true,

    "default-nameserver": [
      "119.29.29.29",
      "223.5.5.5"
    ],

    "nameserver": [
      "system",
      "223.5.5.5",
      "119.29.29.29"
    ],

    // 🔥 更稳 fallback（避免联通抽风）
    "fallback": [
      "https://1.1.1.1/dns-query",
      "https://8.8.8.8/dns-query"
    ],

    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      geosite: ["gfw"]
    },

    "fake-ip-filter": [
      "geosite:private",
      "geosite:cn",
      "+.icloud.com",
      "+.stun.*.*",
      "msftconnecttest.com"
    ]
  };

  // ===== 嗅探（精简稳定版）=====
  config.sniffer = {
    enable: true,
    "parse-pure-ip": true,
    "force-dns-mapping": true,
    "override-destination": true,

    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, 8080] }
    }
  };

  return config;
}