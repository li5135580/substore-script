/**
 * Sub-Store 终极融合重命名脚本 (彻底修复 Emoji 识别)
 * 逻辑：[国旗] [地区] | [IP前三段/入口] | [协议类型] [编号]
 */

const inArg = $arguments;

// --- 1. 参数控制 (继承自 2.js) ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认开
const clear   = !/^(false|0|off|no)$/i.test(inArg.clear); // 默认开
const numone  = /^(true|1|on|yes)$/i.test(inArg.one);     // 默认关

// --- 2. 增强型地域映射表 (加入了 IP 段辅助识别) ---
const Regions = [
  { n: "香港", f: "🇭🇰", re: /hong.?kong|hk|香港|港|hkg|154\.222|103\.152/i },
  { n: "澳门", f: "🇲🇴", re: /macao|mo|澳门/i },
  { n: "台湾", f: "🇹🇼", re: /taiwan|tw|台湾|台北|tpe|103\.125/i },
  { n: "日本", f: "🇯🇵", re: /japan|jp|日本|东京|大阪|tokyo|osaka|nrt|kix/i },
  { n: "韩国", f: "🇰🇷", re: /korea|kr|韩国|首尔|seoul|icn/i },
  { n: "新加坡", f: "🇸🇬", re: /singapore|sg|新加坡|狮城|sin/i },
  { n: "美国", f: "🇺🇸", re: /united.?states|us|美国|america|lax|sfo|jfk/i },
  { n: "英国", f: "🇬🇧", re: /united.?kingdom|uk|英国|london|lhr/i },
  { n: "其他", f: "🏳️‍🌈", re: /.*/ }
];

/**
 * 3. 核心修复逻辑：高强度地区识别
 */
function getRegionInfo(proxy) {
  let name = proxy.name || "";
  let server = proxy.server || "";
  
  // A. 强制双重解码 + 清理所有不可见/异常控制字符 (针对 %20 专项修复)
  try {
    name = decodeURIComponent(name);
    if (name.includes('%')) name = decodeURIComponent(name);
  } catch (e) {}
  
  // 移除所有零宽字符、不可见字符，将 %20 转化出的异常空格归一化
  name = name.replace(/[\u200b-\u200d\ufeff\u0000-\u001F\u007F-\u009F]/g, "").trim();
  
  const allText = (name + server).toLowerCase();

  // B. 优先匹配 Unicode 国旗符号 (核心修复点)
  // 通过正则表达式直接抓取 Unicode 中的 Regional Indicator Symbol
  if (/(\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF])/.test(name)) {
    const foundFlag = RegExp.$1;
    const match = Regions.find(r => r.f === foundFlag);
    if (match) return { flag: match.f, region: match.n };
  }

  // C. 策略二：关键词与 IP 段正则扫描 (针对乱码名节点)
  for (let i = 0; i < Regions.length - 1; i++) {
    if (Regions[i].re.test(allText)) {
      return { flag: Regions[i].f, region: Regions[i].n };
    }
  }

  return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 4. 协议特征识别 (继承自 1.js)
 */
function detectFeature(proxy) {
  const f = (k) => String(proxy[k] || "").toLowerCase();
  const type = f("type"), flow = f("flow"), sec = f("security") || f("tls"), sn = f("serviceName"), path = f("path");

  if (flow.includes("vision")) return "Vision";
  if (sec === "reality") return (type === "grpc" || sn) ? "Reality-gRPC" : "Reality";
  if (type === "grpc" || sn) return "gRPC";
  if (type === "ws" || path) return "WS";
  if (type === "tuic") return "TUIC";
  if (type === "hysteria2" || type === "hy2") return "Hysteria2";
  return type ? type.toUpperCase() : "NODE";
}

/**
 * 5. IP 格式化逻辑：严格保留前三段
 */
function formatIP(proxy) {
  const host = proxy.server || "";
  // 匹配 IPv4
  if (/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.test(host)) {
    return RegExp.$1;
  }
  // 如果是域名，取第一部分
  return host.split('.')[0];
}

/**
 * 6. 主执行逻辑
 */
function operator(proxies) {
  const counters = {};
  const clearRe = /(套餐|到期|有效|剩余|已用|过期|官方|网址|订阅|流量)/i;

  // 过滤
  let list = clear ? proxies.filter(p => !clearRe.test(p.name)) : proxies;

  // 映射处理
  list = list.map(p => {
    const info = getRegionInfo(p);
    const ipStr = formatIP(p);
    const proto = detectFeature(p);

    // 格式：国旗 地区 | IP段 | 协议
    const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ipStr} | ${proto}`;
    
    // 计数
    counters[base] = (counters[base] || 0) + 1;
    const num = String(counters[base]).padStart(2, "0");
    
    p.name = `${base} ${num}`;
    p._base = base;
    return p;
  });

  // 处理单节点编号
  if (numone) {
    list.forEach(p => {
      if (list.filter(x => x._base === p._base).length === 1) {
        p.name = p.name.replace(/\s\d+$/, "");
      }
    });
  }

  list.forEach(p => delete p._base);
  return list;
}
