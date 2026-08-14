<p align="center">
  <img src="./favicon.svg" alt="Repo Watcher" width="96" height="96" />
</p>

<h1 align="center">Repo Watcher · 项目仓库更新监控</h1>

<p align="center">
  一个基于 <strong>EdgeOne Makers</strong> 边缘函数的多平台仓库更新监控工具，<br/>
  支持 <code>GitHub</code>、<code>Gitee</code>、<code>GitLab</code> 和 <code>CNB</code> 的代码提交监控、定时检测与消息通知。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-EdgeOne%20Makers-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status" />
</p>

> **⚠️ 迁移说明**：本项目已由 Cloudflare 迁移至 EdgeOne Makers，原 Cloudflare 代码已存档至 `cloudflare` 分支。

---

## ✨ 预览

<p align="center">
  <img src="/public/light.png" alt="Light mode" width="48%" />
  <img src="/public/night.png" alt="Dark mode" width="48%" />
</p>

## 🚀 功能特性

| 特性 | 说明 |
|------|------|
| 🌐 **多平台支持** | 同时监控 GitHub、Gitee、GitLab 与 CNB 仓库的代码提交 |
| 📦 **多仓库检测** | 支持同时监控多个仓库 |
| ⚙️ **灵活配置** | 通过环境变量配置仓库与分支 |
| 🔁 **手动触发** | 通过 HTTP 请求手动触发检测 |
| 💾 **状态持久化** | 使用 EdgeOne KV 存储记录上次检测的 commit SHA |
| 🔐 **认证支持** | GitHub / Gitee / GitLab（含自托管）/ CNB Token 认证，提升 API 限流配额 |
| 🔔 **通知接口** | 支持 MagicPush 消息推送 |
| 📊 **限流监控** | 实时获取 GitHub API 限流状态 |
| 📱 **可视化仪表盘** | 内置 Web 仪表盘，直观展示所有监控仓库状态 |

> 💡 **关于定时检测**：EdgeOne 自带的定时任务最短间隔为一天，无法满足需求，因此本项目通过外部 Cron 服务（如 cron-job.org）主动调用检测接口来实现定时检测。

## 📦 部署说明

### 前置条件

1. 注册 [EdgeOne Makers](https://console.cloud.tencent.com/edgeone/pages) 账号。

### 步骤一：部署项目

**方式一：一键部署**

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fmagiccode1412%2Frepo-watcher)

**方式二：手动部署**

1. Fork 本项目（使用 `main` 分支）。
2. 在 EdgeOne Makers 平台从 Git 仓库导入项目。
3. 配置环境变量（参考步骤三）。
4. 点击部署。

### 步骤二：启用 KV Storage（必须）

1. 登录 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)。
2. 进入 **「KV Storage」** 页面。
3. 点击 **「申请开通」**（免费套餐包含 1GB 存储）。
4. 点击 **「创建命名空间」**，输入名称（如 `repo-watcher-kv`）。
5. 进入命名空间 → **「关联项目」** 标签页。
6. 点击 **「绑定项目」**，选择你的项目，设置变量名为 `MY_KV`。
7. 确认绑定成功。

> ⚠️ **关键步骤**：变量名必须是 `MY_KV`，与代码中使用的全局变量名称一致。所有键统一加 `repo_watcher_` 前缀。

### 步骤三：配置环境变量

在 EdgeOne Makers 控制台的 **「环境变量」** 设置中配置以下**受保护环境变量**（仅服务端，不进 KV）：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `JWT_SECRET` | **是** | JWT 双 Token 签名密钥，建议 32 位以上随机串 |
| `CONFIG_ENC_KEY` | **是** | 凭据 AES-256-GCM 加密密钥（hex 64 位 或 任意字符串，会自动派生为 32 字节） |

生成这两个变量的值（请在本地执行，分别生成两个不同的值）：

```bash
# 分别生成两个不同的值
JWT_SECRET=$(openssl rand -hex 32)
CONFIG_ENC_KEY=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"
echo "CONFIG_ENC_KEY=$CONFIG_ENC_KEY"
```

