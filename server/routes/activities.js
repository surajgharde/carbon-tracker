const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Get all activities
router.get('/', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ date: -1 });
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new activity
router.post('/', async (req, res) => {
    const activity = new Activity({
        date: req.body.date,
        category: req.body.category,
        subcategory: req.body.subcategory,
        quantity: req.body.quantity,
        unit: req.body.unit,
        emissionFactor: req.body.emissionFactor,
        emissions: req.body.emissions,
        scope: req.body.scope
    });

    try {
        const newActivity = await activity.save();
        res.status(201).json(newActivity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get a specific activity
router.get('/:id', getActivity, (req, res) => {
    res.json(res.activity);
});

// Update an activity
router.patch('/:id', getActivity, async (req, res) => {
    if (req.body.date != null) {
        res.activity.date = req.body.date;
    }
    if (req.body.category != null) {
        res.activity.category = req.body.category;
    }
    // Add other fields as needed

    try {
        const updatedActivity = await res.activity.save();
        res.json(updatedActivity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an activity
router.delete('/:id', getActivity, async (req, res) => {
    try {
        await res.activity.deleteOne();
        res.json({ message: 'Deleted Activity' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware to get activity by ID
async function getActivity(req, res, next) {
    let activity;
    try {
        activity = await Activity.findById(req.params.id);
        if (activity == null) {
            return res.status(404).json({ message: 'Cannot find activity' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.activity = activity;
    next();
}

module.exports = router;
