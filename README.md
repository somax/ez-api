# ez-api

基于 [express-restify-mongoose](https://florianholzapfel.github.io/express-restify-mongoose/#getting-started) ，用于快速构建 Restful API 。

## Usage

### 环境变量:

- `DB_URI` -- MongoDB 连接字符串, 默认: `mongodb://localhost:27017/test`
- `READONLY_MODE` -- 只读模式, 默认为 `true`，仅当值为 `"false"` 时才取消只读模式，任何其他值都定义为 `true`。
- `API_VERSION` -- 接口版本, 默认为 `v1` , 与接口 uri 中版本号对应
- `DEFAULT_LIMIT` -- 默认单次最大返回数

### Docker

```sh
 docker run --name ezapi --restart always  --link mongo -e DB_URI='mongodb://mongo:27017/test'  -p 3000:3000  ezapi
```

> 添加 --restart always 保证 schema 变更后重启成功

### 设定 Schema

schema 存储于当前连接数据库中名为 `__schema__` 的表中，可以通过 `/api/<API_VERSION>/__schema__` 接口更新或查询 Schema 定义，支持数组批量更新。数据结构如下:

```json
[
    {
        "name": "Customer",
      	"version": "v1",
        "properties": {
            "name": {
                "type": "String",
                "required": true
            },
            "comment": {
                "type": "String"
            }
        }
    },
    {
        "name": "grid",
        "version": "v1",
        "collection_name": "wgh",
        "properties": {
            "taskId": {
                "type": "String"
            },
            "description": {
                "type": "String",
                "access": "protected"
            }
        }
    }
]
```

> 访问限制字段  `access` 支持:  `public`, `private`, `protected` 三种方式
> `version` 与 `API_VERSION` 对应

⚠️注意: 为了防止误操作删除，在 `DELETE` 操作时，必须加上 `?__confirm__=__schema__`。业务上的接口同样受此约束，将 `__confirm__` 的值改为接口的名称即可。



### Reset api server

更新 schema 后需要重启服务才可以生效，通过调用 `__reset__` 接口重启 api 服务

```http
GET http://host:port/__reset__
> reseting...
```

⚠️注意: 重启依赖于服务守护程序, 当使用容器运行时需要加上 `--restart always` 参数


## 接口调用方法

> 详情查看 [express-restify-mongoose 文档](https://florianholzapfel.github.io/express-restify-mongoose/#querying) 

> 查询语句支持参数包含：`sort`, `skip`, `limit`, `query`, `select` 以及 `distinct` 等完整的 mongoose 方法

> 参数值如果是对象或者数组必须符合 JSON 规范

### Sort 排序

```js
// 按 name 正排序
GET /Customer?sort=name
GET /Customer?sort={"name":1}

// 按 name 倒排序
GET /Customer?sort=-name
GET /Customer?sort={"name":0}

// 多个字段排序
GET /Customer?sort=name,age
```

### 分页

```js
// 跳过 10 条
GET /Customer?skip=10
// 每页显示十条,
GET /Customer?limit=10
```
> 注意 limit 如果未指定, 或者为值为0, 或者大于服务器默认值, 则按服务器默认设置数量返回
> 服务端默认值为 100, 可以通过环境变量 `DEFAULT_LIMIT` 改变默认限制

### Query 查询

> 支持的操作符包含： `$regex`、`$gt`、`$gte`、`$lt`、`$lte`、`$ne` 等等

```js
// 查询 name 为 Bob
GET /Customer?query={"name":"Bob"}

// 正则表达式查询
GET /Customer?query={"name":{"$regex":"^(Bob)"}}

// 查询 age 大于 12
GET /Customer?query={"age":{"$gt":12}}

// 查询 age 大于等于 12
GET /Customer?query={"age":{"$gte":12}}

// 查询 age 小于 12
GET /Customer?query={"age":{"$lt":12}}

// 查询 age 小于等于 12
GET /Customer?query={"age":{"$lte":12}}

// 查询 age 不等于 12
GET /Customer?query={"age":{"$ne":12}}
```

### Select 选择器

> 仅返回指定字段

```js
// 仅返回 name 及 _id 字段
GET /Customer?select=name
GET /Customer?select={"name":1}

// 返回多个字段
GET /Customer?select=name,title

// 排除 name 字段
GET /Customer?select=-name
GET /Customer?select={"name":0}
```

### Distinct 去重

```js
// 返回去重后的 name 的数组
GET /Customer?distinct=name
```