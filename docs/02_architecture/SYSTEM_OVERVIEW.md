# 系统概览

> 总架构图

```
┌─────────────┐
│   Frontend  │  React + TypeScript + Vite
│   (React)   │  Cytoscape.js + Zustand
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │  Fastify
│  (Fastify)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Services  │
├─────────────┤
│ Auth        │
│ Graph       │
│ Relation    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Neo4j     │  Graph Database
└─────────────┘
```

---

_文件职责：回答 "系统怎么运作"_
