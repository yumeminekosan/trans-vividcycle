# 数据库设计

> node schema、edge schema、indexes

## Node Schema

### Persona
```cypher
(:Persona {
  id: uuid,
  name: string,
  bio: string,
  pronouns: string,
  tags: string[],
  created_at: datetime
})
```

### Community
```cypher
(:Community {
  id: uuid,
  name: string,
  description: string,
  type: string
})
```

## Edge Schema

### Relation
```cypher
[:RELATION {
  type: string,
  visibility: string,
  weight: float,
  description: string,
  created_at: datetime
}]
```

## Indexes

- Persona.id
- Persona.name
- Community.id

---

_文件职责：回答 "数据怎么存"_
