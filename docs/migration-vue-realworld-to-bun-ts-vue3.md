# Vue 3 + TypeScript + Bun RealWorld 学习式迁移指南

> **重要：这不是一次性复制项目的迁移清单。**  
> 本指南把 `/home/pax/Project/github/vue-realworld-example-app` 拆成一组可以边开发、边学习、边验证的垂直切片。每个迭代只引入一个主要概念和一个可观察的功能，完成后项目仍然可以运行、测试和提交。  
> 目标仓库：`/home/pax/Project/front_project/vue3-ts-realworld-example-app`  
> 参考仓库：`/home/pax/Project/github/vue-realworld-example-app`  
> 编写日期：2026-08-13  
> 当前状态：迭代 1–14、15A–15H 已完成；Playwright 已覆盖导航、标签、分页、认证、文章交互、文章生命周期、Profile、Settings 和 null/empty 字段，下一步进入迭代 15I。

## 0. 先读这几条约定

1. **不要把源仓库的 `src/` 整体复制过来。** 源仓库是行为参考，目标仓库才是实际开发现场。
2. **每个迭代只解决一个问题。** 例如“登录后刷新仍保持会话”，而不是“把整个 `auth.js` 改名为 `auth.ts`”。
3. **每一步都保留可运行状态。** 如果某个功能还没做完，可以先使用占位页面；不要为了等所有页面完成才启动应用。
4. **依赖按功能引入。** 不要一开始同时安装 Pinia、Router、Markdown、日期库、Playwright 和所有测试工具。
5. **先写能证明行为的最小测试，再扩展功能。** 纯函数和 HTTP 边界优先用 Bun 单测，关键用户路径最后再用 Playwright。
6. **源仓库的 API、DOM selector、文案和安全规则是外部契约。** 可以分阶段实现，但不能在实现对应功能时随意改变。
7. **每个迭代单独提交、单独回滚。** 提交信息要说明“学了什么”和“完成了什么”。
8. **目标项目统一使用 `src/stores`。** 这是有意区别于源仓库 `src/store` 的命名选择；后续不要创建第二套单数目录。

最终目标不是“迁移了多少文件”，而是逐步得到一个可维护、可解释、可测试的 Vue 3 + TypeScript + Bun RealWorld 应用。

## 1. 你将逐步构建什么

最终用户路径大致如下：

```text
打开首页
  → 注册/登录
  → 浏览 Global Feed / Your Feed
  → 通过标签和分页筛选
  → 打开文章详情
  → 渲染安全 Markdown
  → 收藏、发表评论
  → 创建、编辑、删除文章
  → 查看 Profile 和 Favorited Articles
  → Follow / Unfollow 用户
  → 修改 Settings
  → 退出登录
```

### 1.1 学习能力地图

| 能力                                         | 在哪些迭代学习       |
| -------------------------------------------- | -------------------- |
| Vue 3 SFC、Composition API、`<script setup>` | 1、2                 |
| `ref`、`computed`、事件和父子组件通信        | 1、2                 |
| Vue Router、动态参数、query、懒加载          | 3、7                 |
| TypeScript 领域类型、`unknown`、类型守卫     | 4、6、8              |
| Bun 安装、脚本、单元测试和 mock              | 每个迭代，重点在 4–8 |
| Pinia state/getters/actions                  | 5–13                 |
| `fetch`、请求头、JSON、HTTP 错误             | 4、6、8–12           |
| localStorage、JWT 生命周期和会话恢复         | 5–7                  |
| Markdown 安全和 XSS 防护                     | 9、15（安全 E2E）    |
| 表单、异步提交、错误和 loading               | 6、10–13             |
| Playwright、selector 契约和部署 fallback     | 14–15                |
| 增量提交、回滚和代码阅读                     | 全部迭代             |

### 1.2 迭代和功能里程碑

| 里程碑           | 完成后能做什么                                   |
| ---------------- | ------------------------------------------------ |
| M0：可运行底座   | 能启动、构建、测试，并理解两个仓库的差异         |
| M1：应用外壳     | 有真实页面布局和基本导航                         |
| M2：认证垂直切片 | 能登录、注册、刷新恢复并保护页面                 |
| M3：只读内容     | 能浏览 Feed、标签、分页、文章详情和安全 Markdown |
| M4：写入内容     | 能评论、收藏、创建/编辑/删除文章                 |
| M5：用户关系     | 能查看 Profile、Favorited、Follow 和 Your Feed   |
| M6：交付契约     | Settings、主题、静态资源、官方 E2E 和清理完成    |

## 2. 开始前：读懂两个仓库和当前基线

### 2.1 当前目标仓库的事实

当前项目仍然是 Vite starter，已经有：

- `src/main.ts`、`src/App.vue`、`src/style.scss`、`vite.config.ts`；
- Bun `>=1.3.14`、`bun.lock`、`bunfig.toml`；
- Vue `3.6.0-rc.3`、TypeScript、Vite、`vue-tsc`、Bun Test、ESLint、Oxlint、Prettier；
- `bun run dev`、`build`、`preview`、`type-check`、`test`、`lint`、`format`、`check` 脚本。

当前入口只渲染 starter 的 `HelloWorld`，还没有：

- Vue Router；
- Pinia；
- RealWorld API 服务；
- 认证守卫；
- 业务页面和业务 store；
- Playwright 配置和 `realworld` submodule。

当前 `tsconfig.app.json` 已启用 `noUnusedLocals`、`noUnusedParameters`、`erasableSyntaxOnly` 等约束，因此不能用大量 `any` 或关闭规则来“先跑起来”。

### 2.2 参考仓库的事实

源项目已经包含：

- 页面：`Home.vue`、`Article.vue`、`ArticleEdit.vue`、`Login.vue`、`Register.vue`、`Profile.vue`、`Settings.vue`；
- 组件：文章列表/预览、文章操作、评论、Header/Footer、标签、分页、错误列表等；
- Pinia store：`auth`、`home`、`article`、`profile`；
- 公共层：fetch API、`VITE_API_URL`、JWT、错误归一化、日期格式化；
- 默认 API：`https://api.realworld.show/api`；
- `realworld/` git submodule：共享主题、API spec、`SELECTORS.md` 和 Playwright E2E；
- `window.__conduit_debug__` 测试调试接口。

优先阅读这些参考文件，而不是先通读全部源码：

```text
src/main.js
src/router/index.js
src/store/auth.js
src/common/api.service.js
src/views/Login.vue
src/views/Home.vue
src/views/Article.vue
realworld/specs/e2e/SELECTORS.md
```

### 2.3 当前工作区状态

原来的 `playground/` TypeScript 练习目录已经清理，不再属于迁移基线。后续实现和测试直接放入正式目录，例如 `src/`、`src/**/*.test.ts` 和 `tests/`，不要重新创建或依赖已删除的 playground 文件。

如果 `git status` 仍显示 `playground/` 下的删除记录，这是本次清理尚未提交的正常结果；迁移代码不要撤销这些删除。

迁移过程中不得使用以下命令清理工作区：

```bash
git reset --hard
git clean -fd
git checkout -- .
```

这些命令仍可能破坏其他未提交工作，因此增量迁移期间继续禁止使用。每次迭代开始前先运行 `git status --short`，只修改当前功能需要的文件。

### 2.4 当前基线验证记录

开始第一个业务迭代前，自己运行并记录：

```bash
bun install
bun test
bun run type-check
bun run build
bun run lint
bun run format:check
```

开发服务器是长驻进程，单独做启动 smoke，不要把它当作会自动退出的检查命令：

```bash
# 终端 A：启动后读取 Vite 打印的实际 URL
bun run dev

# 浏览器访问该 URL；验证后回到终端 A 按 Ctrl-C 停止
```

截至本文件编写时，已验证：

- `bun run check`：通过（包含 format check、lint 和 type-check）；
- `bun test`：1 个正式 Bun runtime 测试通过，0 失败；
- `bun run type-check`：通过；
- `bun run build`：通过；
- `bun run lint`：通过；
- 迁移文档的 Prettier 检查：通过。

清理 `playground/` 后，原先由 `playground/typescript/src/auth-state.test.ts` 引起的格式化阻断已经消失，`bun run check` 已恢复通过。测试数量从原来的练习测试集合下降为 1 是预期变化；后续每个功能迭代要在正式目录逐步补回生产行为测试。

## 3. 正常开发循环：每个迭代都这样做

每个迭代遵循同一个短循环：

### 3.1 开始前

1. 阅读本迭代列出的源文件和目标文件。
2. 写下本次只解决的一个用户行为。
3. 确认不会覆盖工作区已有修改。
4. 只安装本迭代需要的依赖。

### 3.2 实现中

1. 先写最小类型或纯函数。
2. 再写服务/状态层。
3. 再接页面和组件。
4. 保持 loading、空态和错误态，不只实现 happy path。
5. 每完成一个小步骤就运行针对性测试。

### 3.3 迭代出口

```bash
# 快速循环
bun test path/to/changed.test.ts
bun run type-check

# 迭代完成前
bun test
bun run format:check
bun run lint
bun run type-check
bun run build
```

