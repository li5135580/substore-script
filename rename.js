/**
 * Sub-Store 终极修复脚本 (同步版)
 * 解决 QuickJS 编译失败问题，专项修复 Emoji 编码识别
 */

function operator(proxies) {
  const inArg = $arguments || {};

  // --- 参数解析 ---
  const addflag = !/^(false|0|off|no)$/i.test(inArg.flag);
  const numone  = /^(true|1|on|yes)$/i.test(inArg.one);

  // --- 地区字典 (增加针对性 IP 段映射) ---
  const Regions = [
    { n: "香港", f: "🇭🇰", re: /hong.?kong|hk|香港|港|hkg|154\.222|103\.152|203\.186/i },
    { n: "澳门", f: "🇲🇴", re: /macao|mo|澳门/i },
    { n: "台湾", f: "🇹🇼", re: /taiwan|tw|台湾|台北|tpe/i },
    { n: "日本", f: "🇯🇵", re: /japan|jp|日本|东京|大阪|tokyo|nrt/i },
    { n: "韩国", f: "🇰🇷", re: /korea|kr|韩国|首尔|seoul/i },
    { n: "新加坡", f: "🇸🇬", re: /singapore|sg|新加坡|狮城|sin/i },
    { n: "美国", f: "🇺🇸", re: /united.?states|us|美国|america|lax|sfo/i },
    { n: "英国", f: "🇬🇧", re: /united.?kingdom|uk|英国|london/i }
  ];

  const counters = {};

  return proxies.map(p => {
    let name = p.name || "";
    let server = p.server || "";

    // 1. 核心修复：手动清理 URL 编码 (解决 %20 干扰)
    // 不直接依赖 decodeURIComponent 以免部分环境报错
    try {
      name = decodeURIComponent(name).replace(/\+/g, " ");
      if (name.includes("%")) name = decodeURIComponent(name);
    } catch (e) {}

    // 移除不可见字符
    name = name.replace(/[\u200b-\u200d\ufeff]/g, "");
    const allText = (name + server).toLowerCase();

    // 2. 识别地区
    let info = { f: "🏳️‍🌈", n: "其他" };

    // 优先：正则命中 (含 IP 段硬锁)
    for (const r of Regions) {
      if (r.re.test(allText)) {
        info = r;
        break;
      }
    }

    // 补充：如果没有匹配到，且名字里有任何双字节国旗符号，尝试提取
    if (info.n === "其他") {
      const flagMatch = name.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/);
      if (flagMatch) {
        const foundFlag = flagMatch[0];
        const match = Regions.find(r => r.f === foundFlag);
        if (match) info = match;
      }
    }

    // 3. 提取 IP 前三段
    let ipStr = server;
    if (/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.test(server)) {
      ipStr = RegExp.$1;
    } else {
      ipStr = server.split(".")[0];
    }

    // 4. 识别协议 (兼容 1.js)
    let proto = "NODE";
    const type = String(p.type || "").toLowerCase();
    const flow = String(p.flow || "").toLowerCase();
    const sec = String(p.security || p.tls || "").toLowerCase();
    
    if (flow.includes("vision")) proto = "Vision";
    else if (sec === "reality") proto = "Reality";
    else if (type === "tuic") proto = "TUIC";
    else if (type === "hysteria2" || type === "hy2") proto = "Hysteria2";
    else if (type) proto = type.toUpperCase();

    // 5. 拼装结果
    const base = `${addflag ? info.f + " " : ""}${info.n} | ${ipStr} | ${proto}`;
    counters[base] = (counters[base] || 0) + 1;
    const num = String(counters[base]).padStart(2, "0");

    p.name = `${base} ${num}`;
    p._base = base;
    return p;
  }).map((p, i, all) => {
    // 处理单节点去编号
    if (numone && all.filter(x => x._base === p._base).length === 1) {
      p.name = p.name.replace(/\s\d+$/, "");
    }
    delete p._base;
    return p;
  });
}
