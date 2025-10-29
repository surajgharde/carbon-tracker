const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        default: 'My Organization'
    },
    contactEmail: {
        type: String,
        required: true,
        default: 'admin@example.com'
    },
    employees: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    defaultUnit: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric'
    },
    reportingPeriod: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        default: 'monthly'
    },
    autoCalculate: {
        type: Boolean,
        default: true
    },
    goals: {
        annualTarget: {
            type: Number,
            default: 5000
        },
        currentProgress: {
            type: Number,
            default: 0
        },
        monthlyTarget: {
            type: Number,
            default: 417
        },
        reductionGoal: {
            type: Number,
            default: 15
        }
    },
    emissionFactors: {
        type: Object,
        default: {
            "Transportation": {
                "Car - Petrol": {"factor": 0.21, "unit": "kg CO2/km"},
                "Car - Diesel": {"factor": 0.17, "unit": "kg CO2/km"},
                "Car - Electric": {"factor": 0.05, "unit": "kg CO2/km"},
                "Bus": {"factor": 0.08, "unit": "kg CO2/km"},
                "Train": {"factor": 0.04, "unit": "kg CO2/km"},
                "Motorcycle": {"factor": 0.12, "unit": "kg CO2/km"}
            },
            "Energy": {
                "Electricity": {"factor": 0.82, "unit": "kg CO2/kWh"},
                "Natural Gas": {"factor": 2.2, "unit": "kg CO2/m³"},
                "Heating Oil": {"factor": 2.5, "unit": "kg CO2/L"},
                "LPG": {"factor": 1.5, "unit": "kg CO2/L"}
            },
            "Business Travel": {
                "Flight - Domestic": {"factor": 0.19, "unit": "kg CO2/km"},
                "Flight - International": {"factor": 0.23, "unit": "kg CO2/km"},
                "Hotel Stay": {"factor": 30, "unit": "kg CO2/night"},
                "Taxi": {"factor": 0.25, "unit": "kg CO2/km"}
            },
            "Supply Chain": {
                "Paper": {"factor": 1.2, "unit": "kg CO2/kg"},
                "Plastic": {"factor": 3.4, "unit": "kg CO2/kg"},
                "Steel": {"factor": 2.1, "unit": "kg CO2/kg"},
                "Shipping": {"factor": 0.15, "unit": "kg CO2/km"}
            }
        }
    }
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
