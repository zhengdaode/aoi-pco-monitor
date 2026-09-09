#!/usr/bin/env node
// grab.js — Playwright 真实浏览器抓取 PCO 页面商品五要素（图/链接/名称/价格/限购）
// F9 M1：验证 Actions 环境（Azure 出口）能否通过 PCO 的 JS 质询并锁定解析锚点；
//        解析失败时全量 HTML + 截图入 artifact 供锚点修复。
// 用法：URLS="url1 url2" node monitor/grab.js   （未设 URLS 时用默认新着页）
// 纪律：单会话、低频（由 workflow 层控制 ≥30 分钟）、只读浏览、绝不自动下单；
//       真实浏览器执行站点自身 JS 通过质询，不做验证码破解/指纹伪造。
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DEFAULT_URLS = [
  'https://www.pokemoncenter-online.com/search/?srule=top-new-product'
];
const OUT = path.join(__dirname, '..', 'out');

// 与主仓库 js/catalog.js parseHtml 策略 A 同构的商品卡提取（DOM 内执行）
const EXTRACT_FN = () => {
  const out = [];
  const seen = {};
  document.querySelectorAll('a[href*="/products/"]').forEach((a) => {
    const card = a.closest('li') || a.closest('[class*="tile"]') || a.closest('[class*="product"]') || a.parentElement;
    const text = card ? card.textContent : (a.textContent || '');
    const img = card && card.querySelector('img');
    const pm = text.match(/([\d,]{1,9})\s*円/);
    const lm = text.match(/お一人様[^0-9]{0,6}(\d{1,2})\s*(?:個|点)/);
    const name = ((img && img.getAttribute('alt')) || a.getAttribute('title') || (a.textContent || '')).trim();
    const key = a.href || name;
    if (!name || seen[key]) return;
    seen[key] = 1;
    out.push({
      jpName: name,
      priceJpy: pm ? parseInt(pm[1].replace(/,/g, ''), 10) : null,
      limit: lm ? parseInt(lm[1], 10) : null,
      image: (img && (img.currentSrc || img.getAttribute('src'))) || '',
      url: a.href
    });
  });
  return out;
};

(async () => {
  const urls = (process.env.URLS || '').split(/\s+/).filter(Boolean);
  const targets = urls.length ? urls : DEFAULT_URLS;
  fs.mkdirSync(OUT, { recursive: true });
  const summary = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    for (let i = 0; i < targets.length; i++) {
      const url = targets[i];
      const slug = 'p' + (i + 1);
      const dir = path.join(OUT, slug);
      fs.mkdirSync(dir, { recursive: true });
      const page = await context.newPage();
      const info = { url, finalUrl: '', title: '', items: 0, challenge: false, error: '' };
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        // JS 质询会重定向到 wr.pokemoncenter-online.com 再跳回：等待并复查两次
        for (let t = 0; t < 2; t++) {
          await page.waitForTimeout(6000);
          info.finalUrl = page.url();
          if (!/wr\.pokemoncenter-online\.com/.test(info.finalUrl)) break;
        }
        info.challenge = /wr\.pokemoncenter-online\.com/.test(page.url());
        info.title = await page.title();
        if (!info.challenge) {
          await page.waitForTimeout(3000); // 等商品网格渲染
          const items = await page.evaluate(EXTRACT_FN);
          info.items = items.length;
          fs.writeFileSync(path.join(dir, 'products.json'), JSON.stringify(items, null, 2), 'utf8');
        }
        info.finalUrl = page.url();
        fs.writeFileSync(path.join(dir, 'page.html'), await page.content(), 'utf8');
        await page.screenshot({ path: path.join(dir, 'screenshot.png'), fullPage: false });
      } catch (e) {
        info.error = e.message;
      }
      summary.push(info);
      console.log(`[${slug}] items=${info.items} challenge=${info.challenge} title=${info.title} final=${info.finalUrl}${info.error ? ' error=' + info.error : ''}`);
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  }
  // M1 判定：抓不到商品即失败，让 workflow 红灯显性化
  if (!summary.some((s) => s.items > 0)) {
    console.error('M1 FAIL: no products extracted from any URL (see artifact page.html/screenshot)');
    process.exit(1);
  }
})();
