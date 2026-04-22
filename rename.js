/**
 * Sub-Store 重命名脚本 - 暴力识别方案
 * 1. 强制全量解码：处理所有 URL 编码和转义。
 * 2. 暴力索引：不再使用正则，直接用字符串包含判定。
 * 3. 稳健 IP：通过数组切割方式提取 IP 段，彻底解决 undefined 报错。
 */

function operator(proxies) {
  const inArg = $arguments || {};
  const addflag = !/^(false|0|off|no)$/i.test(inArg.flag);
  const numone  = /^(true|1|on|yes)$/i.test(inArg.one);

  // 1. 定义标准映射
  const mapping = [
    { name: "香港", flag: "🇭🇰", keys: ["香港", "港", "hk", "hong", "154.222", "103.152"] },
    { name: "台湾", flag: "🇹🇼", keys: ["台湾", "台", "tw", "taiwan", "103.125"] },
    { name: "日本", flag: "🇯🇵", keys: ["日本", "日", "jp", "japan", "tokyo"] },
    { name: "韩国", flag: "🇰🇷", keys: ["韩国", "韩", "kr", "korea", "seoul"] },
    { name: "新加坡", flag: "🇸🇬", keys: ["新加坡", "新", "sg", "singapore"] },
    { name: "美国", flag: "🇺🇸", keys: ["美国", "美", "us", "united", "america"] },
  ];

  const counters = {};

  return proxies.map(p => {
    // === A. 强力解码节点名 ===
    let rawName = p.name || "";
    try {
      rawName = decodeURIComponent(rawName);
      if (rawName.includes('%')) rawName = decodeURIComponent(rawName);
    } catch (e) {}
    
    // 清理不可见干扰符（有些机场会在 Emoji 后塞零宽字符）
    const cleanName = rawName.replace(/[\u200b-\u200d\ufeff]/g, "").toLowerCase();
    const server = (p.server || "").toLowerCase();
    const allSearch = cleanName + server;

    // === B. 识别地区 (先找 Emoji，再找关键字) ===
    let res = { flag: "🏳️‍🌈", region: "其他" };
    
    // 1. 优先根据 Emoji 原生字符识别
    for (const m of mapping) {
      if (rawName.indexOf(m.flag) !== -1) {
        res = { flag: m.flag, region: m.name };
        break;
      }
    }

    // 2. 如果没找到，按关键字识别
    if (res.region === "其他") {
      for (const m of mapping) {
        if (m.keys.some(key => allSearch.includes(key))) {
          res = { flag: m.flag, region: m.name };
          break;
        }
      }
    }

    // === C. 稳健提取 IP 段 (拒绝 undefined) ===
    let ipDisplay = "Unknown";
    const host = p.server || "";
    if (host.indexOf('.') !== -1) {
      const parts = host.split('.');
      // 如果是 IPv4 (四段数字)
      if (parts.length === 4 && !isNaN(parts[0])) {
        ipDisplay = parts[0] + "." + parts[1] + "." + parts[2];
      } else {
        // 如果是域名，取前两段
        ipDisplay = parts[0] + (parts[1] ? "." + parts[1] : "");
      }
    }

    // === D. 识别协议 (来自 1.js 逻辑) ===
    const type = (p.type || "").toLowerCase();
    const flow = (p.flow || "").toLowerCase();
    const sec = (p.security || p.tls || "").toLowerCase();
    let proto = type.toUpperCase();
    
    if (flow.includes("vision")) proto = "Vision";
    else if (sec === "reality") proto = "Reality";
    else if (type === "hysteria2" || type === "hy2") proto = "Hy2";
    else if (type === "tuic") proto = "TUIC";

    // === E. 组合名称 ===
    const base = `${addflag ? res.flag + ' ' : ''}${res.region} | ${ipDisplay} | ${proto}`;
    
    counters[base] = (counters[base] || 0) + 1;
    p.name = `${base} ${String(counters[base]).padStart(2, "0")}`;
    p._base = base;
    return p;
  }).map((p, i, all) => {
    // 处理单节点隐藏编号
    if (numone) {
      const isOnlyOne = all.filter(x => x._base === p._base).length === 1;
      if (isOnlyOne) p.name = p.name.replace(/\s\d+$/, "");
    }
    delete p._base;
    return p;
  });
}
