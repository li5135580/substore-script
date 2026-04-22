/**
 * Sub-Store 节点名重命名脚本 - Emoji 优先版
 * 逻辑：只要节点里有国旗符号，就直接按符号识别国家
 */

const inArg = $arguments;

// --- 配置参数 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 是否保留旗标
const numone  = /^(true|1|on|yes)$/i.test(inArg.one);    // 单节点是否去编号

// --- Emoji 到 国家的映射表 ---
const EmojiMap = {
    "🇭🇰": "香港", "🇲🇴": "澳门", "🇹🇼": "台湾", "🇯🇵": "日本", 
    "🇰🇷": "韩国", "🇸🇬": "新加坡", "🇺🇸": "美国", "🇬🇧": "英国", 
    "🇫🇷": "法国", "🇩🇪": "德国", "🇦🇺": "澳大利亚", "🇻🇳": "越南",
    "🇹🇭": "泰国", "🇮🇳": "印度", "🇷🇺": "俄罗斯", "🇲🇾": "马来西亚",
    "🇵Ｈ": "菲律宾", "🇹🇷": "土耳其"
};

/**
 * 核心：从名称中暴力提取 Emoji
 */
function getRegionByEmoji(proxy) {
    let name = proxy.name || "";
    let server = proxy.server || "";

    // 1. 深度解码，把 %20 和 %F0... 这种全部转回原始字符
    try {
        name = decodeURIComponent(name);
        if (name.includes('%')) name = decodeURIComponent(name);
    } catch (e) {}

    // 2. 正则表达式：专门抓取 Unicode 里的国旗 Emoji (Regional Indicator Symbols)
    // 这是识别 🇭🇰, 🇺🇸 等符号最稳健的方法
    const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
    const match = name.match(flagRegex);

    if (match) {
        const foundEmoji = match[0];
        return {
            flag: foundEmoji,
            region: EmojiMap[foundEmoji] || "海外"
        };
    }

    // 3. 如果没找到 Emoji，再走关键字识别 (兜底)
    const allText = (name + server).toLowerCase();
    if (/hk|hong|香港|港/.test(allText)) return { flag: "🇭🇰", region: "香港" };
    if (/jp|japan|日本|东京/.test(allText)) return { flag: "🇯🇵", region: "日本" };
    if (/us|united|美国/.test(allText)) return { flag: "🇺🇸", region: "美国" };
    if (/sg|singapore|新加坡|狮城/.test(allText)) return { flag: "🇸🇬", region: "新加坡" };

    return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 协议识别 (由 1.js 优化而来)
 */
function detectFeature(proxy) {
    const f = (k) => String(proxy[k] || "").toLowerCase();
    const type = f("type"), flow = f("flow"), sec = f("security") || f("tls"), sn = f("serviceName");

    if (flow.includes("vision")) return "Vision";
    if (sec === "reality") return (type === "grpc" || sn) ? "Reality-gRPC" : "Reality";
    if (type === "tuic") return "TUIC";
    if (type === "hysteria2" || type === "hy2") return "Hysteria2";
    return type ? type.toUpperCase() : "NODE";
}

/**
 * IP 截取：保留前三段 (154.222.22)
 */
function formatIP(proxy) {
    const host = proxy.server || "";
    if (/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.test(host)) {
        return RegExp.$1;
    }
    return host.split('.')[0];
}

/**
 * 主函数
 */
function operator(proxies) {
    const counters = {};

    return proxies.map(p => {
        const info = getRegionByEmoji(p);
        const ip = formatIP(p);
        const proto = detectFeature(p);

        // 拼接：国旗 地区 | IP | 协议
        const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ip} | ${proto}`;
        
        counters[base] = (counters[base] || 0) + 1;
        const num = String(counters[base]).padStart(2, "0");
        
        p.name = `${base} ${num}`;
        p._base = base;
        return p;
    }).map((p, i, all) => {
        // 单节点去编号
        if (numone && all.filter(x => x._base === p._base).length === 1) {
            p.name = p.name.replace(/\s\d+$/, "");
        }
        delete p._base;
        return p;
    });
}
