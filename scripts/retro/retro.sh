#!/usr/bin/env bash
# =============================================================================
# retro.sh — AIEF Retrospective Curator 自动化脚本
#
# 用法：
#   bash scripts/retro/retro.sh [OPTIONS]
#
# 选项：
#   --date     YYYY-MM-DD    复盘日期（默认：今天）
#   --topic    SLUG          主题标识符，如 aief-doc-review-release
#   --source   SOURCE_ID     来源标识，如 conversation://2026-03-02 （默认：date-topic）
#   --repo     PATH          仓库根目录（默认：脚本所在目录的两级父目录）
#   --dry-run               只打印，不落盘
#   --help                  显示此帮助信息
#
# 示例：
#   # 完整执行（落盘）
#   bash scripts/retro/retro.sh --date 2026-03-02 --topic aief-doc-review-release
#
#   # 预览模式（不写文件）
#   bash scripts/retro/retro.sh --date 2026-03-02 --topic my-feature --dry-run
#
# 行为：
#   1. 校验 repo_root 存在
#   2. 若目标目录不存在则创建
#   3. 生成 retro 主文档骨架（含 8 节 + frontmatter）
#   4. 生成 skill / template / checklist / best-practice 骨架文件
#   5. 更新 context/experience/INDEX.md（追加条目）
#   6. 打印 GitFlow 命令
#   7. dry-run 模式：只打印，不落盘
# =============================================================================

set -euo pipefail

# ----------------------------------------------------------------------------
# 颜色输出
# ----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
section() { echo -e "\n${CYAN}==== $* ====${NC}"; }

# ----------------------------------------------------------------------------
# 默认参数
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DATE="$(date +%Y-%m-%d)"
TOPIC=""
SOURCE_ID=""
REPO_ROOT="${DEFAULT_REPO}"
DRY_RUN=false

# ----------------------------------------------------------------------------
# 参数解析
# ----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --date)    DATE="$2";      shift 2 ;;
    --topic)   TOPIC="$2";     shift 2 ;;
    --source)  SOURCE_ID="$2"; shift 2 ;;
    --repo)    REPO_ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true;   shift   ;;
    --help)
      head -35 "${BASH_SOURCE[0]}" | tail -30
      exit 0
      ;;
    *)
      error "未知参数：$1"
      exit 1
      ;;
  esac
done

# ----------------------------------------------------------------------------
# 参数校验
# ----------------------------------------------------------------------------
if [[ -z "${TOPIC}" ]]; then
  error "--topic 参数必填。示例：--topic aief-doc-review-release"
  exit 1
fi

# 日期格式校验
if ! echo "${DATE}" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
  error "--date 格式无效：${DATE}，应为 YYYY-MM-DD"
  exit 1
fi

# 仓库根目录校验
if [[ ! -d "${REPO_ROOT}" ]]; then
  error "仓库根目录不存在：${REPO_ROOT}"
  exit 1
fi

# 生成 source_id 默认值
if [[ -z "${SOURCE_ID}" ]]; then
  SOURCE_ID="conversation://${DATE}-${TOPIC}"
fi

# 计算 compact date（去掉 -）
DATE_COMPACT="${DATE//-/}"

# ----------------------------------------------------------------------------
# 路径定义
# ----------------------------------------------------------------------------
RETRO_DIR="${REPO_ROOT}/context/experience/lessons"
SKILLS_DIR="${REPO_ROOT}/docs/standards/skills"
TEMPLATES_DIR="${REPO_ROOT}/docs/standards/templates"
CHECKLISTS_DIR="${REPO_ROOT}/docs/standards/checklists"
BP_DIR="${REPO_ROOT}/context/experience/best-practices"
SCRIPT_RETRO_DIR="${REPO_ROOT}/scripts/retro"

RETRO_FILE="${RETRO_DIR}/retro-${DATE_COMPACT}-${TOPIC}.md"
SKILL_FILE="${SKILLS_DIR}/skill-retro-${TOPIC}.md"
TEMPLATE_MAIN_FILE="${TEMPLATES_DIR}/template-retro-${TOPIC}-main.md"
TEMPLATE_LESSON_FILE="${TEMPLATES_DIR}/template-retro-${TOPIC}-lesson.md"
CHECKLIST_FILE="${CHECKLISTS_DIR}/checklist-retro-${TOPIC}.md"
BP_FILE="${BP_DIR}/bp-retro-${TOPIC}.md"
INDEX_FILE="${REPO_ROOT}/context/experience/INDEX.md"

