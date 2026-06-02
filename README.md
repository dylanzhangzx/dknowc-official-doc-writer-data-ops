# 深知写作助手数据运营

这个项目用于每天记录深知写作助手在各分发渠道的公开运营指标。

## 数据表

- `data/clawhub_skill_metrics.csv`: Clawhub skill 下载、安装、收藏、版本和审核状态。
- `data/skillhub_metrics.csv`: SkillHub 下载、安装、收藏、版本和安全审核状态。
- `data/github_metrics.csv`: GitHub 开源仓库 stars、forks、watchers、issues、PR 和 release 状态。

## 更新方式

本地手动更新：

```bash
npm run update:metrics
```

每日定时更新使用外部 cronjob 触发 GitHub Actions，不使用 GitHub 自带 `schedule`；也可以通过 `workflow_dispatch` 手动触发。

## 说明

数据表只记录各平台接口可直接获取的字段，以及本次采集日期；不在基础采集表中计算每日增量或写入人工备注。

华为、火山等渠道如果没有稳定公开统计接口，暂不纳入自动采集表。
