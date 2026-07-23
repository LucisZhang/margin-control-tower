[English](README.md) | [简体中文](README.zh-CN.md)

# Margin Control Tower

[![CI](https://github.com/LucisZhang/margin-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/LucisZhang/margin-control-tower/actions/workflows/ci.yml)

**一个完全在浏览器中分析真实电商数据集的每周贡献毛利工作台——包含流水线、哈希和实测评估，使每个数字都能仅凭本仓库核验。**

决策问题是：一位品类经理观察到每周贡献毛利发生变化，必须在采取行动前回答三个问题——毛利在*哪里*出了问题（品类、地区、支付渠道），*哪个*成本驱动因素变动了（折扣、退货、COGS、履约），以及*一个有界的促销调整是否值得测试*？大多数仪表板只给出一个 KPI，却隐藏了产生它的粒度、公式和假设。而在这里，这些都是一等对象：数据契约、会计恒等式、留出集边界和情景假设全部可在 UI 中检查，且契约检查失败会阻断决策输出，而不是装饰它。

一切都从受跟踪的文件运行：一个确定性的离线流水线，处理
[Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
（六张关系表中的 99,441 个订单）、由其派生的浏览器安全 Parquet 聚合、两份与该制品哈希关联的实测评估报告，以及消费这些数据的 Next.js + DuckDB-WASM 工作台。一个受治理的固定种子合成夹具仍可作为显式的回退与测试模式使用。

![Margin Control Tower workbench](docs/screenshots/margin-desktop.png)

*由 Playwright 工作流测试（`tests/e2e/workflow.spec.ts`）生成的整页截图，展示默认的经哈希校验 Olist 路径及其紧凑首屏预览。*

## 本项目展示的技能

- **数据工程**——一个哈希锁定、确定性的 Python 流水线
  （`pipelines/olist-margin/build.py`）协调六张关系表（订单、订单项、客户、产品、支付、评论），并对多支付订单、多评论订单、缺失品类和支付差异设有显式规则。它在任何来源或契约违规时失败关闭（fail closed），并将溯源信息——来源 URL、许可证、检索日期、原始哈希、转换版本、代理边界——嵌入 Parquet 元数据本身。
- **数据分析**——一个通过确定性回放评估的 STL + 稳健 z 分数检测器（在六个标注扰动上召回率 1.000、精确率 0.316），以及一个带品类/地区/渠道固定效应的 HC3 双对数弹性回归，仅在分析窗口上拟合，并在八周留出集上评分。接近零的系数和较弱的 75.9% 留出集 MAPE 均按实测如实报告，而非修饰成更好的故事。
- **分析应用工程**——一条浏览器内 DuckDB-WASM 查询路径，在渲染任何内容之前先验证所提供 Parquet 的 SHA-256；一个哈希绑定的紧凑预览用于快速首屏绘制，并就位升级为完整物化；十个在 UI 中呈现的失败关闭数据契约；以及在制品缺失或无效时的受治理合成回退——这正是 AI 应用评估工具所依赖的"先验证再信任、失败关闭"的纪律。

## 快速开始——真实数据路径

```bash
npm ci
npm run dev        # http://localhost:3000 — 默认加载已提交的 Olist 制品
```

工作台在浏览器中对 `olist-margin.parquet` 进行哈希验证，渲染一个哈希绑定的紧凑预览，然后通过 DuckDB-WASM 物化全部 15,809 行——仅同源请求，无外部服务。

最快验证，无需 Python：

```bash
shasum -a 256 public/case-studies/margin-control-tower/olist-margin.parquet
# 6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb
node scripts/generate-olist-margin-preview.mjs --check   # 从这些精确字节重新派生已提交的浏览器预览
```

完整流水线验证与重建（Python 3.12；`--download` 获取并哈希校验六张原始表，`--verify-only` 重新验证每个已提交的输出）：

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipelines/olist-margin/requirements.txt
.venv/bin/python pipelines/olist-margin/build.py --download
.venv/bin/python pipelines/olist-margin/build.py --verify-only
```

`npm run verify:real-data` 将流水线验证与预览检查打包在一起。合成模式的可选夹具 QA：`npm run generate:data`、
`npm run generate:analytics-parquet` 和 `npm run test:e2e`（针对夹具的 Playwright 工作流测试；写入 `docs/screenshots/`）。CI 在每次推送时运行 `typecheck`、`lint` 和 `build`。

## 从原始关系表到浏览器安全的证据

1. **锁定。** 六张原始 CSV（总计 64,735,796 字节）在任何操作运行之前，先根据
   `pipelines/olist-margin/source-lock.json` 中的字节数和 SHA-256 哈希进行验证。Kaggle 是该数据集的权威来源；由于其无需认证的下载端点不可用，字节经由一个固定的、不可变的公共镜像传输，该镜像的文件大小与 Kaggle 的公开清单一致。原始表仅存在于一个被忽略的缓存中——不提交任何原始行，且 CLI 拒绝仓库内其他任何位置的原始输入。
2. **协调。** 订单项按文档化规则与订单、客户、产品、支付和评论连接：2,961 个多支付订单归并到金额最大的渠道，
   547 个多评论订单归并到最低评分，缺失品类保留为显式的
   `unknown`，并审计支付与订单项加运费之间的差异。
3. **派生毛利。** 毛收入使用仅基于历史的扩展品类中位数参考价（首次出现的品类周回退到当前价格、代理折扣为零）；退货和 COGS 是已披露的代理；履约是观测到的运费。毛 → 净 → 贡献的会计恒等式必须在每一行上成立。
4. **聚合并剥离身份。** 只有在协调之后，数据才折叠为周 × 产品品类 × 映射地区 × 主导支付渠道：95 个观测周（2016-08-29 → 2018-09-03）共 15,809 个单元格，最后八周留出（14,313 分析行 / 1,496 留出行）。输出模式不携带任何客户、订单或上游产品标识符。
5. **验证。** `--verify-only` 在粒度唯一性、边界、恒等式、精确留出集、完整周一日历、嵌入式溯源元数据、95 MiB 浏览器预算，以及从已提交 Parquet 字节精确重建两份评估报告等方面失败关闭。

结果是一个 672,410 字节的 ZSTD Parquet 制品（SHA-256 `6921b7ed…5722fb`）。在相同固定环境下的第二次构建精确复现了该哈希。

## 交互式工作台的功能

- **毛利桥**：毛 → 折扣 → 退货 → 净 → COGS → 履约 → 贡献，
  与所选周、品类、地区和渠道联动。
- **品类 × 地区热力图和每周趋势**，八周留出集在视觉上与分析窗口分隔，而非混入其中。
- **附带打印假设的促销情景**——促销深度每变动一个百分点，件数同向变动 0.8%，退货率和单位经济性固定。UI 将其标注为假设而非预测，并搭配一个留出比较周。
- **检测与弹性面板**，仅在浏览器确认每份报告的 `artifact_sha256` 与其刚验证的 Parquet 匹配后才渲染实测报告。
- **控制栏中的十项契约检查**——模式、唯一粒度、非空键、边界、
  三个会计恒等式、精确留出集、溯源。任何失败都会阻断决策输出。

## 实测结果（及如何解读）

| 结果 | 数值 | 解读 |
| --- | --- | --- |
| 回放检测召回率 / 精确率 | 1.000 / 0.316 | 在完整 106 个周一的日历（11 个空周补零）上运行的 STL（13 周，稳健）+ MAD z ≥ 3.5。标签是六个确定性回放扰动——这是对检测器的刻画，而非经核实的真实异常。 |
| 价格–件数关联 | +0.040（95% CI 0.026–0.053） | 带固定效应的 HC3 双对数 OLS，仅在分析行上拟合。关联性、接近零，如实报告。 |
| 留出集 MAPE | 75.9% | 在较晚的八个观测周上的件数预测误差——披露为拟合较弱。 |

两份报告都嵌入制品 SHA-256，并在 `--verify-only` 期间从已提交的
Parquet 精确重现，因此屏幕上显示的数字就是流水线实测的数字。

## 架构

```text
Olist 原始 CSV  （Kaggle 为权威来源；哈希锁定，从不提交）
      │   pipelines/olist-margin/build.py — 确定性、失败关闭
      ▼
olist-margin.parquet  +  检测 / 弹性 / 方法报告（哈希关联）
      │   scripts/generate-olist-margin-preview.mjs — 748 行紧凑预览，
      │   绑定到制品哈希并对照精确字节检查
      ▼
Next.js 工作台（静态，仅同源）
  ├─ 渲染前对所提供 Parquet 进行浏览器端 SHA-256 检查
  ├─ 先紧凑预览 → 再完整 DuckDB-WASM 物化
  │    （固定 @duckdb/duckdb-wasm 1.32.0，内置签名的 Parquet 扩展）
  ├─ 十个失败关闭契约检查；失败阻断决策输出
  └─ 当制品缺失/无效时以受治理合成夹具作为回退
```

## 仓库地图

```text
margin-control-tower/
├── pipelines/olist-margin/
│   ├── build.py                    # 原始 → 制品流水线 + 失败关闭验证
│   ├── source-lock.json            # 六张原始表的字节数 + SHA-256
│   ├── PROVENANCE.md               # 权威来源、许可证、传输、输出身份
│   └── README.md                   # 方法论与复现细节
├── public/case-studies/margin-control-tower/
│   ├── olist-margin.parquet        # 派生的真实数据制品（672 KB，ZSTD）
│   ├── detection-report.json       # 实测回放评估
│   ├── elasticity-report.json      # 实测留出集评估
│   ├── methods-evidence.json       # 绑定到制品哈希的双语方法文本
│   ├── data-contract.json          # 夹具粒度 + 检查（metric-registry.json：公式）
│   └── synthetic-margin-data.json  # 固定种子夹具（回退 / 测试模式）
├── src/components/analytics/MarginControlTower.tsx   # 工作台
├── src/lib/duckdb.ts               # 同源 DuckDB-WASM 加载器 + SHA-256 门控
├── src/lib/olist-margin-compact.ts # 哈希绑定的紧凑预览解码器
├── src/lib/margin-report-validation.ts  # 报告契约（失败关闭）
├── scripts/sync-duckdb-browser-assets.mjs  # 固定运行时资产 + 内置扩展
├── public/duckdb/                  # 内置 Parquet 扩展 + 溯源说明
└── tests/e2e/workflow.spec.ts      # Playwright 工作流测试（夹具模式）
```

## 合成夹具（回退与测试模式）

种子 `2026071301` 确定性地生成 52 周内 9,360 行，粒度为
周 × 产品 × 地区 × 渠道，带有一个已标注的注入异常和相同的十项检查契约。它的存在是为了在真实制品缺失时工作流仍可演示和测试，并能针对已知标签展示异常诊断 UX。工作台始终声明当前激活的数据源；合成数字从不伪装成 Olist 测量值。

## 局限性与数据权利

- **来源与许可证。** Kaggle 的 Olist 数据集是权威来源，许可为
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。仅提交派生的聚合数据；署名和相同方式共享义务随派生制品传递，下游复用必须遵守上游许可证。
- **代理。** COGS（观测订单项价格的 60%）、退货（订单状态 / 评论评分）
  和参考价折扣均为已披露的代理，而非经审计的公司经济数据。
- **弹性是关联性的**，而非因果性的；不作任何提升（lift）声明。
- **检测指标刻画的是检测器在确定性回放标签上的表现**；不声称任何经人工核实的真实异常。
- 这是一个作品集案例研究，不是生产系统；不作任何商业影响声明。首次构建于 2026-07，无发布节奏或支持承诺。
- 不授予任何开源许可证；在作出许可决定之前保留所有权利。
