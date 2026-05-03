# ================================================================
# Mihomo (Clash Meta) 完整进阶配置文件
# 完美适配 powerfullz 覆写脚本的分流结构
# ================================================================

# 通用基础配置
mixed-port: 7890
redir-port: 7892
tproxy-port: 7893
routing-mark: 7894
allow-lan: true
bind-address: '*'
ipv6: false
mode: rule
unified-delay: true
tcp-concurrent: true
find-process-mode: off
log-level: info
disable-keep-alive: false

# 元数据与 GEO 数据库配置
geodata-mode: true
geox-url:
  geoip: "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat"
  geosite: "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat"
  mmdb: "https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb"
  asn: "https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb"

profile:
  store-selected: true

# DNS 模块优化配置（Fake-IP 模式，防泄漏）
dns:
  enable: true
  ipv6: false
  prefer-h3: true
  enhanced-mode: fake-ip
  listen: 0.0.0.0:1053
  respect-rules: true # 优先匹配规则防止 DNS 泄露
  default-nameserver:
    - 119.29.29.29
    - 223.5.5.5
  nameserver:
    - system
    - 223.5.5.5
    - 119.29.29.29
    - 180.184.1.1
  fallback:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query
    - https://dns.sb/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    geosite:
      - gfw
    ipcidr:
      - 240.0.0.0/4
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - tls://dot.pub
  fake-ip-filter:
    - "geosite:private"
    - "geosite:connectivity-check"
    - "geosite:cn"
    - "Mijia Cloud"
    - "dig.io.mi.com"
    - "localhost.ptlogin2.qq.com"
    - "+.icloud.com"
    - "+.stun.*.*"
    - "+.stun.*.*.*"
    - "+.stunta.*.*"
    - "+.stunta.*.*.*"
    - "msftconnecttest.com"
    - "msftncsi.com"
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"

# 嗅探模块优化配置（防 SNI 问题与 IP 嗅探泄露）
sniffer:
  enable: true
  parse-pure-ip: true # 强制解析纯 IP
  force-dns-mapping: true
  override-destination: true # 全局强制覆盖目标地址
  sniff:
    TLS:
      ports: [443, 8443]
      override-destination: true
    HTTP:
      ports: [80, 8080, 8880]
      override-destination: true
    QUIC:
      ports: [443, 8443]
      override-destination: true
  skip-domain:
    - "Mijia Cloud"
    - "dlg.io.mi.com"
    - "+.push.apple.com"

# 节点源定义
proxy-providers:
  Subscribe:
    type: http
    url: "https://your-sub-link-here.com" # ★ 请在此处替换为您的机场订阅链接
    interval: 3600
    path: ./profiles/proxies.yaml
    health-check:
      enable: true
      interval: 600
      url: https://cp.cloudflare.com/generate_204

