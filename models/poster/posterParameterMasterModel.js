const mongoose = require("mongoose");

const PosterParameterMasterSchema = new mongoose.Schema({
    parameterName: { type: String, required: true },
    description: { type: String, default: "" },
    inputType: { 
        type: String, 
        enum: ["rating", "dropdown", "text"], 
        required: true 
    },

    // Optional: Dropdown options (if inputType = dropdown)
    options: { type: [String], default: [] },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model(
    "PosterParameterMaster",
    PosterParameterMasterSchema
);
