function operator(proxies = []) {

  // ========= 工具函数 =========

  const get = (obj, keys) => {
    for (const k of keys) if (obj[k]) return String(obj[k]);
    return "";
  };

  const lower = v => String(v || "").toLowerCase();
  const pad = n => String(n).padStart(2, "0");

  // ========= 信息节点过滤 =========
  const nameclear =
    /(套餐|到期|剩余|流量|订阅|官网|客服|测试|群|过期|工单)/i;

  proxies = proxies.filter(p => !nameclear.test(p.name));

  // ========= 国旗映射 =========
  const FLAG = {
    "香港": "🇭🇰",
    "日本": "🇯🇵",
    "韩国": "🇰🇷",
    "台湾": "🇹🇼",
    "新加坡": "🇸🇬",
    "美国": "🇺🇸",
    "英国": "🇬🇧",
    "其他": "🌍"
  };

  // ========= IP段识别（可扩展） =========
  const IP_RULES = [
    { rule: /^154\.222\./, region: "香港" }, // 你的例子
    { rule: /^43\.|^103\./, region: "香港" },
    { rule: /^34\.|^13\.|^18\./, region: "美国" },
    { rule: /^1\.|^27\./, region: "日本" }
  ];

  // ========= 地区识别（终极版） =========
  function detectRegion(p) {

    const name = lower(p.name);
    const server = lower(p.server);
    const sni = lower(get(p, ["sni", "host"]));
    const text = `${name} ${server} ${sni}`;

    // ===== 1️⃣ 国旗优先 =====
    if (name.includes("🇭🇰")) return "香港";
    if (name.includes("🇯🇵")) return "日本";
    if (name.includes("🇰🇷")) return "韩国";
    if (name.includes("🇹🇼")) return "台湾";
    if (name.includes("🇸🇬")) return "新加坡";
    if (name.includes("🇺🇸")) return "美国";
    if (name.includes("🇬🇧")) return "英国";

    // ===== 2️⃣ 域名识别 =====
    if (/^hk\.|\.hk/.test(server) || /^hk/.test(sni)) return "香港";
    if (/^jp\.|\.jp/.test(server) || /^jp/.test(sni)) return "日本";

    // ===== 3️⃣ 关键词识别 =====
    if (/hong.?kong|\bhk\b|香港/.test(text)) return "香港";
    if (/japan|tokyo|osaka|\bjp\b|日本/.test(text)) return "日本";
    if (/korea|seoul|\bkr\b|韩国/.test(text)) return "韩国";
    if (/taiwan|\btw\b|台湾/.test(text)) return "台湾";
    if (/singapore|\bsg\b|新加坡/.test(text)) return "新加坡";
    if (/united.?states|america|\bus\b|洛杉矶/.test(text)) return "美国";
    if (/united.?kingdom|\buk\b|英国/.test(text)) return "英国";

    // ===== 4️⃣ IP识别（兜底） =====
    for (const item of IP_RULES) {
      if (item.rule.test(server)) return item.region;
    }

    return "其他";
  }

  // ========= IP/入口处理 =========
  function simplifyEntry(server) {
    const s = lower(server);

    if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) {
      const p = s.split(".");
      return `${p[0]}.${p[1]}.${p[2]}`;
    }

    return s
      .replace(/^www\./, "")
      .replace(/\.(com|net|org|xyz|io|co|cn)$/, "")
      .split(".")[0];
  }

  // ========= 协议识别 =========
  function detectFeature(p) {
    const net = lower(get(p, ["network", "type"]));
    const sec = lower(get(p, ["security"]));
    const flow = lower(get(p, ["flow"]));

    if (flow.includes("vision")) {
      if (net.includes("grpc")) return "Vision-gRPC";
      return "Vision";
    }

    if (net.includes("grpc")) {
      if (sec === "reality") return "Reality-gRPC";
      return "gRPC";
    }

    if (net.includes("ws")) {
      if (sec === "reality") return "Reality-WS";
      return "WS";
    }

    if (sec === "reality") return "Reality";

    if (net) return net.toUpperCase();

    return "Node";
  }

  // ========= 主逻辑 =========
  const counters = {};

  return proxies.map(p => {

    const region = detectRegion(p);
    const flag = FLAG[region] || "🌍";
    const entry = simplifyEntry(p.server || p.sni);
    const feature = detectFeature(p);

    const base = `${flag} ${region} | ${entry} | ${feature}`;

    counters[base] = (counters[base] || 0) + 1;

    p.name = `${base} ${pad(counters[base])}`;

    return p;
  });
}