# ----------------------------------------------------------------------------
# 写文件 / 打印（dry-run）
# ----------------------------------------------------------------------------
write_file() {
  local path="$1"
  local content="$2"

  if "${DRY_RUN}"; then
    echo -e "${YELLOW}[DRY-RUN] 将写入：${path}${NC}"
    echo "------- CONTENT PREVIEW (first 5 lines) -------"
    echo "${content}" | head -5
    echo "..."
    echo "-----------------------------------------------"
  else
    # 确保目录存在
    mkdir -p "$(dirname "${path}")"
    if [[ -f "${path}" ]]; then
      warn "文件已存在，跳过：${path}"
    else
      echo "${content}" > "${path}"
      success "已创建：${path}"
    fi
  fi
}

append_to_index() {
  local index="$1"
  local entry="$2"

  if "${DRY_RUN}"; then
    echo -e "${YELLOW}[DRY-RUN] 将追加到 INDEX：${index}${NC}"
    echo "${entry}"
    return
  fi

  if [[ ! -f "${index}" ]]; then
    warn "INDEX 文件不存在，跳过更新：${index}"
    return
  fi

  # 检查是否已有该条目
  if grep -q "retro-${DATE_COMPACT}-${TOPIC}" "${index}" 2>/dev/null; then
    warn "INDEX 中已存在该条目，跳过：retro-${DATE_COMPACT}-${TOPIC}"
    return
  fi

  # 在"## 经验列表"下方第一条之前插入新条目
  # 兼容性：使用 awk 而非 sed -i（跨平台）
  local tmp_file
  tmp_file=$(mktemp)
  awk -v entry="${entry}" '
    /^## 经验列表/ { print; found=1; next }
    found && /^<!-- / { print entry; print ""; found=0 }
    { print }
  ' "${index}" > "${tmp_file}"
  mv "${tmp_file}" "${index}"
  success "已更新 INDEX：${index}"
}

# ----------------------------------------------------------------------------
# Step 1：打印运行信息
# ----------------------------------------------------------------------------
section "AIEF Retrospective Curator"
info "日期：    ${DATE}"
info "主题：    ${TOPIC}"
info "来源：    ${SOURCE_ID}"
info "仓库：    ${REPO_ROOT}"
info "Dry-run： ${DRY_RUN}"

# ----------------------------------------------------------------------------
# Step 2：创建目录
# ----------------------------------------------------------------------------
section "创建目录结构"

for dir in "${RETRO_DIR}" "${SKILLS_DIR}" "${TEMPLATES_DIR}" "${CHECKLISTS_DIR}" "${BP_DIR}" "${SCRIPT_RETRO_DIR}"; do
  if "${DRY_RUN}"; then
    echo -e "${YELLOW}[DRY-RUN] mkdir -p ${dir}${NC}"
  else
    mkdir -p "${dir}"
    success "目录就绪：${dir}"
  fi
done

# ----------------------------------------------------------------------------
# Step 3：生成 retro 主文档骨架
# ----------------------------------------------------------------------------
section "生成 retro 主文档"

RETRO_CONTENT="---
title: \"复盘：${TOPIC}\"
date: ${DATE}
tags: [aief, retro, ${TOPIC}]
source: ${SOURCE_ID}
---

# 复盘：${TOPIC}

> 一句话总结本次会话的主要工作和关键结果。

---

## 一、本次会话存在什么问题

<!-- 必填 >=5 条，每条必须引用会话原句作为证据 -->

### P1 <问题标题>

**证据**（会话原文）：

