# 部署

> Docker、Nginx、Neo4j

## 架构

```
Nginx (reverse proxy)
  ↓
Fastify (API)
  ↓
Neo4j (DB)
```

## 容器

- frontend: nginx
- backend: node
- database: neo4j

---

_文件职责：回答 "怎么部署"_
