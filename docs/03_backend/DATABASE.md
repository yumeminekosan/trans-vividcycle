# 数据库

> Neo4j 操作

## 查询示例

### 获取 Persona
```cypher
MATCH (p:Persona {id: $id})
RETURN p
```

### 获取关系
```cypher
MATCH (a:Persona)-[r:RELATION]->(b:Persona)
WHERE a.id = $id
RETURN r, b
```

### 共同朋友
```cypher
MATCH (a:Persona)-[:RELATION]->(b:Persona)<-[:RELATION]-(c:Persona)
WHERE a.id = $id AND c.id <> $id
RETURN c
```

---

_文件职责：回答 "数据库怎么查"_