然后手工验证：

- 一个 happy path；
- 一个空数据或失败 path；
- 当前已经完成的功能没有被破坏。

最后提交：

```text
<type>: <一个学习主题 + 一个功能>
```

### 3.4 暂时不要做的事

- 不要先迁移所有 JS 文件，再“以后补类型”。
- 不要一开始创建四个完整 store 和全部领域类型。
- 不要用真实远程 API 替代 API 单测；网络测试会不稳定。
- 不要在 Router 还没理解时一次性迁移所有页面守卫。
- 不要在第一个页面完成前安装 Playwright 浏览器和全部 submodule 测试。
- 不要把 `test` 从 Bun Test 改成 Playwright；后期新增 `test:e2e`。

### 3.5 依赖引入顺序

| 迭代  | 依赖                                      |
| ----- | ----------------------------------------- |
| 1–2   | 不新增业务依赖                            |
| 3     | `vue-router`                              |
| 4     | 不新增运行时依赖，使用原生 `fetch`        |
| 5     | `pinia`                                   |
| 6–8   | 不新增 Markdown/日期/Playwright 依赖      |
| 9     | `marked`，随后单独引入 `dompurify`        |
| 10–13 | 按功能需要补充，不复制源 lockfile         |
| 15    | `@playwright/test` 和浏览器（最后才引入） |

每次 `package.json` 改动后都运行：

```bash
bun install
```

并提交由 Bun 生成的 `bun.lock`；禁止手工编辑锁文件。

## 4. 迭代 0：冻结基线，建立学习节奏

### Why

先确认你能在当前项目中安装、运行、测试和构建。这个迭代的产出不是业务功能，而是可回滚的起点。

### 学什么

- `package.json` 脚本如何工作；
- Vite 如何从 `index.html → src/main.ts → App.vue` 启动；
- Bun Test 和 `vue-tsc` 的职责区别；
- 如何在有未提交修改的工作区安全开发。

### 最小改动

- 不迁移业务代码；
- 保存本节的基线命令结果；
- 阅读源项目入口、路由、auth store、API service 和 selector 契约；
- 可将本指南加入提交，但不要把业务迁移混进来。

### 验收

- [ ] `bun install` 成功；
- [ ] `bun test` 通过；
- [ ] `bun run type-check` 通过；
- [ ] `bun run build` 通过；
- [ ] `bun run check` 通过；
- [ ] `git status --short` 中的 `playground/` 删除记录仍然保留，没有被迁移操作撤销。

### 练习

1. 说出当前应用真正的挂载入口。
2. 找出源项目的四个 store 和七个页面。
3. 从 `SELECTORS.md` 找出五个必须保留的表单属性或 class。
4. 画出源项目“页面 → store → API → fetch”的调用链。

### 推荐提交

```text
chore: record migration baseline
```

## 5. 迭代 1：把 starter 改成最小 Vue 3 应用外壳

### Why

先练习 Vue 3 本身，不让 Router、Pinia 和 API 同时增加认知负担。

### 学什么

- `<script setup lang="ts">`；
- `ref`、`computed`、事件处理和模板绑定；
- SFC 的 template/script/style 边界；
- 为什么先删除 starter 展示，而不是马上复制完整 Conduit 页面。

### 最小改动

只修改或新增：

```text
src/App.vue
src/style.scss（必要时）
```

建议把 `HelloWorld` 替换为一个最小的 Conduit 页面壳：标题、一句说明、一个能改变状态的按钮。暂时不要引入 Router、Pinia、API、完整主题或所有旧组件。

### 验收

- [ ] `bun run dev` 能打开页面；
- [ ] 点击按钮能改变响应式状态；
- [ ] `<script setup lang="ts">` 通过类型检查；
- [ ] 不再依赖 `HelloWorld.vue`；
- [ ] `bun run type-check`、`bun run build`、`bun test` 通过。

### 练习

- 把 `ref` 改成 `computed` 派生显示文本；
- 为按钮添加键盘可操作的语义；
- 解释 `v-if` 和 `v-show` 在这个页面中的差异。

### 还不要做

不要在这一迭代复制源项目 `App.vue` 的 Header/Footer；先理解一个最小 SFC 的数据流。

### 推荐提交

```text
feat: replace starter with typed app shell
```

## 6. 迭代 2：抽取一个带类型 Props/Emits 的组件

### Why

真实应用不会把所有模板放在 `App.vue`。先抽取一个小组件，理解父子组件通信，再开始页面拆分。

### 学什么

- `defineProps`、`withDefaults`、`defineEmits`；
- 父组件向子组件传数据，子组件向父组件发事件；
- 局部类型和共享领域类型的区别；
- 空值和可选字段如何安全展示。

### 最小改动

新增：

```text
src/components/ArticlePreview.vue
```

可以先定义一个只满足当前练习的局部类型：

```ts
type PreviewArticle = {
  slug: string
  title: string
  description: string
  author: string
}
```

在 `App.vue` 中放一到两个 fixture；暂时不要引入 Article store 或 API。

### 验收

- [ ] Props 类型错误会被 `vue-tsc` 捕获；
- [ ] 组件通过 emit 通知父组件；
- [ ] 空描述、空头像等最小边界不会让组件崩溃；
- [ ] 组件包含未来需要的基础 class，例如 `.article-preview` 和 `.preview-link`；
- [ ] 类型检查和构建通过。

### 练习

1. 添加 `selected` 事件并在父组件中显示 slug。
2. 故意传错一个 prop，观察 `vue-tsc` 报错后再修复。
3. 思考何时应该把局部类型提取到 `src/types/realworld.ts`。

### 推荐提交

```text
feat: add typed article preview component
```

## 7. 迭代 3：只引入 Vue Router，建立导航骨架

### Why

先让 URL 和页面职责成立。后续每个功能都可以挂到一个明确的路由上，而不是继续把内容堆在 `App.vue`。

### 学什么

- `createRouter`、`createWebHistory`；
- `router-link`、`router-view` 和命名路由；
- 动态参数和 query；
- 懒加载页面；
- Vite alias 与 TypeScript 路径配置必须保持一致。

### 依赖

本迭代只添加 Router：

```bash
bun add vue-router
```

### 最小改动

新增或修改：

```text
src/router/index.ts
src/views/Home.vue
src/views/Login.vue
src/views/Register.vue
src/views/Article.vue
src/views/Profile.vue
src/main.ts
src/App.vue
vite.config.ts（如决定启用 @ alias）
```

先建立占位路由：

```text
/
/login
/register
/article/:slug
/profile/:username
```

`/settings`、`/editor` 等受保护路由留到迭代 7 再加入。占位页面是刻意的学习边界，不是偷懒。

### 验收

- [ ] Header 或导航能通过 `router-link` 切换页面；
- [ ] `/article/demo-slug` 能显示 `slug`；
- [ ] `/profile/alice` 能显示 `username`；
- [ ] 路由页面由 `<router-view />` 渲染；
- [ ] `type-check`、`build` 通过；
- [ ] 直接访问核心路由时行为已明确。

### 练习

- 添加 `/?page=2` 的 query 读取；
- 比较 `router-link` 与普通 `<a href>`；
- 为路由组件 props 使用显式类型；
- 解释为什么生产服务器需要 history fallback。

### 还不要做

不要在本迭代迁移旧仓库的全部页面、守卫、store 或 API 请求。

### 推荐提交

```text
feat: add typed route skeleton
```

## 8. 迭代 4：建立最小 TypeScript API 边界

### Why

在页面和 store 之前锁定 HTTP 契约，学习外部数据必须经过类型边界，而不是在组件里到处 `fetch`。

### 学什么

- 原生 `fetch`；
- `unknown`、泛型和类型守卫；
- `Accept`、`Content-Type`、JSON body；
- 2xx、4xx、5xx、204、malformed JSON 和 network error 的区别；
- 为什么 API service 应该是唯一的请求入口。

### 最小改动

新增：

```text
src/types/realworld.ts
src/services/api.ts
src/services/errors.ts
src/config.ts
env.d.ts（补 VITE_API_URL 类型时）
```

先只定义后续 Login/Home 会用到的最小类型：

```text
User
ApiErrors
ApiErrorPayload
ArticleSummary
ArticlesResponse
UserResponse
```

实现一个泛型 `request<T>()`，支持 GET/POST；不要同时实现所有文章、评论、Profile service。

默认 API：

```text
https://api.realworld.show/api
```

环境变量覆盖：

```bash
VITE_API_URL=http://localhost:8000/api bun run dev
```

### 测试

使用 `bun:test` mock `globalThis.fetch`，不要在单测中调用真实远程 API：

- 无 token 时没有 Authorization；
- 有 token 时精确发送 `Authorization: Token <token>`；
- JSON body 和 Content-Type 正确；
- 2xx JSON 返回解析数据；
- 204/无法解析 body 返回约定的空数据；
- HTTP 错误携带 status/data；
- network failure 转换成可识别的 connectivity error。

### 验收

