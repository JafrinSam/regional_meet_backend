const mongoose = require("mongoose");

const PosterEvaluationEntry = new mongoose.Schema({
    evaluatorId: String,
    score: Number   // total per evaluator
});

const PosterDetailsSchema = new mongoose.Schema({
    posterId: {
        type: String,
        required: true,
        unique: true
    },

    userId: { type: String, required: true },

    iicId: { type: String, required: true },
    instituteName: { type: String, required: true },
    instituteCity: { type: String, required: true },
    instituteState: { type: String, required: true },

    // ⭐ dynamic evaluations (Eval 1, Eval 2, Eval 3, ...)
    evaluations: {
        type: [PosterEvaluationEntry],
        default: []
    },

    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

PosterDetailsSchema.pre("save", function (next) {
    if (this.evaluations.length > 0) {
        const scores = this.evaluations.map(e => e.score);
        this.total = scores.reduce((a, b) => a + b, 0);
        this.average = parseFloat((this.total / scores.length).toFixed(2));
    }
    next();
});

module.exports = mongoose.model("PosterDetails", PosterDetailsSchema);
