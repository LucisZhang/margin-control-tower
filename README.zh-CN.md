# Margin Control Tower

这是一个等待发布审核的私有候选仓库。浏览器工具会追查每周贡献毛利变化的原因：
折扣、退货、成本和履约，然后用合成留出期测试一个公开说明的促销方案。

## 数据

固定 seed 夹具包含 9,360 行，覆盖 52 周、20 个商品、5 个品类、3 个区域和 3 个渠道，
粒度为周 x 商品 x 区域 x 渠道。最后八周是独立的合成留出期。Seed 为
`2026071301`。仓库包含 JSON、CSV、样本 CSV 和 ZSTD Parquet；每一行都是合成数据。

## 验证边界

展示诊断前会运行十项确定性检查，覆盖 schema、唯一粒度、维度、取值范围、会计
恒等式、数据划分和合成来源。注入异常和情景只演示工作流，不证明真实提升、检测
精度、预测质量或因果影响。

## 快速开始

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。已提交的固定夹具保证启动结果一致。

```bash
npm run generate:data
npm run generate:analytics-parquet
npm run typecheck
npm run lint
npm run test:e2e
```

## 发布状态

私有候选，公开源码仍等待 Portfolio 最终授权。