\`\`\`
<引用原句或错误信息>
\`\`\`

**分析**：<技术原因 + 流程原因>

**影响**：<影响范围>

---

### P2 <问题标题>

<!-- ...P3 P4 P5 同格式... -->

---

## 二、本次会话可沉淀经验

<!-- 必填 >=5 条，格式：[动词] [对象]，[条件]，[原因] -->

### E1 <经验标题>
<具体规则>

---

## 三、本次会话可改进点

<!-- 必填 >=5 条，可操作的具体建议 -->

### I1 <改进点>
<具体做法>

---

## 四、可沉淀为 Skill

详见：\`docs/standards/skills/skill-retro-${TOPIC}.md\`

---

## 五、可沉淀为 Template

详见：
- \`docs/standards/templates/template-retro-${TOPIC}-main.md\`
- \`docs/standards/templates/template-retro-${TOPIC}-lesson.md\`

---

## 六、可沉淀为 Checklist

详见：\`docs/standards/checklists/checklist-retro-${TOPIC}.md\`

---

## 七、可沉淀为 Best Practice

| # | 规则 | Why |
|---|------|-----|
| BP1 | <规则> | <原因> |

详见：\`context/experience/best-practices/bp-retro-${TOPIC}.md\`

---

## 八、可沉淀为脚本

详见：\`scripts/retro/retro.sh\`

\`\`\`bash
bash scripts/retro/retro.sh --date ${DATE} --topic ${TOPIC} --source \"${SOURCE_ID}\" --dry-run
\`\`\`

---

**关键词**：\`retro\`, \`${TOPIC}\`

**类别**：复盘报告"

write_file "${RETRO_FILE}" "${RETRO_CONTENT}"

# ----------------------------------------------------------------------------
# Step 4：生成 skill 骨架
# ----------------------------------------------------------------------------
section "生成 Skill 骨架"

SKILL_CONTENT="---
title: \"Skill: ${TOPIC}\"
date: ${DATE}
tags: [aief, skill, ${TOPIC}]
source: ${SOURCE_ID}
---

# Skill: ${TOPIC}

> 一句话描述这个 Skill 的职责（单一职责）。

## Purpose
<目的>

## When to Use
<使用场景>

## When NOT to Use
<不适用场景>

## Inputs
\`\`\`typescript
interface Input {
  // 填写输入接口
}
\`\`\`

## Outputs
\`\`\`typescript
interface Output {
  // 填写输出接口
}
\`\`\`

## Steps
1. <步骤 1>
2. <步骤 2>

## Verification
- [ ] <验收标准 1>
- [ ] <验收标准 2>

## Notes
<注意事项>"

write_file "${SKILL_FILE}" "${SKILL_CONTENT}"

# ----------------------------------------------------------------------------
# Step 5：生成 template 骨架
# ----------------------------------------------------------------------------
section "生成 Template 骨架"

TEMPLATE_MAIN_CONTENT="---
title: \"Template: ${TOPIC} 复盘主文档\"
date: ${DATE}
tags: [aief, template, retro, ${TOPIC}]
source: ${SOURCE_ID}
---

# Template: ${TOPIC} 复盘主文档

> 可直接复制的复盘主文档骨架。

## Purpose
<模板用途>

## When to Use
<适用场景>

## When NOT to Use
<不适用场景>

## Inputs
<所需输入>

## Outputs
<产出物>

## Steps
<使用步骤>

## Verification
- [ ] <检查项>

## Notes
<注意事项>

---

## 文档骨架

\`\`\`markdown
<!-- 在此粘贴可复制的模板内容 -->
\`\`\`"

TEMPLATE_LESSON_CONTENT="---
title: \"Template: ${TOPIC} 单条经验\"
date: ${DATE}
tags: [aief, template, lesson, ${TOPIC}]
source: ${SOURCE_ID}
---

# Template: ${TOPIC} 单条经验

> 记录单个踩坑或学习点的标准格式。

## Purpose
<目的>

## When to Use
<使用场景>

## When NOT to Use
<不适用>

## Inputs
<输入>

## Outputs
<输出>

## Steps
<步骤>

## Verification
- [ ] <检查项>

## Notes
<注意事项>"

write_file "${TEMPLATE_MAIN_FILE}" "${TEMPLATE_MAIN_CONTENT}"
write_file "${TEMPLATE_LESSON_FILE}" "${TEMPLATE_LESSON_CONTENT}"

# ----------------------------------------------------------------------------
# Step 6：生成 checklist 骨架
# ----------------------------------------------------------------------------
section "生成 Checklist 骨架"

CHECKLIST_CONTENT="---
title: \"Checklist: ${TOPIC} 执行检查\"
date: ${DATE}
tags: [aief, checklist, ${TOPIC}]
source: ${SOURCE_ID}
---

# Checklist: ${TOPIC} 执行检查

> 阶段化闸门清单，确保 ${TOPIC} 关键步骤不被遗漏。

## Purpose
<目的>

## When to Use
<使用场景>

## When NOT to Use
<不适用>

## Inputs
<输入>

## Outputs
<输出>

## Steps
按阶段执行检查。

## Verification
所有 [ ] 变为 [x] 后方可进入下一步。

## Notes
<注意事项>

---

## 阶段一：<阶段名称>

\`\`\`
[ ] <检查项 1>
[ ] <检查项 2>
\`\`\`

## 阶段二：<阶段名称>

\`\`\`
[ ] <检查项 1>
[ ] <检查项 2>
\`\`\`"

write_file "${CHECKLIST_FILE}" "${CHECKLIST_CONTENT}"

# ----------------------------------------------------------------------------
# Step 7：生成 best practice 骨架
# ----------------------------------------------------------------------------
section "生成 Best Practice 骨架"

BP_CONTENT="---
title: \"Best Practices: ${TOPIC}\"
date: ${DATE}
tags: [aief, best-practice, ${TOPIC}]
source: ${SOURCE_ID}
---

# Best Practices: ${TOPIC}

> 从 ${TOPIC} 相关实践中提炼的短规则集。

## Purpose
<目的>

## When to Use
<使用场景>

## When NOT to Use
<不适用>

## Inputs
<输入>

## Outputs
<输出>

## Steps
执行操作前查阅对应规则，逐条确认。

## Verification
对照规则检查操作方案是否存在已知反模式。

## Notes
<注意事项>

---

### BP1 <规则标题>

**原则**：<规则描述>

**Why**：<原因>

**反例**：

\`\`\`
# ❌ 错误
<反例代码或操作>

# ✅ 正确
<正确代码或操作>
\`\`\`

---

### BP2 <规则标题>

<!-- ... 补充更多规则（>=7 条）... -->"

write_file "${BP_FILE}" "${BP_CONTENT}"

# ----------------------------------------------------------------------------
# Step 8：更新 INDEX
# ----------------------------------------------------------------------------
section "更新 context/experience/INDEX.md"

INDEX_ENTRY="### retro-${DATE_COMPACT}-${TOPIC}

- **类别**：复盘报告
- **日期**：${DATE}
- **关键词**：\`retro\`, \`${TOPIC}\`
- **摘要**：${TOPIC} 会话复盘，沉淀为 skill/template/checklist/best-practice。
- **文档**：\`lessons/retro-${DATE_COMPACT}-${TOPIC}.md\`"

append_to_index "${INDEX_FILE}" "${INDEX_ENTRY}"

# ----------------------------------------------------------------------------
# Step 9：打印 GitFlow 命令
# ----------------------------------------------------------------------------
section "GitFlow 命令"

BRANCH="feature/retro-${DATE_COMPACT}-${TOPIC}"

echo ""
echo -e "${CYAN}# ======================================================${NC}"
echo -e "${CYAN}# 可执行的 GitFlow 提交命令序列${NC}"
echo -e "${CYAN}# ======================================================${NC}"
echo ""
echo "git checkout main"
echo "git checkout -b ${BRANCH}"
echo ""
echo "# 提交 1：内容文件（retro + skill + template + checklist + bp）"
echo "git add \\"
echo "  context/experience/lessons/retro-${DATE_COMPACT}-${TOPIC}.md \\"
echo "  docs/standards/skills/skill-retro-${TOPIC}.md \\"
echo "  docs/standards/templates/template-retro-${TOPIC}-main.md \\"
echo "  docs/standards/templates/template-retro-${TOPIC}-lesson.md \\"
echo "  docs/standards/checklists/checklist-retro-${TOPIC}.md \\"
echo "  context/experience/best-practices/bp-retro-${TOPIC}.md"
echo "git commit -m \"docs(retro): add ${DATE} ${TOPIC} retrospect assets\""
echo ""
echo "# 提交 2：脚本"
echo "git add scripts/retro/"
echo "git commit -m \"chore(scripts): add retro automation script\""
echo ""
echo "# 提交 3：索引更新"
echo "git add context/experience/INDEX.md context/INDEX.md"
echo "git commit -m \"docs(aief): update experience index with retro assets for ${TOPIC}\""
echo ""
echo "# 合并到 develop 和 main"
echo "git checkout develop && git merge main --no-ff -m 'merge: sync develop with main'"
echo "git merge ${BRANCH} --no-ff -m 'merge: ${TOPIC} retro docs into develop'"
echo "git push origin develop"
echo "git checkout main"
echo "git merge develop --no-ff -m 'merge: ${TOPIC} retro docs to main'"
echo "git push origin main"
echo "git branch -d ${BRANCH}"
echo ""

# ----------------------------------------------------------------------------
# 完成报告
# ----------------------------------------------------------------------------
section "完成报告"

if "${DRY_RUN}"; then
  warn "DRY-RUN 模式：以上文件均未实际写入"
  echo ""
  echo "  执行真实写入，去掉 --dry-run 参数："
  echo "  bash scripts/retro/retro.sh --date ${DATE} --topic ${TOPIC} --source '${SOURCE_ID}'"
else
  success "所有复盘资产已生成！"
  echo ""
  echo "  📁 retro 主文档：  context/experience/lessons/retro-${DATE_COMPACT}-${TOPIC}.md"
  echo "  📋 Skill：         docs/standards/skills/skill-retro-${TOPIC}.md"
  echo "  📄 Templates：     docs/standards/templates/template-retro-${TOPIC}-{main,lesson}.md"
  echo "  ✅ Checklist：     docs/standards/checklists/checklist-retro-${TOPIC}.md"
  echo "  💡 Best Practices：context/experience/best-practices/bp-retro-${TOPIC}.md"
  echo ""
  echo "  下一步："
  echo "  1. 填充各文档的实际内容（替换 <PLACEHOLDER>）"
  echo "  2. 执行上方 GitFlow 命令"
fi
