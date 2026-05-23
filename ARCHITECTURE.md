# 架构设计

> Queer Relationship Atlas — 系统架构、技术选型、组件关系

## 系统结构

```
Frontend (React)
    ↓
API Gateway (Fastify)
    ↓
Graph Service
    ↓
Neo4j
```

## 前端架构

### 技术栈
- React
- TypeScript
- Vite
- Cytoscape.js
- Zustand

### 模块

| 模块 | 职责 |
|------|------|
| Auth Module | 登录、token、session |
| Graph Module | graph render、zoom、layout、edge interaction |
| Persona Module | profile、tags、links |
| Relation Module | create relation、edit relation、visibility |

## 后端架构

### 技术栈
- Node.js
- Fastify
- GraphQL
- Neo4j Driver

### 服务拆分

| 服务 | 职责 |
|------|------|
| Auth Service | JWT、session、OAuth |
| Graph Service | node query、edge query、recommendation |
| Relation Service | visibility、permission、bidirectional relation |

## 数据结构设计

### Persona Node
```json
{
  "id": "uuid",
  "name": "alice",
  "bio": "...",
  "pronouns": "she/they",
  "tags": ["transfem", "hacker"]
}
```

### Relation Edge
```json
{
  "from": "alice",
  "to": "eve",
  "type": "emotionally_safe_person",
  "visibility": "friends_only",
  "weight": 0.8
}
```

## 技术选型理由

### Neo4j
- 原生 graph query
- relation traversal 强
- visualization 生态成熟

### Cytoscape.js
- graph interaction 强
- 可扩展 layout
- 大规模节点性能较好

---

_初始创建: 2026-05-23_
