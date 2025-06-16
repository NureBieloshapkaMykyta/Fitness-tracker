let activityChart = null;

function initializeStatistics() {
    // Set up period buttons
    document.querySelectorAll('[data-period]').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('[data-period]').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update statistics with new period
            updateStatistics(this.dataset.period);
        });
    });

    // Initialize with day view
    updateStatistics('day');
}

function updateStatistics(period) {
    const date = new Date();
    console.log(`Updating statistics for period: ${period}, date: ${date.toISOString()}`);
    
    fetch(`/Home/GetStatistics?date=${date.toISOString()}&period=${period}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch statistics');
            return response.json();
        })
        .then(data => {
            console.log('Received statistics data:', data);
            updateTrainingStats(data.training);
            updateNutritionStats(data.nutrition);
            updateTimelineChart(data.timeline, period);
        })
        .catch(error => {
            console.error('Error fetching statistics:', error);
            // Show error state in UI
            document.getElementById('totalTrainings').textContent = '-';
            document.getElementById('totalExercises').textContent = '-';
            document.getElementById('totalCaloriesBurned').textContent = '-';
            document.getElementById('totalMeals').textContent = '-';
            document.getElementById('totalCalories').textContent = '-';
            document.getElementById('avgProteins').textContent = '-';
        });
}

function updateTrainingStats(stats) {
    document.getElementById('totalTrainings').textContent = stats.totalTrainings;
    document.getElementById('totalExercises').textContent = stats.totalExercises;
    document.getElementById('totalCaloriesBurned').textContent = stats.totalCaloriesBurned;
    
    // Update progress bar
    const progress = Math.min((stats.totalCaloriesBurned / stats.calorieGoal) * 100, 100);
    const progressBar = document.getElementById('trainingProgress');
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    
    // Update goal text
    document.getElementById('trainingGoal').textContent = 
        `Progress towards goal: ${stats.totalCaloriesBurned}/${stats.calorieGoal} calories`;
}

function updateNutritionStats(stats) {
    document.getElementById('totalMeals').textContent = stats.totalMeals;
    document.getElementById('totalCalories').textContent = Math.round(stats.totalCalories);
    document.getElementById('avgProteins').textContent = `${Math.round(stats.avgProteins)}g`;
    
    // Update progress bar
    const progress = Math.min((stats.totalCalories / stats.calorieGoal) * 100, 100);
    const progressBar = document.getElementById('nutritionProgress');
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    
    // Update goal text
    document.getElementById('nutritionGoal').textContent = 
        `Progress towards goal: ${Math.round(stats.totalCalories)}/${stats.calorieGoal} calories`;
}

function updateTimelineChart(timeline, period) {
    const ctx = document.getElementById('activityTimeline').getContext('2d');
    
    // Destroy existing chart if it exists
    if (activityChart) {
        activityChart.destroy();
    }

    // Format labels based on period
    const labels = timeline.labels.map(label => {
        if (period === 'day') {
            return label;
        } else if (period === 'week') {
            // For week view, show day names
            const [month, day] = label.split('/');
            const date = new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            // For month view, show day numbers
            return label.split('/')[1];
        }
    });

    console.log('Timeline data:', {
        labels: labels,
        caloriesBurned: timeline.caloriesBurned,
        caloriesConsumed: timeline.caloriesConsumed
    });
    
    // Create new chart
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories Burned',
                    data: timeline.caloriesBurned,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Calories Consumed',
                    data: timeline.caloriesConsumed,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            // Show full date in tooltip
                            const index = tooltipItems[0].dataIndex;
                            return timeline.labels[index];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: period === 'day' ? 'Time' : period === 'week' ? 'Day' : 'Date'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Initialize statistics when the page loads
document.addEventListener('DOMContentLoaded', initializeStatistics); 