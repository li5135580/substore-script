/**
 * Sub-Store 智能识别脚本 (异步 API + 稳健 IP 提取)
 * 修复说明：彻底解决 IP 段显示为 undefined 的问题
 */

const inArg = $arguments;

// --- 参数控制 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认显示国旗
const useApi  = !/^(false|0|off|no)$/i.test(inArg.api);  // 是否开启 API (默认开)

// --- 国家名中英文映射表 (针对 API 返回结果) ---
const CountryMap = {
  "Hong Kong": { n: "香港", f: "🇭🇰" },
  "Taiwan": { n: "台湾", f: "🇹🇼" },
  "Macao": { n: "澳门", f: "🇲🇴" },
  "Japan": { n: "日本", f: "🇯🇵" },
  "Singapore": { n: "新加坡", f: "🇸🇬" },
  "United States": { n: "美国", f: "🇺🇸" },
  "South Korea": { n: "韩国", f: "🇰🇷" },
  "United Kingdom": { n: "英国", f: "🇬🇧" },
  "Vietnam": { n: "越南", f: "🇻🇳" }
};

/**
 * 1. 异步 API 查询 (ipwho.is)
 */
async function fetchIpInfo(ip) {
  if (!ip || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return null;
  return new Promise((resolve) => {
    $httpClient.get(`https://ipwho.is/${ip}`, (error, response, data) => {
      if (!error && data) {
        try {
          const res = JSON.parse(data);
          if (res.success) {
            const country = res.country;
            const mapped = CountryMap[country];
            resolve({
              region: mapped ? mapped.n : country,
              flag: mapped ? mapped.f : (res.flag ? res.flag.emoji : "🏳️‍🌈")
            });
            return;
          }
        } catch (e) {}
      }
      resolve(null);
    });
  });
}

/**
 * 2. 稳健的 IP 段提取 (核心修复：解决 undefined 问题)
 */
function getSafeIP(host) {
  const sHost = String(host || "");
  // 方法 A: 正则匹配 (不使用 RegExp.$1)
  const match = sHost.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (match && match[1]) {
    return match[1];
  }
  // 方法 B: 暴力切割兜底
  if (sHost.includes('.')) {
    const parts = sHost.split('.');
    if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return parts[0]; // 如果是域名，返回第一段
  }
  return "Unknown";
}

/**
 * 3. 本地识别 (针对 Emoji 专项优化)
 */
function getRegionLocal(proxy) {
  let name = proxy.name || "";
  try {
    name = decodeURIComponent(name);
    if (name.includes('%')) name = decodeURIComponent(name);
  } catch (e) {}
  
  // 识别 Emoji
  const flagMatch = name.match(/([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/);
  if (flagMatch) {
    const f = flagMatch[1];
    if (f === "🇭🇰") return { flag: "🇭🇰", region: "香港" };
    if (f === "🇯🇵") return { flag: "🇯🇵", region: "日本" };
    if (f === "🇸🇬") return { flag: "🇸🇬", region: "新加坡" };
    if (f === "🇺🇸") return { flag: "🇺🇸", region: "美国" };
    if (f === "🇹🇼") return { flag: "🇹🇼", region: "台湾" };
  }
  
  // 识别关键字
  const all = (name + (proxy.server || "")).toLowerCase();
  if (all.includes("hk") || all.includes("香港") || all.includes("154.222")) return { flag: "🇭🇰", region: "香港" };
  if (all.includes("sg") || all.includes("新加坡")) return { flag: "🇸🇬", region: "新加坡" };
  
  return null;
}

/**
 * 4. 协议特征识别
 */
function detectFeature(proxy) {
  const f = (k) => String(proxy[k] || "").toLowerCase();
  const type = f("type"), flow = f("flow"), sec = f("security") || f("tls");
  if (flow.includes("vision")) return "Vision";
  if (sec === "reality") return "Reality";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2") return "Hy2";
  return type.toUpperCase() || "NODE";
}

/**
 * 5. 主执行逻辑
 */
async function operator(proxies) {
  const counters = {};

  const processed = await Promise.all(proxies.map(async (p) => {
    // 1. 获取地域
    let info = getRegionLocal(p);
    if (!info && useApi) {
      info = await fetchIpInfo(p.server);
    }
    if (!info) info = { flag: "🏳️‍🌈", region: "其他" };

    // 2. 获取 IP 段 (修复点)
    const ip = getSafeIP(p.server);

    // 3. 识别协议
    const proto = detectFeature(p);

    // 4. 组装
    const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ip} | ${proto}`;
    
    counters[base] = (counters[base] || 0) + 1;
    p.name = `${base} ${String(counters[base]).padStart(2, "0")}`;
    return p;
  }));

  return processed;
}
