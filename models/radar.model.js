const { Schema, default: mongoose } = require("mongoose");

const apiPerformanceSchema = new Schema({
    apiId: {
        type: Schema.ObjectId,
        ref: "apiModel",
        required: true
    },
    project : {
        type : Schema.Types.ObjectId,
        ref : "project",
        required : true
    },
    // Performance Metrics
    hitsPerTimeFrame: [
        {
            timeframe: String,
            hits: Number,
        },
    ],
    statusCodesPerTimeFrame: [
        {
            timeframe: String,
            statusCodes: [
                {
                    statusCode: Number,
                    count: Number,
                },
            ],
        },
    ],
    apiMostCapturedStatusCode : {
        type : String,
        required : true,
    },
    apiAverageResponseTime : {
        type : String,
        reqired : true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Radar", apiPerformanceSchema);
