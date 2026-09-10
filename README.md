# aoi-pco-monitor

PCO（pokemoncenter-online.com）商品目录抓取与补货监控 —— Aoi-system [F9](https://github.com/zhengdaode/Aoi-system/blob/main/docs/PLAN-F9-CATALOG-IMPORT.md) 的抓取内核仓。

## 状态（2026-09-10 终局）

- ✅ **本地全流程打通**：负责人网络直连 + 去自动化（webdriver 抹除/正常 UA/日语环境，已获授权）+ `commit`+轮询导航，实测 40 件商品五要素（pid/名称/价格/图/链接）全中。
- ❌ **Actions 数据中心 IP 被拒**：同一代码 `CHANNEL=chrome` 仍「Restricted access」——PCO 按 **IP 信誉**拒绝数据中心段（Azure/阿里云同属），与浏览器形态无关。
- **结论：自动监控唯一可行载体 = 家庭/办公网络的本地机**（Windows 计划任务方案待负责人确认）。Actions `grab.yml` 保留为复验工具；定时 cron 停用。

## 使用

```bash
npm install && npx playwright install chromium
URLS="https://www.pokemoncenter-online.com/search/?q=9月10日発売&srule=top-new-product" node monitor/grab.js
# 可选：CHANNEL=msedge 用系统 Edge；HEADED=1 有头；GOTO_TIMEOUT=90000 慢网加时
# 产物在 out/：products.json + page.html + screenshot.png
```

## 纪律红线

- 常规**去自动化特征已获负责人批准**（2026-09-10）；**不做**验证码破解、指纹伪装库、自动下单。
- 低频：≥30 分钟间隔；单会话；只读浏览。
- PCO 改版锚点失效：`out/page.html` 即现场，修 `EXTRACT_FN`（主仓库 `js/catalog.js parseHtml` 同步改）。

## 里程碑

- **M1 ✅（2026-09-10）**：抓取内核 + 真实结构锚点 + 本地全流程验证。
- **M2（待负责人确认本机方案）**：写库本地化——`SUPABASE_SERVICE_KEY` 放本地 `.env`（不入仓），直接更新 `team_data.data.pcoItems`。
- **M3/M4**：定时 diff（Windows 计划任务）+ 新活动/补货通知（应用内 `d.notifications`，QQ 待 F5 链路）。
- **M5**：Edge Function `catalog-dispatch`（本机无公网入口，改为「本机轮询任务队列」或主仓库粘贴导入承担）。
