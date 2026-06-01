# 外部 cronjob 触发说明

本项目的 GitHub Actions 接受外部触发。

## workflow_dispatch

```bash
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/{owner}/{repo}/actions/workflows/update-metrics.yml/dispatches \
  -d '{"ref":"main"}'
```

## repository_dispatch

```bash
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/{owner}/{repo}/dispatches \
  -d '{"event_type":"update-dknowc-official-doc-writer-metrics"}'
```

建议每日北京时间 10:00 后触发，避免平台统计数据尚未刷新。
