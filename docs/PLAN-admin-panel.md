# Repo Watcher 管理后台改造计划

> 状态：已实现（代码改造完成，待部署验证）
> 目标：用「管理后台」替代原有的「环境变量配置」，所有配置项迁移到 KV 存储；新增管理后台 UI 与 JWT 双 Token 认证；后端数据层统一使用 EdgeOne KV，键加 `repo_watcher_` 前缀，全局变量名 `MY_KV`。
> 已确认决策：见文末「九、已确认决策汇总」。
> KV 兼容性：已实践验证，Edge Functions 与 Cloud Functions（Node 运行时）均可直接以全局变量方式操作 `MY_KV`，使用同一套 KV 封装即可。

---

## 一、背景与目标

当前项目通过 EdgeOne Makers 的「环境变量」配置所有参数（仓库列表、Token、通知渠道等）。痛点：

- 修改配置需进入控制台改环境变量并重新部署，无法在线动态调整；
- 配置中混合了「敏感凭据」（各类 Token）与「业务配置」（仓库列表、分支），无法分级管理；
- 缺少统一的管理入口与访问控制。

本次改造目标：

1. **配置后台化**：所有原环境变量中的信息，改为在管理后台中读写，存储到 KV。
2. **存储统一**：后端全部使用 EdgeOne KV（`MY_KV` 全局变量），KV 键统一加 `repo_watcher_` 前缀。
3. **访问控制**：管理后台接口与页面使用 JWT 双 Token（access + refresh）认证。
4. **零运行时差异**：`edge-functions` 与 `cloud-functions`（Node 运行时）使用相同方式操作 KV（均通过 `MY_KV` 全局变量）。

---

## 二、范围与配置项清单

需从环境变量迁移到 KV 的配置项（原 `env.XXX`）：

| 配置键 | 原环境变量 | 分类 | 敏感 |
|--------|-----------|------|------|
| `config.github.repo` | `GITHUB_REPO` | 业务 | 否 |
| `config.github.branch` | `GITHUB_BRANCH` | 业务 | 否 |
| `config.github.token` | `GITHUB_TOKEN` | 凭据 | 是 |
| `config.gitee.repo` | `GITEE_REPO` | 业务 | 否 |
| `config.gitee.branch` | `GITEE_BRANCH` | 业务 | 否 |
| `config.gitee.token` | `GITEE_TOKEN` | 凭据 | 是 |
| `config.gitlab.repo` | `GITLAB_REPO` | 业务 | 否 |
| `config.gitlab.branch` | `GITLAB_BRANCH` | 业务 | 否 |
| `config.gitlab.token` | `GITLAB_TOKEN` | 凭据 | 是 |
| `config.gitlab.apiBase` | `GITLAB_API_BASE` | 业务 | 否 |
| `config.gitlab.host` | `GITLAB_HOST` | 业务 | 否 |
| `config.cnb.repo` | `CNB_REPO` | 业务 | 否 |
| `config.cnb.branch` | `CNB_BRANCH` | 业务 | 否 |
| `config.cnb.token` | `CNB_TOKEN` | 凭据 | 是 |
| `config.cnb.apiBase` | `CNB_API_BASE` | 业务 | 否 |
| `config.notifyOnFirstCheck` | `NOTIFY_ON_FIRST_CHECK` | 业务 | 否 |
| `config.tz` | `TZ` | 业务 | 否 |
| `config.checkToken` | `CHECK_TOKEN` | 凭据 | 是 |
| `config.magicpush.url` | `MAGICPUSH_URL` | 凭据 | 是 |
| `config.magicpush.token` | `MAGICPUSH_TOKEN` | 凭据 | 是 |

> 说明：原有 KV 中存「仓库检测状态」（commit SHA 等）继续沿用 `repo_watcher_` 前缀，与配置键共存于同一命名空间。

---

## 三、数据存储设计（KV）

- 全局变量：`MY_KV`（EdgeOne Makers 控制台绑定 KV 命名空间，变量名设为 `MY_KV`）。
- 键前缀：所有本项目键统一 `repo_watcher_`。
- 配置存储结构（**已确认：单键整体存储**）：
  - 键：`repo_watcher_config`（整体配置 JSON）
  - 值示例：`{ "github": { "repo": "...", "branch": "main", "token": "..." }, ... }`
  - 不拆分为多键。读写时整体 get/put，前端可分组提交，后端合并后整体写回。
