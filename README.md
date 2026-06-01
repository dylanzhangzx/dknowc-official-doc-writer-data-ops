# 深知写作助手数据运营

这个项目用于每天记录深知写作助手在各分发渠道的公开运营指标。

## 数据表

- `data/clawhub_skill_metrics.csv`: Clawhub skill 下载、安装、收藏、版本和审核状态。
- `data/skillhub_metrics.csv`: SkillHub 下载、安装、收藏、版本和安全审核状态。
- `data/github_metrics.csv`: GitHub 开源仓库 stars、forks、watchers、issues、PR 和 release 状态。
- `data/ops_events.csv`: 关键运营事件、采集失败和暂未自动化渠道记录。

## 更新方式

本地手动更新：

```bash
npm run update:metrics
```

每日定时更新建议沿用外部 cronjob 触发 GitHub Actions 的方式，不使用 GitHub 自带 schedule。

## 说明

Clawhub 的 `downloads_delta` 和 `installs_all_time_delta`、SkillHub 的 `downloads_delta` 和 `installs_delta` 会根据上一条历史记录自动计算。第一次采集时增量为空。

华为、火山等渠道如果没有稳定公开统计接口，先在 `ops_events.csv` 中记录人工观察或后续接入结果。
