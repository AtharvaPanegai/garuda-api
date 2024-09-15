const { Schema, default: mongoose } = require("mongoose");

const apiPerformanceSchema = new Schema({
    apiId: {
        type: Schema.ObjectId,
        ref: "apiModel",
        required: true
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Radar", apiPerformanceSchema);
