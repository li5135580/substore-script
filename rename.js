/**
 * Sub-Store 融合重命名脚本 (Ultra Version)
 * * 核心特性：
 * 1. 地区识别：基于正则与多国语言/国旗库。
 * 2. 格式输出：[国旗] [地区名] | [IP段/入口] | [协议特征] [编号]
 * 3. 智能 IP 处理：保留 IPv4 的前三个字段（如 123.456.789）。
 * 4. 协议提取：自动识别 Reality, Vision, gRPC, WS 等特征。
 * 5. 功能保留：保留了 flag(国旗), clear(清理), one(单节点去编号) 等开关。
 */

const inArg = $arguments;

// --- 参数解析辅助 ---
function boolArg(v, d = false) {
  if (v === undefined || v === null || v.trim() === "") return d;
  return /^(true|1|on|yes)$/i.test(v);
}

// 功能开关
const addflag = boolArg(inArg.flag, true);   // 是否显示国旗
const clear   = boolArg(inArg.clear, true);  // 是否清理冗余信息节点
const numone  = boolArg(inArg.one, false);   // 若该组只有一个节点，是否隐藏编号
const ABSMODE = (inArg.abs || "en").toLowerCase();

// --- 数据表 ---
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇲','🇦🇹','🇧🇷','🇨🇦','🇨🇭','🇨🇱','🇮🇳','🇮🇩','🇮🇹','🇲🇾','🇳🇱','🇵Ｈ','🇷🇺','🇸🇦','🇪🇸','🇹🇭','🇹🇷','🇻🇳'];
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','亚美尼亚','奥地利','巴西','加拿大','瑞士','智利','印度','印尼','意大利','马来西亚','荷兰','菲律宾','俄罗斯','沙特阿拉伯','西班牙','泰国','土耳其','越南'];
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AM','AT','BR','CA','CH','CL','IN','ID','IT','MY','NL','PH','RU','SA','ES','TH','TR','VN'];

// 信息节点清理正则
const nameclear = /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|订阅|流量|机场)/i;

/**
 * 核心逻辑：格式化入口/IP
 * 逻辑：保留 IP 的前三段，或简化域名
 */
function simplifyEntry(text) {
  let t = String(text || "")
    .replace(/^www\./i, "")
    .replace(/\.(com|net|org|xyz|io|co|cn|208808\.xyz)$/i, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, "")
    .trim();

  if (!t) return "Unknown";

  // 处理 IPv4 地址，保留前三段
  if (/^\d+\.\d+\.\d+\.\d+$/.test(t)) {
    const parts = t.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return t;
}

/**
 * 核心逻辑：检测协议特征 (来自 1.js)
 */
function detectFeature(proxy) {
  const getField = (obj, keys) => {
    for (const key of keys) if (obj[key]) return String(obj[key]).toLowerCase();
    return "";
  };

  const type = getField(proxy, ["type", "network"]);
  const security = getField(proxy, ["security", "tls"]);
  const flow = getField(proxy, ["flow"]);
  const serviceName = getField(proxy, ["serviceName"]);
  const path = getField(proxy, ["path"]);

  if (flow.includes("vision")) return (type === "grpc" || serviceName) ? "Vision-gRPC" : "Vision";
  if (type === "grpc" || serviceName) return security === "reality" ? "Reality-gRPC" : "gRPC";
  if (type === "ws" || path) return security === "reality" ? "Reality-WS" : "WS";
  if (security === "reality") return type ? `Reality-${type.toUpperCase()}` : "Reality";
  
  return type ? type.toUpperCase() : "Node";
}

/**
 * 核心逻辑：匹配地区
 */
function getRegionInfo(name, server) {
  const allText = (name + server).toLowerCase();
  let index = -1;

  // 1. 优先正则匹配 (1.js 风格)
  if (/hong.?kong|hk|香港|港/.test(allText)) index = 0;
  else if (/macao|mo|澳门/.test(allText)) index = 1;
  else if (/taiwan|tw|台湾/.test(allText)) index = 2;
  else if (/japan|jp|日本/.test(allText)) index = 3;
  else if (/korea|kr|韩国/.test(allText)) index = 4;
  else if (/singapore|sg|新加坡/.test(allText)) index = 5;
  else if (/united.?states|us|美国/.test(allText)) index = 6;
  else if (/united.?kingdom|uk|英国/.test(allText)) index = 7;

  // 2. 如果没匹配到，尝试搜索 EN 词表
  if (index === -1) {
    index = EN.findIndex(code => {
      const re = new RegExp(`(?:^|[^A-Za-z])${code}(?:[^A-Za-z]|$)`, "i");
      return re.test(allText);
    });
  }

  if (index !== -1) {
    return {
      flag: FG[index] || "",
      region: ZH[index],
    };
  }
  return { flag: "🏳️‍🌈", region: "其他" };
}

// --- 主执行函数 ---
function operator(proxies) {
  const counters = {};

  // 1. 预过滤
  if (clear) {
    proxies = proxies.filter(p => !nameclear.test(p.name));
  }

  // 2. 重命名
  const processed = proxies.map((p) => {
    const server = p.server || "";
    const originalName = p.name || "";
    
    // 获取地区和国旗
    const { flag, region } = getRegionInfo(originalName, server);
    
    // 获取简化后的入口/IP段
    const entry = simplifyEntry(server || originalName);
    
    // 获取协议特征
    const feature = detectFeature(p);

    // 组装基础名称：国旗 地区 | IP/入口 | 协议
    let baseName = "";
    if (addflag) baseName += `${flag} `;
    baseName += `${region} | ${entry} | ${feature}`;

    // 计数器
    counters[baseName] = (counters[baseName] || 0) + 1;
    const num = String(counters[baseName]).padStart(2, "0");
    
    p.name = `${baseName} ${num}`;
    p._base = baseName; // 暂存基础名用于 oneP 功能
    return p;
  });

  // 3. 处理单节点编号 (oneP)
  if (numone) {
    const baseCounts = {};
    processed.forEach(p => baseCounts[p._base] = (baseCounts[p._base] || 0) + 1);
    processed.forEach(p => {
      if (baseCounts[p._base] === 1) {
        p.name = p.name.replace(/\s\d+$/, "");
      }
    });
  }

  return processed;
}
