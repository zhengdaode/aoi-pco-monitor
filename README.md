# aoi-pco-monitor

PCO（pokemoncenter-online.com）商品目录抓取与补货监控 —— Aoi-system [F9](https://github.com/zhengdaode/Aoi-system/blob/main/docs/PLAN-F9-CATALOG-IMPORT.md) 的独立执行仓（Playwright 真实浏览器，GitHub Actions 运行）。

## 纪律红线

- 真实浏览器执行站点自身 JS 通过质询；常规**去自动化特征已获负责人批准**（2026-09-10：webdriver 抹除 / 正常 UA / 日语环境，见 `monitor/grab.js`）；**不做**验证码破解、指纹伪装库、高频抓取、自动下单。
- 低频：定时 ≥30 分钟间隔；单会话；只读浏览。
- 若 PCO 升级为验证码级拦截：停止抓取并人工采集（主仓库「粘贴导入」链路永远可用）。

## 状态：监控挂起（2026-09-10）

M1 实测：自动化浏览器被 PCO 风控一律「Restricted access」——Actions 数据中心 / 本地家庭网络、headless / 有头、Chromium / 系统 Edge（含去自动化特征后）共 7 轮对照全部被拒。**负责人判断其网络环境可能本身不可达 PCO，监控暂停。**

恢复步骤：
1. 用日常浏览器直接打开 PCO 搜索页，确认网络可达性；
2. 可达后本地复验：`URLS="<搜索页>" CHANNEL=msedge node monitor/grab.js`（或 `npm run grab`）；
3. 通过后再 `workflow_dispatch` 复验 Actions（`CHANNEL=chrome`，runner 预装 Chrome）；
4. M1 绿后按主仓库 PLAN §4 推进 M2（需配置 `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` secrets）。

## 结构

- `monitor/grab.js` — 抓取内核：打开 URL → 等质询通过 → 提取商品五要素（图/链接/名称/价格/限购）→ `out/`（products.json + page.html + screenshot）。
- `.github/workflows/grab.yml` — `workflow_dispatch`（inputs.urls），M2 起由主仓库「输入活动链接」经 Edge Function 转发调用。
- `.github/workflows/monitor.yml` — cron 每小时扫新着页（M1 阶段仅抓取留证；M3 起 diff + 通知）。

## 里程碑

- **M1（2026-09-10 验证完成，结论挂起）**：自动化浏览器全形态被 PCO「Restricted access」拒绝（实验矩阵见主仓库 PLAN §9）；去自动化版 grab 已就绪待网络可达性确认后复验。
- **M2**：按需抓取写库——需 repo secrets：`SUPABASE_URL`、`SUPABASE_SERVICE_KEY`（写 `team_data.data.pcoItems`）；主仓库 Edge Function `catalog-dispatch`（存 GH token）转发 dispatch。
- **M3**：定时新活动监控 diff + 应用内通知（`d.notifications`）。
- **M4**：变动监控（售罄→在售补货最高优先级 / 限购变动）+ history。
- **M5**：QQ 通知（待 Aoi F5 relay v4/NapCat 真机部署后接入私发管理员链路）。

## 维护

- public 仓库 scheduled workflow 60 天无活动会被停用：本仓库每周都有 run；若 Actions 页显示 disabled，手动「Enable workflow」。
- PCO 改版锚点失效：`monitor-output` 里的 page.html/screenshot 即现场，修 `EXTRACT_FN` 选择器。
