function main(config) {
  if (!config.rules) config.rules = [];
  if (!config["proxy-groups"]) return config;

  const groups = config["proxy-groups"].map(g => g.name);

  // ====== 自动选择可用策略组 ======
  const pick = (list, fallback) => {
    for (const name of list) {
      if (groups.includes(name)) return name;
    }
    return fallback;
  };

  const AI = pick(["🎯 AI专用", "🇺🇸 美国", "🚀 总代理"], "🚀 总代理");
  const STREAM = pick(["🎬 流媒体", "🇭🇰 香港", "🇯🇵 日本"], "🚀 总代理");
  const GLOBAL = pick(["🚀 总代理"], "DIRECT");

  // ====== AI服务（核心）=====
  const aiRules = [
    // ChatGPT / OpenAI
    `DOMAIN-SUFFIX,openai.com,${AI}`,
    `DOMAIN-SUFFIX,chatgpt.com,${AI}`,

    // Claude
    `DOMAIN-SUFFIX,anthropic.com,${AI}`,

    // Gemini / Google AI
    `DOMAIN-SUFFIX,gemini.google.com,${AI}`,
    `DOMAIN-SUFFIX,ai.google.dev,${AI}`,
    `DOMAIN-SUFFIX,generativeai.google,${AI}`,

    // Perplexity
    `DOMAIN-SUFFIX,perplexity.ai,${AI}`
  ];

  // ====== 流媒体 ======
  const mediaRules = [
    `GEOSITE,NETFLIX,${STREAM}`,
    `GEOSITE,YOUTUBE,${STREAM}`,
    `DOMAIN-SUFFIX,tiktok.com,${STREAM}`,
    `DOMAIN-SUFFIX,byteoversea.com,${STREAM}`
  ];

  // ====== DNS污染关键修复 ======
  const dnsFix = [
    `DOMAIN,safebrowsing.googleapis.com,DIRECT`,
    `DOMAIN,safebrowsing.urlsec.qq.com,DIRECT`,
    `DOMAIN-SUFFIX,services.googleapis.cn,DIRECT`
  ];

  // ====== 国内直连优化 ======
  const directRules = [
    `GEOSITE,CN,DIRECT`,
    `GEOIP,CN,DIRECT`
  ];

  // ====== 汇总 ======
  const finalRules = [
    ...aiRules,
    ...mediaRules,
    ...dnsFix,
    ...directRules
  ];

  // 插入最前（最高优先级）
  config.rules.unshift(...finalRules);

  return config;
}