- [ ] API wrapper 的 URL、method、headers、body 有单测；
- [ ] malformed JSON 不产生未捕获解析异常；
- [ ] 不使用大面积 `any`；
- [ ] `bun test`、`type-check`、`build` 通过。

### 练习

1. 写一个 `isApiErrors(value: unknown)` 类型守卫。
2. 比较 `null`、空对象和 malformed response 的语义。
3. 为 `request<T>()` 增加一个只读 GET 的调用示例。

### 推荐提交

```text
feat: add typed RealWorld request boundary
```

## 9. 迭代 5：只用 Pinia 完成本地认证状态

### Why

先学习 Pinia 和 localStorage 的边界，不把“有 token”误认为“后端已经验证登录”。真实 API 登录在下一迭代实现。

### 学什么

- `createPinia`、`defineStore`、state、getters、actions；
- 浏览器 `localStorage` 和 Bun 测试环境的差异；
- 纯状态转换和副作用持久化分离；
- `authenticated`、`unauthenticated`、暂时的 `loading` 状态。

### 依赖

```bash
bun add pinia
```

### 最小改动

新增：

```text
src/stores/index.ts
src/stores/auth-state.ts
src/stores/auth.ts
src/services/jwt.ts
```

建议：

- `auth-state.ts` 只负责纯状态转换；
- `jwt.ts` 只负责 `jwtToken` 读写；
- `auth.ts` 组合二者并暴露 Pinia action；
- Header 根据状态显示登录/退出入口；
- 可以先提供开发用的 `setLocalSession`，但要明确它不是 API 登录。

### 测试

- 缺少 token 为 `unauthenticated`；
- 保存和读取的 key 精确为 `jwtToken`；
- logout 清除 token 和 user；
- storage 中 malformed 数据不让应用崩溃；
- 状态转换不修改输入对象。

原 playground 里的 auth 状态练习已经删除，不再作为代码依赖。需要状态机时，在 `src/stores/auth-state.ts` 中重新实现最小生产版本，并在相邻的 `src/stores/auth-state.test.ts` 中从行为开始测试。

### 验收

- [ ] 刷新页面后本地 token 状态恢复；
- [ ] Header 能随 store 改变；
- [ ] 退出后 token 和用户状态清除；
- [ ] `bun test`、`type-check`、`build` 通过。

### 练习

- 为 `AuthStatus` 写联合类型；
- 写一个测试证明 state 没有被 action 原地修改；
- 说明为什么 Bun 单测不应直接假定浏览器 `window` 一定存在。

### 推荐提交

```text
feat: add local auth state with Pinia
```

## 10. 迭代 6：Login/Sign up 真实 API 垂直切片

### Why

现在才把表单、API、Pinia 和 Router 串成第一个真正的用户功能。

### 学什么

- `v-model` 和受控表单；
- 异步 Pinia action；
- API 字段错误展示；
- 登录成功 redirect；
- `POST /users/login` 和 `POST /users` 的 payload 差异。

### 最小实现顺序

**6A：Login**

1. Login 页面只接收 email/password。
2. 添加 `POST /users/login` service。
3. 成功后写入 auth store 并跳转 `/`。
4. 失败时显示 `{ errors: Record<string, string[]> }`。

**6B：Register**

1. 复用错误列表和 redirect 逻辑。
2. 添加 username/email/password。
3. 添加 `POST /users`。
4. 注册成功后复用同一套 session 写入逻辑。

本迭代不要添加 `date-fns`、`marked`、`dompurify` 或 Playwright。

### 必须保留的 DOM 契约

- `input[name="username"]`；
- `input[name="email"]`；
- `input[name="password"]`；
- `h1` 文案 `Sign in` / `Sign up`；
- `.error-messages`；
- 登录/注册成功后的站内 redirect，禁止开放重定向。

### 测试和验收

- [ ] submit 调用正确 endpoint/method/body；
- [ ] 422/401 错误在页面可见；
- [ ] network failure 不产生未捕获异常；
- [ ] 成功后 token 写入 `jwtToken`；
- [ ] 成功后跳转预期路径；
- [ ] `bun:test` 覆盖请求和错误分支；
- [ ] 手工验证空字段和重复提交。

### 推荐提交

```text
feat: add login and registration flow
```

## 11. 迭代 7：会话恢复和第一个受保护路由

> 完成于 2026-08-14：`/settings`、`/editor` 已受保护，启动时通过 `GET /user` 验证本地 token，并区分 4xx 与临时不可用状态。

### Why

认证真正有用的地方是“刷新仍能恢复”和“未登录不能访问受保护页面”。先只保护一个页面，理解守卫后再扩展。

### 学什么

- Router 全局守卫；
- `RouteMeta.requiresAuth` 类型；
- 应用启动时异步恢复；
- `loading`、`authenticated`、`unauthenticated`、`unavailable` 的区别；
- 4xx 和 5xx/network 不应被同样处理。

### 最小改动

新增或修改：

```text
src/views/Settings.vue（先做占位页）
src/views/ArticleEdit.vue（先做占位页）
src/router/index.ts
src/main.ts
src/stores/auth.ts
```

先给 `/settings` 加 `requiresAuth`，确认行为后再给 `/editor` 加守卫。实现 `GET /user`：

- 4xx：清除 token，进入 `unauthenticated`；
- 5xx/network：保留 token，进入 `unavailable`，允许降级浏览；
- 2xx 但 body 为空、JSON 畸形或缺少合法 `user`：保留 token，进入 `unavailable`；
- 2xx 且 `user` 通过类型校验：恢复 user 和 `authenticated`。

状态名统一使用 `unavailable`，不再引入含义重复的 `degraded`。

### 测试和验收

- [x] 未认证访问 `/settings` 跳 `/login`；
- [x] 有效 token 刷新后 user 恢复；
- [x] `/user` 4xx 清 token；
- [x] 5xx/network 保留 token；
- [x] 2xx 空 body、畸形 JSON 或缺少合法 `user` 时也保留 token，并进入 `unavailable`；
- [x] 守卫不会因初始化竞态错误跳转；
- [x] `router` 参数和 meta 有类型；
- [x] `bun test`、`type-check`、`build` 通过。

### 练习

- 用 memory history 测试守卫，不要先启动浏览器；
- 解释为什么 `loading` 不能直接等同于 `unauthenticated`；
- 为 `/?feed=following` 增加“需要认证”的判断，但暂时不实现 Feed。

### 推荐提交

```text
feat: add session restore and protected settings route
```

## 12. 迭代 8：Home Global Feed，再扩展标签和分页

> 8A 完成于 2026-08-14：已接入 `GET /articles`，并完成 loading、empty、error、重试和文章预览跳转。
>
> 8B 完成于 2026-08-14：`?page=N` 已转换为 `offset/limit`，`/tag/:tag` 已转换为 tag 过滤条件，并接入独立容错的 Popular Tags。
>
> 8C 完成于 2026-08-14：已接入携带 Token 的 `GET /articles/feed`，`/?feed=following` 受认证守卫保护，并支持 Your Feed 分页、空状态和退出后返回 Global Feed。

### Why

Home 是第一个完整的“API → store → list component → route query”垂直切片。先做 Global Feed，稳定后再增加标签、分页和 Your Feed。

### 学什么

- Pinia 异步列表状态；
- loading、empty、error 三种 UI；
- query string 和分页；
- 组件组合和 `update:currentPage`；
- 不同 feed 模式的请求差异。

### 最小实现顺序

**8A：Global Feed**

- `home` store 只支持 `GET /articles`；
- Home 显示标题、文章列表和加载状态；
- ArticlePreview 点击进入 `/article/:slug`。

**8B：分页和标签**

- `?page=N` 转换成 `offset/limit`；
- `/tag/:tag` 和 `tag` query；
- 空列表和非法 page 的稳定行为；
- tags sidebar 的 `GET /tags`。

**8C：Your Feed**

- 认证完成后才请求 `/articles/feed`；
- 未认证访问 `/?feed=following` 跳 `/login`。

### 改哪些文件

```text
src/stores/home.ts
src/components/ArticleList.vue
src/components/ArticlePreview.vue
src/components/ArticleMeta.vue
src/components/TagList.vue
src/components/VTag.vue
src/components/VPagination.vue
src/views/Home.vue
```

### 必须保留的 selector

`.feed-toggle`、`.article-preview`、`.article-meta`、`.preview-link`、`.author`、`.sidebar`、`.tag-list`、`.pagination`、`.page-item`、`.empty-feed-message`。

### 测试和验收

- [x] `/` 显示 Global Feed；
- [x] loading、空列表、API 错误有明确 UI；
- [x] `?page=N` 生成正确 offset/limit；
- [x] `/tag/:tag` 过滤正确；
- [x] tags 请求失败不会让首页白屏；
- [x] 分页当前项有 `.active`；
- [x] Your Feed 未登录按守卫契约跳转；
- [x] store/API 单测验证 8A endpoint 和响应解析；
- [x] 8B 单测验证 page/tag query。
- [x] 8C 单测验证 `/articles/feed`、Token、认证恢复和空列表。