- 管理员凭据：首次访问 `/admin` 走**初始化向导**设置管理员密码（见第五节）。
  - 用户名：固定 `admin`（或向导可设）。
  - 密码：仅存 **bcrypt/argon2 哈希**，存于 `repo_watcher_admin`。
- JWT 签名密钥：**保留为受保护环境变量 `JWT_SECRET`**，不进 KV、不出现在后台可读配置中（见第四节）。

### KV 中凭据加密（已确认：加密）

> 原因：KV 命名空间可能与其它应用共用，明文 token 有泄露风险。

- 加密字段：配置中所有标记为「敏感」的字段（见第二节 `敏感=是` 的 8 项：各平台 token、checkToken、magicpush.url、magicpush.token）。
- 加密方式：AES-256-GCM 对称加密。
  - 密钥来源：环境变量 `CONFIG_ENC_KEY`（与 `JWT_SECRET` 同属受保护环境变量，仅服务端可用）。
  - 明文在写入 KV 前加密，读取后解密（仅在服务端内存中存在明文）。
  - 密文在 KV 中存储格式：`enc::<iv>:<authTag>:<ciphertext>`（或 JSON 包装），便于识别已加密字段。
- 脱敏返回：管理后台 `GET /api/admin/config` 对敏感字段返回掩码（如 `••••••`），不返回明文或密文。
- 注意：`repo_watcher_` 前缀下的「仓库检测状态」（commit SHA 等）属于业务数据，非凭据，**不加密**，与配置键共存。

### KV 操作封装（共享库）

新增/改造 `edge-functions/lib/utils/kv.js`，统一通过 `MY_KV` 全局变量访问，并内置前缀与加解密：

```js
// 统一前缀 + 全局变量（Edge Functions 全局变量，非 context.env）
const KV_KEY_PREFIX = 'repo_watcher_';
const KV = MY_KV; // EdgeOne 注入的全局变量

function withPrefix(key) { return `${KV_KEY_PREFIX}${key}`; }

export async function kvGetJSON(key) {
  return KV.get(withPrefix(key), 'json');
}
export async function kvPutJSON(key, value) {
  await KV.put(withPrefix(key), JSON.stringify(value));
}
export async function kvDelete(key) {
  await KV.delete(withPrefix(key));
}
// encryptField / decryptField 基于 CONFIG_ENC_KEY + AES-256-GCM 实现
```

> Cloud Functions 侧 KV 访问方式见「十、Cloud Functions 与 KV 兼容性说明」。

---

## 四、认证设计（JWT 双 Token）

- **Access Token**：短期（如 15 分钟），用于访问受保护的管理接口。
- **Refresh Token**：长期（如 7 天），用于换取新的 Access Token；存于 KV（`repo_watcher_session:<jti>`）以支持吊销。
- **登录**：`POST /api/admin/login`（用户名 + 密码）→ 返回双 Token。
- **刷新**：`POST /api/admin/refresh`（携带 refresh token）→ 返回新 access token。
- **登出**：`POST /api/admin/logout` → 吊销 refresh token。
- **鉴权中间件**：校验 `Authorization: Bearer <accessToken>`，失败返回 401；refresh 过期需重新登录。
- **JWT 签名密钥**：使用受保护环境变量 `JWT_SECRET`（仅服务端，不进 KV、不暴露给后台 UI）。双 Token 均用其签名/校验。
- 原 `CHECK_TOKEN`（用于 `/api/check` 的调用鉴权）仍保留，但改为从 KV 配置 `config.checkToken` 读取（该值在 KV 中加密存储），不再依赖环境变量。

### JWT 实现要点

- 使用 `jsonwebtoken`（Node Functions）或 Edge 兼容的 `jose`（Edge Functions）签发。
- Access Token payload：`{ sub: 'admin', type: 'access', jti, exp }`。
- Refresh Token payload：`{ sub: 'admin', type: 'refresh', jti, exp }`；`jti` 写入 `repo_watcher_session:<jti>`，登出/改密时删除该键即吊销。
- 中间件对受保护接口校验 `type === 'access'` 且 `jti` 在 KV 中存在。

---

## 五、管理后台接口（后端）

新增 `edge-functions/api/admin/` 与对应的 `cloud-functions`：

