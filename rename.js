/**
 * Sub-Store 重命名脚本 - 第一版回归加固版
 * 1. 识别格式：国旗 地区 | IP前三段 | 协议 编号
 * 2. 核心修复：解决 IP undefined 问题，确保 Emoji 正常解码
 */

function operator(proxies) {
  const inArg = $arguments || {};
  const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认开启国旗
  const numone  = /^(true|1|on|yes)$/i.test(inArg.one);     // 单节点不带编号

  const counters = {};

  return proxies.map(p => {
    // === 1. 基础信息处理 ===
    let name = p.name || "";
    const server = (p.server || "").toLowerCase();
    
    // 强制解码，处理 %20 和 Emoji 编码
    try {
      name = decodeURIComponent(decodeURIComponent(name));
    } catch (e) {
      try { name = decodeURIComponent(name); } catch (e2) {}
    }
    
    const allText = (name + server).toLowerCase();

    // === 2. 地域识别 (回归第一版简洁逻辑) ===
    let info = { flag: "🏳️‍🌈", region: "其他" };

    if (allText.includes("香港") || allText.includes("hk") || allText.includes("🇭🇰") || allText.includes("154.222")) {
      info = { flag: "🇭🇰", region: "香港" };
    } else if (allText.includes("台湾") || allText.includes("tw") || allText.includes("🇹🇼")) {
      info = { flag: "🇹🇼", region: "台湾" };
    } else if (allText.includes("日本") || allText.includes("jp") || allText.includes("🇯🇵")) {
      info = { flag: "🇯🇵", region: "日本" };
    } else if (allText.includes("新加坡") || allText.includes("sg") || allText.includes("🇸🇬")) {
      info = { flag: "🇸🇬", region: "新加坡" };
    } else if (allText.includes("美国") || allText.includes("us") || allText.includes("🇺🇸")) {
      info = { flag: "🇺🇸", region: "美国" };
    } else if (allText.includes("韩国") || allText.includes("kr") || allText.includes("🇰🇷")) {
      info = { flag: "🇰🇷", region: "韩国" };
    }

    // === 3. IP 提取 (彻底修复 undefined) ===
    // 逻辑：直接分割字符串，不使用正则
    let ipDisplay = server;
    if (server.includes(".")) {
      const parts = server.split(".");
      if (parts.length >= 3) {
        // 拼接前三位：123.123.123
        ipDisplay = parts[0] + "." + parts[1] + "." + parts[2];
      }
    }

    // === 4. 协议识别 ===
    const type = (p.type || "").toLowerCase();
    const flow = (p.flow || "").toLowerCase();
    const sec = (p.security || p.tls || "").toLowerCase();
    let proto = type.toUpperCase();

    if (flow.includes("vision")) proto = "Vision";
    else if (sec === "reality") proto = "Reality";
    else if (type === "hysteria2" || type === "hy2") proto = "Hy2";
    else if (type === "tuic") proto = "TUIC";

    // === 5. 组合最终名称 ===
    const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ipDisplay} | ${proto}`;
    
    counters[base] = (counters[base] || 0) + 1;
    const num = String(counters[base]).padStart(2, "0");
    
    p.name = `${base} ${num}`;
    p._base = base;
    return p;
  }).map((p, i, all) => {
    // 单节点隐藏编号逻辑
    if (numone) {
      const isOnlyOne = all.filter(x => x._base === p._base).length === 1;
      if (isOnlyOne) p.name = p.name.replace(/\s\d+$/, "");
    }
    delete p._base;
    return p;
  });
}
