# 手动打 tag 绕过 release script 导致版本不一致

> 发版时跳过 `scripts/release.mjs`，直接使用 `git tag`，导致 package.json 版本未同步，CI 版本校验失败。

## 背景

- 项目：ai-engineering-framework
- 时间：2026-03-02
- 影响：v1.5.1 发版 CI 失败，需手动删 tag、bump 版本、重新触发

## 问题

执行 GitFlow 发版流程（feature→develop→main）时，在 main 分支上手动创建 tag：

```bash
git tag -a v1.5.1 -m "release: v1.5.1 - doc consistency and usability fixes"
git push origin v1.5.1
```

CI 触发后，版本一致性校验失败：

```
Tag version:    1.5.1
aief-init:      1.5.0          ← 未同步
ai-eng-fw-init: 1.5.0          ← 未同步
ERROR: version does not match tag
```

### 症状

- GitHub Actions `Release & Publish` 工作流以 `failure` 结束
- GitHub Release 未创建
- npm 包未发布
- 最新 tag 仍显示 v1.5.0 为 Latest

### 复现条件

1. 存在 `scripts/release.mjs`（负责版本同步+tag+push）
2. 发版时未使用该脚本，改用 `git tag -a <tag>` 手动创建
3. push tag → CI 触发 → 版本校验失败

## 原因

### 技术原因

CI 工作流（`.github/workflows/release.yml`）包含版本一致性校验步骤，要求 `packages/*/package.json` 中的 `version` 字段 = tag 版本号。手动打 tag 不会自动修改 `package.json`。

### 流程原因

`scripts/release.mjs` 将以下步骤原子化绑定在一起：
1. 更新 `packages/aief-init/package.json` 版本
2. 更新 `packages/ai-engineering-framework-init/package.json` 版本
3. `git commit`
4. `git tag`
5. `git push`

手动操作拆散了这个原子单元，遗漏了步骤 1、2。

## 解决方案

### 修复步骤

```bash
# 1. 删除已推送的错误 tag
git tag -d v1.5.1
git push origin :refs/tags/v1.5.1

# 2. 更新 package.json 版本
# （手动编辑两个文件）

# 3. 提交版本 bump
git add packages/aief-init/package.json packages/ai-engineering-framework-init/package.json
git commit -m "chore: bump package versions to 1.5.1"

# 4. 重新打 tag 并 push
git tag -a v1.5.1 -m "release: v1.5.1"
git push origin main
git push origin v1.5.1
```

### 正确做法

发版统一使用 release script，一条命令完成所有步骤：

```bash
node scripts/release.mjs 1.5.1
```

脚本自动完成：格式校验 → 分支检查 → 版本同步 → commit → tag → push

## 教训

### 应该做

- 发版前先 `ls scripts/`，确认是否有 release script
- 发版**只用** `node scripts/release.mjs <version>`
- 在 GitFlow SOP 文档中明确"打 tag = 执行 release script"

### 不应该做

- 手动执行 `git tag` 进行版本发布
- 将 GitFlow 合并步骤和发版步骤混为一谈（合并走 git merge，发版走 release.mjs）

### 检查清单

下次发版前确认：

- [ ] 当前在 `main` 分支且工作区干净
- [ ] 使用 `node scripts/release.mjs <version>` 而非手动 `git tag`
- [ ] CI 三个 job 全部通过（verify + publish + release）
- [ ] `gh release list` 确认新版本已显示为 Latest

## 相关

- `scripts/release.mjs` — 正确的发版入口
- `.github/workflows/release.yml` — CI 版本校验逻辑
- `workflow/phases/release.md` — 完整发版 SOP

---

**关键词**：`release`, `tag`, `version`, `package.json`, `CI`, `GitFlow`, `npm publish`

**类别**：踩坑记录
