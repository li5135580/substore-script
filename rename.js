/**
 * Sub-Store 终极融合脚本 (彻底修复版)
 * * 1. 输出格式：国旗 地区 | IP段(3位) | 协议类型 编号
 * 2. 核心修复：针对 🇭🇰%20 乱码名节点进行强制解码与 Emoji 穿透识别
 * 3. 智能 IP：自动提取 123.456.789 格式
 */

const inArg = $arguments;

// --- 功能开关 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认开启国旗
const clear   = !/^(false|0|off|no)$/i.test(inArg.clear); // 默认开启清理
const numone  = /^(true|1|on|yes)$/i.test(inArg.one);     // 单节点去编号

// --- 地区映射表 ---
const RegionMap = [
  { name: "香港", code: "HK", flag: "🇭🇰", re: /hong.?kong|hk|香港|港|hkg|154\.222/i },
  { name: "澳门", code: "MO", flag: "🇲🇴", re: /macao|mo|澳门/i },
  { name: "台湾", code: "TW", flag: "🇹🇼", re: /taiwan|tw|台湾|台北|tpe/i },
  { name: "日本", code: "JP", flag: "🇯🇵", re: /japan|jp|日本|东京|大阪|tokyo|nrt/i },
  { name: "韩国", code: "KR", flag: "🇰🇷", re: /korea|kr|韩国|首尔|seoul|icn/i },
  { name: "新加坡", code: "SG", flag: "🇸🇬", re: /singapore|sg|新加坡|狮城|sin/i },
  { name: "美国", code: "US", flag: "🇺🇸", re: /united.?states|us|美国|america|lax|sfo/i },
  { name: "英国", code: "GB", flag: "🇬🇧", re: /united.?kingdom|uk|英国|london/i },
  { name: "越南", code: "VN", flag: "🇻🇳", re: /vietnam|vn|越南/i }
];

/**
 * 核心逻辑：精准识别地区
 */
function getRegionInfo(proxy) {
  let name = proxy.name || "";
  let server = (proxy.server || "").toLowerCase();

  // 1. 暴力解码：解决 %20 及 Emoji 编码问题
  try {
    name = decodeURIComponent(name);
    if (name.includes('%')) name = decodeURIComponent(name); 
  } catch (e) {}

  // 2. 清理不可见字符 (零宽空格等)
  name = name.replace(/[\u200b-\u200d\ufeff]/g, "");
  const allText = (name + server).toLowerCase();

  // 3. 策略一：直接检测名字里的国旗符号 (核心修复)
  for (const item of RegionMap) {
    if (name.includes(item.flag)) {
      return { flag: item.flag, region: item.name };
    }
  }

  // 4. 策略二：正则关键词匹配 (含 IP 段匹配)
  for (const item of RegionMap) {
    if (item.re.test(allText)) {
      return { flag: item.flag, region: item.name };
    }
  }

  return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 协议识别：完整继承 1.js 逻辑
 */
function detectFeature(proxy) {
  const f = (k) => String(proxy[k] || "").toLowerCase();
  const type = f("type"), flow = f("flow"), sec = f("security") || f("tls"), sn = f("serviceName");

  if (flow.includes("vision")) return "Vision";
  if (sec === "reality") return (type === "grpc" || sn) ? "Reality-gRPC" : "Reality";
  if (type === "grpc" || sn) return "gRPC";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2" || type === "hy2") return "Hysteria2";
  if (f("path") || type === "ws") return "WS";
  return type ? type.toUpperCase() : "NODE";
}

/**
 * IP 格式化：保留前三个字段
 */
function formatIP(proxy) {
  const host = proxy.server || "";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  // 域名则截取前两段
  return host.split(".").slice(0, 2).join(".");
}

/**
 * 主执行函数
 */
function operator(proxies) {
  const counters = {};
  const filterRe = /(套餐|到期|有效|剩余|已用|过期|官方|网址|流量)/i;

  // 1. 过滤与初步重命名
  let list = proxies
    .filter(p => !clear || !filterRe.test(p.name))
    .map(p => {
      const info = getRegionInfo(p);
      const ipStr = formatIP(p);
      const proto = detectFeature(p);

      // 组装格式：国旗 地区 | IP | 协议
      const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ipStr} | ${proto}`;
      
      // 计数
      counters[base] = (counters[base] || 0) + 1;
      const num = String(counters[base]).padStart(2, "0");
      
      p.name = `${base} ${num}`;
      p._base = base; // 临时存储用于 oneP 逻辑
      return p;
    });

  // 2. 单节点去编号逻辑
  if (numone) {
    list.forEach(p => {
      if (Object.values(list.filter(x => x._base === p._base)).length === 1) {
        p.name = p.name.replace(/\s\d+$/, "");
      }
    });
  }

  // 3. 清理临时变量并返回
  return list.map(p => { delete p._base; return p; });
}
