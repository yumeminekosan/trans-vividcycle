# 速率限制

> Rate limit

## 规则

| 端点 | 限制 |
|------|------|
| /persona | 100/min |
| /relation | 100/min |
| /graph | 30/min |

## 实现

- Redis（后期）
- 内存计数（初期）

---

_文件职责：回答 "怎么限流"_
