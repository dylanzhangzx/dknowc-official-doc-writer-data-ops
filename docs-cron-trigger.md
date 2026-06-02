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

## 推荐配置

建议每日北京时间 10:05 触发，避免平台统计数据尚未刷新。

如果使用 cron-job.org 或同类外部定时服务，推荐调用 `repository_dispatch`：

- Method: `POST`
- URL: `https://api.github.com/repos/dylanzhangzx/dknowc-official-doc-writer-data-ops/dispatches`
- Headers:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <GitHub Personal Access Token>`
  - `X-GitHub-Api-Version: 2022-11-28`
  - `Content-Type: application/json`
- Body:

```json
{"event_type":"update-dknowc-official-doc-writer-metrics"}
```

GitHub Token 需要具备该仓库的 Actions 触发和内容写入权限；如果只用于这个项目，建议使用细粒度 token，并只授权 `dknowc-official-doc-writer-data-ops` 仓库。