### 练习

- 让分页组件只 emit，不直接操作 Router；
- 处理 `?page=abc`、`?page=0` 和超界页；
- 比较 Global、Your、Tag 三种 query。

### 推荐提交

```text
8A: feat: add global feed slice
8B: feat: add global feed tags and pagination
8C: feat: add authenticated user feed
```

## 13. 迭代 9：Article 详情和安全 Markdown

> 完成于 2026-08-14：已接入 `GET /articles/:slug`、详情 store、ArticleMeta 和安全 Markdown helper；404、异常响应、XSS 与外链属性都有自动化测试。

### Why

先做只读详情，理解动态路由、异步加载和 XSS 边界，再加入评论和收藏等写入操作。

### 学什么

- `GET /articles/:slug`；
- 动态路由参数；
- `marked` 和 `DOMPurify`；
- `v-html` 的安全边界；
- 详情页 loading/error/empty。

### 依赖

分两次添加，观察每次 lockfile 变化：

```bash
bun add marked
bun add dompurify
```

由于 Bun 测试环境没有浏览器 DOM，本迭代额外使用最新版 jsdom 作为**仅测试使用**的 DOM 实现，让 DOMPurify 的恶意 HTML 单测与浏览器执行同一套 helper：

```bash
bun add --dev jsdom @types/jsdom
```

不要在业务代码中导入 jsdom；它不会进入生产包。

### 最小改动

```text
src/stores/article.ts（先只做详情）
src/views/Article.vue
src/components/ArticleMeta.vue
src/components/VTag.vue
src/services/markdown.ts
```

### 安全要求

```ts
DOMPurify.sanitize(marked.parse(body))
```

只有清理结果才能进入 `v-html`。不要把 Markdown 原文或 `marked.parse` 的未清理结果直接插入 DOM。

### 测试和验收

- [x] `/article/:slug` 显示标题、作者、日期、tags 和正文；
- [x] 文章不存在显示可见错误；
- [x] 基础 Markdown 正常渲染；
- [x] `<script>`、事件属性和危险 URL 被清除；
- [x] 页面只有可审计的 sanitized `v-html`；
- [x] 外链新窗口具备 `rel="noopener noreferrer"`；
- [x] 安全单测覆盖恶意 HTML。

### 练习

- 测试 null、空字符串和 malformed body；
- 解释为什么“看起来是自己的 API”也必须清理 HTML；
- 对 markdown helper 做纯函数测试。

### 推荐提交

```text
feat: add article detail with safe markdown
```

## 14. 迭代 10：评论和收藏

> 完成于 2026-08-14：已接入评论 GET/POST/DELETE 和收藏 POST/DELETE；空白评论、本地提交状态、失败保留输入、204 fallback、删除和跨 store 收藏同步均已覆盖。

### Why

这一步练习登录状态参与页面交互、异步表单、局部列表更新和跨 store 同步。

### 学什么

- 评论读取/创建/删除；
- 受控 textarea 和提交状态；
- 204、空 body、响应不完整时的 fallback；
- favorite/unfavorite；
- article 状态和 home 列表同步。

### 最小实现顺序

**10A：读取评论**

```text
GET /articles/:slug/comments
```

**10B：发表评论**

```text
POST /articles/:slug/comments
```

**10C：删除评论**

```text
DELETE /articles/:slug/comments/:id
```

**10D：收藏**

```text
POST /articles/:slug/favorite
DELETE /articles/:slug/favorite
```

不要在这一迭代同时实现编辑器和 Profile。

### 改哪些文件

```text
src/stores/article.ts
src/components/Comment.vue
src/components/CommentEditor.vue
src/components/ArticleActions.vue
src/components/ListErrors.vue
src/views/Article.vue
```

### 必须保留的 selector/文案

- `textarea[placeholder="Write a comment..."]`；
- `.comment-form`、`.card`、`.card-block`、`.comment-author-img`、`.mod-options`；
- `Post Comment`；
- `Favorite` / `Unfavorite`。

### 测试和验收

- [x] 未登录用户看到登录/注册提示；
- [x] 登录用户可以发表评论；
- [x] 空白评论不能提交；
- [x] 提交期间按钮禁用或显示 loading；
- [x] 创建失败保留输入并显示错误；
- [x] 响应不完整时重新获取评论；
- [x] 删除 2xx 后本地评论消失；
- [x] 收藏后详情和 Home 列表状态同步；
- [x] Bun 单测覆盖成功、失败、204 和 network failure。

### 推荐提交

```text
feat: add comments and article favorites
```

## 15. 迭代 11：创建、编辑和删除文章

### Why

编辑器是第一个完整写入型功能，练习表单模型、创建/更新复用和受保护路由。

### 学什么

- `ArticleDraft` 与返回的 `Article` 区别；
- `POST`、`PUT`、`DELETE` payload；
- `/editor` 与 `/editor/:slug` 页面复用；
- tag 添加/删除；
- 字段级错误和防重复提交。

### 最小实现顺序

1. `/editor` 新建；
2. 成功后进入详情；
3. `/editor/:slug` 编辑；
4. 删除文章并回到首页；
5. 添加离开页面时的状态重置（如果确有需要）。

### 改哪些文件

```text
src/types/realworld.ts
src/services/api.ts
src/services/articles.ts
src/views/ArticleEdit.vue
src/stores/article.ts
src/stores/home.ts
src/components/ArticleActions.vue
src/components/ListErrors.vue
src/router/index.ts
tests/article-lifecycle-service.test.ts
tests/article-store.test.ts
tests/router.test.ts
tests/auth-guard.test.ts
```

### API

```text
POST /articles
PUT /articles/:slug
DELETE /articles/:slug
```

### 必须保留的 DOM 契约

- `input[name="title"]`；
- `input[name="description"]`；
- `textarea[name="body"]`；
- `input[placeholder="Enter tags"]`；
- `Publish Article`、`Delete Article`；
- `.error-messages`。

### 测试和验收

- [x] 必填字段缺失时不能提交；
- [x] 新建调用 POST，编辑调用 PUT；
- [x] 成功后跳转详情；
- [x] 删除后返回首页；
- [x] API 字段错误可见；
- [x] 未认证访问 editor 被守卫拦截；
- [x] 连续点击不会产生重复提交。

### 本轮落地记录

- `/editor` 和 `/editor/:slug` 复用同一个 TypeScript 表单，编辑模式会先读取文章并生成独立 `ArticleDraft`；
- store 统一裁剪必填字段、过滤空标签并去重，校验失败不会发起请求；
- 作者在详情页看到 `Edit Article` 和 `Delete Article`，其他用户继续看到收藏操作；
- 创建和编辑成功后进入最新 slug 的详情页，删除成功后回首页；
- 更新或删除文章时同步 Home 已存在的列表项，但不会把详情 `body` 写入摘要列表；
- POST、PUT、DELETE、204、422、异常响应、网络失败和编辑路由保护均有 Bun 回归测试。

验收记录（2026-08-14）：`bun run check`、93 个 Bun 测试和 `bun run build` 全部通过；浏览器使用本地 mock API 验证了未登录守卫、空字段拦截、422 错误、双击只创建一次、编辑预填与 PUT、删除 204 后回首页，控制台无错误。

### 练习

- 把表单 UI 模型与 API payload 分开；
- 为 `addTag/removeTag` 写纯函数测试；
- 设计删除确认行为。

### 推荐提交

```text
feat: add article editor lifecycle
```

## 16. 迭代 12A–12D：逐步加入 Profile 和用户关系

### Why

Profile 会复用文章列表、分页和认证状态，适合练习“组合已有模块”，而不是复制一套新的列表实现。

### 学什么

- `profile` store；
- 动态用户名参数；
- profile article/favorites feed；
- Follow/Unfollow；
- route name 区分 tab；
- eventually consistent API 的局部重试；
- Home 与 Article 的跨 store 同步。

这一组必须拆成四个可以独立运行、独立提交的子迭代，不能在一个提交中一次完成。

### 12A：只读 Profile 和用户文章

1. [x] 请求 `/profiles/:username`；
2. [x] 渲染头像、username、bio；
3. [x] 复用 `ArticleList` 显示该用户的文章；
4. [x] 处理 profile 不存在、loading 和路由参数变化。

本轮实现记录：

- 新增独立 `profile` store，Profile 和作者文章列表拥有各自的 loading、success、error 状态；
- Profile 404 最多重试两次，每次间隔 400ms，兼容注册后短暂查不到用户的最终一致性 API；
- `/profile/:username?page=2` 使用现有分页解析和 `ArticleList`，请求 `GET /articles?author=:username`；
- `image: null`、空字符串或加载失败时使用 `/default-avatar.svg`；
- request id 防止快速切换用户名时，较慢的旧请求覆盖新 Profile。

推荐提交：

```text
feat: add read only user profiles
```

### 12B：Favorited Articles

1. [x] 添加 `/profile/:username/favorites`；
2. [x] 根据 route name 切换文章/收藏 tab；
3. [x] 复用列表和分页，不复制第二套组件。

