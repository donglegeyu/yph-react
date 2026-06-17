# 撤回/回退命令

> Last updated: 2026-04-15

## 用途

回退不需要的变更，确保可逆性

## Git 回退

### 撤回未提交的更改
```bash
git checkout -- <file>
git restore <file>
```

### 回退已提交
```bash
# 回退最近一次提交
git revert HEAD

# 回退到指定版本
git revert <commit-hash>
```

### 重置（谨慎使用）
```bash
# 软重置
git reset --soft HEAD~1

# 硬重置（会丢失更改）
git reset --hard HEAD~1
```

## 文件操作撤回

```bash
# 删除文件后恢复
git checkout HEAD -- <file>

# 恢复误删文件
git restore <file>
```

## 工作流

1. 用「撤回」命令回退变更
2. 确保代码库干净
3. 重新开始

## 注意事项

⚠️ 硬重置会丢失未提交的更改，慎用！
⚠️ 已推送的提交建议用 revert，不要 reset

## 相关

- [自动化开发流程](../workflows/automation-development.md)
