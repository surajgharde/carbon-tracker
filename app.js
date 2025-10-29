// Carbon Emission Tracking Application JavaScript

// Application Data Storage (Server-backed)
let appData = {
    activities: [],
    emissionFactors: {},
    monthlyData: [
        {"month": "Jan", "scope1": 280, "scope2": 420, "scope3": 650},
        {"month": "Feb", "scope1": 250, "scope2": 380, "scope3": 590},
        {"month": "Mar", "scope1": 290, "scope2": 450, "scope3": 710},
        {"month": "Apr", "scope1": 270, "scope2": 410, "scope3": 630},
        {"month": "May", "scope1": 260, "scope2": 390, "scope3": 600},
        {"month": "Jun", "scope1": 240, "scope2": 360, "scope3": 580}
    ],
    goals: {
        "annualTarget": 5000,
        "currentProgress": 3450,
        "monthlyTarget": 417,
        "reductionGoal": 15
    },
    settings: {
        organizationName: "Green Tech Corp",
        contactEmail: "admin@greentechcorp.com",
        employees: 150,
        defaultUnit: "metric",
        reportingPeriod: "monthly",
        autoCalculate: true
    }
};

let currentCategory = 'Transportation';
let charts = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeDashboard();
    initializeDataEntry();
    loadInitialData();
});

const API_BASE = '/api';

async function loadInitialData() {
    try {
        const settingsRes = await fetch(`${API_BASE}/settings`);
        const settings = await settingsRes.json();
        if (settings && settings.emissionFactors) {
            appData.emissionFactors = settings.emissionFactors;
        }
        if (settings && settings.goals) {
            appData.goals = {
                annualTarget: settings.goals.annualTarget ?? appData.goals.annualTarget,
                currentProgress: settings.goals.currentProgress ?? appData.goals.currentProgress,
                monthlyTarget: settings.goals.monthlyTarget ?? appData.goals.monthlyTarget,
                reductionGoal: settings.goals.reductionGoal ?? appData.goals.reductionGoal
            };
        }
        appData.settings.organizationName = settings.organizationName || appData.settings.organizationName;
        appData.settings.contactEmail = settings.contactEmail || appData.settings.contactEmail;
        appData.settings.employees = settings.employees || appData.settings.employees;
        appData.settings.defaultUnit = settings.defaultUnit || appData.settings.defaultUnit;
        appData.settings.reportingPeriod = settings.reportingPeriod || appData.settings.reportingPeriod;
        appData.settings.autoCalculate = typeof settings.autoCalculate === 'boolean' ? settings.autoCalculate : appData.settings.autoCalculate;
        initializeSettings();

        const activitiesRes = await fetch(`${API_BASE}/activities`);
        const activities = await activitiesRes.json();
        appData.activities = Array.isArray(activities) ? activities : [];

        updateMetrics();
        renderRecentActivities();
        createScopeChart();
        createMonthlyTrendChart();
        updateGoalTracking();
        updateSubcategoryOptions('Transportation');
    } catch (err) {
        console.error('Failed to load initial data:', err);
        updateMetrics();
        renderRecentActivities();
        createScopeChart();
        createMonthlyTrendChart();
        updateGoalTracking();
    }
}

// Navigation Functions
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Initialize section-specific functionality
    if (sectionName === 'analytics') {
        initializeAnalytics();
    }
}

// Dashboard Functions
function initializeDashboard() {
    createMonthlyTrendChart();
    createScopeChart();
}

