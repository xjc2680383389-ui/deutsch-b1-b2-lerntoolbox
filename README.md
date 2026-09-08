# 德语 B1/B2 学习工具箱

中文母语者的德语 B1/B2 本地学习工具：单词 SRS 卡组、语法专题练习、错题本、学习统计、听力精听。
**纯本地运行，零构建、零外部依赖、不联网。**

## 一、技术选型（二选一之说明）

**选择：纯前端 HTML/JS（零构建）+ Node 静态服务 + Node 运行自检。**

理由：

1. **无任何第三方依赖**：界面、图表（自绘 SVG）、语音（浏览器内置合成）都不需要安装包，也不依赖 CDN / 在线 API / 在线字体，满足「无外网假设」。
2. **逻辑与渲染天然可分离**：核心逻辑（SRS 调度、判分、错题、统计、持久化）放在 `js/core/`，全部为不触碰 DOM 的 ES 模块；同一批模块既被浏览器加载，也被 Node 直接 `import` 跑自检，逻辑层只有一份实现，测试即测真实代码。
3. **对比 Python 本地应用**：Python 桌面方案（tkinter 等）无法同时满足「零构建零安装 + 浏览器级排版（竖排解析、卡片动效）+ 语音朗读」；且 Python GUI 的自动化自检要复杂得多。Node 在本机已具备，用于跑自检与静态服务，无需任何 `npm install`。
4. **一键启动成本低**：`start.bat` 优先用 Node 起本地服务（ES 模块需要 http 协议），缺失时自动退回 Python 内置服务器；两者都按常见安装位置逐一探测，即使没写进系统 PATH 也能启动。

## 二、持久化选型（三选一之说明）

**选择：localStorage（键名 `dwt.db.v1`，结构版本号 v1）。**

理由：零配置、随浏览器自动持久化、同步 API 简单可靠；不选本地 JSON 文件是因为浏览器出于安全不能直接写盘，需要额外后端服务；不选 sqlite 是因为浏览器端无原生支持，需引入原生模块（违背零构建）。
为防数据丢失，「数据管理」页提供**导出 / 导入备份文本**功能；数据损坏时自动回退为空库而不崩溃。

### 数据结构（钉死，版本 1）

```text
dwt.db.v1 = {
  version: 1,
  profile:  { createdAt },                     // 首次使用时间
  settings: { dailyGoal, timeOffsetMs, ttsRate, lastDeckId, lastTopicId, demoSeeded },
  states:   { [卡片ID]: { id, ef, interval, reps, lapses, due, lastReviewed, lastRating, totalReviews, history } },
  customCards: { [卡片ID]: { id, deckId, term, pos, zh, example, exZh, level } },
  userDecks:  [ { id, name, level } ],
  events:     [ { ts, type: 'card'|'quiz'|'listening', deck?, topic?, qtype?, correct, rating? } ],
  mistakes:   [ { id, source, module, refId, topicId, stem, userAnswer, correctAnswer,
                  explanation, ts, wrongCount, mastered, masteredTs, lastReviewTs, reviewCount } ],
  quizStats:      { [专题ID]: { attempts, correct } },
  listeningStats: { [句子ID]: { plays, best } },
}
```

## 三、目录结构与文件职责

