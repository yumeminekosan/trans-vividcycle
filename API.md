# API 文档

> Queer Relationship Atlas — 接口定义、认证方式、调用示例

## 认证

- JWT Token
- Session 管理
- OAuth（后期）

## 端点

### Persona API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /persona/create | 创建 Persona |
| GET | /persona/:id | 获取 Persona |
| PATCH | /persona/:id | 更新 Persona |
| DELETE | /persona/:id | 删除 Persona |

### Relation API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /relation/create | 创建关系 |
| PATCH | /relation/:id | 更新关系 |
| DELETE | /relation/:id | 删除关系 |
| GET | /relation/list | 关系列表 |

### Graph API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /graph/:personaId | 获取个人图谱 |
| GET | /graph/recommendation | 推荐连接 |

## 示例

待补充

---

_初始创建: 2026-05-23_
