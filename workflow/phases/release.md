# Release 阶段：发版 SOP

> 将 develop 上的成果发布为正式版本。本文档是 AIEF 项目自身的发版标准操作流程。

## 适用范围

- 项目：ai-engineering-framework
- 触发条件：develop 上积累了足够的变更，需要对外发布
- 执行者：维护者

---

## 版本号决策

遵循语义化版本（Semantic Versioning）：

| 变更类型 | 版本号变化 | 示例 |
|---------|-----------|------|
| 不兼容的 API 变更 | Major（X.0.0） | 1.5.0 → 2.0.0 |
| 新增向下兼容功能 | Minor（x.Y.0） | 1.5.0 → 1.6.0 |
| 问题修复、文档更新 | Patch（x.y.Z） | 1.5.0 → 1.5.1 |

---

## 发版流程

### Step 1：同步 develop 与 main

develop 可能落后于 main（历史 hotfix 等），先同步：

```bash
git checkout develop
git merge main --no-ff -m "merge: sync develop with main vX.Y.Z"
git push origin develop
```

### Step 2：将 feature 合并到 develop

```bash
git checkout develop
git merge feature/<name> --no-ff -m "merge: <description> into develop"
git push origin develop
```

### Step 3：将 develop 合并到 main

```bash
git checkout main
git merge develop --no-ff -m "merge: release vX.Y.Z"
git push origin main
```

### Step 4：执行 release script（关键步骤）

> ⚠️ **禁止** 手动执行 `git tag`。必须通过 release script，确保版本号原子同步。

```bash
node scripts/release.mjs <version>
# 示例：node scripts/release.mjs 1.5.1
```

脚本自动完成：
1. 验证 semver 格式
2. 确认在 main 分支且工作区干净
3. 更新 `packages/aief-init/package.json`
4. 更新 `packages/ai-engineering-framework-init/package.json`
5. `git commit` + `git tag` + `git push`（原子操作）

### Step 5：等待 CI 通过

```bash
gh run list --limit 3
# 三个 job 必须全部 success：
# ✓ Verify version consistency
# ✓ Publish to npm
# ✓ Create GitHub Release
```

### Step 6：确认发版结果

```bash
gh release list --limit 3
# 新版本应显示为 Latest
```

---

## Pre-Release Checklist

发版前，逐项确认：

```
发版前检查
==========
[ ] 所有计划合并的 feature 分支已合并到 develop
[ ] develop 已同步 main（无落后 commit）
[ ] develop 已成功合并到 main，且 push 完成
[ ] 当前在 main 分支（git rev-parse --abbrev-ref HEAD）
[ ] 工作区干净（git status --porcelain 无输出）
[ ] 版本号已决策（patch / minor / major）
[ ] 使用 node scripts/release.mjs <version>，而非手动 git tag
[ ] CI 全部通过（verify + publish + release）
[ ] gh release list 确认新版本为 Latest
[ ] （可选）清理已合并的 feature 分支
```

---

## 常见错误与修复

### 版本不一致（CI 失败）

**症状**：CI 报 `version does not match tag`

**原因**：手动打 tag，未更新 package.json

**修复**：

```bash
# 删除错误 tag
git tag -d v<version>
git push origin :refs/tags/v<version>

# bump 版本（手动或重新用 release script）
node scripts/release.mjs <version>
```

### develop 落后于 main

**症状**：合并 develop→main 时出现 merge conflict 或意外的 revert

**修复**：

```bash
git checkout develop
git merge main --no-ff -m "merge: sync develop with main"
# 解决冲突后继续
```

---

## 相关文件

- `scripts/release.mjs` — 发版脚本（版本同步 + tag + push）
- `.github/workflows/release.yml` — CI 版本校验 + npm 发布 + GitHub Release
- `context/experience/lessons/2026-03-02-release-script-bypass.md` — 踩坑记录