本轮实现记录：

- `ArticlesQuery` 增加 `favorited` 过滤条件，并保留可选 Token；
- `profile` store 复用同一份文章状态，根据 tab 请求 `author` 或 `favorited`；
- 两个 tab 使用 route name 作为唯一状态来源，切换 tab 时自动清除旧分页 query；
- 收藏列表沿用 `ArticleList`、分页、loading、空态、错误态和 request id，未复制第二套列表。

推荐提交：

```text
feat: add favorited articles tab
```

### 12C：Follow/Unfollow

1. [x] 登录后才允许 follow action；
2. [x] 实现 POST/DELETE；
3. [x] 请求成功后同步按钮状态；
4. [x] 单独测试失败时保留原 profile。

本轮实现记录：

- 未登录点击 Follow 会进入 Login，并通过安全的 `redirect` query 在登录后返回原 Profile；
- `POST /profiles/:username/follow` 和 `DELETE /profiles/:username/follow` 统一携带 Token，用户名经过 URL 编码；
- Follow/Unfollow 提交期间按钮禁用，成功后使用服务端返回的 Profile 更新 `following`；
- 请求失败或响应结构异常时不做乐观更新，原 Profile 和按钮状态保持不变，同时显示局部错误；
- 查看自己的 Profile 时显示 Settings 入口，不显示关注自己的按钮。

推荐提交：

```text
feat: add profile follow actions
```

### 12D：Your Feed 和跨列表状态同步

1. [x] Home 增加 `/articles/feed`；
2. [x] 未登录访问 `/?feed=following` 跳 `/login`；
3. [x] 收藏/取消收藏后同步当前文章与 Home 列表；
4. [x] 验证刷新后 feed/tab 状态可由 URL 恢复。

本轮复核记录：

- Your Feed 请求和认证守卫已在 8C 落地，本轮不复制第二套实现；
- 收藏与详情/Home Store 同步已在 10D 落地，本轮补充取消收藏的反向同步回归测试；
- Router 回归测试明确锁定 `/?feed=following&page=2`，认证恢复后仍保留完整 URL；
- 浏览器刷新后会继续请求 `/articles/feed?limit=10&offset=10`，Profile Favorites 的路径、tab 和分页 query 也能恢复。

推荐提交：

```text
feat: add personalized feed and favorite sync
```

### 改哪些文件

```text
src/types/realworld.ts
src/services/profiles.ts
src/services/articles.ts
src/stores/profile.ts
src/views/Profile.vue
public/default-avatar.svg
tests/profile-service.test.ts
tests/profile-store.test.ts
src/stores/home.ts
src/stores/article.ts
src/components/ArticleList.vue
```

### API

```text
GET /profiles/:username
POST /profiles/:username/follow
DELETE /profiles/:username/follow
GET /articles?author=:username
GET /articles?favorited=:username
GET /articles/feed
```

### 测试和验收

- [x] profile 和 favorites 路径可访问、可刷新；
- [x] profile 不存在时不是白屏；
- [x] profile 获取最多重试两次、间隔 400ms（若保留源行为）；
- [x] Follow/Unfollow 请求和按钮文字正确；
- [x] Home/Article 的 favorite 状态同步；
- [x] Your Feed 未认证按契约跳转；
- [x] `.profile-page`、`.user-info`、`.user-img`、`.user-pic` 存在；
- [x] `image: null` 或空字符串使用默认头像。

12A 验收记录（2026-08-14）：`bun run check`、Bun 全量测试和 `bun run build` 通过；浏览器验证了公开 Profile、默认头像、12 篇文章分页、空文章用户、404 重试后错误页和路由用户名变化，正常路径控制台无错误。

12B 验收记录（2026-08-14）：`bun run check`、108 个 Bun 测试和 `bun run build` 通过；浏览器验证了 My Articles/Favorited Articles 切换、收藏列表分页、`/profile/:username/favorites?page=2` 刷新恢复、返回作者文章时重置分页和空收藏状态，控制台无错误。

12C 验收记录（2026-08-14）：`bun run check`、111 个 Bun 测试和 `bun run build` 通过；浏览器验证了未登录 Follow 跳转登录并返回、登录后 Follow/Unfollow 的 POST/DELETE 与按钮切换、500 失败时保留原 Profile 并显示错误，正常路径控制台无错误。

12D 验收记录（2026-08-14）：`bun run check`、113 个 Bun 测试和 `bun run build` 通过；浏览器验证了未登录访问 Your Feed 第二页时的登录 redirect、登录和刷新后 `feed=following&page=2` 恢复、收藏/取消收藏双向请求，以及 Favorites 标签页刷新恢复，正常路径控制台无错误。

### 练习

- 解释为什么 retry 应放 store/service，而不是模板；
- 让同一个 `ArticleList` 支持 Home、Profile 和 Favorites；
- 处理路由复用时的重新请求。

## 17. 迭代 13：Settings、退出登录和错误体验

### Why

Settings 完成认证闭环，同时集中练习用户信息更新、错误格式化和退出操作。

### 学什么

- `GET/PUT /user`；
- 表单初始化和提交；
- 空密码不覆盖旧密码；
- auth store 更新后的 Header/Profile 响应；
- API 错误、网络错误和 unavailable 的用户体验。

### 改哪些文件

```text
src/views/Settings.vue
src/stores/auth.ts
src/services/errors.ts
src/services/format.ts
src/components/TheHeader.vue
```

### API

```text
GET /user
PUT /user
```

### 测试和验收

- [x] `/settings` 只能由登录用户访问；
- [x] 能显示和编辑 username/email/image/bio；
- [x] 空密码不被发送为覆盖值；
- [x] 保存成功后 auth store 和 Header 更新；
- [x] `Update Settings` 和 `Or click here to logout` 文案符合契约；
- [x] 错误出现在 `.error-messages`；
- [x] 退出清除 `jwtToken` 并回首页；
- [x] token 不出现在日志或普通页面文本。

本轮实现记录：

- 新增 `PUT /user` 的类型化 service，使用当前 Token 并发送 `{ user: settings }`；
- auth store 在服务端返回合法 User 后统一更新用户和可能轮换的 Token，Header 会立即显示新 username；
- Settings 表单从当前会话预填 image、username、bio 和 email，密码始终为空，不填写时不会进入请求 body；
- 422 与网络错误继续使用现有 `.error-messages` 格式，失败时保留原用户和登录状态；
- 保存成功后进入更新后的 Profile；页面内退出按钮清除 `jwtToken` 并返回首页；
- 复用现有 `ListErrors`、auth store 和 App Header，没有创建重复的格式化工具或第二套 Header。

验收记录（2026-08-14）：`bun run check`、117 个 Bun 测试和 `bun run build` 通过；浏览器验证了未登录守卫、表单预填、422 错误、空密码 PUT、Token 轮换、Header/Profile 更新和退出清理，页面未显示 Token，正常路径控制台无错误。

### 推荐提交

```text
feat: add settings and logout flow
```

## 18. 迭代 14：主题、静态资源和 RealWorld DOM 契约

### Why

功能可以工作后，再把视觉主题和外部 selector 契约接进来。这样主题问题不会掩盖早期 Vue/TS/API 问题。

### 学什么

- git submodule 的来源和更新方式；
- 共享 CSS 与应用 CSS 的边界；
- 默认头像、favicon、manifest、robots；
- 为什么 class、表单 `name`、placeholder 和可见文案也是 API；
- 生产构建不应手工复制 `dist`。

### 最小改动

当前目标仓库还没有源项目的 `.gitmodules` 和 `realworld/` 目录，因此第一次接入要先登记 submodule。为复现参考仓库的测试/主题契约，固定到参考仓库当前使用的 commit `dd53ae6ef11e492a74feabc8043133e9f5283967`：

```bash
git submodule add https://github.com/realworld-apps/realworld realworld
git -C realworld checkout dd53ae6ef11e492a74feabc8043133e9f5283967
git add .gitmodules realworld
git submodule update --init --recursive
git submodule status
```

submodule 提供主题和规范：

```text
realworld/assets/theme/styles.css
realworld/specs/e2e/SELECTORS.md
realworld/specs/e2e/*.spec.ts
```

以下是**目标应用自己的静态资源**，不来自 submodule。只从参考仓库逐个复制所需文件，不要复制参考仓库的整个 `public/` 或 `dist/`：

```bash
cp /home/pax/Project/github/vue-realworld-example-app/public/default-avatar.svg public/
cp /home/pax/Project/github/vue-realworld-example-app/public/favicon.ico public/
cp /home/pax/Project/github/vue-realworld-example-app/public/manifest.json public/
cp /home/pax/Project/github/vue-realworld-example-app/public/robots.txt public/
```

复制后确认：

```text
public/default-avatar.svg
public/favicon.ico
public/manifest.json
public/robots.txt
```

在 `src/main.ts` 引入共享主题后，再决定删除或缩减当前 `src/style.scss`。不要在同一个提交中重构所有模板。

无引用后再删除：