```text
deutsch-toolbox/
├── index.html                     页面骨架：导航与七个页面容器
├── server.js                      零依赖 Node 静态服务器（端口被占用时自动顺延）
├── start.bat                      一键启动（GBK+CRLF；自动探测本机 Node/Python，不依赖 PATH）
├── selftest.bat                   一键运行全部自检（GBK+CRLF；同样的运行环境探测）
├── package.json                   声明 ESM 模式与启动/自检命令
├── README.md                      本说明文件
├── css/
│   └── style.css                  全站样式（Microsoft YaHei UI、竖排解析、图表容器）
├── js/
│   ├── core/                      ★纯逻辑层：不依赖 DOM/浏览器，可被 Node 直接运行
│   │   ├── random.js              种子化随机数（mulberry32）、洗牌、抽样
│   │   ├── srs.js                 SM-2 间隔重复调度（时间注入，可虚拟推进 100 天）
│   │   ├── quiz.js                判分（四选一/填空）、答案归一、抽题与整卷评分
│   │   ├── mistakes.js            错题收集去重、筛选、掌握标记、重练出题
│   │   ├── stats.js               每日量/正确率/到期分布/连续天数等统计聚合
│   │   ├── store.js               持久化：数据结构钉死、清洗兜底、内存/浏览器后端
│   │   └── listening.js           听写相似度（LCS）、分级评语、逐词对照
│   ├── data/                      ★内容数据层：纯数据 + 纯解析函数
│   │   ├── vocab_parse.js         词条文本解析与卡片结构生成
│   │   ├── vocab_b1_1.js … _6.js  B1 词库 6 段（共 420 词）
│   │   ├── vocab_b2_1.js … _6.js  B2 词库 6 段（共 420 词）
│   │   ├── grammar_b1_passiv.js   B1 专题：被动态（21 题）
│   │   ├── grammar_b1_relativ.js  B1 专题：关系代词（21 题）
│   │   ├── grammar_b1_praep.js    B1 专题：介词搭配（21 题）
│   │   ├── grammar_b1_nebensatz.js B1 专题：从句连接词（21 题）
│   │   ├── grammar_b1_trennbar.js B1 专题：可分动词与动词前缀（21 题）
│   │   ├── grammar_b2_konj2.js    B2 专题：虚拟式 II（21 题）
│   │   ├── grammar_b2_partizip.js B2 专题：分词定语（21 题）
│   │   ├── grammar_b2_nominal.js  B2 专题：名词化与功能动词结构（21 题）
│   │   ├── grammar_b2_passiversatz.js B2 专题：被动态替代与情态动词主观用法（21 题）
│   │   ├── listening.js           听力句库 36 句（B1/B2 各 18，含词汇点与语法解析）
│   │   └── index.js               数据聚合：卡组、专题、句库、卡片合并
│   ├── selftest/                  ★自检层：固定输入 → 断言输出
│   │   ├── harness.js             断言小框架（通过/失败、差异信息）
│   │   ├── test_random.js         随机数：种子复现、洗牌不变量、抽样边界
│   │   ├── test_srs.js            SRS：间隔阶梯、「不会」重置、注入时钟推进 100 天
│   │   ├── test_quiz.js           判分与归一、选项打乱后答案键仍正确、整卷统计
│   │   ├── test_mistakes.js       收集去重、筛选、掌握联动、重练种子化
│   │   ├── test_stats.js          聚合与事件流水一致、跨月边界、100 天模拟
│   │   ├── test_store.js          结构钉死、损坏兜底、导入导出、流水上限
│   │   ├── test_listening.js      相似度、自检分级、逐词对照
│   │   ├── test_data.js           词库≥400/级、无重复、题库答案键与解析合法性
│   │   └── run_all.js             自检总入口（逐项输出通过/失败，非零退出码）
│   └── ui/                        ★界面层：唯一允许操作 DOM 的目录
│       ├── app.js                 哈希路由与页面挂载（?demo=1 触发演示数据）
│       ├── state.js               粘合层：持久化后端、虚拟时钟、学习事件记录
│       ├── util.js                DOM 工具、转义、提示条、浏览器语音合成
│       ├── charts.js              纯 SVG 柱状图 / 折线图（无图表库）
│       ├── demo.js                演示数据生成（仅 ?demo=1，截图与冒烟用）
│       ├── page_home.js           首页：今日概览、目标进度、卡组概览、到期分布
│       ├── page_cards.js          背卡：翻面、三档评分、间隔预览、进度条
│       ├── page_grammar.js        语法练习：专题列表、逐题判分、结束报告
│       ├── page_listening.js      听力精听：左原文、右竖排解析、播放、听写自检
│       ├── page_mistakes.js       错题本：筛选、重练、掌握标记
│       ├── page_stats.js          统计：学习量柱图、正确率折线、到期分布、明细
│       └── page_data.js           数据管理：自建卡组/词条、目标、时间机器、备份
└── screenshots/                   界面截图（首页/背卡/语法练习/听力/错题本/统计）
```

