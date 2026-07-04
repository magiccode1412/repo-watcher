# GitHub/Gitee/GitLab/CNB 仓库更新监控 - EdgeOne Makers

一个基于 EdgeOne Makers 边缘函数的多平台仓库更新监控工具，支持 GitHub、Gitee、GitLab 和 CNB 仓库的代码提交监控、定时检测和通知功能。

## 预览

![light](/static/readme/light.webp)
![dark](/static/readme/dark.webp)

## 功能特性

- **多平台支持**：支持同时监控 GitHub、Gitee、GitLab 和 CNB 仓库的代码提交
- **多仓库检测**：支持同时监控多个仓库
- **灵活配置**：通过环境变量配置仓库和分支
- **定时检测**：支持外部 Cron 定时触发（替代 Cloudflare Cron Triggers）
- **手动触发**：通过 HTTP 请求手动触发检测
- **缓存优化**：集成 Cache API 减少 API 调用
- **状态持久化**：使用 EdgeOne KV 存储记录上次检测的 commit SHA
- **认证支持**：
  - 支持 GitHub Token 认证，提高 API 限流配额
  - 支持 Gitee Token 认证
  - 支持 GitLab Token 认证（支持 gitlab.com 和自托管 GitLab）
  - 支持 CNB Token 认证
- **通知接口**：支持 MagicPush 通知
- **限流监控**：实时获取 GitHub API 限流状态
- **可视化仪表盘**：内置 Web 仪表盘，直观展示所有监控仓库状态

## 部署说明

### 前置条件

1. 注册 [EdgeOne Makers](https://console.cloud.tencent.com/edgeone/pages) 账号
2. 安装 EdgeOne Makers CLI:
   ```bash
   npm install -g edgeone-cli
   ```

### 步骤一：启用 KV Storage（必须）

1. 登录 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 进入 **"KV Storage"** 页面
3. 点击 **"申请开通"**（免费套餐包含 1GB 存储）
4. 点击 **"创建命名空间"**，输入名称（如 `repo-watcher-kv`）
5. 创建完成后，进入命名空间 → **"关联项目"** 标签页
6. 点击 **"绑定项目"**，选择你的项目，设置 **变量名为 `KV_DEFAULT`**
7. 确认绑定成功

> ⚠️ **关键步骤**：变量名必须是 `KV_DEFAULT`，这是代码中使用的全局变量名称。

### 步骤二：部署项目

```bash
# 1. 克隆或下载本项目
git clone <your-repo-url>
cd repo-watcher

# 2. 登录 EdgeOne（首次使用）
edgeone makers login

# 3. 关联远程项目（如果尚未关联）
edgeone makers link

# 4. 本地开发测试
npm run dev

# 5. 部署到生产环境
npm run deploy
```

### 步骤三：配置环境变量

在 EdgeOne Makers 控制台的 **"环境变量"** 设置中配置以下变量：

#### 通用配置

| 变量名 | 必填 | 说明 | 默认 |
|--------|------|------|------|
| `DEV_MODE` | 否 | 是否启用开发模式（允许手动触发检测） | `false` |
| `NOTIFY_ON_FIRST_CHECK` | 否 | 首次检测是否通知 | `false` |
| `TZ` | 否 | 时区设置 | `UTC+8` |

#### GitHub 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `GITHUB_REPO` | 否 | 监控的 GitHub 仓库列表，支持逗号或换行分隔 | `facebook/react,vuejs/core` |
| `GITHUB_BRANCH` | 否 | 默认分支名称 | `main` |
| `GITHUB_TOKEN` | 否 | Personal Access Token（提高 API 限流配额） | `ghp_xxxxxxxxxxxx` |
| `GITHUB_CACHE_TTL` | 否 | 缓存过期时间（秒） | `300` |

#### Gitee 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `GITEE_REPO` | 否 | 监控的 Gitee 仓库列表 | `owner/repo1,owner/repo2` |
| `GITEE_BRANCH` | 否 | 默认分支名称 | `master` |
| `GITEE_TOKEN` | 否 | 私人令牌 | `your-gitee-token` |
| `GITEE_CACHE_TTL` | 否 | 缓存过期时间（秒） | `300` |

#### GitLab 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `GITLAB_REPO` | 否 | 监控的 GitLab 仓库列表 | `owner/repo1,owner/repo2` |
| `GITLAB_BRANCH` | 否 | 默认分支名称 | `main` |
| `GITLAB_TOKEN` | 否 | Private Access Token | `your-gitlab-token` |
| `GITLAB_API_BASE` | 否 | API 基础地址（自托管 GitLab 时需配置） | `https://gitlab.example.com` |
| `GITLAB_HOST` | 否 | 主机地址 | `gitlab.example.com` |

#### CNB 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `CNB_REPO` | 否 | 监控的 CNB 仓库列表 | `owner/repo1,owner/repo2` |
| `CNB_BRANCH` | 否 | 默认分支名称 | `main` |
| `CNB_TOKEN` | **是** | API 认证 Token | `your-cnb-token` |
| `CNB_API_BASE` | 否 | API 基础地址 | `https://api.cnb.cool` |

#### 通知渠道配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `MAGICPUSH_URL` | 否 | MagicPush API URL | `https://your-magicpush-api.com/notify` |
| `MAGICPUSH_TOKEN` | 否 | MagicPush Bearer Token | `your-magicpush-token` |

## 使用方式

### 方式一：可视化仪表盘（推荐）

直接访问项目的根路径 `/`，即可打开监控仪表盘页面：

```
https://your-project.edgeone.app/
```

**仪表盘功能：**
- 展示所有监控仓库的实时状态
- 统计 GitHub、Gitee、GitLab 和 CNB 仓库数量
- 显示每个仓库的最新 commit SHA
- 自动每 30 秒刷新数据
- 支持手动刷新
- 响应式设计，支持移动端和桌面端

### 方式二：公开 API 接口

**获取仓库列表和状态**（无需鉴权，支持跨域）：

```
GET /api/repos
```

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 3,
    "github": 2,
    "cnb": 1,
    "repos": [
      {
        "platform": "github",
        "name": "facebook/react",
        "branch": "main",
        "key": "facebook/react@main",
        "latestSha": "abc123...",
        "hasUpdate": false
      }
    ]
  }
}
```

### 方式三：HTTP 请求触发（开发模式）

> **注意**：手动触发需要设置环境变量 `DEV_MODE=true`，否则会返回 403。

**请求说明：**
- 使用 `/api/check` 路径进行检测
- 使用 `/api/test-notify` 路径测试通知

#### 检测所有仓库

```
GET /api/check
```

#### 检测指定平台

```
GET /api/check?type=github
GET /api/check?type=cnb
```

#### 检测并发送通知

添加 `notify=true` 参数：

```
GET /api/check?notify=true
GET /api/check?type=cnb&notify=true
```

### 方式四：定时检测（Cron 替代方案）

EdgeOne Edge Functions 不支持原生的 `scheduled()` 事件。替代方案如下：

#### 方案 A：使用外部 Cron 服务

推荐使用以下免费服务定期调用你的检测接口：

1. **cron-job.org** (免费)
   - 创建一个 cron job，URL 设为: `https://your-project.edgeone.app/api/check?notify=true`
   - 设置执行频率（如每 30 分钟）