```text
src/components/HelloWorld.vue
src/assets/hero.png
src/assets/vite.svg
src/assets/vue.svg
```

### 验收

- [x] `git submodule status` 显示上述固定 commit；
- [x] `default-avatar.svg`、favicon、manifest 可从 preview 加载；
- [x] null/空头像使用默认头像；
- [x] `.navbar`、`.nav-link`、`.banner`、`.container`、`.feed-toggle`、`.article-preview`、`.article-meta`、`.article-content`、`.article-page`、`.sidebar`、`.tag-list`、`.card`、`.comment-form`、`.profile-page`、`.pagination`、`.error-messages` 存在；
- [x] 表单 `name` 和 placeholder 与 `SELECTORS.md` 一致；
- [x] 关键文案包括 `Home`、`Global Feed`、`Your Feed`、`Sign in`、`Sign up`、`Publish Article`、`Update Settings`、`Post Comment`、`Favorite/Unfavorite`、`Follow/Unfollow`；
- [x] 深层链接在 preview/部署服务器有 history fallback。

本轮实现记录：

- 新增 `realworld` submodule，并固定到 `dd53ae6ef11e492a74feabc8043133e9f5283967`；
- 从参考仓库复制 `default-avatar.svg`、`favicon.ico`、`manifest.json` 和 `robots.txt`，`index.html` 改用 Conduit 标题、favicon 和 manifest；
- `src/main.ts` 先加载 `realworld/assets/theme/styles.css`，再加载现有 `style.scss` 作为项目覆盖层，没有在同一轮重写全部页面样式；
- 对齐文章、评论、Profile 和导航头像 fallback，以及 tag、favorite、logout、comment delete 的 RealWorld selector class；
- 新增 `tests/realworld-contract.test.ts`，用 6 个契约测试覆盖静态资源、主题加载顺序、DOM class、表单属性、可见文案和默认头像；
- Bun 测试配置排除 submodule 自带的 Playwright 文件，避免 `bun test` 把上游 E2E 当成本项目单元测试执行。

验收记录（2026-08-14）：`bun run check`、123 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 验证了首页、文章详情、Profile、默认头像、主题与关键 selector，390px 宽度无横向溢出且控制台无错误；preview 下首页、文章深层链接和 4 个静态资源均返回 200。

### 推荐提交

```text
chore: add RealWorld theme and static assets
```

## 19. 迭代 15：逐步引入 Playwright，最后再跑官方全套

### Why

Playwright 是交付验证工具，不是 Vue 3/TypeScript 入门的前置条件。等至少一个完整垂直切片可运行后再引入，失败才容易定位。

### 进入条件

- `/`、`/login` 和一个受保护路由能稳定打开；
- API base URL、host、port 和 history fallback 已确定；
- DOM selector、表单属性和关键文案已按 `SELECTORS.md` 固定；
- 有测试 API 或隔离测试数据策略；
- 本地/CI 能安装 Chromium。

### 最小实现顺序

1. 添加 `@playwright/test` 和浏览器；
2. 新建根目录 `playwright.config.ts`，明确测试目录和服务器配置；
3. 先写一个首页/导航 smoke；
4. 再验证 login/register 和 protected redirect；
5. 再验证 article/comments；
6. 再验证 profile/settings/favorite/follow；
7. 最后运行官方套件和 `@security`。

依赖和脚本：

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

`--with-deps` 会安装系统包，只在明确支持且具备相应权限的 Debian/Ubuntu CI 中使用：

```bash
bunx playwright install --with-deps chromium
```

`playwright.config.ts` 至少要明确：

