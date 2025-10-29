const mongoose = require('mongoose');

// Map high-level categories to GHG Protocol scopes
const categoryToScopeMap = {
    'Transportation': 'Scope 1',
    'Energy': 'Scope 2',
    'Business Travel': 'Scope 3',
    'Supply Chain': 'Scope 4'
};

const activitySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    category: {
        type: String,
        required: true,
        enum: ['Transportation', 'Energy', 'Business Travel', 'Supply Chain']
    },
    subcategory: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    emissionFactor: {
        type: Number,
        required: true,
        min: 0
    },
    emissions: {
        type: Number,
        required: true,
        min: 0
    },
    scope: {
        type: String,
        required: true,
        enum: ['Scope 1', 'Scope 2', 'Scope 3', 'Scope 4']
    }
}, {
    timestamps: true
});

// Auto-assign scope from category if not explicitly provided (or override to ensure consistency)
activitySchema.pre('validate', function(next) {
    if (this.category && categoryToScopeMap[this.category]) {
        this.scope = categoryToScopeMap[this.category];
    }
    next();
});

module.exports = mongoose.model('Activity', activitySchema);
