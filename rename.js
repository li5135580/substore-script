/**
 * Sub-Store 终极重命名脚本 (Emoji 穿透识别版)
 * 特性：直接提取节点名中的国旗，根据国旗自动生成国家名
 */

const inArg = $arguments;

// --- 基础参数 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认显示国旗
const numone  = /^(true|1|on|yes)$/i.test(inArg.one);    // 单节点是否隐藏编号

// --- Emoji 对应国家映射表 ---
const EmojiToRegion = {
  "🇭🇰": "香港", "🇲🇴": "澳门", "🇹🇼": "台湾", "🇯🇵": "日本", 
  "🇰🇷": "韩国", "🇸🇬": "新加坡", "🇺🇸": "美国", "🇬🇧": "英国", 
  "🇩🇪": "德国", "🇫🇷": "法国", "🇷🇺": "俄罗斯", "🇨🇦": "加拿大", 
  "🇦🇺": "澳大利亚", "🇻🇳": "越南", "🇹🇭": "泰国", "🇮🇳": "印度",
  "🇲🇾": "马来西亚", "🇵Ｈ": "菲律宾", "🇹🇷": "土耳其"
};

/**
 * 1. 核心识别：直接识别 Emoji
 */
function getRegionByEmoji(proxy) {
  let name = proxy.name || "";
  let server = (proxy.server || "").toLowerCase();

  // A. 强制解码：把 %20, %F0... 这种全部转回原始字符
  try {
    name = decodeURIComponent(name);
    if (name.includes('%')) name = decodeURIComponent(name);
  } catch (e) {}

  // B. Unicode 正则：专门抓取国旗 Emoji (Regional Indicator Symbol)
  // 这是识别 🇭🇰, 🇺🇸 等符号最底层的逻辑
  const flagRegex = /([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/;
  const match = name.match(flagRegex);

  if (match) {
    const foundEmoji = match[1];
    return {
      flag: foundEmoji,
      region: EmojiToRegion[foundEmoji] || "海外"
    };
  }

  // C. 兜底逻辑：如果名字里真没 Emoji，再搜关键字
  const allText = (name + server).toLowerCase();
  if (/hk|hong|香港|港|hkg/.test(allText)) return { flag: "🇭🇰", region: "香港" };
  if (/jp|japan|日本|东京|nrt/.test(allText)) return { flag: "🇯🇵", region: "日本" };
  if (/tw|taiwan|台湾|台北|tpe/.test(allText)) return { flag: "🇹🇼", region: "台湾" };
  if (/sg|singapore|新加坡|狮城|sin/.test(allText)) return { flag: "🇸🇬", region: "新加坡" };
  if (/us|united|美国|lax|sfo/.test(allText)) return { flag: "🇺🇸", region: "美国" };

  return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 2. IP 处理：严格保留前三段 (如 154.222.22)
 */
function simplifyEntry(host) {
  if (!host) return "Unknown";
  // 匹配 IPv4
  if (/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.test(host)) {
    return RegExp.$1;
  }
  // 如果是域名，取第一段
  return host.split('.')[0];
}

/**
 * 3. 协议识别 (优化版)
 */
function detectFeature(proxy) {
  const f = (k) => String(proxy[k] || "").toLowerCase();
  const type = f("type"), flow = f("flow"), sec = f("security") || f("tls"), sn = f("serviceName");

  if (flow.includes("vision")) return "Vision";
  if (sec === "reality") return (type === "grpc" || sn) ? "Reality-gRPC" : "Reality";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2" || type === "hy2") return "Hysteria2";
  if (f("path") || type === "ws") return "WS";
  return type ? type.toUpperCase() : "NODE";
}

/**
 * 4. 主函数
 */
function operator(proxies) {
  const counters = {};

  return proxies.map(p => {
    // 获取地域信息
    const { flag, region } = getRegionByEmoji(p);
    // 获取 IP
    const ip = simplifyEntry(p.server);
    // 获取协议
    const proto = detectFeature(p);

    // 组装格式：国旗 地区 | IP段 | 协议
    const baseName = `${addflag ? flag + ' ' : ''}${region} | ${ip} | ${proto}`;
    
    // 计数
    counters[baseName] = (counters[baseName] || 0) + 1;
    const num = String(counters[baseName]).padStart(2, "0");
    
    p.name = `${baseName} ${num}`;
    p._base = baseName;
    return p;
  }).map((p, i, all) => {
    // 处理单节点隐藏编号
    if (numone && all.filter(x => x._base === p._base).length === 1) {
      p.name = p.name.replace(/\s\d+$/, "");
    }
    delete p._base;
    return p;
  });
}
