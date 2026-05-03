function main(config) {
  // ===== 基础校验 =====
  if (!config.proxies) return config;
  if (!config["proxy-groups"]) config["proxy-groups"] = [];
  if (!config.rules) config.rules = [];

  // ===== 策略组名称 =====
  const PROXY = "选择代理";
  const DIRECT = "直连";

  // ===== DNS 防泄露（强化版）=====
  config.dns = {
    enable: true,
    ipv6: false,
    "prefer-h3": true,
    "enhanced-mode": "fake-ip",
    listen: "0.0.0.0:1053",

    // 🔥 核心：防 DNS 泄露
    "respect-rules": true,

    "default-nameserver": [
      "119.29.29.29",
      "223.5.5.5"
    ],

    "nameserver": [
      "system",
      "223.5.5.5",
      "119.29.29.29",
      "180.184.1.1"
    ],

    "fallback": [
      "https://dns.cloudflare.com/dns-query",
      "https://dns.google/dns-query",
      "https://dns.sb/dns-query"
    ],

    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      geosite: ["gfw"],
      ipcidr: ["240.0.0.0/4"]
    },

    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "tls://dot.pub"
    ],

    "fake-ip-filter": [
      "geosite:private",
      "geosite:connectivity-check",
      "geosite:cn",
      "+.icloud.com",
      "Mijia Cloud",
      "dig.io.mi.com",
      "localhost.ptlogin2.qq.com",
      "+.stun.*.*",
      "+.stun.*.*.*",
      "msftconnecttest.com",
      "msftncsi.com"
    ]
  };

  // ===== 嗅探修复（SNI防泄露）=====
  config.sniffer = {
    enable: true,

    // 🔥 关键
    "parse-pure-ip": true,
    "force-dns-mapping": true,
    "override-destination": true,

    sniff: {
      TLS: {
        ports: [443, 8443],
        "override-destination": true
      },
      HTTP: {
        ports: [80, 8080, 8880],
        "override-destination": true
      },
      QUIC: {
        ports: [443, 8443],
        "override-destination": true
      }
    },

    "skip-domain": [
      "Mijia Cloud",
      "dlg.io.mi.com",
      "+.push.apple.com"
    ]
  };

  // ===== 🔥 强制关闭 QUIC（核心）=====
  config.rules.unshift(
    "AND,((DST-PORT,443),(NETWORK,UDP)),REJECT"
  );

  // ===== AI 分流优化 =====
  config.rules.unshift(
    "DOMAIN-SUFFIX,openai.com," + PROXY,
    "DOMAIN-SUFFIX,chatgpt.com," + PROXY,
    "DOMAIN-SUFFIX,anthropic.com," + PROXY,
    "DOMAIN-SUFFIX,perplexity.ai," + PROXY,
    "DOMAIN-SUFFIX,ai.google.dev," + PROXY,
    "DOMAIN-SUFFIX,gemini.google.com," + PROXY
  );

  // ===== DNS 污染修复 =====
  config.rules.unshift(
    "DOMAIN,safebrowsing.googleapis.com," + DIRECT,
    "DOMAIN,safebrowsing.urlsec.qq.com," + DIRECT,
    "DOMAIN-SUFFIX,services.googleapis.cn," + DIRECT
  );

  // ===== 国内直连优化 =====
  config.rules.push(
    "GEOSITE,CN," + DIRECT,
    "GEOIP,CN," + DIRECT
  );

  return config;
}