/**
 * Sub-Store 融合重命名脚本 (Final Repair Version)
 * 逻辑：国旗 地区 | IP段/入口 | 协议类型 编号
 */

const inArg = $arguments;

// --- 基础参数配置 ---
function boolArg(v, d = false) {
  if (v === undefined || v === null || String(v).trim() === "") return d;
  return /^(true|1|on|yes)$/i.test(String(v).trim());
}

const addflag = boolArg(inArg.flag, true);   // 是否显示国旗
const clear   = boolArg(inArg.clear, true);  // 是否清理冗余节点
const numone  = boolArg(inArg.one, false);   // 单节点是否隐藏编号

// --- 数据表 (来自 2.js) ---
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇲','🇦🇹','🇧🇷','🇨🇦','🇨🇭','🇨🇱','🇮🇳','🇮🇩','🇮🇹','🇲🇾','🇳🇱','🇵Ｈ','🇷🇺','🇸🇦','🇪🇸','🇹🇭','🇹🇷','🇻🇳'];
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','亚美尼亚','奥地利','巴西','加拿大','瑞士','智利','印度','印尼','意大利','马来西亚','荷兰','菲律宾','俄罗斯','沙特阿拉伯','西班牙','泰国','土耳其','越南'];
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AM','AT','BR','CA','CH','CL','IN','ID','IT','MY','NL','PH','RU','SA','ES','TH','TR','VN'];

const nameclear = /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|订阅|流量|机场)/i;

/**
 * 1. IP与入口处理 (优化 IPv4 截取逻辑)
 */
function simplifyEntry(text) {
  let t = String(text || "")
    .replace(/^www\./i, "")
    .replace(/\.(com|net|org|xyz|io|co|cn|208808\.xyz)$/i, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, "")
    .trim();

  if (!t) return "Unknown";

  // 保留 IPv4 前三个字段 (如 123.456.789)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(t)) {
    const parts = t.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return t;
}

/**
 * 2. 协议特征识别 (来自 1.js 的高精度逻辑)
 */
function detectFeature(proxy) {
  const getF = (keys) => {
    for (const k of keys) if (proxy[k]) return String(proxy[k]).toLowerCase();
    return "";
  };

  const type = getF(["type", "network"]);
  const security = getF(["security", "tls"]);
  const flow = getF(["flow"]);
  const serviceName = getF(["serviceName"]);
  const path = getF(["path"]);

  if (flow.includes("vision")) return (type === "grpc" || serviceName) ? "Vision-gRPC" : "Vision";
  if (type === "grpc" || serviceName) return security === "reality" ? "Reality-gRPC" : "gRPC";
  if (type === "ws" || path) return security === "reality" ? "Reality-WS" : "WS";
  if (security === "reality") return type ? `Reality-${type.toUpperCase()}` : "Reality";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2" || type === "hy2") return "Hysteria2";
  
  return type ? type.toUpperCase() : "Node";
}

/**
 * 3. 地区识别核心 (针对 Emoji 和 URL 编码专项修复)
 */
function getRegionInfo(proxy) {
  // 对原始名称进行解码，防止 %20 或编码后的 Emoji 匹配
