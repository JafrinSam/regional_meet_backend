const mongoose = require("mongoose");

const PosterScoreParameterSchema = new mongoose.Schema({
    parameterName: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    inputType: { type: String },  // rating, dropdown, text
    description: { type: String }
});

const PosterScoreSchema = new mongoose.Schema({
    scoreId: {
        type: String,
        required: true,
        unique: true
    },

    userId: { type: String, required: true },
    userType: { type: String, enum: ["Evaluator", "User"], required: true },

    posterId: { type: String, required: true },

    // ⭐ Dynamic parameter scoring
    parameters: {
        type: [PosterScoreParameterSchema],
        required: true
    },

    total: { type: Number, default: 0 },

    evaluatorRemarks: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now }
});

// Auto compute total only from rating parameters
PosterScoreSchema.pre("save", function (next) {
    let sum = 0;
    this.parameters.forEach(p => {
        if (p.inputType === "rating" && typeof p.value === "number") {
            sum += p.value;
        }
    });
    this.total = sum;
    next();
});

module.exports = mongoose.model("PosterScore", PosterScoreSchema);
