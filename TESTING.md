# 测试策略

> Queer Relationship Atlas — 测试类型、覆盖率、CI/CD

## 测试清单

### Auth 测试
- [ ] JWT 是否过期
- [ ] session revoke 是否有效
- [ ] 多设备登录

### Persona 测试
- [ ] profile update
- [ ] tag update
- [ ] invalid field

### Relation 测试
- [ ] 双向 relation
- [ ] visibility inheritance
- [ ] 删除 relation 后 graph 同步

### Graph 测试
- [ ] 大规模节点性能
- [ ] zoom stability
- [ ] layout crash

### 安全测试
- [ ] unauthorized graph access
- [ ] blocked user access
- [ ] graph scraping

### Federation 测试（后期）
- [ ] remote node unavailable
- [ ] duplicated identity
- [ ] ActivityPub sync

---

_初始创建: 2026-05-23_