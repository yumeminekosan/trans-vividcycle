# Persona 系统

> Persona 是什么

## 定义

Persona 是用户的可组合身份节点。

## 特性

- 一个用户可以有多个 persona
- 允许匿名 persona
- 每个 persona 有独立的 tag system
- 支持 pronouns

## 数据结构

```json
{
  "id": "uuid",
  "name": "alice",
  "bio": "...",
  "pronouns": "she/they",
  "tags": ["transfem", "hacker"]
}
```

---

_文件职责：回答 "persona 是什么"_