# 策略组
proxy-groups:
  # 1. 核心总控与选择组
  - name: 选择代理
    type: select
    proxies:
      - 自动选择
      - 故障转移
      - 台湾节点
      - 香港节点
      - 新加坡节点
      - 日本节点
      - 美国节点
      - 英国节点
      - 德国节点
      - 韩国节点
      - 法国节点
      - 低倍率节点
      - 手动选择
      - DIRECT

  - name: 手动选择
    type: select
    use:
      - Subscribe

  - name: 直连
    type: select
    proxies:
      - DIRECT
      - 选择代理

  # 2. 常用业务分组（按脚本匹配的默认分流逻辑）
  - name: 静态资源
    type: select
    proxies: &base-proxies
      - 选择代理
      - 台湾节点
      - 香港节点
      - 新加坡节点
      - 日本节点
      - 美国节点
      - 英国节点
      - 德国节点
      - 韩国节点
      - 法国节点
      - 低倍率节点
      - 手动选择
      - DIRECT

  - name: AI服务
    type: select
    proxies: *base-proxies

  - name: 加密货币
    type: select
    proxies: *base-proxies

  - name: 苹果服务
    type: select
    proxies: *base-proxies

  - name: 谷歌服务
    type: select
    proxies: *base-proxies

  - name: 微软服务
    type: select
    proxies: *base-proxies

  - name: Youtube
    type: select
    proxies: *base-proxies

  - name: Netflix
    type: select
    proxies: *base-proxies

  - name: TikTok
    type: select
    proxies: *base-proxies

  - name: Spotify
    type: select
    proxies: *base-proxies

  - name: Telegram
    type: select
    proxies: *base-proxies

  - name: Twitter
    type: select
    proxies: *base-proxies

  - name: E-Hentai
    type: select
    proxies: *base-proxies

  - name: PikPak网盘
    type: select
    proxies: *base-proxies

  - name: SSH
    type: select
    proxies: *base-proxies

  # 3. 特定地区优先分组
  - name: 哔哩哔哩
    type: select
    proxies:
      - DIRECT
      - 台湾节点
      - 香港节点
      - 手动选择

  - name: 巴哈姆特
    type: select
    proxies:
      - 台湾节点
      - 选择代理
      - 手动选择
      - DIRECT

  - name: 新浪微博
    type: select
    proxies:
      - DIRECT
      - 台湾节点
      - 香港节点
      - 新加坡节点
      - 日本节点
      - 美国节点
      - 英国节点
      - 德国节点
      - 韩国节点
      - 法国节点
      - 低倍率节点
      - 选择代理
      - 手动选择

  - name: Truth Social
    type: select
    proxies:
      - 美国节点
      - 选择代理
      - 手动选择

  - name: 搜狗输入法
    type: select
    proxies:
      - DIRECT
      - REJECT

  - name: 广告拦截
    type: select
    proxies:
      - REJECT
      - REJECT-DROP
      - 直连

  # 4. 自动优选与容灾组
  - name: 自动选择
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe

  - name: 故障转移
    type: fallback
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    use:
      - Subscribe

  # 5. 低倍率/节流节点过滤
  - name: 低倍率节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)0\\.[0-5]|低倍率|省流|实验性"

  # 6. 正则化筛选的各地区代理组
  - name: 香港节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)香港|港|\\b(?:HK|hk)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Hong Kong|HongKong|hongkong|深港|HKG|🇭🇰"

  - name: 澳门节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)澳门|\\b(?:MO|mo)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Macau|🇲🇴"

  - name: 台湾节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)台|新北|彰化|\\b(?:TW|tw)(?:[-_ ]?\\d+(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?)?\\b|Taiwan|TAIWAN|TWN|TPE|ROC|🇹🇼|🇼🇸"

  - name: 新加坡节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)新加坡|坡|狮城|\\b(?:SG|sg)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Singapore|SINGAPORE|SIN|🇸🇬"

  - name: 日本节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)日本|川日|东京|大阪|泉日|埼玉|沪日|深日|\\b(?:JP|jp)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Japan|JAPAN|JPN|NRT|HND|KIX|TYO|OSA|关西|Kansai|KANSAI|🇯🇵"

  - name: 韩国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)韩国|韩|韓|春川|Chuncheon|首尔|\\b(?:KR|kr)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Korea|KOREA|KOR|ICN|🇰🇷"

  - name: 美国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)美国|美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|亚特兰大|迈阿密|华盛顿|\\b(?:US|us)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|United States|UnitedStates|USA|America|AMERICA|JFK|EWR|IAD|ATL|ORD|MIA|NYC|LAX|SFO|SEA|DFW|SJC|🇺🇸"

  - name: 加拿大节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)加拿大|渥太华|温哥华|卡尔加里|蒙特利尔|Montreal|\\b(?:CA|ca)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Canada|CANADA|CAN|YVR|YYZ|YUL|🇨🇦"

  - name: 英国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)英国|伦敦|曼彻斯特|Manchester|\\b(?:UK|uk)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Britain|United Kingdom|UNITED KINGDOM|England|GBR|LHR|MAN|🇬🇧"

  - name: 澳大利亚节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)澳洲|澳大利亚|\\b(?:AU|au)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Australia|🇦🇺"

  - name: 德国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)德国|德|柏林|法兰克福|慕尼黑|Munich|\\b(?:DE|de)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Germany|GERMANY|DEU|MUC|🇩🇪"

  - name: 法国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)法国|法|巴黎|马赛|Marseille|\\b(?:FR|fr)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|France|FRANCE|FRA|CDG|MRS|🇫🇷"

  - name: 俄罗斯节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)俄罗斯|俄|\\b(?:RU|ru)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Russia|🇷🇺"

  - name: 泰国节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)泰国|泰|\\b(?:TH|th)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Thailand|🇹🇭"

  - name: 印度节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)印度|\\b(?:IN|in)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|India|🇮🇳"

  - name: 马来西亚节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)马来西亚|马来|\\b(?:MY|my)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Malaysia|🇲🇾"

  - name: 阿根廷节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)阿根廷|布宜诺斯艾利斯|\\b(?:AR|ar)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Argentina|EZE|🇦🇷"

  - name: 芬兰节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)芬兰|赫尔辛基|\\b(?:FI|fi)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Finland|HEL|🇫🇮"

  - name: 埃及节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)埃及|开罗|\\b(?:EG|eg)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Egypt|CAI|🇪🇬"

  - name: 菲律宾节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)菲律宾|马尼拉|\\b(?:PH|ph)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Philippines|MNL|🇵🇭"

  - name: 土耳其节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)土耳其|伊斯坦布尔|\\b(?:TR|tr)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Turkey|Türkiye|IST|🇹🇷"

  - name: 乌克兰节点
    type: url-test
    url: https://cp.cloudflare.com/generate_204
    interval: 60
    tolerance: 20
    use:
      - Subscribe
    filter: "(?i)乌克兰|基辅|\\b(?:UA|ua)(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Ukraine|KBP|🇺🇦"

  - name: GLOBAL
    type: select
    proxies:
      - 选择代理
      - 自动选择
      - 台湾节点
      - 香港节点
      - 韩国节点
      - 日本节点
      - 新加坡节点
      - 美国节点
      - 其它节点
      - 手动选择
      - DIRECT

