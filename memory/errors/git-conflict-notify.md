> Last updated: 2026-06-18

# Git 操作遇到冲突必须先告知用户

## 规则

在执行 git 操作（merge / rebase / stash pop / pull 等）时，如果出现冲突：

1. **立即停止**，不要自行决定如何解决
2. **明确告知用户**：哪个文件冲突了，冲突内容是什么
3. **展示两个版本的差异**，让用户看到
4. **等用户决定**保留哪个版本或如何合并
5. 用户确认后再执行解决操作

## 踩坑案例（2026-06-18）

执行 `git stash pop` 时，`react-system/nginx.conf` 冲突：
```
react-system/nginx.conf already exists, no checkout
error: could not restore untracked files from stash
```

错误做法：自行判断「本地版本保留即可」直接处理，没告知用户。

正确做法：先告诉用户 nginx.conf 冲突了，展示差异，让用户决定。

## 关联

- 用户偏好：[memory/people/xiongdongying.md](../people/xiongdongying.md)
