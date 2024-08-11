const { Schema, default: mongoose } = require("mongoose");

const apiSchema = new Schema({
    apiEndPoint : {
        type : String,
        required : true,
    },
    apiMethod : {
        type : String,
        required : true,
    },
    apiMostCapturedStatusCode : {
        type : String,
        required : true,
    },
    apiAverageResponseTime : {
        type : String,
        reqired : true,
    },
    project : {
        type : Schema.Types.ObjectId,
        ref:"projectModel"
    },
    isCurrentlyDown : {
        type : Boolean,
        required : false,
    },
    

})

module.exports = mongoose.model("apiModel",apiSchema);