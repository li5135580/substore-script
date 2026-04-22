/**
 * Sub-Store 融合重命名脚本 (Final Production Version)
 * 特性：
 * 1. 专项修复：解决 🇭🇰%20 这种含有 URL 编码和零宽字符的 Emoji 识别失败问题。
 * 2. 协议增强：完整继承Vision/Reality/gRPC 识别逻辑。
 * 3. 智能截取：IP 地址严格保留前三段 (如 1.2.3)。
 */

const inArg = $arguments;

// --- 参数解析 (继承自 2.js) ---
function boolArg(v, d = false) {
  if (v === undefined || v === null || String(v).trim() === "") return d;
  return /^(true|1|on|yes)$/i.test(String(v).trim());
}

const addflag = boolArg(inArg.flag, true);   // 是否显示国旗
const clear   = boolArg(inArg.clear, true);  // 是否清理信息节点
const numone  = boolArg(inArg.one, false);   // 单节点隐藏编号

// --- 核心数据表 ---
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇧🇷','🇨🇦','🇨🇭','🇮🇳','🇮🇩','🇲🇾','🇳🇱','🇵Ｈ','🇷🇺','🇹🇭','🇹🇷','🇻🇳'];
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','巴西','加拿大','瑞士','印度','印尼','马来西亚','荷兰','菲律宾','俄罗斯','泰国','土耳其','越南'];
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','BR','CA','CH','IN','ID','MY','NL','PH','RU','TH','TR','VN'];

// 冗余节点清理正则
const nameclear = /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|订阅|流量|机场)/i;

/**
 * 1. 地区识别 (专项修复逻辑)
 */
function getRegionInfo(proxy) {
  let name = proxy.name || "";
  let server = (proxy.server || "").toLowerCase();

  // 修复点：强制解码 URL 字符 (如 %20)，并剔除不可见的零宽干扰字符
  try { 
    name = decodeURIComponent(name).replace(/[\u200b-\u200d\ufeff]/g, ""); 
  } catch(e) { }
  
  const allText = (name + server).toLowerCase();

  // 修复点：先通过字符串包含检测 Emoji，确保 🇭🇰 开头的节点必中
  for (let i = 0; i < FG.length; i++) {
    if (name.includes(FG[i])) {
      return { flag: FG[i], region: ZH[i] };
    }
  }

  // 兜底：正则匹配关键字
  let index = -1;
  if (/hong.?kong|hk|香港|港|hkg/.test(allText)) index = 0;
  else if (/macao|mo|澳门/.test(allText)) index = 1;
  else if (/taiwan|tw|台湾|台北|新北/.test(allText)) index = 2;
  else if (/japan|jp|日本|东京|大阪|tokyo|osaka/.test(allText)) index = 3;
  else if (/korea|kr|韩国|首尔|seoul/.test(allText)) index = 4;
  else if (/singapore|sg|新加坡|狮城/.test(allText)) index = 5;
  else if (/united.?states|us|美国|america/.test(allText)) index = 6;
  else if (/united.?kingdom|uk|英国|london/.test(allText)) index = 7;

  if (index === -1) {
    index = EN.findIndex(code => new RegExp(`(?:^|[^A-Za-z])${code}(?:[^A-Za-z]|$)`, "i").test(allText));
  }

  if (index !== -1) {
    return { flag: FG[index], region: ZH[index] };
  }
  return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 2. 入口简化 (IP 截取逻辑)
 */
function simplifyEntry(text) {
  let t = String(text || "").replace(/^www\./i, "").replace(/\.(com|net|org|xyz|io|208808\.xyz)$/i, "").trim();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(t)) {
    const parts = t.split(".");
    // 严格保留前三段
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return t.length > 12 ? t.slice(0, 12) : t;
}

/**
 * 3. 协议特征识别
 */
function detectFeature(proxy) {
  const f = (k) => String(proxy[k] || "").toLowerCase();
  const type = f("type"), flow = f("flow"), security = f("security") || f("tls"), sn = f("serviceName"), path = f("path");

  if (flow.includes("vision")) return (type === "grpc" || sn) ? "Vision-gRPC" : "Vision";
  if (type === "grpc" || sn) return security === "reality" ? "Reality-gRPC" : "gRPC";
  if (type === "ws" || path) return security === "reality" ? "Reality-WS" : "WS";
  if (security === "reality") return "Reality";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2" || type === "hy2") return "Hysteria2";
  return type ? type.toUpperCase() : "NODE";
}

/**
 * 主函数
 */
function operator(proxies) {
  const counters = {};

  // 过滤
  if (clear) proxies = proxies.filter(p => !nameclear.test(p.name));

  return proxies.map(p => {
    const { flag, region } = getRegionInfo(p);
    const entry = simplifyEntry(p.server || p.name);
    const feature = detectFeature(p);

    const baseName = `${addflag ? flag + ' ' : ''}${region} | ${entry} | ${feature}`;
    
    // 计数与编号
    counters[baseName] = (counters[baseName] || 0) + 1;
    const num = String(counters[baseName]).padStart(2, "0");
    
    const finalName = `${baseName} ${num}`;
    
    // 处理单节点隐藏编号
    p.name = finalName;
    p._base = baseName;
    return p;
  }).map((p, _, all) => {
    if (numone && all.filter(x => x._base === p._base).length === 1) {
      p.name = p.name.replace(/\s\d+$/, "");
    }
    delete p._base;
    return p;
  });
}