// Create Monthly trend chart 
function createMonthlyTrendChart() {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');

    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totals = {
        'Scope 1': Array(12).fill(0),
        'Scope 2': Array(12).fill(0),
        'Scope 3': Array(12).fill(0),
        'Scope 4': Array(12).fill(0)
    };

    appData.activities.forEach(activity => {
        if (!activity.date) return;
        const monthIndex = new Date(activity.date).getMonth();
        const scope = activity.scope || getScopeForCategory(activity.category) || 'Scope 1';
        const value = typeof activity.emissions === 'number' ? activity.emissions : parseFloat(activity.emissions) || 0;
        if (totals[scope]) {
            totals[scope][monthIndex] += value;
        }
    });

    // Trim to months that have any data to keep the chart focused
    const hasAny = monthLabels.map((_, i) =>
        totals['Scope 1'][i] + totals['Scope 2'][i] + totals['Scope 3'][i] + totals['Scope 4'][i]
    );
    const firstIdx = hasAny.findIndex(v => v > 0);
    const lastIdx = hasAny.length - 1 - hasAny.slice().reverse().findIndex(v => v > 0);
    const start = firstIdx === -1 ? 0 : firstIdx;
    const end = firstIdx === -1 ? 5 : lastIdx; // default show first 6 months if no data

    const labels = monthLabels.slice(start, end + 1);

    const ds = [
        {
            label: 'Scope 1',
            data: totals['Scope 1'].slice(start, end + 1),
            borderColor: '#1FB8CD',
            backgroundColor: 'rgba(31, 184, 205, 0.1)',
            tension: 0.4
        },
        {
            label: 'Scope 2',
            data: totals['Scope 2'].slice(start, end + 1),
            borderColor: '#FFC185',
            backgroundColor: 'rgba(255, 193, 133, 0.1)',
            tension: 0.4
        },
        {
            label: 'Scope 3',
            data: totals['Scope 3'].slice(start, end + 1),
            borderColor: '#B4413C',
            backgroundColor: 'rgba(180, 65, 60, 0.1)',
            tension: 0.4
        }
    ];

    // Only include Scope 4 if it has data
    if (totals['Scope 4'].some(v => v > 0)) {
        ds.push({
            label: 'Scope 4',
            data: totals['Scope 4'].slice(start, end + 1),
            borderColor: '#7E8C6F',
            backgroundColor: 'rgba(126, 140, 111, 0.1)',
            tension: 0.4
        });
    }

    if (charts.monthlyTrend) {
        charts.monthlyTrend.destroy();
    }

    charts.monthlyTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: ds
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO₂ Emissions (kg)'
                    }
                }
            }
        }
    });
}

function createScopeChart() {
    const ctx = document.getElementById('scopeChart').getContext('2d');
    const totals = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0, 'Scope 4': 0 };
    appData.activities.forEach(activity => {
        const key = activity.scope || getScopeForCategory(activity.category);
        const value = typeof activity.emissions === 'number' ? activity.emissions : parseFloat(activity.emissions) || 0;
        if (totals[key] === undefined) totals[key] = 0;
        totals[key] += value;
    });

    const scopeColors = {
        'Scope 1': '#1FB8CD',
        'Scope 2': '#FFC185',
        'Scope 3': '#B4413C',
        'Scope 4': '#7E8C6F'
    };

    const labels = Object.keys(totals).filter(k => totals[k] > 0);
    const data = labels.map(k => totals[k]);
    const colors = labels.map(k => scopeColors[k] || '#cccccc');

    if (charts.scope) {
        charts.scope.destroy();
    }

    charts.scope = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data.length ? data : [0],
                backgroundColor: colors.length ? colors : ['#e0e0e0'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Data Entry Functions
function initializeDataEntry() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const form = document.getElementById('activityForm');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            switchCategory(category);
        });
    });
    
    form.addEventListener('submit', handleFormSubmit);
    document.getElementById('subcategory').addEventListener('change', updateEmissionFactor);
    document.getElementById('quantity').addEventListener('input', calculateEmissions);
    
    // Initialize with Transportation category
    switchCategory('Transportation');
    
    // Set today's date as default
    document.getElementById('activityDate').valueAsDate = new Date();
}

function switchCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Update subcategory options
    updateSubcategoryOptions(category);
}

function updateSubcategoryOptions(category) {
    const subcategorySelect = document.getElementById('subcategory');
    subcategorySelect.innerHTML = '<option value="">Select activity type</option>';
    
    const factors = appData.emissionFactors[category] || {};
    Object.keys(factors).forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory;
        option.textContent = subcategory;
        subcategorySelect.appendChild(option);
    });
}

