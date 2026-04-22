function operator(proxies = []) {

  const get = (o, k) => {
    for (const i of k) if (o[i]) return String(o[i]);
    return "";
  };

  const lower = v => String(v || "").toLowerCase();
  const pad = n => String(n).padStart(2, "0");

  // ===== 清理垃圾节点 =====
  const nameclear =
    /(套餐|到期|剩余|流量|订阅|官网|客服|测试|群|过期|工单)/i;

  proxies = proxies.filter(p => !nameclear.test(p.name));

  // ===== 国旗 =====
  const FLAG = {
    香港: "🇭🇰",
    日本: "🇯🇵",
    韩国: "🇰🇷",
    台湾: "🇹🇼",
    新加坡: "🇸🇬",
    美国: "🇺🇸",
    英国: "🇬🇧",
    其他: "🌍"
  };

  // ===== IP识别 =====
  const IP_RULES = [
    [/^154\.222\./, "香港"],
    [/^43\.|^103\./, "香港"],
    [/^34\.|^13\.|^18\./, "美国"],
    [/^1\.|^27\./, "日本"]
  ];

  function detectRegion(p) {
    const name = lower(p.name);
    const server = lower(p.server);
    const sni = lower(get(p, ["sni", "host"]));
    const text = `${name} ${server} ${sni}`;

    // 国旗优先
    if (name.includes("🇭🇰")) return "香港";
    if (name.includes("🇯🇵")) return "日本";
    if (name.includes("🇰🇷")) return "韩国";
    if (name.includes("🇹🇼")) return "台湾";
    if (name.includes("🇸🇬")) return "新加坡";
    if (name.includes("🇺🇸")) return "美国";

    // 关键词
    if (/hk|hong.?kong|香港/.test(text)) return "香港";
    if (/jp|japan|东京/.test(text)) return "日本";
    if (/kr|korea|首尔/.test(text)) return "韩国";
    if (/sg|singapore/.test(text)) return "新加坡";
    if (/us|america|洛杉矶/.test(text)) return "美国";

    // IP兜底
    for (const [rule, region] of IP_RULES) {
      if (rule.test(server)) return region;
    }

    return "其他";
  }

  function simplify(server) {
    const s = lower(server);

    if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) {
      const p = s.split(".");
      return `${p[0]}.${p[1]}.${p[2]}`;
    }

    return s.split(".")[0];
  }

  function feature(p) {
    const net = lower(get(p, ["network", "type"]));
    const sec = lower(get(p, ["security"]));
    const flow = lower(get(p, ["flow"]));

    if (flow.includes("vision")) return net === "grpc" ? "Vision-gRPC" : "Vision";
    if (sec === "reality") return net ? `Reality-${net.toUpperCase()}` : "Reality";
    if (net) return net.toUpperCase();

    return "Node";
  }

  // ===== 去重 =====
  const seen = new Set();
  proxies = proxies.filter(p => {
    const key = `${p.server}-${p.port}-${p.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ===== 排序（地区优先级）=====
  const order = ["香港", "日本", "新加坡", "美国", "其他"];

  proxies.sort((a, b) => {
    const ra = order.indexOf(detectRegion(a));
    const rb = order.indexOf(detectRegion(b));
    return ra - rb;
  });

  // ===== 编号 =====
  const counters = {};

  return proxies.map(p => {

    const region = detectRegion(p);
    const flag = FLAG[region] || "🌍";
    const entry = simplify(p.server || p.sni);
    const feat = feature(p);

    const base = `${flag} ${region} | ${entry} | ${feat}`;

    counters[base] = (counters[base] || 0) + 1;

    p.name = `${base} ${pad(counters[base])}`;

    return p;
  });
}