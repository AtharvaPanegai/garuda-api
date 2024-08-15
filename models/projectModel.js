const { Schema, default: mongoose } = require("mongoose");

const projectSchema = new Schema({
    projectName : {
        type : String,
        required : true
    },
    customer : {
        type : Schema.Types.ObjectId,
        ref : "customer"
    },
    totalApis : [
        {
            type : Schema.Types.ObjectId,
            ref : "apiModel"
        }
    ],
    apiKey : {
        type : String,
        required : false
    }
})

module.exports = mongoose.model("projectModel",projectSchema);