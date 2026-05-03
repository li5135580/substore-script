# ================= 基础 =================
mixed-port: 7890
redir-port: 7892
tproxy-port: 7893
allow-lan: true
bind-address: "*"
mode: rule
log-level: info
ipv6: false
tcp-concurrent: true
unified-delay: true
find-process-mode: strict

# ================= GEO =================
geodata-mode: true
geo-auto-update: true
geo-update-interval: 24

geox-url:
  geoip: https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb
  geosite: https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat

# ================= DNS（大陆联通专用优化） =================
dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: false
  enhanced-mode: fake-ip
  respect-rules: true

  # 国内 DNS（优先）
  nameserver:
    - 223.5.5.5      # 阿里
    - 119.29.29.29   # 腾讯
    - 114.114.114.114

  # 国外 DNS（防污染）
  fallback:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query
    - tls://1.1.1.1:853

  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4

  # 代理节点解析（避免污染）
  proxy-server-nameserver:
    - https://dns.cloudflare.com/dns-query

  fake-ip-filter:
    - "geosite:cn"
    - "geosite:private"
    - "+.qq.com"
    - "+.bilibili.com"
    - "+.mi.com"

# ================= 嗅探 =================
sniffer:
  enable: true
  parse-pure-ip: true
  force-dns-mapping: true
  sniff:
    TLS:
      ports: [443, 8443]
    HTTP:
      ports: [80, 8080]

# ================= 订阅 =================
proxy-providers:
  Subscribe:
    type: http
    url: "你的机场订阅"
    interval: 3600
    path: ./profiles/proxies.yaml
    health-check:
      enable: true
      url: http://www.gstatic.com/generate_204
      interval: 300

# ================= 策略组 =================
proxy-groups:

# 🎯 总控
- name: 🚀 总代理
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Global.png
  proxies:
    - ⚡ 自动优选
    - 🔁 故障转移
    - 🎯 AI专用
    - 🎬 流媒体
    - 🧭 手动
    - DIRECT

- name: 🧭 手动
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Select.png
  use: [Subscribe]

# ⚡ 延迟优选（联通重点）
- name: ⚡ 自动优选
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png
  url: http://www.gstatic.com/generate_204
  interval: 120
  tolerance: 20
  use: [Subscribe]

# 🔁 稳定
- name: 🔁 故障转移
  type: fallback
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Fallback.png
  url: http://www.gstatic.com/generate_204
  interval: 120
  use: [Subscribe]

# 🐢 低倍率隔离
- name: 🐢 低倍率
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Low.png
  url: http://www.gstatic.com/generate_204
  interval: 300
  use: [Subscribe]
  filter: "(?i)0\\.[0-5]|低倍率|省流|体验"

# 🌍 地区（联通建议）
- name: 🇭🇰 香港
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png
  use: [Subscribe]
  filter: "HK|香港"

- name: 🇯🇵 日本
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png
  use: [Subscribe]
  filter: "JP|日本"

- name: 🇸🇬 新加坡
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png
  use: [Subscribe]
  filter: "SG|新加坡"

- name: 🇺🇸 美国
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png
  use: [Subscribe]
  filter: "US|美国"

# 🤖 AI（关键）
- name: 🎯 AI专用
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png
  proxies:
    - 🇺🇸 美国
    - 🇯🇵 日本
    - ⚡ 自动优选

# 🎬 流媒体
- name: 🎬 流媒体
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix.png
  proxies:
    - 🇭🇰 香港
    - 🇯🇵 日本
    - 🇺🇸 美国
    - ⚡ 自动优选

# 📱 服务
- name: 🤖 AI服务
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png
  proxies:
    - 🎯 AI专用

- name: 📺 YouTube
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png
  proxies:
    - 🇭🇰 香港
    - 🇯🇵 日本

- name: 🎵 TikTok
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png
  proxies:
    - 🇺🇸 美国

- name: ✈️ Telegram
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png
  proxies:
    - ⚡ 自动优选

# 🍎 微软
- name: 🍎 苹果
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple.png
  proxies:
    - DIRECT
    - ⚡ 自动优选

- name: 🪟 微软
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png
  proxies:
    - DIRECT
    - ⚡ 自动优选

# 🚫 广告
- name: 🛑 广告
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Adblock.png
  proxies:
    - REJECT
    - DIRECT

# ================= 规则 =================
rules:

# 阻断 QUIC
- AND,((DST-PORT,443),(NETWORK,UDP)),REJECT

# 广告
- GEOSITE,CATEGORY-ADS-ALL,🛑 广告

# AI
- GEOSITE,CATEGORY-AI-!CN,🤖 AI服务

# 流媒体
- GEOSITE,NETFLIX,🎬 流媒体
- GEOSITE,YOUTUBE,📺 YouTube

# 社交
- GEOSITE,TELEGRAM,✈️ Telegram

# 系统
- GEOSITE,APPLE,🍎 苹果
- GEOSITE,MICROSOFT,🪟 微软

# 国内
- GEOIP,CN,DIRECT

# 兜底
- MATCH,🚀 总代理