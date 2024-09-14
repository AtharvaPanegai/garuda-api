const { Schema, default: mongoose } = require("mongoose");

const apiSchema = new Schema({
    apiEndPoint : {
        type : String,
        required : true,
        unique : true
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
        ref:"project"
    },
    customer : {
        type : Schema.Types.ObjectId,
        ref : "customer"
    },
    isCurrentlyDown : {
        type : Boolean,
        required : false,
    },
    apiMostRecentStatusCode : {
        type : String,
        required : true
    },
    apiMostRecentResponseTime : {
        type : String,
        required : true
    },
    totalHitsTillNow : {
        type : Number,
        required : true
    },
    apiStatusCodesArray : {
        type : Array,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("apiModel",apiSchema);