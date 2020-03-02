module.exports = {
    Customer: {
        name: { type: "String", required: true },
        comment: { type: "String" }
    },
    user:{
        name:{type: "String", required: true},
        age: {type: "Number"}
    },
    wgh:{
        "taskId":{ type: "String"},
        "description":{type: "String"}
    }
}