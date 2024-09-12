const { Schema, default: mongoose } = require("mongoose");
// add slack bot msging feature may be 

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