/**
 * Sub-Store 基础回归版重命名脚本
 * 逻辑：国旗 地区 | IP前三段 | 协议 编号
 */

function operator(proxies) {
  const inArg = $arguments || {};
  const addflag = !/^(false|0|off|no)$/i.test(inArg.flag); // 默认开启国旗
  const numone  = /^(true|1|on|yes)$/i.test(inArg.one);     // 默认单节点不带编号

  const counters = {};

  return proxies.map(p => {
    // 1. 获取名称并简单解码
    let name = p.name || "";
    try {
      name = decodeURIComponent(name);
    } catch (e) {}
    
    const server = (p.server || "").toLowerCase();
    const allText = (name + server).toLowerCase();

    // 2. 地域识别 (最简单的关键字匹配)
    let info = { flag: "🏳️‍🌈", region: "其他" };

    if (allText.includes("香港") || allText.includes("hk") || allText.includes("154.222")) {
      info = { flag: "🇭🇰", region: "香港" };
    } else if (allText.includes("台湾") || allText.includes("tw")) {
      info = { flag: "🇹🇼", region: "台湾" };
    } else if (allText.includes("日本") || allText.includes("jp") || allText.includes("tokyo")) {
      info = { flag: "🇯🇵", region: "日本" };
    } else if (allText.includes("新加坡") || allText.includes("sg") || allText.includes("singapore")) {
      info = { flag: "🇸🇬", region: "新加坡" };
    } else if (allText.includes("美国") || allText.includes("us") || allText.includes("united")) {
      info = { flag: "🇺🇸", region: "美国" };
    }

    // 3. 稳健 IP 提取 (同步逻辑，绝无 undefined)
    let ipStr = server;
    if (server.includes(".")) {
      const parts = server.split(".");
      if (parts.length >= 3) {
        // 强制拼接前三段
        ipStr = `${parts[0]}.${parts[1]}.${parts[2]}`;
      } else {
        ipStr = parts[0];
      }
    }

    // 4. 协议识别 (根据 1.js 逻辑)
    const type = (p.type || "").toLowerCase();
    const flow = (p.flow || "").toLowerCase();
    const sec = (p.security || p.tls || "").toLowerCase();
    let proto = type.toUpperCase();

    if (flow.includes("vision")) proto = "Vision";
    else if (sec === "reality") proto = "Reality";
    else if (type === "hysteria2" || type === "hy2") proto = "Hy2";
    else if (type === "tuic") proto = "TUIC";

    // 5. 组装格式
    const base = `${addflag ? info.flag + ' ' : ''}${info.region} | ${ipStr} | ${proto}`;
    
    // 编号逻辑
    counters[base] = (counters[base] || 0) + 1;
    const num = String(counters[base]).padStart(2, "0");
    
    p.name = `${base} ${num}`;
    p._base = base;
    return p;
  }).map((p, i, all) => {
    // 单节点去编号
    if (numone) {
      if (all.filter(x => x._base === p._base).length === 1) {
        p.name = p.name.replace(/\s\d+$/, "");
      }
    }
    delete p._base;
    return p;
  });
}
