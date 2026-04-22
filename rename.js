/**
 * Sub-Store 终极重命名脚本 (彻底修复 Emoji 识别问题)
 * 逻辑：[国旗] [地区] | [IP前三段/入口] | [协议类型] [编号]
 */

const inArg = $arguments;

// --- 参数控制 ---
const addflag = /^(false|0|off|no)$/i.test(inArg.flag) ? false : true;
const clear   = /^(false|0|off|no)$/i.test(inArg.clear) ? false : true;
const numone  = /^(true|1|on|yes)$/i.test(inArg.one) ? true : false;

// --- 标准映射表 ---
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇲','🇦🇹','🇧🇷','🇨🇦','🇨🇭','🇮🇳','🇮🇩','🇮🇹','🇲🇾','🇳🇱','🇵Ｈ','🇷🇺','🇸🇦','🇪🇸','🇹🇭','🇹🇷','🇻🇳'];
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','亚美尼亚','奥地利','巴西','加拿大','瑞士','印度','印尼','意大利','马来西亚','荷兰','菲律宾','俄罗斯','沙特阿拉伯','西班牙','泰国','土耳其','越南'];
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AM','AT','BR','CA','CH','IN','ID','IT','MY','NL','PH','RU','SA','ES','TH','TR','VN'];

/**
 * 核心修复：高强度地区识别函数
 */
function getRegionInfo(proxy) {
    let name = proxy.name || "";
    let server = (proxy.server || "").toLowerCase();

    // 1. 彻底解码：处理 %20 以及嵌套编码
    try {
        name = decodeURIComponent(name);
        // 再次解码以防万一
        if (name.includes('%')) name = decodeURIComponent(name);
    } catch (e) {}

    // 2. 清理干扰：去除零宽字符、换行符、特殊空格
    name = name.replace(/[\u200b-\u200d\ufeff\s]/g, " ").trim();
    
    const allText = (name + server).toLowerCase();

    // 3. 策略一：Emoji 暴力匹配 (解决 🇭🇰%20 问题的关键)
    // 直接遍历国旗数组，不使用 includes，改用 indexOf 确保兼容性
    for (let i = 0; i < FG.length; i++) {
        if (name.indexOf(FG[i]) !== -1) {
            return { flag: FG[i], region: ZH[i] };
        }
    }

    // 4. 策略二：中文/英文关键词正则匹配
    let index = -1;
    if (/hong.?kong|hk|香港|港|hkg/.test(allText)) index = 0;
    else if (/macao|mo|澳门/.test(allText)) index = 1;
    else if (/taiwan|tw|台湾|台北|tpe/.test(allText)) index = 2;
    else if (/japan|jp|日本|东京|大阪|tokyo/.test(allText)) index = 3;
    else if (/korea|kr|韩国|首尔|seoul/.test(allText)) index = 4;
    else if (/singapore|sg|新加坡|狮城|sin/.test(allText)) index = 5;
    else if (/united.?states|us|美国|america|lax|sfo/.test(allText)) index = 6;
    else if (/united.?kingdom|uk|英国|london/.test(allText)) index = 7;

    // 5. 策略三：EN 国家代码边界匹配 (来自 2.js)
    if (index === -1) {
        index = EN.findIndex(code => {
            const re = new RegExp(`(?:^|[^A-Za-z])${code}(?:[^A-Za-z]|$)`, "i");
            return re.test(allText);
        });
    }

    if (index !== -1) {
        return { flag: FG[index] || "🏳️‍🌈", region: ZH[index] };
    }

    return { flag: "🏳️‍🌈", region: "其他" };
}

/**
 * 协议识别 (来自 1.js)
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
 * IP段提取：保留前三个字段
 */
function getIP(proxy) {
    const host = proxy.server || "";
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const p = host.split(".");
        return `${p[0]}.${p[1]}.${p[2]}`;
    }
    // 如果是域名，取前段
    return host.split(".")[0];
}

/**
 * 主逻辑
 */
function operator(proxies) {
    const counters = {};
    const nameclear = /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|订阅|流量|机场)/i;

    // 过滤
    let list = clear ? proxies.filter(p => !nameclear.test(p.name)) : proxies;

    // 第一遍重命名：组装基础格式
    list = list.map(p => {
        const info = getRegionInfo(p);
        const ip = getIP(p);
        const proto = detectFeature(p);

        const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ip} | ${proto}`;
        
        counters[base] = (counters[base] || 0) + 1;
        const num = String(counters[base]).padStart(2, "0");
        
        p.name = `${base} ${num}`;
        p._base = base;
        return p;
    });

    // 第二遍：处理单节点去编号 (one 开关)
    if (numone) {
        const counts = {};
        list.forEach(p => counts[p._base] = (counts[p._base] || 0) + 1);
        list.forEach(p => {
            if (counts[p._base] === 1) {
                p.name = p.name.replace(/\s\d+$/, "");
            }
        });
    }

    // 清理临时属性
    list.forEach(p => delete p._base);
    return list;
}
