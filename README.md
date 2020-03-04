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
