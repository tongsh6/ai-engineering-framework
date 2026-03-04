# Post-Release Checklist

Use this checklist immediately after tagging a release to confirm that GitHub and npm are fully in sync.

## 1) Run automated checks

```bash
node scripts/post-release-check.mjs 1.8.1
```

The script validates:
- Git tag exists (`v<version>`)
- GitHub Release is published (not draft / not prerelease)
- `Release & Publish` workflow finished with success for that tag
- npm versions match for both packages:
  - `@tongsh6/aief-init`
  - `@tongsh6/ai-engineering-framework-init`

## 2) Manual spot-check (optional but recommended)

```bash
gh release view v1.8.1 --repo tongsh6/ai-engineering-framework
gh run list --repo tongsh6/ai-engineering-framework --workflow "Release & Publish" --limit 5
npm view @tongsh6/aief-init version
npm view @tongsh6/ai-engineering-framework-init version
```

## 3) Troubleshooting

- If workflow is still running: wait and rerun the script.
- If npm version is stale: check `Release & Publish` job logs for publish step errors.
- If release exists but npm does not: verify npm token/permissions in repository secrets.
