/**
 * ez-api by mxj 20200302
 */
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const restify = require('express-restify-mongoose')
const app = express()
const router = express.Router()

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/test'
const READONLY_MODE = process.env.READONLY_MODE === 'false' ? false : true
const API_VERSION = process.env.API_VERSION || 'v1'
const DEFAULT_LIMIT =  +process.env.DEFAULT_LIMIT || 100

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

console.log("READONLY_MODE:",READONLY_MODE);

app.use(bodyParser.json())
app.use(methodOverride())
app.use('/admin',express.static('public'))

let options = {
    prefix: '/api',
    version: `/${API_VERSION}`, // /api/v1/xxx
    totalCountHeader: true, // X-Total-Count: 999
    private: [], //
    protected: ['__v'],
    limit: DEFAULT_LIMIT,
    preMiddleware: (req, res, next) => {
        console.log('inject log:', req.method, req.url);
        next()
    },
    access: (req) => {
        // TODO 实现 isAuthenticated 
        if (req.isAuthenticated) {
            return req.user.isAdmin ? 'private' : 'protected'
        } else {
            return 'public'
        }
    },
    onError: (err, req, res, next) => {
        const statusCode = req.erm.statusCode // 400 or 404
        console.log(err);
        res.status(statusCode).json({
            message: err.message
        })

    }
}
restify.defaults(options)

// 只读模式拦截
app.use((req, res, next) => {
    // default content type
    res.header("Content-Type", 'application/json');

    // readonly mode
    if (READONLY_MODE && req.method != 'GET') {
        console.log(req.path);
        let regex = new RegExp(`${options.prefix}${options.version}/__schema__`)
        if (regex.test(req.path)) {
            next()
        } else {
            res.status(405).json({ message: 'Method not allowed' })
        }
    } else {
        next()
    }
})

app.use((req, res, next)=>{
    if(req.method === 'DELETE'){
        let _regexp = new RegExp(`\\/${req.query.__confirm__}($|\\?|\\/)`)
        console.log(_regexp);
        console.log(req.path,req.query.__confirm__, _regexp.test(req.path));
        if(!_regexp.test(req.path)){
            res.status(400).json({message:'DELETE /api/v1/<name>?__confirm__=<name>'})
        }else{
            next()
        }
    }else{
        next()
    }
})

// TODO schema 存储支持不通版本共存
let schemaSchema = {
    "name": "__schema__",
    "collection_name": "__schema__",
    "properties": {
        "name": {
            "type": "String",
            "required": true
        },
        "version":"String",
        "collection_name": {
            "type": "String"
        },
        "properties": {
            "type": "Object"
        }
    }
}
let mongoSchema = new mongoose.Schema(schemaSchema.properties)
mongoSchema.index({
    name: 1,
    version: 1
},{ 
    unique:true
})

let __schema__ = mongoose.model(schemaSchema.name, mongoSchema, schemaSchema.collection_name)

let _schema_serve = restify.serve(
    router,
    __schema__
)
console.log(_schema_serve);

__schema__.find({version: API_VERSION}, (err, schemas) => {
    // schema 转换工具 https://transform.tools/json-to-mongoose
    // const schemas = [
    //     schemaSchema,
    //     {
    //         "name": "Customer",
    //         "properties": {
    //             "name": {
    //                 "type": "String",
    //                 "required": true
    //             },
    //             "comment": {
    //                 "type": "String"
    //             }
    //         }
    //     },
    //     {
    //         "name": "grid",
    //         "collection_name": "wgh",
    //         "properties": {
    //             "taskId": {
    //                 "type": "String"
    //             },
    //             "description": {
    //                 "type": "String",
    //                 "access": "protected"
    //             }
    //         }
    //     }
    // ]
    console.log({schemas});
    init(schemas)
})

function init(schemas) {
    schemas.forEach(_schema => {

        if (!_schema || !_schema.name) { return }
        let name = _schema.name

        //实际数据表名称, 如不指定等同于接口名称
        let collection_name = _schema.collection_name || name

        console.log({ name, collection_name });
        try {
            let r = restify.serve(
                router,
                mongoose.model(name, new mongoose.Schema(_schema.properties), collection_name),
                // option
            )
            console.log(r);
        } catch (error) {
            console.error(error)
        }
    })

    app.get('/__reset__', (req, res, next) => {
        res.send('reseting...')
        process.exit(0)
    })

    app.use(router)

    // if not match any router...
    app.use((req, res, next) => {
        res.status(404).send({ message: 'Not find.' });
    });


    app.listen(3000, () => {
        console.log('Express server listening on http://0.0.0.0:3000')
    })

}