| 接口 | 方法 | 鉴权 | 说明 |
|------|------|------|------|
| `/api/admin/init` | GET | 否 | 查询是否已完成初始化（`{ initialized: bool }`） |
| `/api/admin/init` | POST | 否 | 初始化向导：首次设置管理员用户名/密码，写入 `repo_watcher_admin`（哈希） |
| `/api/admin/login` | POST | 否 | 登录获取双 Token |
| `/api/admin/refresh` | POST | refresh | 刷新 access token |
| `/api/admin/logout` | POST | access | 吊销会话 |
| `/api/admin/config` | GET | access | 读取全部配置（凭据脱敏/掩码返回） |
| `/api/admin/config` | PUT | access | 更新配置（整体或分组提交，后端合并后整体写回 KV，敏感字段加密） |
| `/api/admin/test-notify` | POST | access | 测试通知（替代原公开 `/api/test-notify`） |

> 初始化逻辑：`repo_watcher_admin` 不存在时，`/admin` 前端显示初始化向导；已存在则显示登录页。`init` 接口保证幂等（已初始化时 POST 返回 409）。

原公开接口改造：

- `/api/repos`：保持**公开**（无需鉴权，与现状一致），但配置来源从 `env` 改为 KV（先解密再使用）。
- `/api/check`：调用鉴权由 `CHECK_TOKEN` 环境变量改为 KV 中的 `config.checkToken`（解密后比对）。
- `/api/test-notify`（公开版）：下线，由 `/api/admin/test-notify` 取代。

### 业务函数改造要点

- `repos.js` / `check.js`：移除 `context.env.XXX` 读取，改为调用 `getConfig()` 从 KV 读取整体配置（自动解密敏感字段）后传入各 `checkXxxRepoUpdate(repoInfo, config)`。
- 各 `services/*.js` 的 `env` 参数替换为 `config` 对象（字段名见第二节清单）。
- `notify.js`、`datetime.js` 相应改为接收 `config`。
- `getConfig()` 统一位于 `lib/config.js`：`kvGetJSON('config')` → AES 解密敏感字段 → 返回明文 config 对象（仅服务端使用）。

---

## 六、管理后台前端（UI）

在现有 Vite + Vue 项目（`src/`）中新增后台页面，与现有仪表盘共存。**不引入路由库**，采用轻量「路径判断 + 组件切换」方式区分页面（保持依赖最小，现状 `src` 为纯单页无路由）。

- 页面入口（基于 `location.pathname` 切换组件，或在仪表盘加「管理后台」入口按钮跳转 `/admin`）：
  - `/`（现仪表盘，公开）
  - `/admin`（初始化向导 / 登录页，按 `GET /api/admin/init` 结果切换）
  - `/admin/console`（配置后台，需登录；未登录则重定向 `/admin`）
- 页面组件（新增于 `src/`）：
  - `views/AdminInit.vue`：首次初始化向导（设置管理员用户名/密码）。
  - `views/AdminLogin.vue`：登录表单。
  - `views/AdminConsole.vue`：配置表单（各平台仓库/分支/Token、通知、通用开关）。
  - `components/ConfigSection.vue`：分组配置卡片。
  - `components/TokenField.vue`：敏感字段输入（掩码显示，留空 = 不修改）。
  - `composables/useAdminAuth.js`：登录态、Token 存储（内存/会话存储 + refresh 自动续期）。
- 凭据字段在界面上脱敏显示（如 `••••••`），编辑时留空表示不修改。
- 受保护接口请求统一在 `useAdminAuth` 中注入 `Authorization` 头并处理 401（自动用 refresh 续期，失败则跳登录）。
- 导航：仪表盘页增加「管理后台」链接指向 `/admin`。

> 部署说明：前端构建产物 `dist/` 由 EdgeOne Pages 托管；管理后台 API 由 edge-functions 提供，同源部署即可避免跨域。

---

## 七、实现技能与部署

- 使用 **EdgeOne Makers 技能**完成 KV 绑定、`MY_KV` 全局变量配置、edge-functions 与 cloud-functions 的部署。
- `cloud-functions/` 与 `edge-functions/` **同级目录**（按用户确认），Node 运行时。
- 部署后需：
  1. 控制台绑定 KV 命名空间，变量名 `MY_KV`；
  2. 配置受保护环境变量：`JWT_SECRET`、`CONFIG_ENC_KEY`；
  3. 首次访问 `/admin` 走初始化向导设置管理员账号。

> ⚠️ `cloud-functions` 是否真的能像 edge 一样访问 `MY_KV` 全局变量，存在平台限制（见第十节），需先验证。

---

## 八、改造文件清单（预估）