2. **腾讯云 SCF 定时触发器**
   - 创建一个云函数，通过 HTTP 调用你的接口
   - 配置定时触发规则

#### 方案 B：使用 GitHub Actions

在项目中添加 `.github/workflows/cron-check.yml`:

```yaml
name: Repo Check Cron
on:
  schedule:
    # 每 30 分钟执行一次 (UTC 时间)
    - cron: '*/30 * * * *'
  workflow_dispatch:  # 允许手动触发

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger repo check
        run: |
          curl -X GET "https://your-project.edgeone.app/api/check?notify=true"
```

## 项目结构

```
repo-watcher/
├── edge-functions/
│   └── api/
│       ├── [[...path]].js     # Catch-all: 仪表盘 + favicon
│       ├── repos.js           # GET /api/repos 公开接口
│       ├── check.js           # GET /api/check 手动检测
│       └── test-notify.js     # GET /api/test-notify 通知测试
├── lib/                       # 共享业务库
│   ├── services/              # 服务层 (各平台 API + 通知)
│   │   ├── github.js
│   │   ├── gitee.js
│   │   ├── gitlab.js
│   │   ├── cnb.js
│   │   └── notify.js
│   └── utils/                 # 工具函数
│       ├── kv.js              # KV 存储操作 (全局变量模式)
│       ├── cache.js           # Cache API 封装 (caches.open)
│       ├── parser.js          # 仓库字符串解析
│       └── datetime.js        # 日期格式化
├── public/                    # 静态文件目录
│   ├── dashboard.html         # 仪表盘页面
│   └── favicon.svg            # 网站图标
├── package.json               # 项目配置
└── README.md                  # 项目文档
```

## 从 Cloudflare Workers 迁移

如果你是从 Cloudflare Workers 版本迁移过来，主要变更点：

| 项目 | Cloudflare Workers | EdgeOne Makers |
|------|-------------------|----------------|
| 导出格式 | `export default { fetch, scheduled }` | `export function onRequest(context)` |
| KV 访问 | `env.KV_DEFAULT` | 全局变量 `KV_DEFAULT` |
| Cache API | `caches.default` | `await caches.open('api-cache')` |
| Cron 任务 | `scheduled()` 方法 | 外部 Cron 触发 HTTP 接口 |
| 静态资源 | wrangler 打包 import | `public/` 目录自动托管 |
| CLI 工具 | Wrangler | EdgeOne Makers CLI |

## 注意事项

1. **GitHub API 限流**：未认证请求限制 60 次/小时，建议配置 GitHub Token
2. **Gitee API 限制**：建议配置 Gitee Token 以提高限流配额
3. **GitLab API 限制**：自托管 GitLab 可能有不同的限流策略
4. **CNB API 限制**：CNB Token 必须配置
5. **KV 存储限制**：免费账户有读写次数限制，合理设置检测频率
6. **通知频率**：避免过于频繁的通知造成骚扰
7. **开发模式**：默认关闭手动触发检测，测试完成后建议关闭

## 许可证

MIT License