function updateEmissionFactor() {
    const subcategory = document.getElementById('subcategory').value;
    if (!subcategory) return;
    
    const factor = (appData.emissionFactors[currentCategory] || {})[subcategory];
    if (!factor) return;
    document.getElementById('emissionFactor').value = factor.factor;
    document.getElementById('unit').value = factor.unit.split('/')[1];
    
    calculateEmissions();
}

function calculateEmissions() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const emissionFactor = parseFloat(document.getElementById('emissionFactor').value) || 0;
    const emissions = quantity * emissionFactor;
    
    document.getElementById('calculatedEmissions').value = emissions.toFixed(2);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const payload = {
        date: document.getElementById('activityDate').value,
        category: currentCategory,
        subcategory: document.getElementById('subcategory').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        emissionFactor: parseFloat(document.getElementById('emissionFactor').value),
        emissions: parseFloat(document.getElementById('calculatedEmissions').value),
        scope: getScopeForCategory(currentCategory)
    };
    
    try {
        const res = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save activity');
        const saved = await res.json();
        appData.activities.unshift(saved);
        updateMetrics();
        renderRecentActivities();
        createScopeChart();
        createMonthlyTrendChart();
        updateGoalTracking();
        showSuccessMessage('Activity added successfully!');
        e.target.reset();
        document.getElementById('activityDate').valueAsDate = new Date();
        updateSubcategoryOptions(currentCategory);
    } catch (err) {
        console.error(err);
        showSuccessMessage('Failed to add activity');
    }
}

function getScopeForCategory(category) {
    const scopeMapping = {
        'Transportation': 'Scope 1',
        'Energy': 'Scope 2',
        'Business Travel': 'Scope 3',
        'Supply Chain': 'Scope 3'
    };
    return scopeMapping[category] || 'Scope 1';
}

// Analytics Functions
function initializeAnalytics() {
    createCategoryChart();
}

function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Calculate category totals
    const categoryTotals = {};
    appData.activities.forEach(activity => {
        if (!categoryTotals[activity.category]) {
            categoryTotals[activity.category] = 0;
        }
        categoryTotals[activity.category] += activity.emissions;
    });
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                label: 'CO₂ Emissions (kg)',
                data: Object.values(categoryTotals),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO₂ Emissions (kg)'
                    }
                }
            }
        }
    });
}

// Metrics and Display Functions
function updateMetrics() {
    const totalEmissions = appData.activities.reduce((sum, activity) => sum + activity.emissions, 0);
    const currentMonth = new Date().getMonth();
    const monthlyEmissions = appData.activities
        .filter(activity => new Date(activity.date).getMonth() === currentMonth)
        .reduce((sum, activity) => sum + activity.emissions, 0);
    
    document.getElementById('totalEmissions').textContent = totalEmissions.toLocaleString();
    document.getElementById('monthlyEmissions').textContent = monthlyEmissions.toLocaleString();
    
    const goalProgress = (totalEmissions / appData.goals.annualTarget * 100).toFixed(0);
    document.getElementById('goalProgress').textContent = goalProgress + '%';
}

function updateGoalTracking() {
    const totalEmissions = appData.activities.reduce((sum, activity) => sum + (Number(activity.emissions) || 0), 0);
    const target = Number(appData.goals.annualTarget) || 0;
    const reductionGoal = Number(appData.goals.reductionGoal) || 0;
    const progressPct = target > 0 ? Math.min(100, (totalEmissions / target) * 100) : 0;

    const fill = document.getElementById('goalProgressFill');
    const stats = document.getElementById('goalStatsText');
    const status = document.getElementById('goalStatus');
    const subtitle = document.getElementById('goalSubtitle');

    if (fill) fill.style.width = `${progressPct.toFixed(0)}%`;
    if (stats) stats.textContent = `${totalEmissions.toFixed(0)} kg / ${target.toLocaleString()} kg target`;
    if (subtitle) subtitle.textContent = `${reductionGoal}% reduction from baseline`;

    if (status) {
        // Simple status rule of thumb
        status.textContent = progressPct <= 70 ? 'On Track' : (progressPct <= 100 ? 'At Risk' : 'Exceeded');
        status.className = 'status ' + (progressPct <= 70 ? 'status--success' : (progressPct <= 100 ? 'status--warning' : 'status--error'));
    }
}

