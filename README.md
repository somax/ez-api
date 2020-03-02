
# ez-api

基于 (express-restify-mongoose)[https://florianholzapfel.github.io/express-restify-mongoose/#getting-started] , 用于快速构建 Restful API  

## Usage
### 环境变量:
- `DB_URI` -- MongoDB 连接字符串, 默认连本地测试库
- `READONLY_MODE` -- 只读模式, 默认为true, 仅当值为 'false' 是才取消只读模式, 任何其他值都定义为 true

### schema

在连接的数据库中

支持限制字段,通 `access` 定义:  'public', 'private', 'protected'