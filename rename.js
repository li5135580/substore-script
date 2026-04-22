/**
 * Sub-Store 智能识别脚本 (Final Repair)
 * 逻辑：本地识别 -> IP API 兜底 -> 严格三段 IP 格式
 */

const inArg = $arguments;

// --- 参数控制 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); 
const useApi  = !/^(false|0|off|no)$/i.test(inArg.api);  

// --- 本地数据表 ---
const Regions = [
    { n: "香港", f: "🇭🇰", re: /hong.?kong|hk|香港|港|hkg|154\.222|103\.152/i },
    { n: "澳门", f: "🇲🇴", re: /macao|mo|澳门/i },
    { n: "台湾", f: "🇹🇼", re: /taiwan|tw|台湾|台北|tpe/i },
    { n: "日本", f: "🇯🇵", re: /japan|jp|日本|东京|大阪|tokyo|nrt/i },
    { n: "韩国", f: "🇰🇷", re: /korea|kr|韩国|首尔|seoul/i },
    { n: "新加坡", f: "🇸🇬", re: /singapore|sg|新加坡|狮城|sin/i },
    { n: "美国", f: "🇺🇸", re: /united.?states|us|美国|america|lax|sfo/i },
    { n: "英国", f: "🇬🇧", re: /united.?kingdom|uk|英国|london/i }
];

const FlagMap = { "HK": "🇭🇰", "MO": "🇲🇴", "TW": "🇹🇼", "JP": "🇯🇵", "KR": "🇰🇷", "SG": "🇸🇬", "US": "🇺🇸", "GB": "🇬🇧", "VN": "🇻🇳", "TH": "🇹🇭" };

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
                        resolve({
                            region: res.country || "其他",
                            flag: FlagMap[res.country_code] || "🏳️‍🌈"
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
 * 2. 本地识别 (修复 RegExp.$1 冲突问题)
 */
function getRegionLocal(proxy) {
    let name = proxy.name || "";
    let server = proxy.server || "";
    try {
        name = decodeURIComponent(name);
        if (name.includes('%')) name = decodeURIComponent(name);
    } catch (e) {}
    name = name.replace(/[\u200b-\u200d\ufeff\s]/g, "");
    
    // 优先提取 Emoji
    const flagMatch = name.match(/([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/);
    if (flagMatch) {
        const found = Regions.find(r => r.f === flagMatch[1]);
        if (found) return { flag: found.f, region: found.n };
    }

    const allText = (name + server).toLowerCase();
    for (const r of Regions) {
        if (r.re.test(allText)) return { flag: r.f, region: r.n };
    }
    return null;
}

/**
 * 3. 协议识别
 */
function detectFeature(proxy) {
    const f = (k) => String(proxy[k] || "").toLowerCase();
    const type = f("type"), flow = f("flow"), sec = f("security") || f("tls");
    if (flow.includes("vision")) return "Vision";
    if (sec === "reality") return "Reality";
    if (type === "tuic") return "TUIC";
    if (type === "hysteria2" || type === "hy2") return "Hysteria2";
    return type.toUpperCase() || "NODE";
}

/**
 * 4. IP 格式化 (修复 undefined 问题)
 */
function formatIP(host) {
    const ipMatch = String(host || "").match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
    if (ipMatch && ipMatch[1]) {
        return ipMatch[1];
    }
    return String(host || "Unknown").split('.')[0];
}

/**
 * 5. 主执行逻辑
 */
async function operator(proxies) {
    const counters = {};
    const clearRe = /(套餐|到期|有效|剩余|已用|过期|官方|网址|订阅|流量)/i;

    const processed = await Promise.all(proxies.map(async (p) => {
        if (clearRe.test(p.name)) return null;

        // 获取地域
        let info = getRegionLocal(p);
        if (!info && useApi) {
            info = await fetchIpInfo(p.server);
        }
        if (!info) info = { flag: "🏳️‍🌈", region: "其他" };

        // 获取格式化后的 IP
        const ip = formatIP(p.server);
        const proto = detectFeature(p);

        const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ip} | ${proto}`;
        
        counters[base] = (counters[base] || 0) + 1;
        const num = String(counters[base]).padStart(2, "0");
        p.name = `${base} ${num}`;
        return p;
    }));

    return processed.filter(Boolean);
}
