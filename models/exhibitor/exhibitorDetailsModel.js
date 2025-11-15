const mongoose = require("mongoose");

const EvaluationEntry = new mongoose.Schema({
    evaluatorId: String,   
    score: Number          // Each evaluator’s total score
});

const ExhibitorDetailsSchema = new mongoose.Schema({
    productId: {
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
        enum: ["YUKTI", "General"],
        required: true
    },

    stageReadinessLevel: {
        type: String,
        enum: ["Idea", "PoC", "Prototype", "Product"],
        required: true
    },

    companyState: { type: String },
    registrationType: { type: String },
    dpiit: { type: String },

    startupName: { type: String },
    ipStatus: { type: String },

    pitchingParticipation: { type: String },

    productCategory: { type: String },
    productName: { type: String, required: true },
    productUrl: { type: String, default: "" },

    // ⭐ Dynamic evaluator score list
    evaluations: {
        type: [EvaluationEntry],
        default: []
    },

    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

ExhibitorDetailsSchema.pre("save", function (next) {
    if (this.evaluations.length > 0) {
        const scores = this.evaluations.map(e => e.score);
        this.total = scores.reduce((a, b) => a + b, 0);
        this.average = parseFloat((this.total / scores.length).toFixed(2));
    }
    next();
});

module.exports = mongoose.model("ExhibitorDetails", ExhibitorDetailsSchema);
