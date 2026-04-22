function operator(proxies = []) {

  const get = (o, k) => {
    for (const i of k) if (o[i]) return String(o[i]);
    return "";
  };

  const lower = v => String(v || "").toLowerCase();
  const pad = n => String(n).padStart(2, "0");

  // ===== 国旗 =====
  const FLAG = {
    香港: "🇭🇰",
    日本: "🇯🇵",
    韩国: "🇰🇷",
    台湾: "🇹🇼",
    新加坡: "🇸🇬",
    美国: "🇺🇸",
    其他: "🌍"
  };

  // ===== 强化IP库（关键）=====
  const IP_DB = [
    // 🇭🇰 香港
    [/^154\.222\./, "香港"],
    [/^43\.132\./, "香港"],
    [/^8\.210\./, "香港"],

    // 🇯🇵 日本
    [/^1\.0\./, "日本"],
    [/^27\.0\./, "日本"],
    [/^133\./, "日本"],

    // 🇸🇬 新加坡
    [/^8\.219\./, "新加坡"],
    [/^47\.74\./, "新加坡"],

    // 🇺🇸 美国
    [/^34\./, "美国"],
    [/^13\./, "美国"],
    [/^18\./, "美国"]
  ];

  function detectRegion(p) {
    const ip = lower(p.server);

    // ✅ 1️⃣ IP优先（核心）
    for (const [rule, region] of IP_DB) {
      if (rule.test(ip)) return region;
    }

    // ✅ 2️⃣ fallback：国旗
    const name = p.name || "";
    if (name.includes("🇭🇰")) return "香港";
    if (name.includes("🇯🇵")) return "日本";
    if (name.includes("🇺🇸")) return "美国";

    // ✅ 3️⃣ fallback：关键词
    const text = lower(p.name);
    if (/hk|hongkong/.test(text)) return "香港";
    if (/jp|japan/.test(text)) return "日本";
    if (/us|america/.test(text)) return "美国";

    return "其他";
  }

  function simplify(ip) {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      const p = ip.split(".");
      return `${p[0]}.${p[1]}.${p[2]}`;
    }
    return ip.split(".")[0];
  }

  function feature(p) {
    const net = lower(get(p, ["network", "type"]));
    const sec = lower(get(p, ["security"]));
    const flow = lower(get(p, ["flow"]));

    if (flow.includes("vision")) return "Vision";
    if (sec === "reality") return "Reality";
    if (net) return net.toUpperCase();
    return "Node";
  }

  const counters = {};

  return proxies.map(p => {

    const region = detectRegion(p);
    const flag = FLAG[region] || "🌍";
    const entry = simplify(p.server || "");
    const feat = feature(p);

    const base = `${flag} ${region} | ${entry} | ${feat}`;

    counters[base] = (counters[base] || 0) + 1;

    p.name = `${base} ${pad(counters[base])}`;

    return p;
  });
}
