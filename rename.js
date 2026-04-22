/**
 * Ultimate Sub-Store Rename Script（融合版）
 *
 * 功能：
 * 1. 自动识别地区（中/英/关键词）
 * 2. 自动提取IP前三段 / 域名简化
 * 3. 自动识别协议类型（Vision / Reality / WS / gRPC / TCP）
 * 4. 自动编号（01 / 02）
 * 5. 自动过滤信息节点
 * 6. 输出统一格式：
 *    🇯🇵 日本 | 123.45.67 | Vision-gRPC | 01
 */

function operator(proxies = []) {

  // ==================== 基础工具函数 ====================

  // 安全取字段
  function get(obj, keys) {
    for (const k of keys) {
      if (obj[k]) return String(obj[k]);
    }
    return "";
  }

  // 转小写
  function lower(v) {
    return String(v || "").toLowerCase();
  }

  // 编号补零
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // ==================== 信息节点过滤 ====================

  const nameclear =
    /(套餐|到期|剩余|流量|订阅|官网|客服|测试|群|过期|工单)/i;

  proxies = proxies.filter(p => !nameclear.test(p.name));

  // ==================== 国旗映射 ====================

  const FLAG_MAP = {
    "香港": "🇭🇰",
    "日本": "🇯🇵",
    "韩国": "🇰🇷",
    "台湾": "🇹🇼",
    "新加坡": "🇸🇬",
    "美国": "🇺🇸",
    "英国": "🇬🇧",
    "其他": "🌍"
  };

  // ==================== 地区识别 ====================

  function detectRegion(text) {
    if (/hong.?kong|\bhk\b|香港/.test(text)) return "香港";
    if (/japan|tokyo|osaka|\bjp\b|日本/.test(text)) return "日本";
    if (/korea|seoul|\bkr\b|韩国/.test(text)) return "韩国";
    if (/taiwan|\btw\b|台湾/.test(text)) return "台湾";
    if (/singapore|\bsg\b|新加坡/.test(text)) return "新加坡";
    if (/united.?states|america|\bus\b|洛杉矶/.test(text)) return "美国";
    if (/united.?kingdom|\buk\b|英国/.test(text)) return "英国";

    return "其他";
  }

  // ==================== IP / 域名处理 ====================

  function simplifyEntry(server) {
    let s = String(server || "").toLowerCase().trim();

    if (!s) return "unknown";

    // IP → 取前三段
    if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) {
      const p = s.split(".");
      return `${p[0]}.${p[1]}.${p[2]}`;
    }

    // 域名 → 去后缀
    return s
      .replace(/^www\./, "")
      .replace(/\.(com|net|org|xyz|io|co|cn)$/i, "")
      .split(".")[0];
  }

  // ==================== 协议识别 ====================

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

  // ==================== 主处理逻辑 ====================

  const counters = {};

  return proxies.map(p => {

    const text = lower([
      p.name,
      p.server,
      p.sni,
      p.host
    ].join(" "));

    // 1️⃣ 地区
    const region = detectRegion(text);

    // 2️⃣ 国旗
    const flag = FLAG_MAP[region] || "🌍";

    // 3️⃣ IP/入口
    const entry = simplifyEntry(p.server || p.sni);

    // 4️⃣ 协议
    const feature = detectFeature(p);

    // 5️⃣ 生成基础名
    const base = `${flag} ${region} | ${entry} | ${feature}`;

    // 6️⃣ 编号
    counters[base] = (counters[base] || 0) + 1;

    // 7️⃣ 最终名称
    p.name = `${base} | ${pad(counters[base])}`;

    return p;
  });
}