# 规则源提供者
rule-providers:
  ADBlock:
    type: http
    behavior: domain
    format: mrs
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.mrs"
    path: ./ruleset/ADBlock.mrs
  SogouInput:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://ruleset.skk.moe/Clash/non_ip/sogouinput.txt"
    path: ./ruleset/SogouInput.txt
  StaticResources:
    type: http
    behavior: domain
    format: text
    interval: 86400
    url: "https://ruleset.skk.moe/Clash/domainset/cdn.txt"
    path: ./ruleset/StaticResources.txt
  CDNResources:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://ruleset.skk.moe/Clash/non_ip/cdn.txt"
    path: ./ruleset/CDNResources.txt
  TikTok:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/TikTok.list"
    path: ./ruleset/TikTok.list
  EHentai:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/EHentai.list"
    path: ./ruleset/EHentai.list
  SteamFix:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/SteamFix.list"
    path: ./ruleset/SteamFix.list
  GoogleFCM:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/FirebaseCloudMessaging.list"
    path: ./ruleset/FirebaseCloudMessaging.list
  AdditionalFilter:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list"
    path: ./ruleset/AdditionalFilter.list
  AdditionalCDNResources:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalCDNResources.list"
    path: ./ruleset/AdditionalCDNResources.list
  Crypto:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/Crypto.list"
    path: ./ruleset/Crypto.list
  Weibo:
    type: http
    behavior: classical
    format: text
    interval: 86400
    url: "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/Weibo.list"
    path: ./ruleset/Weibo.list

# 分流规则
rules:
  # 彻底阻断 QUIC，防止旁路流量泄露或绕过分流
  - AND,((DST-PORT,443),(NETWORK,UDP)),REJECT

  # 广告拦截
  - RULE-SET,ADBlock,广告拦截
  - RULE-SET,AdditionalFilter,广告拦截

  # 特定业务规则
  - RULE-SET,SogouInput,搜狗输入法
  - DOMAIN-SUFFIX,truthsocial.com,Truth Social

  # 静态资源与 CDN
  - RULE-SET,StaticResources,静态资源
  - RULE-SET,CDNResources,静态资源
  - RULE-SET,AdditionalCDNResources,静态资源

  # 各种常见服务分类
  - RULE-SET,Crypto,加密货币
  - RULE-SET,EHentai,E-Hentai
  - RULE-SET,TikTok,TikTok
  - RULE-SET,SteamFix,直连
  - RULE-SET,GoogleFCM,直连
  - RULE-SET,Weibo,新浪微博

  # 常用大厂 Geosite 分流
  - GEOSITE,YOUTUBE,Youtube
  - GEOSITE,TELEGRAM,Telegram
  - GEOSITE,GOOGLE-PLAY@CN,直连
  - GEOSITE,MICROSOFT@CN,直连
  - GEOSITE,APPLE,苹果服务
  - GEOSITE,MICROSOFT,微软服务
  - GEOSITE,GOOGLE,谷歌服务
  - GEOSITE,NETFLIX,Netflix
  - GEOSITE,SPOTIFY,Spotify
  - GEOSITE,BAHAMUT,巴哈姆特
  - GEOSITE,BILIBILI,哔哩哔哩
  - GEOSITE,PIKPAK,PikPak网盘
  - GEOSITE,TWITTER,Twitter
  - GEOSITE,CATEGORY-AI-!CN,AI服务

  # 国内外基础分流
  - GEOSITE,GFW,选择代理
  - GEOSITE,CN,直连
  - GEOSITE,PRIVATE,直连

  # IP 规则防泄漏与匹配
  - GEOIP,NETFLIX,Netflix,no-resolve
  - GEOIP,TELEGRAM,Telegram,no-resolve
  - GEOIP,CN,直连
  - GEOIP,PRIVATE,直连

  # SSH 端口及兜底
  - DST-PORT,22,SSH
  - MATCH,选择代理
