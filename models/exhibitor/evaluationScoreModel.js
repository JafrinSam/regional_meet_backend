const mongoose = require("mongoose");

const ScoreParameterSchema = new mongoose.Schema({
    parameterName: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },   // rating / dropdown / text
    inputType: { type: String },                    // "rating", "dropdown", "text"
    description: { type: String }
});

const EvaluationScoreSchema = new mongoose.Schema({
    scoreId: {
        type: String, 
        required: true,
        unique: true
    },

    userId: { 
        type: String, 
        required: true 
    },

    userType: {
        type: String,
        enum: ["Evaluator", "User"],
        required: true
    },

    productId: {
        type: String,
        required: true
    },

    // ⭐ Dynamic Parameters
    parameters: {
        type: [ScoreParameterSchema],
        required: true
    },
    remarks: { type: String, default: "" },
    // Auto-computed total score (only rating parameters)
    total: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

// Auto calculate total from rating parameters
EvaluationScoreSchema.pre("save", function (next) {
    let sum = 0;

    this.parameters.forEach(p => {
        if (p.inputType === "rating" && typeof p.value === "number") {
            sum += p.value;
        }
    });

    this.total = sum;
    next();
});

module.exports = mongoose.model("EvaluationScore", EvaluationScoreSchema);