> 原业务配置（仓库列表、各平台 Token、通知渠道等）**不再通过环境变量配置**，改为在管理后台中设置并存储到 KV。

### 步骤四：初始化管理后台

1. 部署完成后访问 `/admin`。
2. 首次访问显示**初始化向导**，设置管理员用户名与密码（密码至少 6 位）。
3. 初始化完成后，再次访问 `/admin` 显示登录页，使用刚设置的账号登录。
4. 登录后进入 `/admin/console` 配置各平台仓库、Token 与通知渠道（凭据加密存储、界面脱敏）。

### 步骤三（旧）：原环境变量配置已废弃

> ⚠️ 以下配置项**已迁移至管理后台（KV 存储）**，不再通过环境变量配置：
> `NOTIFY_ON_FIRST_CHECK`、`TZ`、`CHECK_TOKEN`、`GITHUB_*`、`GITEE_*`、`GITLAB_*`、`CNB_*`、`MAGICPUSH_*`。
> 部署后请在 `/admin/console` 中配置。仅 `JWT_SECRET` 与 `CONFIG_ENC_KEY` 保留为受保护环境变量。

## 🛠 使用方式

### 方式一：可视化仪表盘（推荐）

直接访问项目的根路径 `/`，即可打开监控仪表盘页面：

```
https://<your-domain>/
```

**仪表盘功能：**

- 展示所有监控仓库的实时状态
- 统计 GitHub、Gitee、GitLab 与 CNB 仓库数量
- 显示每个仓库的最新 commit SHA
- 自动每 30 秒刷新数据
- 支持手动刷新
- 响应式设计，兼容移动端与桌面端

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

### 方式三：管理后台（推荐）

部署并初始化后，通过管理后台在线维护所有配置：

- 访问 `/admin` 完成初始化 / 登录。
- 访问 `/admin/console` 配置各平台仓库、分支、Token 及通知渠道；敏感字段在 KV 中以 AES-256-GCM 加密存储，界面脱敏显示，编辑时留空表示不修改。
- 管理接口（`/api/admin/*`）使用 JWT 双 Token 鉴权，access token 15 分钟、refresh token 7 天，支持登出吊销。

### 方式四：HTTP 请求触发

**请求说明：**

- 使用 `/api/check` 路径进行检测。
- 通知测试改为在管理后台 `/admin/console` 点击「测试通知」（原公开 `/api/test-notify` 已下线）。
- `CHECK_TOKEN` 在管理后台配置（存储于 KV 加密）。调用时需携带令牌：通过请求头 `Authorization: Bearer <token>` 或查询参数 `?token=<token>` 传入，否则返回 401。

#### 检测所有仓库

```bash
# 方式一：Authorization 请求头
curl -H "Authorization: Bearer $CHECK_TOKEN" \
  "https://<your-domain>/api/check"

# 方式二：token 查询参数
curl "https://<your-domain>/api/check?token=$CHECK_TOKEN"
```

#### 检测指定平台

```bash
curl -H "Authorization: Bearer $CHECK_TOKEN" \
  "https://<your-domain>/api/check?type=github"

curl -H "Authorization: Bearer $CHECK_TOKEN" \
  "https://<your-domain>/api/check?type=cnb"
```

#### 检测并发送通知

添加 `notify=true` 参数：

```bash
curl -H "Authorization: Bearer $CHECK_TOKEN" \
  "https://<your-domain>/api/check?notify=true"

curl -H "Authorization: Bearer $CHECK_TOKEN" \
  "https://<your-domain>/api/check?type=cnb&notify=true"
```

### 方式四：定时检测（Cron 替代方案）

推荐使用以下免费服务定期调用你的检测接口：

1. **cron-job.org**（免费）
   - 创建一个 cron job，URL 设为：`https://<your-domain>/api/check?notify=true`
   - 若已配置 `CHECK_TOKEN`，请在请求的 **HTTP Headers** 中添加 `Authorization: Bearer <token>`（或在 URL 末尾追加 `&token=<token>`）。
   - 设置执行频率（如每 30 分钟）。

