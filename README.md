# aoi-pco-monitor

PCO（pokemoncenter-online.com）商品目录抓取与补货监控 —— Aoi-system [F9](https://github.com/zhengdaode/Aoi-system/blob/main/docs/PLAN-F9-CATALOG-IMPORT.md) 的独立执行仓（Playwright 真实浏览器，GitHub Actions 运行）。

## 纪律红线

- 真实浏览器执行站点自身 JS 通过质询；**不做**验证码破解、指纹伪造、反检测对抗。
- 低频：定时 ≥30 分钟间隔；单会话；只读浏览；**绝不自动下单**。
- 若 PCO 升级为验证码级拦截：停止抓取并人工采集（主仓库「粘贴导入」链路永远可用）。

## 结构

- `monitor/grab.js` — 抓取内核：打开 URL → 等质询通过 → 提取商品五要素（图/链接/名称/价格/限购）→ `out/`（products.json + page.html + screenshot）。
- `.github/workflows/grab.yml` — `workflow_dispatch`（inputs.urls），M2 起由主仓库「输入活动链接」经 Edge Function 转发调用。
- `.github/workflows/monitor.yml` — cron 每小时扫新着页（M1 阶段仅抓取留证；M3 起 diff + 通知）。

## 里程碑

- **M1（进行中）**：Actions 环境实抓验证 + 锚点锁定（看 `grab-output` artifact 的 summary.json / page.html）。
- **M2**：按需抓取写库——需 repo secrets：`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`（写 `team_data.data.pcoItems`）；主仓库 Edge Function `catalog-dispatch`（存 GH token）转发 dispatch。
- **M3**：定时新活动监控 diff + 应用内通知（`d.notifications`）。
- **M4**：变动监控（售罄→在售补货最高优先级 / 限购变动）+ history。
- **M5**：QQ 通知（待 Aoi F5 relay v4/NapCat 真机部署后接入私发管理员链路）。

## 维护

- public 仓库 scheduled workflow 60 天无活动会被停用：本仓库每周都有 run；若 Actions 页显示 disabled，手动「Enable workflow」。
- PCO 改版锚点失效：`monitor-output` 里的 page.html/screenshot 即现场，修 `EXTRACT_FN` 选择器。
