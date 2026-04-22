/**
 * Sub-Store 终极修复脚本 - 稳健 IP + 字节级识别
 * 1. 格式：[国旗] [地区] | [IP前三段] | [协议] [编号]
 * 2. 修复：彻底解决 IP undefined 问题，精准捕获 %20 乱码节点
 */

function operator(proxies) {
    const inArg = $arguments || {};
    const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认开国旗
    const numone  = /^(true|1|on|yes)$/i.test(inArg.one);    // 单节点去编号

    const counters = {};

    return proxies.map(p => {
        // --- 1. 获取原始信息并强制解码 ---
        let name = p.name || "";
        const server = (p.server || "").toLowerCase();
        
        try {
            // 处理双重 URL 编码 (解决 %20)
            name = decodeURIComponent(decodeURIComponent(name));
        } catch (e) {
            try { name = decodeURIComponent(name); } catch (e2) {}
        }

        const allText = (name + server).toLowerCase();

        // --- 2. 识别地区 (采用最稳健的字节码索引) ---
        let info = { flag: "🏳️‍🌈", region: "其他" };

        // 专项修复：识别香港 (含国旗字节码、关键词、特定 IP 段)
        if (
            name.includes("\uD83C\uDDE6\uD83C\uDDF0") || // 🇭🇰 的 Unicode 编码
            allText.includes("香港") || 
            allText.includes("hk") || 
            allText.includes("154.222") // 您的专属 IP 段锁定
        ) {
            info = { flag: "🇭🇰", region: "香港" };
        } 
        else if (name.includes("\uD83C\uDDF9\uD83C\uDDFC") || allText.includes("tw") || allText.includes("台湾")) {
            info = { flag: "🇹🇼", region: "台湾" };
        }
        else if (name.includes("\uD83C\uDDEF\uD83C\uDDF5") || allText.includes("jp") || allText.includes("日本")) {
            info = { flag: "🇯🇵", region: "日本" };
        }
        else if (name.includes("\uD83C\uDDF8\uD83C\uDDEC") || allText.includes("sg") || allText.includes("新加坡")) {
            info = { flag: "🇸🇬", region: "新加坡" };
        }
        else if (name.includes("\uD83C\uDDFA\uD83C\uDDF8") || allText.includes("us") || allText.includes("美国")) {
            info = { flag: "🇺🇸", region: "美国" };
        }

        // --- 3. 稳健提取 IP 段 (绝对不会出现 undefined) ---
        let ipPart = "0.0.0";
        if (server.includes('.')) {
            const segs = server.split('.');
            if (segs.length >= 3) {
                // 取前三段并拼接
                ipPart = segs[0] + "." + segs[1] + "." + segs[2];
            } else {
                ipPart = segs[0];
            }
        } else {
            ipPart = server;
        }

        // --- 4. 识别协议 (根据 1.js 逻辑) ---
        const type = (p.type || "").toLowerCase();
        const flow = (p.flow || "").toLowerCase();
        const sec = (p.security || p.tls || "").toLowerCase();
        let proto = type.toUpperCase() || "NODE";
        
        if (flow.includes("vision")) proto = "Vision";
        else if (sec === "reality") proto = "Reality";
        else if (type === "hysteria2" || type === "hy2") proto = "Hy2";
        else if (type === "tuic") proto = "TUIC";

        // --- 5. 组装最终名称 ---
        const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ipPart} | ${proto}`;
        
        // 计数与编号
        counters[base] = (counters[base] || 0) + 1;
        const num = String(counters[base]).padStart(2, "0");
        
        p.name = `${base} ${num}`;
        p._base = base;
        return p;
    }).map((p, i, all) => {
        // 单节点去编号处理
        if (numone) {
            const isOnlyOne = all.filter(x => x._base === p._base).length === 1;
            if (isOnlyOne) p.name = p.name.replace(/\s\d+$/, "");
        }
        delete p._base;
        return p;
    });
}
