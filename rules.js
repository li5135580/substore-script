/***
 * Mihomo / Clash Meta 终极动态覆写脚本（强化版）
 * 基于 dahaha-365 YaNet 深度优化
 * 强化：DNS防泄露 / QUIC禁用 / AI分流 / 全远程规则
 */

function stringToArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val !== 'string') return []
  return val.split(';').map(i => i.trim()).filter(Boolean)
}

/* ---------------- 参数 ---------------- */

const _chinaDoh = 'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'
const _foreignDoh = 'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIP = '119.29.29.29;223.5.5.5'
const _foreignIP = '8.8.8.8;1.1.1.1'

const args = typeof $arguments !== 'undefined' ? $arguments : {}

let {
  enable = true,
  githubProxy = 'https://ghfast.top/',
  ipv6 = false,
  logLevel = 'error'
} = args

const chinaDNS = stringToArray(_chinaDoh)
const foreignDNS = stringToArray(_foreignDoh)
const defaultDNS = stringToArray(_chinaIP)
const directDNS = stringToArray(_chinaIP)

/* ---------------- DNS（无泄露版） ---------------- */

const dnsConfig = {
  enable: true,
  listen: '127.0.0.1:53',
  ipv6,
  'log-level': logLevel,

  'prefer-h3': false,
  'use-hosts': true,
  'use-system-hosts': false,

  'respect-rules': true,

  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',

  nameserver: chinaDNS,
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,

  fallback: foreignDNS,
  'fallback-filter': {
    geoip: true,
    'geoip-code': 'CN',
  },

  'proxy-server-nameserver': foreignDNS,

  'nameserver-policy': {
    'geosite:cn': chinaDNS,
    'geosite:gfw,geosite:google,geosite:openai': foreignDNS,
  },
}

/* ---------------- 主入口 ---------------- */

function main(config) {
  if (!enable) return config

  /* ===== 基础 ===== */
  config['mode'] = 'rule'
  config['dns'] = dnsConfig

  config['geodata-mode'] = true
  config['tcp-concurrent'] = true
  config['unified-delay'] = true
  config['keep-alive-interval'] = 600

  /* ===== QUIC 禁用 ===== */
  config.rules = config.rules || []
  config.rules.unshift(
    'NETWORK,udp,REJECT',
    'AND,((NETWORK,udp),(DST-PORT,443)),REJECT'
  )

  /* ===== Sniffer ===== */
  config.sniffer = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
    },
  }

  /* ===== TUN 防泄露 ===== */
  config.tun = {
    enable: true,
    stack: 'mixed',
    'auto-route': true,
    'strict-route': true,
    'dns-hijack': ['any:53','tcp://any:53','udp://any:53'],
  }

  /* ===== 远程规则 ===== */
  config['rule-providers'] = {
    ai: {
      type: 'http',
      interval: 86400,
      behavior: 'domain',
      url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs`,
      path: './ruleset/ai.mrs'
    }
  }

  /* ===== AI 分流 ===== */
  config.rules.unshift(
    'GEOSITE,category-ai-!cn,AI服务',
    'DOMAIN-SUFFIX,openai.com,AI服务',
    'DOMAIN-SUFFIX,chatgpt.com,AI服务',
    'DOMAIN-SUFFIX,anthropic.com,AI服务',
    'DOMAIN-SUFFIX,claude.ai,AI服务',
    'DOMAIN-SUFFIX,poe.com,AI服务',
    'DOMAIN-SUFFIX,perplexity.ai,AI服务',
    'DOMAIN-SUFFIX,gemini.google.com,AI服务'
  )

  /* ===== 策略组 ===== */
  config['proxy-groups'] = [
    {
      name: 'AI服务',
      type: 'select',
      proxies: ['自动选择','手动选择','DIRECT']
    },
    {
      name: '自动选择',
      type: 'url-test',
      url: 'https://www.gstatic.com/generate_204',
      interval: 300,
      proxies: config.proxies.map(p => p.name)
    },
    {
      name: '手动选择',
      type: 'select',
      proxies: config.proxies.map(p => p.name)
    }
  ]

  return config
}