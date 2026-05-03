# ================= 基础 =================
mixed-port: 7890
redir-port: 7892
tproxy-port: 7893
allow-lan: true
bind-address: "*"
mode: rule
log-level: info
ipv6: false
unified-delay: true
tcp-concurrent: true

# ================= DNS =================
dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: false
  enhanced-mode: fake-ip
  respect-rules: true

  nameserver:
    - 223.5.5.5
    - 119.29.29.29

  fallback:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query

  fallback-filter:
    geoip: true
    geoip-code: CN

# ================= 订阅 =================
proxy-providers:
  Subscribe:
    type: http
    url: "你的订阅&flag=meta"
    interval: 3600
    path: ./proxies.yaml

# ================= 策略组 =================
proxy-groups:

# 🎯 核心
- name: 选择代理
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Global.png
  proxies:
    - 自动选择
    - 故障转移
    - 手动选择
    - DIRECT

- name: 手动选择
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Select.png
  use:
    - Subscribe

- name: 自动选择
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png
  url: http://www.gstatic.com/generate_204
  interval: 300
  use:
    - Subscribe

- name: 故障转移
  type: fallback
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Fallback.png
  url: http://www.gstatic.com/generate_204
  interval: 300
  use:
    - Subscribe

# 🌍 分地区
- name: 日本节点
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png
  use: [Subscribe]
  filter: "日本|JP|东京|大阪"

- name: 香港节点
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png
  use: [Subscribe]
  filter: "香港|HK"

- name: 美国节点
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png
  use: [Subscribe]
  filter: "美国|US"

- name: 新加坡节点
  type: url-test
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png
  use: [Subscribe]
  filter: "新加坡|SG"

# 🎬 流媒体
- name: Netflix
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix.png
  proxies:
    - 自动选择
    - 美国节点
    - 日本节点

- name: Youtube
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png
  proxies:
    - 自动选择
    - 日本节点

- name: TikTok
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png
  proxies:
    - 美国节点
    - 日本节点

# 🧠 AI
- name: AI服务
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png
  proxies:
    - 美国节点
    - 日本节点

# 📱 常用
- name: Telegram
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png
  proxies:
    - 自动选择

- name: Twitter
  type: select
  icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Twitter.png
  proxies:
    - 自动选择

# 🚫 广告
- name: 广告拦截
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
- DOMAIN-SUFFIX,ad.com,广告拦截

# 流媒体
- GEOSITE,NETFLIX,Netflix
- GEOSITE,YOUTUBE,Youtube

# AI
- GEOSITE,CATEGORY-AI-!CN,AI服务

# 社交
- GEOSITE,TELEGRAM,Telegram
- GEOSITE,TWITTER,Twitter

# 国内外
- GEOIP,CN,DIRECT
- MATCH,选择代理