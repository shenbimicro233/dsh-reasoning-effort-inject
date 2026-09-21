# dsh-reasoning-effort-inject

思考强度注入插件：在「设置 → 模型」中为**每个模型**注入独立的「思考强度 / Thinking effort」配置界面，弥补 DSH 原生web页面不支持思考强度的问题。

## 特点

- 仅前端注入与配置写入：dsh原生支持修改 `ettings.yaml` 实现自定义提供商的模型思考强度配置，本插件仅做web界面注入和配置写入。

## 兼容

目前测试可在 `dsh v2.0.13-beta.1` 中运行，其余版本未测试。

## 安装

```sh
dsh plugin --profile web add git+https://github.com/shenbimicro233/dsh-reasoning-effort-inject.git
```

安装完成后，打开「设置 → 模型」，每个模型条目内即可看到「思考强度 / Thinking effort」选择区。

## 工作原理

- 浏览器端 `lib/client.js` 经 `dsh.client` 声明被 `dsh-client-modules` 拾取，从 `settings.models.provider-card` 槽进入，DOM 扫描定位每个模型条目，用 `createPortal` 注入编辑器；`MutationObserver` + 轮询保证增删模型、切换提供商后仍能正确注入。
- `dsh.bundle.patch` 声明的 `cordis.patch.yml` 由 `dsh plugin` 安装后自动作为 bundle 层加载并加入 profile 的 `dsh.profile.bundles`。
- 数据通过 `remote.settings` 读写 `llm-pi-ai` 命名空间，写入时整体重建 `models` 数组并带 revision 乐观并发控制。

## 注意事项

- **请用插件自带的「保存」按钮写思考强度**：DSH 原生保存按钮刻意不提供 reasoning-effort 控制，且可能在改动其它字段时整体覆盖 `models` 数组、冲掉插件写入的值。
- 模型条目类名 `.fS-I-G_modelEntry` 是 DSH 编译期 CSS Module 产物，**升级 DSH 后可能变更**；若界面不再注入，请同步更新 `client.js` 顶部的 `MODEL_ENTRY` 常量。
- 修改插件代码后需完全重启 DSH 才能生效；保存基于 revision 做并发控制，多窗口同时改设置会提示「设置已变更，请重试」。

## 目录结构

```
.
├── package.json      # bundle 声明：dsh.bundle.patch + dsh.client，可被 dsh plugin 安装
├── cordis.patch.yml # bundle patch 层：插入 reasoning-effort-inject loader 行
└── lib/
    ├── index.js     # Host 端（no-op，仅供 bundle 解析）
    └── client.js   # 浏览器端：注入每个模型的思考强度编辑器
```

## 变更记录

- `0.1.0` 初始版本：每模型思考强度编辑器、portal 注入、主题化渲染、整体重建 `models` 保存。
