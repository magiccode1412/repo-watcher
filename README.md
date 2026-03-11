# GitHub/Gitee/GitLab/CNB 仓库更新监控 - Cloudflare Worker

一个基于 Cloudflare Worker 的多平台仓库更新监控工具，支持 GitHub、Gitee、GitLab 和 CNB 仓库的代码提交监控、定时检测和通知功能。

## 预览

[点此预览](https://repo-watcher.nxsg.workers.dev/)

![light](/static/readme/light.webp)
![dark](/static/readme/dark.webp)

## 功能特性

- **多平台支持**：支持同时监控 GitHub、Gitee、GitLab 和 CNB 仓库的代码提交
- **多仓库检测**：支持同时监控多个仓库
- **灵活配置**：通过环境变量配置仓库和分支
- **定时检测**：支持 Cloudflare Cron Triggers 定时触发
- **手动触发**：通过 HTTP 请求手动触发检测
- **缓存优化**：集成 Cloudflare Cache API 减少 API 调用
- **状态持久化**：使用 KV 存储记录上次检测的 commit SHA
- **认证支持**：
  - 支持 GitHub Token 认证，提高 API 限流配额
  - 支持 Gitee Token 认证
  - 支持 GitLab Token 认证（支持 gitlab.com 和自托管 GitLab）
  - 支持 CNB Token 认证
- **通知接口**：支持 Telegram、企业微信、PushPlus 和 MagicPush 通知
- **限流监控**：实时获取 GitHub API 限流状态
- **可视化仪表盘**：内置 Web 仪表盘，直观展示所有监控仓库状态

## 部署说明

⚠️⚠️部署前先看这里⚠️⚠️

在`构建命令`处填写：`npm install --save-dev wrangler@4`,这是必须的，否则会报错，因为构建默认使用的是wrangler@3，不支持自动创建kv命名空间

点此👉👉 [![Deploy to Cloudflare Workers](static/readme/cloudflare.svg)](https://deploy.workers.cloudflare.com/?url=https://github.com/magiccode1412/repo-watcher) 👈👈

### 环境变量配置

在 Cloudflare Worker 的设置中配置以下环境变量：

#### 通用配置

| 变量名 | 必填 | 说明 | 默认 |
|--------|------|------|------|
| `DEV_MODE` | 否 | 是否启用开发模式 | `true` |
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
| `GITEE_REPO` | 否 | 监控的 Gitee 仓库列表，支持逗号或换行分隔 | `owner/repo1,owner/repo2` |
| `GITEE_BRANCH` | 否 | 默认分支名称 | `master` |
| `GITEE_TOKEN` | 否 | 私人令牌（提高 API 限流配额） | `your-gitee-token` |
| `GITEE_CACHE_TTL` | 否 | 缓存过期时间（秒） | `300` |

#### GitLab 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `GITLAB_REPO` | 否 | 监控的 GitLab 仓库列表，支持逗号或换行分隔 | `owner/repo1,owner/repo2` |
| `GITLAB_BRANCH` | 否 | 默认分支名称 | `main` |
| `GITLAB_TOKEN` | 否 | Private Access Token（提高 API 限流配额） | `your-gitlab-token` |
| `GITLAB_API_BASE` | 否 | API 基础地址（自托管 GitLab 时需配置） | `https://gitlab.example.com` |
| `GITLAB_HOST` | 否 | 主机地址（用于生成仓库链接，默认 gitlab.com） | `gitlab.example.com` |
| `GITLAB_CACHE_TTL` | 否 | 缓存过期时间（秒） | `300` |

#### CNB 平台配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `CNB_REPO` | 否 | 监控的 CNB 仓库列表，支持逗号或换行分隔 | `owner/repo1,owner/repo2` |
| `CNB_BRANCH` | 否 | 默认分支名称 | `main` |
| `CNB_TOKEN` | CNB 监控必填 | API 认证 Token | `your-cnb-token` |
| `CNB_API_BASE` | 否 | API 基础地址 | `https://api.cnb.cool` |
| `CNB_CACHE_TTL` | 否 | 缓存过期时间（秒） | `300` |

#### 通知渠道配置

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `TELEGRAM_BOT_TOKEN` | 否 | Telegram Bot Token（启用 Telegram 通知时必填） | `123456:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | 否 | Telegram 接收消息的 Chat ID（启用 Telegram 通知时必填） | `123456789` |
| `WECOM_WEBHOOK_URL` | 否 | 企业微信机器人 Webhook URL（启用企业微信通知时必填） | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx` |
| `PUSHPLUS_TOKEN` | 否 | PushPlus Token（启用 PushPlus 通知时必填） | `your-pushplus-token` |
| `PUSHPLUS_TOPIC` | 否 | PushPlus 群组编码，不填则发给自己 | `your-topic-code` |
| `PUSHPLUS_CHANNEL` | 否 | 发送渠道：wechat/mp/mail/sms，默认 wechat | `wechat` |
| `MAGICPUSH_URL` | 否 | MagicPush API URL（启用 MagicPush 通知时必填） | `https://your-magicpush-api.com/notify` |
| `MAGICPUSH_TOKEN` | 否 | MagicPush Bearer Token（启用 MagicPush 通知时必填） | `your-magicpush-token` |
| `MAGICPUSH_TYPE` | 否 | MagicPush 通知类型 | `text` |

## 使用方式

### 方式一：可视化仪表盘（推荐）

直接访问 Worker 的根路径 `/`，即可打开监控仪表盘页面：

```
https://your-worker.your-subdomain.workers.dev/
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
      },
      {
        "platform": "cnb",
        "name": "owner/repo",
        "branch": "main",
        "key": "cnb:owner/repo@main",
        "latestSha": "abc123...",
        "hasUpdate": false
      }
    ]
  }
}
```

**CORS 支持：**
该接口支持跨域请求，可用于第三方应用集成：
```javascript
fetch('https://your-worker.your-subdomain.workers.dev/api/repos')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 方式三：HTTP 请求触发（开发模式）

**注意**：手动触发需要设置环境变量 `DEV_MODE=true`，否则会返回"开发模式已关闭"。

**请求说明**：
- 使用 `/check` 路径进行检测
- 使用 `/test-notify` 路径测试通知

启用开发模式后：

#### 1. 检测所有仓库

```
GET /check
```

检测所有已配置的 GitHub、Gitee、GitLab 和 CNB 仓库。

#### 2. 检测指定仓库

```
# GitHub 仓库
GET /check?repo=owner/repo
GET /check?repo=owner/repo@branch

# CNB 仓库
GET /check?repo=owner/repo&type=cnb
GET /check?repo=owner/repo@branch&type=cnb
```

#### 3. 按平台检测

```
# 仅检测 GitHub 仓库
GET /check?type=github

# 仅检测 Gitee 仓库
GET /check?type=gitee

# 仅检测 GitLab 仓库
GET /check?type=gitlab

# 仅检测 CNB 仓库
GET /check?type=cnb
```

#### 4. 检测并发送通知

添加 `notify=true` 参数，检测到更新时会发送通知：

```
GET /check?notify=true
GET /check?repo=owner/repo&notify=true
GET /check?type=cnb&notify=true
```

#### 5. 测试通知渠道

测试通知配置是否正常工作：

```
# 测试所有通知渠道
GET /test-notify

# 测试 Telegram 通知
GET /test-notify?target=telegram

# 测试企业微信通知
GET /test-notify?target=wecom

# 测试 PushPlus 通知
GET /test-notify?target=pushplus

# 测试 MagicPush 通知
GET /test-notify?target=magicpush
```

**响应示例（通知测试）：**
```json
{
  "code": 200,
  "message": "通知测试完成",
  "data": [
    {
      "channel": "telegram",
      "status": "success"
    },
    {
      "channel": "wecom",
      "status": "success"
    },
    {
      "channel": "pushplus",
      "status": "success"
    },
    {
      "channel": "magicpush",
      "status": "success"
    }
  ]
}
```

**响应示例（CNB 仓库检测）：**
```json
{
  "code": 200,
  "message": "检测完成",
  "data": [
    {
      "repo": "cnb:owner/repo@main",
      "platform": "cnb",
      "hasUpdate": true,
      "latestSha": "abc123...",
      "latestDate": "2026-02-09T15:30:00Z",
      "latestMessage": "Update README",
      "authorName": "John Doe",
      "previousSha": "def456...",
      "isFirstCheck": false,
      "url": "https://cnb.cool/owner/repo",
      "branch": "main"
    }
  ]
}
```



**响应示例（开发模式已关闭）：**
```
开发模式已关闭
```
HTTP 状态码：403

### 方式四：定时触发（Cron Triggers）

在 Cloudflare Dashboard 中配置 Cron Triggers：

```cron
# 每 30 分钟检测一次
*/30 * * * *

# 每小时检测一次
0 * * * *

# 每天早上 9 点检测一次
0 9 * * *
```

## API 响应示例

### 检测成功

```json
{
  "code": 200,
  "message": "检测完成",
  "data": [
    {
      "repo": "facebook/react@main",
      "hasUpdate": true,
      "latestSha": "abc123...",
      "latestDate": "2024-01-15T10:30:00Z",
      "previousSha": "def456..."
    },
    {
      "repo": "cnb:owner/repo@main",
      "platform": "cnb",
      "hasUpdate": true,
      "latestSha": "abc123...",
      "latestDate": "2026-02-09T15:30:00Z",
      "latestMessage": "Update README",
      "authorName": "John Doe",
      "previousSha": "def456...",
      "url": "https://cnb.cool/owner/repo",
      "branch": "main"
    }
  ],
  "rateLimit": {
    "limit": "60",
    "remaining": "55",
    "reset": "2024-01-15T11:00:00Z"
  }
}
```

### 检测失败

```json
{
  "code": 500,
  "message": "检测失败",
  "error": "错误详情"
}
```

## 通知功能

本工具已内置支持多种通知渠道，根据环境变量自动判断启用哪些通知渠道。

### Telegram 通知

**配置环境变量：**
- `TELEGRAM_BOT_TOKEN`：Telegram Bot Token
- `TELEGRAM_CHAT_ID`：接收消息的 Chat ID

**获取 Bot Token：**
1. 在 Telegram 中找到 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 创建新机器人
3. 按提示设置机器人名称，获取 Token

**获取 Chat ID：**
1. 在 Telegram 中找到 [@userinfobot](https://t.me/userinfobot)
2. 发送任意消息，获取你的 Chat ID
3. 或者直接给你的 Bot 发送消息，然后访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` 查看

**通知格式：**

**GitHub 仓库更新：**
```
🚀 GitHub 仓库更新通知

📦 仓库：owner/repo@branch
🆔 最新 SHA：abc123...
📅 更新时间：2026-02-08 12:58:15
```

**CNB 代码提交更新：**
```
🚀 CNB 代码提交更新通知

📦 仓库：owner/repo@main
🆔 最新 SHA：abc123...
👤 提交者：John Doe
📝 提交信息：Update README
📅 提交时间：2026-02-09 15:30:00
```

### 企业微信机器人通知

**配置环境变量：**
- `WECOM_WEBHOOK_URL`：企业微信群机器人的 Webhook URL

**获取 Webhook URL：**
1. 在企业微信群中点击群设置
2. 选择"群机器人" → "添加机器人"
3. 设置机器人名称，获取 Webhook URL

**通知格式：**

**GitHub 仓库更新：**
```
🚀 GitHub 仓库更新通知
📦 仓库：owner/repo@branch
🆔 最新 SHA：abc123...
📅 更新时间：2026-02-08 12:58:15
```

**CNB 代码提交更新：**
```
🚀 CNB 代码提交更新通知
📦 仓库：owner/repo@main
🆔 最新 SHA：abc123...
👤 提交者：John Doe
📝 提交信息：Update README
📅 提交时间：2026-02-09 15:30:00
```

### PushPlus 通知

**配置环境变量：**
- `PUSHPLUS_TOKEN`：PushPlus Token（必填）
- `PUSHPLUS_TOPIC`：群组编码，不填则发给自己（可选）
- `PUSHPLUS_CHANNEL`：发送渠道（wechat/mp/mail/sms），默认 wechat（可选）

**获取 PushPlus Token：**
1. 访问 [PushPlus 官网](https://www.pushplus.plus)
2. 扫码登录后，在"一对一"页面获取 Token
3. 如需发送给群组，在"一对多"页面创建群组并获取 Topic 编码

**通知格式：**

**GitHub 仓库更新：**
```
🚀 GitHub 仓库更新通知 - owner/repo@branch

📦 仓库：owner/repo@branch
🆔 最新 SHA：abc123...
📅 更新时间：2026-02-08 12:58:15
```

**CNB 代码提交更新：**
```
🚀 CNB 代码提交更新通知 - owner/repo@main

📦 仓库：owner/repo@main
🆔 最新 SHA：abc123...
👤 提交者：John Doe
📝 提交信息：Update README
📅 提交时间：2026-02-09 15:30:00
```

### MagicPush 通知

**配置环境变量：**
- `MAGICPUSH_URL`：MagicPush API URL
- `MAGICPUSH_TOKEN`：MagicPush Bearer Token

**通知格式：**

**GitHub 仓库更新：**
```
🚀 GitHub 仓库更新 - owner/repo@branch

📦 仓库：owner/repo@branch
🆔 最新 SHA：abc123...
📅 更新时间：2026-02-08 12:58:15
```

**CNB 代码提交更新：**
```
🚀 CNB 代码提交更新 - owner/repo@main

📦 仓库：owner/repo@main
🆔 最新 SHA：abc123...
👤 提交者：John Doe
📝 提交信息：Update README
📅 提交时间：2026-02-09 15:30:00
```

### 多通知渠道同时使用

您可以同时配置多个通知渠道，系统会自动检测并启用所有已配置的渠道。例如：

**同时启用 Telegram 和企业微信：**
```
TELEGRAM_BOT_TOKEN = 123456:ABC-DEF...
TELEGRAM_CHAT_ID = 123456789
WECOM_WEBHOOK_URL = https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

当检测到仓库更新时，Telegram 和企业微信都会收到通知。

**同时启用所有通知渠道（Telegram + 企业微信 + PushPlus + MagicPush）：**
```
TELEGRAM_BOT_TOKEN = 123456:ABC-DEF...
TELEGRAM_CHAT_ID = 123456789
WECOM_WEBHOOK_URL = https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
PUSHPLUS_TOKEN = your-pushplus-token
PUSHPLUS_TOPIC = your-topic-code
PUSHPLUS_CHANNEL = wechat
MAGICPUSH_URL = https://your-magicpush-api.com/notify
MAGICPUSH_TOKEN = your-magicpush-token
```

当检测到仓库更新时，所有已配置的通知渠道都会收到通知。

### 自定义通知

如需添加自定义通知渠道，可以在 `worker.js` 中参考 `sendTelegramNotification`、`sendWeComNotification`、`sendPushPlusNotification` 和 `sendMagicPushNotification` 函数的实现方式，添加新的通知函数，并在 `notify` 函数中调用。

## 仪表盘页面

项目内置了一个美观的监控仪表盘，采用现代深色主题设计：

### 设计特点

- **深色主题**：采用深蓝渐变背景，营造专业的监控面板氛围
- **玻璃拟态**：卡片使用毛玻璃效果，提升视觉层次感
- **响应式布局**：自适应移动端和桌面端
- **实时状态**：状态指示器带有脉冲动画效果
- **自动刷新**：每 30 秒自动获取最新数据

### 页面结构

1. **顶部导航栏**：项目名称、最后更新时间、刷新按钮
2. **统计概览区**：总仓库数、GitHub、Gitee、GitLab、CNB 数量、运行状态
3. **GitHub 仓库区**：网格卡片展示各 GitHub 仓库状态
4. **Gitee 仓库区**：网格卡片展示各 Gitee 仓库状态
5. **GitLab 仓库区**：网格卡片展示各 GitLab 仓库状态
6. **CNB 仓库区**：网格卡片展示各 CNB 仓库提交状态
7. **页脚**：版权信息

### 访问方式

直接访问 Worker 的 URL 即可：
```
https://your-worker.your-subdomain.workers.dev/
```

## 项目结构

```
repo-watcher/
├── src/
│   ├── index.js           # 主入口，Worker 导出
│   ├── handlers/          # 请求处理器
│   │   ├── index.js       # 处理器导出
│   │   ├── check.js       # 检测处理器
│   │   ├── dashboard.js   # 仪表盘处理器
│   │   ├── repos.js       # 仓库列表处理器
│   │   └── test-notify.js # 通知测试处理器
│   ├── services/          # 服务层
│   │   ├── index.js       # 服务导出
│   │   ├── github.js      # GitHub API 服务
│   │   ├── gitee.js       # Gitee API 服务
│   │   ├── gitlab.js      # GitLab API 服务
│   │   ├── cnb.js         # CNB API 服务
│   │   └── notify.js      # 通知服务
│   └── utils/             # 工具函数
│       ├── index.js       # 工具导出
│       ├── parser.js      # 解析工具
│       ├── kv.js          # KV 操作工具
│       └── datetime.js    # 日期时间工具
├── static/
│   ├── dashboard.html     # 仪表盘页面
│   └── favicon.svg        # 网站图标
├── wrangler.toml          # Wrangler 配置文件
├── package.json           # 项目配置
└── README.md              # 项目文档
```

## 核心功能说明

### 1. 仓库解析

**GitHub 仓库格式：**
- `owner/repo`：使用默认分支
- `owner/repo@branch`：指定分支

**Gitee 仓库格式：**
- `owner/repo`：使用默认分支
- `owner/repo@branch`：指定分支

**GitLab 仓库格式：**
- `owner/repo`：使用默认分支
- `owner/repo@branch`：指定分支

**CNB 仓库格式：**
- `owner/repo`：使用默认分支
- `owner/repo@branch`：指定分支

### 2. 检测逻辑

**GitHub 检测流程：**
1. 从 GitHub API 获取最新 commit 信息
2. 从 KV 读取上次记录的 SHA
3. 对比 SHA 判断是否有更新
4. 更新 KV 中的最新 SHA
5. 如果有更新，或首次检测且 `NOTIFY_ON_FIRST_CHECK=true`，则调用通知函数

**Gitee 检测流程：**
1. 从 Gitee API 获取最新 commit 信息
2. 从 KV 读取上次记录的 SHA
3. 对比 SHA 判断是否有更新
4. 更新 KV 中的最新 SHA
5. 如有更新，发送通知并更新 KV

**GitLab 检测流程：**
1. 从 GitLab API 获取最新 commit 信息
2. 从 KV 读取上次记录的 SHA
3. 对比 SHA 判断是否有更新
4. 更新 KV 中的最新 SHA
5. 如有更新，发送通知并更新 KV

**CNB 检测流程：**
1. 从 CNB API 获取最新 commit 信息
2. 从 KV 读取上次记录的 SHA
3. 对比 SHA 判断是否有更新
4. 更新 KV 中的最新 SHA
5. 如果有更新，或首次检测且 `NOTIFY_ON_FIRST_CHECK=true`，则调用通知函数

**首次检测行为：**
- 默认情况：首次检测不会发送通知，仅记录 SHA
- 设置 `NOTIFY_ON_FIRST_CHECK=true`：首次检测也会发送通知

### 3. 缓存机制

- 使用 Cloudflare Cache API 缓存 API 响应
- GitHub 缓存：可配置 `GITHUB_CACHE_TTL`（默认 300 秒）
- Gitee 缓存：可配置 `GITEE_CACHE_TTL`（默认 300 秒）
- GitLab 缓存：可配置 `GITLAB_CACHE_TTL`（默认 300 秒）
- CNB 缓存：可配置 `CNB_CACHE_TTL`（默认 300 秒）
- 减少 API 调用次数，降低限流风险

### 4. 认证机制

**GitHub 认证：**
- 可选 GitHub Token 认证
- 认证后 API 限流从 60 次/小时提升至 5000 次/小时
- 自动检测是否配置 Token 并添加认证头

**Gitee 认证：**
- 可选 Gitee Token 认证
- 使用 `private_token` 参数认证
- 认证后可提高 API 限流配额

**GitLab 认证：**
- 可选 GitLab Token 认证
- 使用 `PRIVATE-TOKEN` header 认证
- 支持 gitlab.com 和自托管 GitLab 实例
- 自托管需配置 `GITLAB_API_BASE` 和 `GITLAB_HOST`

**CNB 认证：**
- 必须配置 `CNB_TOKEN` 才能使用 CNB 监控
- 使用 Bearer Token 认证方式
- 支持自定义 CNB API 地址（`CNB_API_BASE`）

## 注意事项

1. **GitHub API 限流**：未认证请求限制 60 次/小时，建议配置 GitHub Token
2. **Gitee API 限制**：建议配置 Gitee Token 以提高限流配额
3. **GitLab API 限制**：自托管 GitLab 可能有不同的限流策略，建议配置 GitLab Token
4. **CNB API 限制**：CNB Token 必须配置，可能有调用频率限制，请合理设置 `CNB_CACHE_TTL`
5. **KV 存储限制**：免费账户有读写次数限制，合理设置检测频率
6. **Cron 触发限制**：免费账户最多 1 个 Cron Trigger
7. **通知频率**：避免过于频繁的通知造成骚扰
8. **开发模式**：默认关闭手动触发检测，避免 CDN 回源导致浪费请求次数。如需手动触发，请设置 `DEV_MODE=true`，测试完成后建议关闭
9. **CNB API 兼容性**：CNB API 格式可能变化，如遇问题请检查 API 响应格式

## 许可证

MIT License