后端（edge-functions / cloud-functions 对齐）：
- `edge-functions/lib/utils/kv.js`（改为 `MY_KV` 全局变量 + 前缀 + 加解密 + 配置读写）
- `edge-functions/lib/utils/crypto.js`（新增：AES-256-GCM 加解密，密钥 `CONFIG_ENC_KEY`）
- `edge-functions/lib/auth/jwt.js`（新增：双 Token 签名/校验/中间件）
- `edge-functions/lib/config.js`（新增：`getConfig()` / `saveConfig()`，含解密/加密）
- `edge-functions/api/repos.js`、`api/check.js`（去 `env`，用 `config`）
- `edge-functions/api/admin/init.js`、`login.js`、`refresh.js`、`logout.js`、`config.js`、`test-notify.js`（新增）
- `edge-functions/lib/services/*.js`（参数 `env` → `config`）
- `cloud-functions/`（同级目录，对齐上述 admin 接口与 KV 访问；经实践验证 Node 运行时可直接操作 `MY_KV`）

前端（src/）：
- `views/AdminInit.vue`、`views/AdminLogin.vue`、`views/AdminConsole.vue`（新增）
- `components/ConfigSection.vue`、`components/TokenField.vue`（新增）
- `composables/useAdminAuth.js`（新增）
- `App.vue`（加「管理后台」入口 + 轻量页面切换，不引路由库）
- `main.js`（无需路由）

文档：
- `README.md`（更新部署与配置说明）
- 本计划文档

---

## 九、已确认决策汇总

| # | 决策点 | 已确认选择 |
|---|--------|-----------|
| 1 | 管理员初始化 | **方案 B**：首次访问 `/admin` 走初始化向导设置账号 |
| 2 | JWT 密钥 | 保留受保护环境变量 `JWT_SECRET`（不进 KV、不暴露 UI） |
| 3 | KV 凭据加密 | **加密**（AES-256-GCM，密钥 `CONFIG_ENC_KEY`）；命名空间可能共用 |
| 4 | 配置存储粒度 | **单键整体**（`repo_watcher_config`） |
| 5 | 前端路由 | **不引入 vue-router**，用轻量组件切换 |
| 6 | cloud-functions 位置 | 与 `edge-functions/` **同级目录** |
| 7 | `/api/repos` 公开性 | **保持公开**（仅写配置与管理接口需登录） |

补充约束（用户指定，不变）：
- KV 全局变量 `MY_KV`、键前缀 `repo_watcher_`；edge 与 cloud functions 用统一方式操作 KV。
- 从环境变量读取的全部信息（共 20 项）迁移到 KV，清单见第二节。

---

## 十、Cloud Functions 与 KV 兼容性说明（已确认）

### 结论（实践验证）

- **Edge Functions 与 Cloud Functions（Node 运行时）均可直接以全局变量方式操作 `MY_KV`**，使用方式与 edge 完全一致：`await MY_KV.get(key, 'json')` / `MY_KV.put(...)` / `MY_KV.delete(...)`。
- 该结论已由用户在实践中验证，不受官方技能文档中「KV 仅支持 Edge Functions」描述的约束（以实际平台行为为准）。
- 因此 `edge-functions/` 与 `cloud-functions/`（同级目录）**共享同一套 KV 封装**，无需 Blob 模拟，也不会产生双份存储。

### 统一 KV 封装约定

- 在 edge 与 cloud 两侧均通过全局变量 `MY_KV` 访问（非 `context.env`）。
- 共享封装层（见第八节 `lib/utils/kv.js` / `lib/utils/crypto.js`）保证：键前缀 `repo_watcher_`、AES-256-GCM 加解密、配置整体读写三处逻辑一致。
- 注意：Cloud Functions 仍通过 `context.env` 读取 `JWT_SECRET`、`CONFIG_ENC_KEY` 等受保护环境变量（KV 用于存储数据，环境变量用于存储密钥，职责分离）。

---

## 十一、里程碑（建议执行顺序）

1. KV 适配层 + `MY_KV` 绑定 + 前缀 + AES 加解密封装（edge 与 cloud 共享）。
2. 配置迁移：业务函数去 `env`，改读 KV 配置（自动解密）；保持公开接口行为不变。
3. JWT 双 Token 模块 + 初始化/登录/刷新/登出接口。
4. 管理后台接口（config 读写、test-notify），edge 与 cloud 对齐实现。
5. 管理后台前端（init/login/console + 轻量切换）。
6. 下线原环境变量依赖与公开 test-notify，更新 README 与部署文档。
7. 用 EdgeOne 技能完成部署与验证。
