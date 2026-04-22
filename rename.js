/**
 * Sub-Store 智能识别脚本 (本地优先 + IP API 兜底)
 * 逻辑：本地识别 -> 若失败则调用 ipwho.is -> 自动格式化
 */

const inArg = $arguments;

// --- 参数控制 ---
const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认显示国旗
const useApi  = !/^(false|0|off|no)$/i.test(inArg.api);  // 是否开启 API 查询 (默认开)

// --- 本地核心数据表 (增加 IP 段识别，确保 154.222 必中) ---
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
 * 1. 异步 API 查询函数 (ipwho.is)
 */
async function fetchIpInfo(ip) {
    if (!ip || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return null;
    const url = `https://ipwho.is/${ip}`;
    return new Promise((resolve) => {
        $httpClient.get(url, (error, response, data) => {
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
 * 2. 本地地区识别 (针对 🇭🇰%20 乱码名节点)
 */
function getRegionLocal(proxy) {
    let name = proxy.name || "";
    let server = proxy.server || "";
    
    // 暴力解码
    try {
        name = decodeURIComponent(name);
        if (name.includes('%')) name = decodeURIComponent(name);
    } catch (e) {}
    
    const allText = (name + server).toLowerCase();

    // 优先匹配 Unicode 旗帜
    const flagRegex = /([\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF])/;
    const match = name.match(flagRegex);
    if (match) {
        const found = Regions.find(r => r.f === match[1]);
        if (found) return { flag: found.f, region: found.n };
    }

    // 关键字与 IP 段扫描 (这里 154.222 就会命中香港)
    for (const r of Regions) {
        if (r.re.test(allText)) return { flag: r.f, region: r.n };
    }

    return null; // 本地识别失败
}

/**
 * 3. 协议与 IP 格式化
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

function formatIP(host) {
    if (/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.test(host)) return RegExp.$1;
    return host.split('.')[0];
}

/**
 * 4. 主执行函数 (异步)
 */
async function operator(proxies) {
    const counters = {};
    
    // 使用 Promise.all 提高效率 (但受限于 API 频率限制)
    const processed = await Promise.all(proxies.map(async (p) => {
        // A. 尝试本地识别
        let info = getRegionLocal(p);
        
        // B. 本地识别失败且开启 API，则在线查询
        if (!info && useApi) {
            const apiInfo = await fetchIpInfo(p.server);
            if (apiInfo) info = apiInfo;
        }
        
        // C. 仍然识别失败的兜底
        if (!info) info = { flag: "🏳️‍🌈", region: "其他" };

        const ip = formatIP(p.server);
        const proto = detectFeature(p);
        const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ip} | ${proto}`;
        
        counters[base] = (counters[base] || 0) + 1;
        p.name = `${base} ${String(counters[base]).padStart(2, "0")}`;
        return p;
    }));

    return processed;
}
