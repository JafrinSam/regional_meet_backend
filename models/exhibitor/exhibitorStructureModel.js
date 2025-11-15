const mongoose = require("mongoose");

const ParameterSchema = new mongoose.Schema({
    parameterName: { type: String, required: true }, // e.g., "Innovation & Originality"
    value: { type: mongoose.Schema.Types.Mixed },    // number / string / dropdown
    description: { type: String, default: "" },
    inputType: { type: String, enum: ["rating", "dropdown", "text", "checkbox"], default: "rating" }
});

const ExhibitorScoreSchema = new mongoose.Schema({

    exhibitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exhibitor",
        required: true
    },

    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // ⭐ DYNAMIC PARAMETERS ARRAY
    parameters: {
        type: [ParameterSchema],   // Array of parameter objects
        required: true
    },

    // Auto-timestamp
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ExhibitorStructure", ExhibitorScoreSchema);
