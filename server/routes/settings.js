const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get settings
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings
router.patch('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Update settings fields if they exist in the request
        if (req.body.organizationName !== undefined) {
            settings.organizationName = req.body.organizationName;
        }
        if (req.body.contactEmail !== undefined) {
            settings.contactEmail = req.body.contactEmail;
        }
        if (req.body.employees !== undefined) {
            settings.employees = req.body.employees;
        }
        if (req.body.defaultUnit !== undefined) {
            settings.defaultUnit = req.body.defaultUnit;
        }
        if (req.body.reportingPeriod !== undefined) {
            settings.reportingPeriod = req.body.reportingPeriod;
        }
        if (req.body.autoCalculate !== undefined) {
            settings.autoCalculate = req.body.autoCalculate;
        }
        if (req.body.goals !== undefined) {
            settings.goals = { ...settings.goals, ...req.body.goals };
        }
        if (req.body.employees !== undefined) {
            settings.employees = req.body.employees;
        }
        if (req.body.defaultUnit !== undefined) {
            settings.defaultUnit = req.body.defaultUnit;
        }
        if (req.body.reportingPeriod !== undefined) {
            settings.reportingPeriod = req.body.reportingPeriod;
        }
        if (req.body.autoCalculate !== undefined) {
            settings.autoCalculate = req.body.autoCalculate;
        }
        
        // Update goals if provided
        if (req.body.goals) {
            if (req.body.goals.annualTarget !== undefined) {
                settings.goals.annualTarget = req.body.goals.annualTarget;
            }
            if (req.body.goals.currentProgress !== undefined) {
                settings.goals.currentProgress = req.body.goals.currentProgress;
            }
            if (req.body.goals.monthlyTarget !== undefined) {
                settings.goals.monthlyTarget = req.body.goals.monthlyTarget;
            }
            if (req.body.goals.reductionGoal !== undefined) {
                settings.goals.reductionGoal = req.body.goals.reductionGoal;
            }
        }
        
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Reset settings to default
router.post('/reset', async (req, res) => {
    try {
        await Settings.deleteMany({});
        const defaultSettings = new Settings();
        const savedSettings = await defaultSettings.save();
        res.json(savedSettings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