```ts
import { defineConfig } from '@playwright/test'
import { baseConfig } from './realworld/specs/e2e/playwright.base'

export default defineConfig({
  ...baseConfig,
  testDir: './realworld/specs/e2e',
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:8080',
  },
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1 --port 8080 --strictPort',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

如果项目后续把 host/port 固定进 `vite.config.ts`，这里仍要与之保持一致。不要照搬源仓库的 `bun run serve`，因为当前目标仓库只有 `dev` 脚本；只有实际添加了 `serve` 别名后才能引用它。

15A 先把本项目自己的最小 smoke 放在 `tests/e2e/`，因此当前配置使用 `testDir: './tests/e2e'`，并以 `bunx vite --host 127.0.0.1 --port 4173 --strictPort` 启动隔离测试服务器。等本地 smoke 稳定后，再扩展到 `realworld/specs/e2e`，不要第一次接入就同时处理全部官方用例。

保留 Bun 单测 `test`，新增并确保真实存在：

```json
{
  "test": "bun test",
  "test:e2e": "bunx playwright test"
}
```

15A 只新增真实可运行的 `test:e2e`；在 security 用例尚未接入时，不先放置一个没有测试可执行的占位脚本。真正接入 security 用例时再增加：

```json
{
  "test:e2e:security": "bunx playwright test --grep @security"
}
```

### Playwright 验收

- [x] 首页和登录 smoke 通过；
- [x] `playwright.config.ts` 的 `testDir`、`baseURL`、`webServer.command` 与当前脚本一致；
- [x] 深层路由刷新不 404；
- [x] 未登录受保护路由跳 `/login`；
- [ ] `window.__conduit_debug__` 存在且不打印 token；
- [ ] 普通套件与 security 套件有独立命令；
- [ ] 官方 E2E 的通过/失败/未运行状态有真实输出记录；
- [ ] E2E 不通过修改测试来掩盖实现缺陷。

15A 实现记录：

- 安装 `@playwright/test`，并通过 `bunx playwright install chromium` 安装本地 Chromium；
- `playwright.config.ts` 复用 submodule 的 `baseConfig`，当前只执行 `tests/e2e` 下的本地 smoke；
- 新增 3 个导航 smoke：隔离 API 的首页 DOM 契约、`/login` 直接打开和刷新、未登录访问 `/settings` 的 redirect；
- 首页测试通过 `page.route` 返回固定 articles/tags，避免把公共 API 的稳定性混入浏览器测试；
- `bunfig.toml` 排除 `tests/e2e/**`，Bun 单测与 Playwright 测试保持各自的运行器边界。

15A 验收记录（2026-08-14）：3 个 Playwright Chromium smoke、`bun run check`、123 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 再次验证 `/login` 与 `/settings` redirect，控制台无错误。官方套件和 security 套件本轮未运行，留到后续小迭代。

15B 实现记录：

- 新增 `tests/e2e/auth.spec.ts`，继续通过 Playwright route mock 隔离公共 API；
- 登录测试验证 `{ user: { email, password } }` 请求、`jwtToken` 持久化，以及登录后返回原受保护路由；
- 注册测试验证 `{ user: { username, email, password } }` 请求、认证导航和 Token 持久化；
- 会话恢复测试预置 `jwtToken`，验证刷新 `/settings` 时以 `Token <jwt>` 请求 `/user`，并在进入页面前恢复表单用户；
- 浏览器断言 Token 只保存在 localStorage/请求头，不出现在普通页面文本中。

15B 验收记录（2026-08-14）：新增 3 个认证 E2E，Playwright Chromium 累计 6 个测试通过；`bun run check`、123 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 验证真实表单登录、认证导航、默认头像和 `jwtToken` 持久化，页面未显示 Token，控制台无错误。

15C 实现记录：

- 新增 `tests/e2e/article.spec.ts`，覆盖文章 Markdown、标签、评论列表和默认头像；
- 评论测试验证 `{ comment: { body } }` 请求、创建后即时显示，以及携带 Token 删除自己的评论；
- 收藏测试验证 POST/DELETE `/favorite`、`Favorite/Unfavorite` 文案、计数和 `.btn-outline-primary/.btn-primary` 状态；
- 测试发现 `.ion-trash-a` 为空元素时浏览器判定不可见，导致官方 selector 无法点击；保留契约 class，并加入无外部字体依赖的可见删除符号。

15C 验收记录（2026-08-15）：新增 3 个文章交互 E2E，Playwright Chromium 累计 9 个测试通过；`bun run check`、123 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 实际验证发表评论、可见删除图标、删除评论和收藏切换，控制台无错误。

15D 实现记录：

- 新增 `tests/e2e/profile-settings.spec.ts`，继续使用确定性的 API route mock，不依赖公共 API 数据；
- Profile 测试覆盖默认头像、username、bio、My Articles，以及切换 `/profile/:username/favorites` 后使用 `favorited` 查询；
- Follow 测试覆盖 POST/DELETE `/profiles/:username/follow`、按钮文案和 `Token <jwt>` 请求头；
- Settings 测试覆盖 PUT `/user`、空 password 省略、轮换 Token 持久化、更新后 Profile 导航和 logout 清理会话；
- 3 个浏览器路径首次通过后未发现新的业务实现缺口，因此本轮只增加 E2E 契约和进度记录。

15D 验收记录（2026-08-15）：新增 3 个 Profile/Settings E2E，Playwright Chromium 累计 12 个测试通过；`bun run check`、123 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 实际验证 Follow/Unfollow 的 POST、DELETE 顺序与认证头，页面未显示 Token，控制台无错误。官方完整 E2E 和 security 套件仍未运行，留到后续小迭代。

15E 差距分析：

官方 submodule 目录共有 12 个可发现的 spec 文件、139 个测试；其中 16 个属于 `@security`，其余 123 个依赖真实 API 数据或服务端错误注入。本项目当前本地套件为 4 个 spec 文件、12 个测试。

| 官方 spec                                              | 测试数 | 当前状态                                              | 下一步                           |
| ------------------------------------------------------ | -----: | ----------------------------------------------------- | -------------------------------- |
| `articles.spec.ts`                                     |     10 | 已覆盖渲染、收藏和创建/编辑/删除主流程；权限边界仍缺  | 后续补文章异常与权限边界         |
| `auth.spec.ts`                                         |      8 | 已覆盖登录、注册、会话恢复；错误登录和无效 Token 缺   | 15F 与错误态一起补               |
| `comments.spec.ts`                                     |      9 | 已覆盖新增、删除、Token；长文本、刷新保留和权限边界缺 | 后续补充                         |
| `navigation.spec.ts` + `url-navigation.spec.ts`        |     23 | 已覆盖基础导航、标签、分页和 Your Feed URL 主流程     | 后续补直接跳转与组合边界         |
| `social.spec.ts` + Profile/Settings                    |     13 | 已覆盖 Profile、Favorites、Follow、Settings 主流程    | 补异常与回归                     |
| `null-fields.spec.ts`                                  |     11 | 默认头像有局部覆盖；Settings 字段和头像清空组合缺     | 后续补充                         |
| `error-handling.spec.ts` + `user-fetch-errors.spec.ts` |     45 | 尚未接入官方注入场景                                  | 需要先固定 API mock/错误注入边界 |
| `health.spec.ts`                                       |      4 | 尚未单独执行                                          | 依赖 API 可用性策略              |
| `xss-security.spec.ts`                                 |     16 | Bun Markdown 单测已有；官方安全 E2E 未执行            | 最后单独运行 `@security`         |

15E 实现记录：

- 新增 `playwright.official.config.ts`，将官方 `realworld/specs/e2e` 与本地 `tests/e2e` 隔离；
- 新增 `bun run test:e2e:official:list`，只列出测试，不创建用户、不写入文章、不调用公共 API；
- `tsconfig.node.json` 纳入官方配置，避免配置文件脱离 TypeScript 检查；
- `tests/realworld-contract.test.ts` 增加配置隔离契约，防止把官方套件误并入默认 `bun run test:e2e`。

15E 验收记录（2026-08-15）：`bun run test:e2e:official:list` 发现 139 个测试、12 个官方 spec 文件；7 个 RealWorld 契约单测通过，未执行官方测试主体，也未触碰公共 API 数据。当前官方完整 E2E 和 security 仍是明确未运行状态。

15F 实现记录：

- 新增 `tests/e2e/article-lifecycle.spec.ts`，继续使用隔离的 Playwright API mock；
- 创建测试验证 `POST /api/articles`、标准 Article payload、Token，以及跳转到新文章详情；
- 编辑测试验证 `PUT /api/articles/:slug`、读取旧草稿、移除旧标签、写入新标签，以及 slug 变化后的跳转；
- 删除测试验证作者可见的 `Delete Article`、204 响应、Token 和返回 Global Feed；
- 3 个路径均复用了现有 Article/ArticleEdit 实现，本轮没有新增业务抽象。

15F 验收记录（2026-08-15）：新增 3 个文章生命周期 E2E，Playwright Chromium 累计 15 个测试通过；`bun run check`、124 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 实际创建文章并验证 POST payload、认证头、详情跳转和安全 Token 展示，控制台无错误。官方文章权限、异常响应和标签编辑完整套件仍未运行。

15G 实现记录：

- 新增 `tests/e2e/navigation-query.spec.ts`，覆盖 URL 与 API query 的同步关系；
- 标签路由验证 `/tag/vue`、`tag=vue`、默认分页参数和 active 标签；
- Your Feed 验证 `/?feed=following`、`/api/articles/feed`、Token 请求头和 active feed；
- 分页验证 `/?page=2`、`offset=10`、active page，以及点击第 1 页后清理 query 并请求 `offset=0`；
- 本轮只增加浏览器契约，没有修改已有 Home、Router 或 store 实现。

15G 验收记录（2026-08-15）：新增 3 个 URL/query E2E，Playwright Chromium 累计 18 个测试通过；`bun run check`、124 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 实际验证 `/tag/vue` 的请求参数、标签展示和默认头像，控制台无错误。官方完整 navigation/url-navigation 套件仍未运行。

15H 实现记录：

- 新增 `tests/e2e/null-fields.spec.ts`，继续用 Playwright route mock 隔离 API 数据；
- 公开 Profile 使用 `image: null`、`bio: null`，验证默认头像、友好 bio 文案和文章作者头像 fallback；
- 认证文章详情使用 null 作者与评论作者，验证导航栏、文章作者、评论编辑器和评论列表头像都回退到 `/default-avatar.svg`；
- Settings 使用 null 的 `image` 与 `bio`，验证表单初始化为空字符串，而不是把 `null` 渲染成文本；
- 删除过宽的整页 `not.toContainText('null')` 断言，保留与字段行为直接相关的 DOM 断言，避免把 fixture 标题和 tag 当成缺陷。

15H 验收记录（2026-08-15）：新增 3 个 null/empty 字段 E2E，Playwright Chromium 累计 21 个测试通过；`bun run check`、124 个 Bun 测试、`bun run build` 和 `git diff --check` 通过；Chrome DevTools 使用本地 null 数据 fixture 实测 Profile 默认头像、文章作者默认头像和友好 bio，页面无控制台消息。官方 `null-fields`、完整 error-handling 和 security 套件仍未运行。

下一轮 15I：错误态与 API 异常 E2E。

- 先覆盖登录失败、无效 Token、Profile/文章 404 和 5xx 的可见错误态；
- 继续使用隔离 route mock，不连接公共 API，不提前接入官方完整套件；
- 重点学习 Playwright 的响应注入、重试/错误边界和“页面可恢复”验收。

### 推荐提交

至少拆成：

```text
test: add Playwright navigation smoke
test: add RealWorld end to end coverage
test: add security regression coverage
```

## 20. 每个迭代的统一完成定义

无论功能大小，每个迭代都必须满足：

- [ ] 改动范围只涉及当前功能切片；
- [ ] 至少新增或更新一个针对当前行为的测试，或记录为什么只能做手工 smoke；
- [ ] `bun run type-check` 通过；
- [ ] `bun run build` 通过；
- [ ] `bun test` 通过；
- [ ] 已验证一个 happy path 和一个空态/失败 path；
- [ ] 没有同名 `.js`/`.ts` 长期并存；
- [ ] 没有撤销已清理的 `playground/` 删除记录，也没有重新引入练习目录；
- [ ] 提交说明包含学习主题、功能范围和未完成项；
- [ ] 下一迭代的前置条件已明确，没有偷偷提前实现下一阶段。

### 20.1 测试分层建议

| 层级                   | 适合验证什么                                    | 何时使用               |
| ---------------------- | ----------------------------------------------- | ---------------------- |
| Bun 纯函数单测         | 类型守卫、分页、错误、状态转换、Markdown helper | 最早开始，快速且稳定   |
| Bun service/store 单测 | HTTP headers/payload、Pinia action、状态同步    | API 和 store 完成后    |
| Router/集成测试        | 守卫、参数、query、跨组件导航                   | 路由和认证稳定后       |
| Playwright smoke       | 首页、登录、跳转、刷新、关键 selector           | 至少一个完整垂直切片后 |
| 官方 RealWorld E2E     | 全部用户流程和 security                         | 最后交付阶段           |

当前项目虽然安装了 `vitest`，但实际测试文件和脚本使用 `bun:test`。除非另有明确决策，不要在学习路线中同时引入第二套测试运行方式。

## 21. 最终兼容性验收矩阵

### 21.1 路由

最终应支持并可直接刷新：

```text
/
/?feed=following
/?page=N
/tag/:tag
/tag/:tag?page=N
/login
/register
/editor
/editor/:slug
/settings
/profile/:username
/profile/:username/favorites
/article/:slug
```

其中 `/settings`、`/editor`、`/editor/:slug` 和 `/?feed=following` 需要认证；未认证时跳转 `/login`。

### 21.2 API

最终需要覆盖：

```text
POST   /users
POST   /users/login
GET    /user
PUT    /user
GET    /articles
GET    /articles/:slug
POST   /articles
PUT    /articles/:slug
DELETE  /articles/:slug
GET    /articles/:slug/comments
POST   /articles/:slug/comments
DELETE /articles/:slug/comments/:id
POST   /articles/:slug/favorite
DELETE /articles/:slug/favorite
GET    /profiles/:username
POST   /profiles/:username/follow
DELETE /profiles/:username/follow
GET    /tags
```

同时保持：

- `VITE_API_URL` 覆盖 `https://api.realworld.show/api`；
- localStorage key `jwtToken`；
- `Authorization: Token <token>`；
- 错误结构 `{ errors: { field: string[] } }`；
- 204、空 body、malformed JSON、network failure 的稳定处理；
- `/user` refresh：4xx 清 token 并进入 `unauthenticated`；5xx/network，或 2xx 但 body 为空、JSON 畸形/缺少合法 `user` 时，保留 token 并进入 `unavailable`。

### 21.3 `SELECTORS.md` 和 debug 契约

以下仅是摘要，**完整契约必须逐项阅读并核对 `realworld/specs/e2e/SELECTORS.md`**。最终至少保持：

- 表单：`username`、`email`、`password`、`title`、`description`、`body`、`image`、`bio`；
- placeholder：`Enter tags`、`Write a comment...`；
- 核心 class：`.navbar`、`.navbar-brand`、`.nav-link`、`.banner`、`.container`、`.feed-toggle`、`.article-preview`、`.article-meta`、`.article-content`、`.article-page`、`.preview-link`、`.author`、`.sidebar`、`.tag-list`、`.tag-default`、`.tag-pill`、`.card`、`.card-block`、`.comment-form`、`.comment-author-img`、`.mod-options`、`.ion-trash-a`、`.profile-page`、`.user-info`、`.user-img`、`.user-pic`、`.pagination`、`.page-item`、`.error-messages`、`.btn-outline-primary`、`.btn-primary`、`.btn-outline-danger`；
- 文案：`Home`、`Global Feed`、`Your Feed`、`Sign in`、`Sign up`、`Publish Article`、`Update Settings`、`Or click here to logout`、`Post Comment`、`Delete Article`、`Favorite`、`Unfavorite`、`Favorite Article`、`Follow {username}`、`Unfollow {username}`、`Favorited`、`Edit Article`、`Edit Profile Settings`；
- `window.__conduit_debug__`：
  - `getToken(): string | null`；
  - `getAuthState(): authenticated | unauthenticated | unavailable | loading`；
  - `getCurrentUser(): user | null`；
- null/空头像使用 `default-avatar.svg`；
- Markdown 必须经过 DOMPurify 后才进入 `v-html`；
- `target="_blank"` 外链使用 `rel="noopener noreferrer"`。

### 21.4 最终命令

功能迁移完成后，再执行完整门禁：

```bash
bun install
bun test
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:e2e
bun run test:e2e:security
```

如果某个命令尚未因为对应迭代未完成而存在，必须写明“未运行原因”，不能把静态配置当作通过证据。

## 22. 回滚、风险和待决定事项

### 22.1 回滚规则

- 每个迭代单独提交；依赖、服务、页面、主题和 E2E 分开提交；
- 回滚只回滚当前迭代，不重置整个工作区；
- 不删除源仓库，不覆盖目标仓库已有未提交修改；
- 如果一个迭代太大，优先拆成 `A/B` 子提交，而不是继续堆功能。

### 22.2 主要风险

| 风险                              | 影响                    | 增量缓解                                             |
| --------------------------------- | ----------------------- | ---------------------------------------------------- |
| Vue `3.6.0-rc.3` 与第三方包兼容性 | 编译/运行失败           | 在首次 Router/Pinia 迭代单独验证；失败时记录版本决策 |
| JS → TS 隐式 any                  | 运行时错配              | 每个功能只定义最小类型，用 `unknown` + guard 扩展    |
| 同名 JS/TS 并存                   | Vite 解析不确定         | 单模块切换后立即删除旧文件                           |
| 过早引入 Playwright               | 基础问题被 E2E 噪声掩盖 | 至少一个完整垂直切片后再引入                         |
| 远程 API 不稳定                   | 单测 flaky              | service/store 测试 mock fetch，不调用真实服务        |
| DOM selector/文案变化             | 官方测试失败            | 对应功能迭代就保留 selector，不留到最后猜            |
| 错把网络错误当未登录              | 用户状态丢失            | 单独测试 4xx、5xx、network 三分支                    |
| Markdown 未清理                   | XSS                     | 在 Article 迭代写安全测试，禁止裸 `v-html`           |
| 深层路由 404                      | 生产不可用              | Router 迭代确定 fallback，E2E 再验证                 |
| 覆盖已有未提交修改                | 数据丢失                | 开始前检查 `git status`，禁止 reset/clean            |

### 22.3 开始实施前只需做的决策

- [x] store 目录统一使用 `src/stores`；这是目标仓库的有意命名选择，源仓库的 `src/store` 只作为参考；
- [ ] 是否继续使用 `vue@3.6.0-rc.3`，以及何时评估稳定版；
- [ ] API 默认地址和本地测试 API；
- [ ] 主题是否原样引入 Conduit Minimal CSS；
- [ ] Playwright 是否在迭代 15 才加入（建议是）；
- [ ] `window.__conduit_debug__` 在开发/生产的暴露策略；

## 23. 推荐提交历史

建议最终形成类似以下、可逐个阅读的提交序列：

```text
chore: record migration baseline
feat: replace starter with typed app shell
feat: add typed article preview component
feat: add typed route skeleton
feat: add typed RealWorld request boundary
feat: add local auth state with Pinia
feat: add login and registration flow
feat: add session restore and protected settings route
feat: add global feed tags and pagination
feat: add article detail with safe markdown
feat: add comments and article favorites
feat: add article editor lifecycle
feat: add read only user profiles
feat: add favorited articles tab
feat: add profile follow actions
feat: add personalized feed and favorite sync
feat: add settings and logout flow
chore: add RealWorld theme and static assets
test: add Playwright navigation smoke
test: add RealWorld end to end coverage
test: add security regression coverage
chore: remove unused starter files
docs: update incremental migration guide
```

每个提交应满足：

- 只完成一个学习主题或一个垂直 feature；
- 可以独立运行或明确写出占位边界；
- 有对应测试或手工验收证据；
- 不把格式化、删除 starter 文件和业务逻辑混在一个提交；
- `bun.lock` 只在依赖变更提交中更新。

## 附录 A：源文件到目标文件的参考映射（不是执行顺序）

| 源文件                      | 目标建议                    | 进入迭代   |
| --------------------------- | --------------------------- | ---------- |
| `src/main.js`               | `src/main.ts`               | 3、7       |
| `src/App.vue`               | `src/App.vue`               | 1、3       |
| `src/router/index.js`       | `src/router/index.ts`       | 3、7       |
| `src/store/index.js`        | `src/stores/index.ts`       | 5          |
| `src/store/auth.js`         | `src/stores/auth.ts`        | 5–7        |
| `src/store/home.js`         | `src/stores/home.ts`        | 8、12      |
| `src/store/article.js`      | `src/stores/article.ts`     | 9–11       |
| `src/store/profile.js`      | `src/stores/profile.ts`     | 12         |
| `src/common/api.service.js` | `src/services/api.ts`       | 4、6、8–13 |
| `src/common/config.js`      | `src/config.ts`             | 4          |
| `src/common/jwt.service.js` | `src/services/jwt.ts`       | 5–7        |
| `src/common/errors.js`      | `src/services/errors.ts`    | 4、6、13   |
| `src/common/format.js`      | `src/services/format.ts`    | 13         |
| `src/views/*.vue`           | 同名 `src/views/*.vue`      | 按功能进入 |
| `src/components/*.vue`      | 同名 `src/components/*.vue` | 按功能进入 |
| `realworld/`                | submodule                   | 14–15      |
| `playwright.config.ts`      | 同名                        | 15         |

不要把这张表理解成“第一个提交就把所有文件复制过来”。它只是告诉你最终能力来自哪里。

## 附录 B：常见问题

### 为什么不先把所有 JS 改成 TS？

因为那会同时引入模板、类型、路由、状态和 API 五类问题，编译错误很难归因。按垂直切片迁移时，每次只面对一个新的概念，学完后可以立即看到页面行为。

### 为什么先做占位页面？

占位页面让 Router 和 URL 先稳定下来，同时保留可运行状态。它是明确的边界，不代表最终 UI 已完成。

### 为什么单测不直接调用真实 API？

远程 API 的网络、数据和速率限制会让测试不稳定。单测应验证自己的请求契约；真实服务联调和 Playwright 放到后期。

### 什么时候可以说“迁移完成”？

只有在最终路由、API、认证降级、DOM selector、Markdown 安全、默认资源、Playwright 普通套件和 security 套件都有新鲜证据后，才能称为完整迁移。中间迭代只能说“完成了某个功能切片”。

### 清理 `playground/` 后测试为什么变少了？

因为原来的 `playground/typescript/src/auth-state.test.ts` 已随练习目录删除，`bun test` 不再运行那些练习测试。此时测试数下降是预期变化，但正式迁移每实现一个行为，都应把相应测试写入 `src/**/*.test.ts` 或 `tests/`，逐步建立新的生产测试基线。

### 清理后 `bun run check` 还失败怎么办？

重新读取最新输出并定位当前文件，不要再归因于已经删除的 playground 测试。格式问题可以在当前功能迭代中仅修复本次涉及的文件；与功能无关的大范围格式化应拆成独立提交。