function renderRecentActivities() {
    const container = document.getElementById('recentActivitiesList');
    const recentActivities = appData.activities;
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div>
                <div class="activity-category">${activity.category}</div>
                <div class="activity-subcategory">${activity.subcategory}</div>
            </div>
            <div class="activity-quantity">${activity.quantity} ${activity.unit}</div>
            <div class="activity-emissions">${activity.emissions.toFixed(1)} kg CO₂</div>
            <div class="activity-date">${formatDate(activity.date)}</div>
            <button class="delete-activity" data-id="${activity._id || activity.id}" title="Delete activity">Delete</button>
        </div>
    `).join('');
    
    // Show about 5 items, scroll for the rest
    container.style.maxHeight = '420px';
    container.style.overflowY = 'auto';
    container.style.paddingRight = '4px';
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-activity').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const activityId = e.target.getAttribute('data-id'); // keep as string for Mongo ObjectId
            if (confirm('Are you sure you want to delete this activity?')) {
                deleteActivity(activityId);
            }
        });
    });
}

async function deleteActivity(activityId) {
    try {
        await fetch(`${API_BASE}/activities/${activityId}`, { method: 'DELETE' });
        // Remove locally by string compare to handle ObjectId
        appData.activities = appData.activities.filter(activity => String(activity._id || activity.id) !== String(activityId));
        updateMetrics();
        renderRecentActivities();
        createScopeChart();
        createMonthlyTrendChart();
        updateGoalTracking();
        showSuccessMessage('Activity deleted successfully!');
    } catch (err) {
        console.error(err);
        showSuccessMessage('Failed to delete activity');
    }
}

// Report Functions
function generateReport(type) {
    const reportContent = document.getElementById('reportContent');
    const reportPreview = document.getElementById('reportPreview');
    
    let content = '';
    
    switch(type) {
        case 'monthly':
            content = generateMonthlyReport();
            break;
        case 'annual':
            content = generateAnnualReport();
            break;
        case 'compliance':
            content = generateComplianceReport();
            break;
    }
    
    reportContent.innerHTML = content;
    reportPreview.classList.remove('hidden');
}

function generateMonthlyReport() {
    const totalEmissions = appData.activities.reduce((sum, activity) => sum + activity.emissions, 0);
    const categoryBreakdown = {};
    
    appData.activities.forEach(activity => {
        if (!categoryBreakdown[activity.category]) {
            categoryBreakdown[activity.category] = 0;
        }
        categoryBreakdown[activity.category] += activity.emissions;
    });
    
    return `
        <h4>Monthly Emission Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
        <div style="margin: 20px 0;">
            <strong>Executive Summary:</strong>
            <p>Total emissions for this period: <strong>${totalEmissions.toFixed(1)} kg CO₂</strong></p>
            <p>Monthly target: ${appData.goals.monthlyTarget} kg CO₂</p>
            <p>Performance: ${totalEmissions > appData.goals.monthlyTarget ? 'Above target' : 'Within target'}</p>
        </div>
        <div style="margin: 20px 0;">
            <strong>Breakdown by Category:</strong>
            ${Object.entries(categoryBreakdown).map(([category, emissions]) => 
                `<p>${category}: ${emissions.toFixed(1)} kg CO₂ (${(emissions/totalEmissions*100).toFixed(1)}%)</p>`
            ).join('')}
        </div>
        <div style="margin: 20px 0;">
            <strong>Recent Activities:</strong>
            ${appData.activities.slice(0, 10).map(activity => 
                `<p>${formatDate(activity.date)} - ${activity.category}: ${activity.emissions.toFixed(1)} kg CO₂</p>`
            ).join('')}
        </div>
    `;
}

function generateAnnualReport() {
    const totalEmissions = appData.activities.reduce((sum, activity) => sum + activity.emissions, 0);
    const monthlyTotals = appData.monthlyData.map(d => d.scope1 + d.scope2 + d.scope3);
    
    return `
        <h4>Annual Sustainability Report - ${new Date().getFullYear()}</h4>
        <div style="margin: 20px 0;">
            <strong>Annual Performance:</strong>
            <p>Total emissions: <strong>${totalEmissions.toFixed(1)} kg CO₂</strong></p>
            <p>Annual target: ${appData.goals.annualTarget} kg CO₂</p>
            <p>Progress: ${(totalEmissions/appData.goals.annualTarget*100).toFixed(1)}% of target</p>
            <p>Reduction goal: ${appData.goals.reductionGoal}%</p>
        </div>
        <div style="margin: 20px 0;">
            <strong>Monthly Trend:</strong>
            <p>Average monthly emissions: ${(monthlyTotals.reduce((a,b) => a+b, 0)/monthlyTotals.length).toFixed(1)} kg CO₂</p>
            <p>Highest month: ${Math.max(...monthlyTotals).toFixed(1)} kg CO₂</p>
            <p>Lowest month: ${Math.min(...monthlyTotals).toFixed(1)} kg CO₂</p>
        </div>
        <div style="margin: 20px 0;">
            <strong>Sustainability Initiatives:</strong>
            <p>• Implemented energy-efficient lighting systems</p>
            <p>• Promoted remote work to reduce transportation emissions</p>
            <p>• Switched to renewable energy sources where possible</p>
        </div>
    `;
}

function generateComplianceReport() {
    const scope1 = appData.activities.filter(a => a.scope === 'Scope 1').reduce((sum, a) => sum + a.emissions, 0);
    const scope2 = appData.activities.filter(a => a.scope === 'Scope 2').reduce((sum, a) => sum + a.emissions, 0);
    const scope3 = appData.activities.filter(a => a.scope === 'Scope 3').reduce((sum, a) => sum + a.emissions, 0);
    
    return `
        <h4>GHG Emissions Compliance Report</h4>
        <div style="margin: 20px 0;">
            <strong>Organization Information:</strong>
            <p>Name: ${appData.settings.organizationName}</p>
            <p>Reporting Period: ${new Date().getFullYear()}</p>
            <p>Employees: ${appData.settings.employees}</p>
        </div>
        <div style="margin: 20px 0;">
            <strong>GHG Emissions by Scope:</strong>
            <p>Scope 1 (Direct Emissions): ${scope1.toFixed(1)} kg CO₂e</p>
            <p>Scope 2 (Electricity): ${scope2.toFixed(1)} kg CO₂e</p>
            <p>Scope 3 (Other Indirect): ${scope3.toFixed(1)} kg CO₂e</p>
            <p><strong>Total: ${(scope1 + scope2 + scope3).toFixed(1)} kg CO₂e</strong></p>
        </div>
        <div style="margin: 20px 0;">
            <strong>Methodology:</strong>
            <p>Emissions calculated using standard emission factors from recognized sources.</p>
            <p>Data collection period: January 1 - December 31, ${new Date().getFullYear()}</p>
            <p>Verification status: Internal verification completed</p>
        </div>
    `;
}

function exportData(format) {
    if (format === 'pdf') {
        const report = document.getElementById('reportContent');
        if (!report || !report.innerHTML.trim()) {
            showSuccessMessage('Generate a report first');
            return;
        }
        const opt = {
            margin:       10,
            filename:     `report_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        try {
            // html2pdf returns a promise
            html2pdf().set(opt).from(report).save();
        } catch (e) {
            console.error(e);
            showSuccessMessage('Failed to export PDF');
        }
    } else if (format === 'csv') {
        // Simple CSV export of activities
        const rows = [
            ['Date','Category','Subcategory','Quantity','Unit','Emission Factor','Emissions','Scope'],
            ...appData.activities.map(a => [a.date, a.category, a.subcategory, a.quantity, a.unit, a.emissionFactor, a.emissions, a.scope])
        ];
        const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/\"/g,'\"')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `activities_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        showSuccessMessage(`Report exported as ${format.toUpperCase()}`);
    }
}

