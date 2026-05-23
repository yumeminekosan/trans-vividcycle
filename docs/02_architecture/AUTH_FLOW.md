# 认证流程

> Auth 详细设计

## 流程

```
注册/登录
  ↓
生成 JWT
  ↓
后续请求携带 Token
  ↓
验证 Token
  ↓
返回数据
```

## 安全

- Token 过期
- Refresh token
- Session revoke
- 多设备管理

---

_文件职责：回答 "怎么认证"_