## 四、快速开始

1. 双击 `start.bat`（自动选择 Node 或 Python 启动本地服务并打开浏览器）。
2. 也可手动：`node server.js` 后访问 `http://127.0.0.1:8123/index.html`。
3. 运行自检：双击 `selftest.bat`，或命令行 `node js/selftest/run_all.js`。

### 运行环境探测（不依赖 PATH）

很多机器上 Node.js / Python 装好了但**没有写进系统 PATH**，此时用 `where node` 会扑空、脚本一闪而过。
`start.bat` / `selftest.bat` 因此按以下顺序逐个探测，命中即用：

| 顺序 | 运行时 | 探测位置 |
| --- | --- | --- |
| 1 | Node.js | 系统 PATH → `%USERPROFILE%\nodejs\node.exe` → `%USERPROFILE%\nodejs\*\node.exe` → `%LOCALAPPDATA%\Programs\nodejs\*\node.exe` → `C:\Program Files\nodejs\node.exe` → `C:\Program Files (x86)\nodejs\node.exe` |
| 2 | Python | 系统 PATH（`py -3` / `python`）→ `%LOCALAPPDATA%\Programs\Python\Python3*\python.exe` → `C:\Python312\python.exe` → `C:\Python313\python.exe` |

若都未命中，脚本会**暂停并列出已检查的位置**，不会静默退出。

### 启动失败排查

| 现象 | 原因与处理 |
| --- | --- |
| 窗口一闪而过 | 旧版脚本只查 PATH。现版本已改为多位置探测并在退出前 `pause`；若仍闪退，请右键 `start.bat` → 用记事本打开确认内容是否为新版 |
| 提示端口被占用 | 服务会自动顺延到 8124、8125……并打印实际地址；如需固定端口，先关闭占用程序 |
| 提示未找到运行环境 | 按上面表格把 Node.js 装到默认路径，或在安装时勾选「添加到 PATH」 |
| 浏览器没自动打开 | 手动访问窗口里打印的地址（默认 http://127.0.0.1:8123/index.html ） |

## 五、自检（selftest）说明

- 覆盖 8 个模块共 **84 项断言**，全部使用**固定种子与注入的虚拟时钟**，无需真实等待即可模拟跨天复习（含连续推进 100 天的调度一致性）。
- 数据自检校验：B1/B2 各 ≥400 词、词条五要素齐全、全库无重复词条；题库题号唯一、四选一恰四选项且答案键有效、解析非空；听力句库 ≥30 且含解析。
- 退出码：全绿为 0，存在失败为 1（可用于流水线）。

## 六、人工冒烟指引

1. **背卡**：进入「背卡」→ 开始本轮 → 空格翻面 → 分别试「不会 / 模糊 / 会」，按钮上会显示下次间隔（本轮再来 / 3 天 / 1 天→6 天）。
2. **跨天复习模拟（无需等待）**：进入「数据管理」→ 时间机器推进 1～7 天 → 回「背卡」，到期卡片立即进入队列；「学习统计」的到期分布同步变化。
3. **练习判分**：进入「语法练习」→ 任选专题 → 答错时立即显示正确答案与解析。
4. **错题收集 → 重练**：答错几题、背卡评几个「不会」→ 打开「错题本」可见对应条目（含你当时的错误答案）→「重练未掌握」→ 自评「已经会了」后条目标记掌握。
5. **统计一致性**：完成任意学习后打开「学习统计」，柱状图 / 折线图 / 汇总数字与刚才的操作一致。
6. **演示数据**：地址栏加 `?demo=1`（如 `index.html?demo=1#/stats`）可写入一次演示学习记录，用于快速查看全部界面效果。

## 七、其他说明

- **听力语音**：使用浏览器内置语音合成（德语 de-DE），支持正常 / 慢速两档与语速滑块。若系统未安装德语语音包，页面会给出提示，可对照原文自行朗读。
- **界面**：全中文，字体统一 Microsoft YaHei UI，无占位符残留；「数据管理」页内仅出现德语学习内容与必要的键名等标识符。
- **隐私**：所有数据仅保存在本机浏览器中，程序不发起任何网络请求。