function closeReportPreview() {
    document.getElementById('reportPreview').classList.add('hidden');
}

// Settings Functions
function initializeSettings() {
    // Populate settings form with current values
    Object.keys(appData.settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = appData.settings[key];
            } else {
                element.value = appData.settings[key];
            }
        }
    });
}

async function saveSettings() {
    // Update settings from form
    Object.keys(appData.settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                appData.settings[key] = element.checked;
            } else {
                appData.settings[key] = element.value;
            }
        }
    });
    try {
        const res = await fetch(`${API_BASE}/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData.settings)
        });
        if (!res.ok) throw new Error('Failed to save settings');
        const updated = await res.json();
        if (updated.emissionFactors) {
            appData.emissionFactors = updated.emissionFactors;
        }
        showSuccessMessage('Settings saved successfully!');
        updateGoalTracking();
    } catch (err) {
        console.error(err);
        showSuccessMessage('Failed to save settings');
    }
}

async function resetSettings() {
    try {
        const res = await fetch(`${API_BASE}/settings/reset`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to reset settings');
        const defaults = await res.json();
        appData.settings.organizationName = defaults.organizationName;
        appData.settings.contactEmail = defaults.contactEmail;
        appData.settings.employees = defaults.employees;
        appData.settings.defaultUnit = defaults.defaultUnit;
        appData.settings.reportingPeriod = defaults.reportingPeriod;
        appData.settings.autoCalculate = defaults.autoCalculate;
        appData.emissionFactors = defaults.emissionFactors || appData.emissionFactors;
        initializeSettings();
        showSuccessMessage('Settings reset to defaults!');
        updateGoalTracking();
    } catch (err) {
        console.error(err);
        showSuccessMessage('Failed to reset settings');
    }
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function showSuccessMessage(message) {
    // Determine anchor: prefer Data Entry section when visible
    const entrySection = document.getElementById('entry');
    const entryActive = entrySection && entrySection.classList.contains('active');
    const entryContainer = entryActive ? entrySection.querySelector('.container') : null;

    // Ensure a container exists (avoids overlap and ensures very high stacking)
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';

        if (entryContainer) {
            // Position inside Data Entry container, above the section header
            if (getComputedStyle(entryContainer).position === 'static') {
                entryContainer.style.position = 'relative';
            }
            container.style.cssText = `
                position: absolute;
                top: 8px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                z-index: 99999;
                pointer-events: none;
                width: max-content;
                max-width: 90%;
            `;
            entryContainer.prepend(container);
        } else {
            // Fallback: fixed top-right
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 99999;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    } else if (entryContainer && container.parentElement !== entryContainer) {
        // Move container into entry when switching sections
        if (getComputedStyle(entryContainer).position === 'static') {
            entryContainer.style.position = 'relative';
        }
        container.style.position = 'absolute';
        container.style.top = '8px';
        container.style.left = '50%';
        container.style.right = '';
        container.style.transform = 'translateX(-50%)';
        entryContainer.prepend(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        background: #4CAF50;
        color: #fff;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px;
        text-align: center;
        opacity: 0;
        transform: translateY(-6px);
        transition: opacity 200ms ease, transform 200ms ease;
        pointer-events: auto;
    `;

    container.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Auto dismiss
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}


// Global functions for HTML event handlers
window.showSection = showSection;
window.generateReport = generateReport;
window.exportData = exportData;
window.closeReportPreview = closeReportPreview;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;