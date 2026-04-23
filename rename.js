/**
 * Ultimate Sub-Store Rename Script（简化版，无编号）
 *
 * 功能：
 * 1. 自动识别地区（中/英/关键词）
 * 2. 自动提取IP前三段 / 域名简化
 * 3. 自动识别协议类型（Vision / Reality / WS / gRPC / TCP）
 * 4. 自动过滤信息节点
 * 5. 输出统一格式：
 *    🇯🇵 日本 | 123.45.67 | Vision-gRPC
 */

function operator(proxies = []) {
  // ==================== 基础工具函数 ====================

  // 安全取字段
  const get = (obj, keys) => {
    for (const k of keys) {
      if (obj[k]) return String(obj[k]);
    }
    return "";
  };

  // 转小写
  const lower = (v) => String(v || "").toLowerCase();

  // ==================== 信息节点过滤 ====================

  const nameClearRegex = /(套餐|到期|剩余|流量|订阅|官网|客服|测试|群|过期|工单)/i;

  // ==================== 国旗映射 ====================

  const FLAG_MAP = new Map([
    ["香港", "🇭🇰"],
    ["日本", "🇯🇵"],
    ["韩国", "🇰🇷"],
    ["台湾", "🇹🇼"],
    ["新加坡", "🇸🇬"],
    ["美国", "🇺🇸"],
    ["英国", "🇬🇧"],
    ["其他", "🌍"]
  ]);

  // ==================== 地区识别规则 ====================

  const REGION_PATTERNS = [
    { region: "香港", patterns: [/hong.?kong|\bhk\b|香港/i] },
    { region: "日本", patterns: [/japan|tokyo|osaka|\bjp\b|日本/i] },
    { region: "韩国", patterns: [/korea|seoul|\bkr\b|韩国/i] },
    { region: "台湾", patterns: [/taiwan|\btw\b|台湾/i] },
    { region: "新加坡", patterns: [/singapore|\bsg\b|新加坡/i] },
    { region: "美国", patterns: [/united.?states|america|\bus\b|洛杉矶/i] },
    { region: "英国", patterns: [/united.?kingdom|\buk\b|英国/i] }
  ];

  // ==================== 地区识别函数 ====================

  const detectRegion = (text) => {
    for (const { region, patterns } of REGION_PATTERNS) {
      if (patterns.some(pattern => pattern.test(text))) {
        return region;
      }
    }
    return "其他";
  };

  // ==================== IP / 域名处理 ====================

  const DOMAIN_SUFFIXES = /\.(com|net|org|xyz|io|co|cn)$/i;

  const simplifyEntry = (server) => {
    let s = String(server || "").toLowerCase().trim();

    if (!s) return "unknown";

    // IP → 取前三段
    if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) {
      const parts = s.split(".");
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }

    // 域名 → 去后缀
    return s
      .replace(/^www\./, "")
      .replace(DOMAIN_SUFFIXES, "")
      .split(".")[0];
  };

  // ==================== 协议识别 ====================

  const detectFeature = (p) => {
    const net = lower(get(p, ["network", "type"]));
    const sec = lower(get(p, ["security"]));
    const flow = lower(get(p, ["flow"]));

    if (flow.includes("vision")) {
      return net.includes("grpc") ? "Vision-gRPC" : "Vision";
    }

    if (net.includes("grpc")) {
      return sec === "reality" ? "Reality-gRPC" : "gRPC";
    }

    if (net.includes("ws")) {
      return sec === "reality" ? "Reality-WS" : "WS";
    }

    if (sec === "reality") return "Reality";

    return net ? net.toUpperCase() : "Node";
  };

  // ==================== 主处理逻辑 ====================

  const filteredProxies = proxies.filter(p => !nameClearRegex.test(p.name));

  return filteredProxies.map(p => {
    const text = lower([
      p.name,
      p.server,
      p.sni,
      p.host
    ].join(" "));

    // 1️⃣ 地区
    const region = detectRegion(text);

    // 2️⃣ 国旗
    const flag = FLAG_MAP.get(region) || "🌍";

    // 3️⃣ IP/入口
    const entry = simplifyEntry(p.server || p.sni);

    // 4️⃣ 协议
    const feature = detectFeature(p);

    // 5️⃣ 最终名称（无编号格式）
    p.name = `${flag} ${region} | ${entry} | ${feature}`;

    return p;
  });
}

// 测试用例
console.log("简化版脚本加载完成");

// 示例使用
/*
const testProxies = [
  { name: "日本东京-01", server: "192.168.1.100", network: "grpc", security: "reality", flow: "" },
  { name: "套餐信息", server: "192.168.1.101", network: "tcp", security: "", flow: "" },
  { name: "日本大阪-02", server: "192.168.2.200", network: "ws", security: "reality", flow: "" }
];

console.log(operator(testProxies));
*/