2. **腾讯云 SCF 定时触发器**
   - 创建一个云函数，通过 HTTP 调用你的接口。
   - 配置定时触发规则。

## 📂 项目结构

```
repo-watcher/
├── edge-functions/            # 边缘函数 (EdgeOne Makers)
│   ├── api/                   # HTTP 接口
│   │   ├── repos.js           # GET /api/repos 公开接口
│   │   ├── check.js           # GET|POST /api/check 手动/定时检测
│   │   └── admin/             # 管理后台接口（需鉴权）
│   │       ├── init.js        # GET|POST /api/admin/init 初始化
│   │       ├── login.js       # POST /api/admin/login 登录
│   │       ├── refresh.js     # POST /api/admin/refresh 刷新
│   │       ├── logout.js      # POST /api/admin/logout 登出
│   │       ├── config.js      # GET|PUT /api/admin/config 配置读写
│   │       └── test-notify.js # POST /api/admin/test-notify 通知测试
│   └── lib/                   # 共享业务库
│       ├── services/          # 服务层 (各平台 API + 通知)
│       │   ├── index.js       # 服务统一导出 (barrel)
│       │   ├── github.js
│       │   ├── gitee.js
│       │   ├── gitlab.js
│       │   ├── cnb.js
│       │   └── notify.js
│       ├── utils/             # 工具函数
│       │   ├── index.js       # 工具统一导出 (barrel)
│       │   ├── kv.js          # KV 存储操作 (MY_KV 全局变量 + 前缀)
│       │   ├── crypto.js      # AES-256-GCM 凭据加解密
│       │   ├── parser.js      # 仓库字符串解析
│       │   └── datetime.js    # 日期格式化
│       ├── config.js          # 配置读写层（解密/加密 + 脱敏）
│       └── auth/              # 认证
│           ├── jwt.js         # JWT 双 Token 签名/校验
│           ├── admin.js       # 管理员哈希与会话
│           └── middleware.js  # 鉴权中间件辅助
├── cloud-functions/           # Cloud Functions (Node 运行时，与 edge 对齐)
│   └── api/admin/             # 管理后台接口（复用 edge-functions/lib）
├── public/                    # 静态资源 (自动托管)
│   └── favicon.svg            # 网站图标
├── src/                       # 前端仪表盘 (Vite + Vue)
│   ├── components/            # Vue 组件
│   │   ├── BrandIcon.vue
│   │   ├── RepoCard.vue
│   │   ├── StatCard.vue
│   │   ├── ConfigSection.vue  # 分组配置卡片
│   │   └── TokenField.vue     # 敏感字段输入
│   ├── composables/           # 组合式函数
│   │   ├── useRepos.js        # 仓库数据获取逻辑
│   │   └── useAdminAuth.js    # 管理后台鉴权
│   ├── views/                 # 页面
│   │   ├── AdminInit.vue      # 初始化向导
│   │   ├── AdminLogin.vue     # 登录
│   │   └── AdminConsole.vue   # 配置后台
│   ├── utils/                 # 前端工具函数
│   │   └── time.js            # 时间格式化
│   ├── App.vue                # 根组件（轻量页面切换）
│   ├── main.js                # 入口文件
│   └── style.css              # 全局样式
├── index.html                 # Vite 入口 HTML
├── favicon.svg                # 网站图标 (根目录)
├── vite.config.js             # Vite 配置
├── package.json               # 项目配置
├── package-lock.json          # 依赖锁定文件
├── skills-lock.json           # 技能锁定文件
└── README.md                 # 项目文档
```

## ⚠️ 注意事项

1. **GitHub API 限流**：未认证请求限制 60 次/小时，建议配置 GitHub Token。
2. **Gitee API 限制**：建议配置 Gitee Token 以提高限流配额。
3. **GitLab API 限制**：自托管 GitLab 可能有不同的限流策略。
4. **CNB API 限制**：CNB Token **必须**配置。

## 📄 许可证

[MIT License](./LICENSE)
