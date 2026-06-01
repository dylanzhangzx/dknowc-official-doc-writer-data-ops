import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const execFileAsync = promisify(execFile);

const TARGETS = {
  clawhubSkill: "dknowc-official-doc-writer",
  clawhubApi: "https://clawhub.ai/api/v1/skills/dknowc-official-doc-writer",
  skillhubSkill: "dknowc-official-doc-writer-skillhub",
  skillhubApi: "https://api.skillhub.cn/api/v1/skills/dknowc-official-doc-writer-skillhub",
  githubRepo: "dylanzhangzx/dknowc-official-doc-writer",
};

function formatShanghaiDate(date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const today = formatShanghaiDate(new Date());

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => item !== ""));
}

async function readCsv(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!existsSync(filePath)) return [];
  return parseCsv(await readFile(filePath, "utf8"));
}

async function upsertCsv(fileName, rowObject) {
  const filePath = path.join(DATA_DIR, fileName);
  const rows = await readCsv(fileName);
  if (rows.length === 0) {
    throw new Error(`CSV file is missing header: ${fileName}`);
  }

  const header = rows[0];
  const dataRows = rows.slice(1).filter((row) => row[0] !== rowObject.date);
  const row = header.map((column) => csvEscape(rowObject[column]));
  const output = [header.join(","), ...dataRows.map((items) => items.map(csvEscape).join(",")), row.join(",")].join("\n") + "\n";
  await writeFile(filePath, output, "utf8");
}

async function fetchJson(url, options = {}) {
  const headers = {
    "user-agent": "dknowc-official-doc-writer-ops/1.0",
    accept: "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`${url} -> HTTP ${response.status}`);
    }
    return response.json();
  } catch (fetchError) {
    const curlArgs = ["-sS", "-L", "--fail", "-H", "user-agent: dknowc-official-doc-writer-ops/1.0", "-H", "accept: application/json"];
    if (headers.authorization) {
      curlArgs.push("-H", `authorization: ${headers.authorization}`);
    }
    curlArgs.push(url);

    try {
      const { stdout } = await execFileAsync("curl", curlArgs, { maxBuffer: 1024 * 1024 * 10 });
      return JSON.parse(stdout);
    } catch (curlError) {
      throw new Error(`${url} -> fetch failed; curl fallback failed: ${curlError.message}`);
    }
  }
}

async function fetchClawhubSkill() {
  const data = await fetchJson(TARGETS.clawhubApi);
  const skill = data.skill ?? {};
  const latestVersion = data.latestVersion ?? {};
  const moderation = data.moderation ?? {};
  const stats = skill.stats ?? {};

  return {
    slug: skill.slug ?? TARGETS.clawhubSkill,
    display_name: skill.displayName ?? "",
    version: latestVersion.version ?? skill.tags?.latest ?? "",
    downloads: stats.downloads ?? "",
    installs_all_time: stats.installsAllTime ?? "",
    installs_current: stats.installsCurrent ?? "",
    stars: stats.stars ?? "",
    comments: stats.comments ?? "",
    versions: stats.versions ?? "",
    moderation_status: moderation.status ?? "",
    moderation_reason: moderation.reason ?? "",
    moderation_updated_at: moderation.updatedAt ? new Date(moderation.updatedAt).toISOString() : "",
    owner_handle: data.owner?.handle ?? "",
    updated_at: skill.updatedAt ? new Date(skill.updatedAt).toISOString() : "",
  };
}

async function fetchSkillhubSkill() {
  const data = await fetchJson(TARGETS.skillhubApi);
  const skill = data.skill ?? {};
  const latestVersion = data.latestVersion ?? {};
  const stats = skill.stats ?? {};
  const keen = data.securityReports?.keen ?? {};
  const sanbu = data.securityReports?.sanbu ?? {};

  return {
    slug: skill.slug ?? TARGETS.skillhubSkill,
    display_name: skill.displayName ?? "",
    version: latestVersion.version ?? skill.tags?.latest ?? "",
    tag_latest: skill.tags?.latest ?? "",
    downloads: stats.downloads ?? "",
    installs: stats.installs ?? "",
    stars: stats.stars ?? "",
    comments: stats.comments ?? "",
    versions: stats.versions ?? "",
    keen_status: keen.status ?? "",
    sanbu_status: sanbu.status ?? "",
    keen_status_text: keen.statusText ?? "",
    sanbu_status_text: sanbu.statusText ?? "",
    owner_handle: data.owner?.handle ?? "",
    updated_at: skill.updatedAt ? new Date(skill.updatedAt).toISOString() : "",
    latest_created_at: latestVersion.createdAt ? new Date(latestVersion.createdAt).toISOString() : "",
  };
}

async function fetchGitHub() {
  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const repoUrl = `https://api.github.com/repos/${TARGETS.githubRepo}`;
  const issueSearch = `https://api.github.com/search/issues?q=repo:${TARGETS.githubRepo}+is:issue+is:open`;
  const prSearch = `https://api.github.com/search/issues?q=repo:${TARGETS.githubRepo}+is:pr+is:open`;
  const releaseUrl = `https://api.github.com/repos/${TARGETS.githubRepo}/releases/latest`;

  const [repo, issues, prs] = await Promise.all([
    fetchJson(repoUrl, { headers }),
    fetchJson(issueSearch, { headers }),
    fetchJson(prSearch, { headers }),
  ]);

  let latestRelease = "";
  try {
    const release = await fetchJson(releaseUrl, { headers });
    latestRelease = release.tag_name ?? "";
  } catch (error) {
    latestRelease = "none";
  }

  return {
    repo: TARGETS.githubRepo,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.subscribers_count ?? repo.watchers_count ?? "",
    open_issues: issues.total_count,
    open_prs: prs.total_count,
    latest_release: latestRelease,
    default_branch: repo.default_branch,
    visibility: repo.visibility,
    pushed_at: repo.pushed_at,
  };
}

async function main() {
  const failures = [];
  const results = {};

  for (const [key, fetcher] of Object.entries({
    clawhub: fetchClawhubSkill,
    skillhub: fetchSkillhubSkill,
    github: fetchGitHub,
  })) {
    try {
      results[key] = await fetcher();
    } catch (error) {
      failures.push(`${key}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }

  await upsertCsv("clawhub_skill_metrics.csv", { date: today, ...results.clawhub });
  await upsertCsv("skillhub_metrics.csv", { date: today, ...results.skillhub });
  await upsertCsv("github_metrics.csv", { date: today, ...results.github });

  console.log("Updated skill metrics for", today);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
