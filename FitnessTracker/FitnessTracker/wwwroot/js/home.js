function renderCalendar(year, month, selectedDate = null) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const today = new Date();
    const birthDateStr = window.userBirthDate;
    const birthDate = birthDateStr ? new Date(birthDateStr) : null;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    let html = '<div class="d-flex justify-content-between align-items-center mb-2">';
    html += `<button class="btn btn-sm btn-outline-primary" id="prevMonth">&lt;</button>`;
    html += `<span class="fw-bold">${firstDay.toLocaleString('default', { month: 'long' })} ${year}</span>`;
    html += `<button class="btn btn-sm btn-outline-primary" id="nextMonth">&gt;</button>`;
    html += '</div>';
    html += '<table class="table table-bordered calendar-table"><thead><tr>';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d of days) html += `<th>${d}</th>`;
    html += '</tr></thead><tbody><tr>';
    for (let i = 0; i < startDay; i++) html += '<td></td>';
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const isSelected = selectedDate === dateStr;
        let isDisabled = false;
        if (birthDate && dateObj < birthDate) isDisabled = true;
        if (dateObj > today) isDisabled = true;
        html += `<td class="calendar-day${isToday ? ' bg-info text-white' : ''}${isSelected ? ' border border-primary border-3' : ''}${isDisabled ? ' text-muted bg-light' : ''}" data-date="${dateStr}" style="cursor:${isDisabled ? 'not-allowed' : 'pointer'};${isDisabled ? 'opacity:0.5;' : ''}" ${isDisabled ? 'tabindex="-1"' : ''}>${day}</td>`;
        if ((startDay + day) % 7 === 0) html += '</tr><tr>';
    }
    html += '</tr></tbody></table>';
    calendar.innerHTML = html;
    document.getElementById('prevMonth').onclick = () => {
        const prevMonth = month - 1 < 0 ? 11 : month - 1;
        const prevYear = month - 1 < 0 ? year - 1 : year;
        renderCalendar(prevYear, prevMonth, selectedDate);
    };
    document.getElementById('nextMonth').onclick = () => {
        const nextMonth = month + 1 > 11 ? 0 : month + 1;
        const nextYear = month + 1 > 11 ? year + 1 : year;
        renderCalendar(nextYear, nextMonth, selectedDate);
    };
    document.querySelectorAll('.calendar-day').forEach(cell => {
        if (cell.classList.contains('text-muted')) return;
        cell.onclick = function () {
            const date = this.getAttribute('data-date');
            document.getElementById('selected-date-label').textContent = date;
            loadDayDetails(date);
            renderCalendar(year, month, date);
            // Store selected date for use in add meal/training pages
            localStorage.setItem('selectedDate', date);
        };
    });
    // If no date is selected, select today if in current month and today is not before birthDate
    if (!selectedDate && today.getFullYear() === year && today.getMonth() === month) {
        const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (!birthDate || new Date(todayStr) >= birthDate) {
            document.getElementById('selected-date-label').textContent = todayStr;
            loadDayDetails(todayStr);
            // Highlight today
            const todayCell = document.querySelector(`.calendar-day[data-date='${todayStr}']`);
            if (todayCell) todayCell.classList.add('border', 'border-primary', 'border-3');
        }
    }
}

function loadDayDetails(date) {
    const detailsDiv = document.getElementById('day-details');
    detailsDiv.innerHTML = '<div class="text-center text-muted">Loading...</div>';
    
    Promise.all([
        fetch(`/Meals/ByDate?date=${date}`)
            .then(async r => {
                if (!r.ok) {
                    console.error('Meals fetch error:', r.status, r.statusText);
                    if (r.status === 404) return [];
                    throw new Error(`HTTP error! status: ${r.status}`);
                }
                const data = await r.json();
                console.log('Meals data:', data);
                return data;
            }),
        fetch(`/Trainings/ByDate?date=${date}`)
            .then(async r => {
                if (!r.ok) {
                    console.error('Trainings fetch error:', r.status, r.statusText);
                    if (r.status === 404) return [];
                    throw new Error(`HTTP error! status: ${r.status}`);
                }
                const data = await r.json();
                console.log('Trainings data:', data);
                return data;
            })
    ]).then(([meals, trainings]) => {
        console.log('Processing data:', { meals, trainings });
        let html = '';
        html += `<h6 class="fw-bold">Meals</h6>`;
        if (!meals || meals.length === 0) {
            html += '<p class="text-muted">No meals recorded for this date.</p>';
        } else {
            html += '<ul class="list-group mb-3">';
            for (let meal of meals) {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div><strong>Date:</strong> ${meal.date?.substring(0, 10) || ''}</div>
                        <div><strong>Products:</strong> ${meal.products && meal.products.length > 0 ? meal.products.map(p => p.name).join(', ') : 'None'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2 delete-meal-btn" data-id="${meal.id}"><i class="bi bi-trash"></i></button>
                </li>`;
            }
            html += '</ul>';
        }
        html += `<h6 class="fw-bold">Trainings</h6>`;
        if (!trainings || trainings.length === 0) {
            html += '<p class="text-muted">No trainings recorded for this date.</p>';
        } else {
            html += '<ul class="list-group">';
            for (let training of trainings) {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div><strong>Description:</strong> ${training.description || 'No description'}</div>
                        <div><strong>Date:</strong> ${training.date?.substring(0, 10) || ''}</div>
                        <div><strong>Exercises:</strong></div>
                        <ul class="list-unstyled ms-3">
                            ${training.exercises && training.exercises.length > 0 
                                ? training.exercises.map(e => `
                                    <li class="mb-2">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                            <div class="flex-grow-1">
                                                <div class="d-flex align-items-center">
                                                    <span class="me-2">${e.name}</span>
                                                    ${e.duration ? `<span class="badge bg-info me-2">${e.duration}</span>` : ''}
                                                    ${e.caloriesBurned ? `<span class="badge bg-warning">${e.caloriesBurned} cal</span>` : ''}
                                                </div>
                                                ${e.description ? `<small class="text-muted d-block">${e.description}</small>` : ''}
                                            </div>
                                            <button class="btn btn-sm btn-outline-primary ms-2 edit-calories-btn" 
                                                    data-id="${e.id}" 
                                                    data-calories="${e.caloriesBurned || ''}">
                                                <i class="bi bi-plus-circle"></i> Calories
                                            </button>
                                        </div>
                                    </li>
                                `).join('')
                                : '<li class="text-muted">No exercises recorded</li>'
                            }
                        </ul>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2 delete-training-btn" data-id="${training.id}"><i class="bi bi-trash"></i></button>
                </li>`;
            }
            html += '</ul>';
        }
        detailsDiv.innerHTML = html;

        // Attach delete handlers
        document.querySelectorAll('.delete-meal-btn').forEach(btn => {
            btn.onclick = function() {
                if (confirm('Delete this meal?')) {
                    fetch('/Meals/Delete/' + btn.getAttribute('data-id'), { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        }
                    })
                    .then(r => {
                        if (!r.ok) throw new Error('Failed to delete meal');
                        return r.json();
                    })
                    .then(() => loadDayDetails(date))
                    .catch(error => {
                        console.error('Delete meal error:', error);
                        alert('Failed to delete meal. Please try again.');
                    });
                }
            };
        });

        // Attach edit calories handlers
        document.querySelectorAll('.edit-calories-btn').forEach(btn => {
            btn.onclick = function() {
                const exerciseId = btn.getAttribute('data-id');
                const currentCalories = btn.getAttribute('data-calories');
                const calories = prompt('Enter calories burned:', currentCalories);
                
                if (calories !== null) {
                    const caloriesNum = parseInt(calories);
                    if (isNaN(caloriesNum) || caloriesNum < 0) {
                        alert('Please enter a valid positive number');
                        return;
                    }

                    fetch('/Trainings/UpdateExerciseCalories', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        },
                        body: JSON.stringify({
                            exerciseId: exerciseId,
                            caloriesBurned: caloriesNum
                        })
                    })
                    .then(r => {
                        if (!r.ok) throw new Error('Failed to update calories');
                        return r.json();
                    })
                    .then(() => loadDayDetails(date))
                    .catch(error => {
                        console.error('Update calories error:', error);
                        alert('Failed to update calories. Please try again.');
                    });
                }
            };
        });

        document.querySelectorAll('.delete-training-btn').forEach(btn => {
            btn.onclick = function() {
                if (confirm('Delete this training?')) {
                    fetch('/Trainings/Delete/' + btn.getAttribute('data-id'), { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value
                        }
                    })
                    .then(r => {
                        if (!r.ok) throw new Error('Failed to delete training');
                        return r.json();
                    })
                    .then(() => loadDayDetails(date))
                    .catch(error => {
                        console.error('Delete training error:', error);
                        alert('Failed to delete training. Please try again.');
                    });
                }
            };
        });
    }).catch(error => {
        console.error('Error loading day details:', error);
        detailsDiv.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Failed to load data. Please try again later.
                <br>
                <small class="text-muted">Error: ${error.message}</small>
            </div>`;
    });
}

// Modal logic for add meal/training
function getSelectedDate() {
    const selectedDateLabel = document.getElementById('selected-date-label');
    if (!selectedDateLabel || selectedDateLabel.textContent === '[Select a day]') {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    return selectedDateLabel.textContent;
}

document.addEventListener('DOMContentLoaded', function() {
    const addMealBtn = document.getElementById('addMealBtn');
    const addTrainingBtn = document.getElementById('addTrainingBtn');

    if (addMealBtn) {
        addMealBtn.onclick = function() {
            const selectedDate = getSelectedDate();
            window.location.href = `/Meals/Add?date=${selectedDate}`;
        };
    }

    if (addTrainingBtn) {
        addTrainingBtn.onclick = function() {
            const selectedDate = getSelectedDate();
            window.location.href = `/Trainings/Add?date=${selectedDate}`;
        };
    }

    // Initial render
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    renderCalendar(now.getFullYear(), now.getMonth(), todayStr);
    document.getElementById('selected-date-label').textContent = todayStr;
    loadDayDetails(todayStr);
});

function addExercise() {
    const exercisesContainer = document.getElementById('exercises-container');
    const exerciseIndex = exercisesContainer.children.length;
    
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-item mb-3 p-3 border rounded';
    exerciseDiv.innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="position-relative">
                    <input type="text" class="form-control exercise-name" 
                           name="Exercises[${exerciseIndex}].Name"
                           placeholder="Exercise name" 
                           data-exercise-index="${exerciseIndex}"
                           autocomplete="off">
                    <div class="exercise-suggestions position-absolute w-100 bg-white border rounded shadow-sm" 
                         style="display: none; z-index: 1000; max-height: 200px; overflow-y: auto;">
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <input type="time" class="form-control exercise-duration" 
                       name="Exercises[${exerciseIndex}].Duration"
                       placeholder="Duration">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control exercise-description" 
                       name="Exercises[${exerciseIndex}].Description"
                       placeholder="Description">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-outline-danger" onclick="removeExercise(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
        <div class="exercise-details mt-2 small text-muted" style="display: none;">
            <span class="met-value"></span>
            <span class="calories-estimate"></span>
        </div>
    `;
    
    exercisesContainer.appendChild(exerciseDiv);
    
    // Add event listeners for exercise search
    const nameInput = exerciseDiv.querySelector('.exercise-name');
    const suggestionsDiv = exerciseDiv.querySelector('.exercise-suggestions');
    const detailsDiv = exerciseDiv.querySelector('.exercise-details');
    const durationInput = exerciseDiv.querySelector('.exercise-duration');
    
    let searchTimeout;
    
    nameInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            fetch(`/Trainings/SearchExercises?query=${encodeURIComponent(query)}`)
                .then(r => r.json())
                .then(exercises => {
                    if (exercises.length > 0) {
                        suggestionsDiv.innerHTML = exercises.map(e => `
                            <div class="p-2 hover-bg-light cursor-pointer" 
                                 onclick="selectExercise(this, ${exerciseIndex})"
                                 data-met="${e.met}"
                                 data-name="${e.name}">
                                <div class="fw-bold">${e.name}</div>
                                <div class="small text-muted">${e.description}</div>
                            </div>
                        `).join('');
                        suggestionsDiv.style.display = 'block';
                    } else {
                        suggestionsDiv.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error searching exercises:', error);
                    suggestionsDiv.style.display = 'none';
                });
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!nameInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Update calories estimate when duration changes
    durationInput.addEventListener('change', function() {
        updateCaloriesEstimate(exerciseIndex);
    });
}

function selectExercise(element, index) {
    const exerciseDiv = document.getElementById('exercises-container').children[index];
    const nameInput = exerciseDiv.querySelector('.exercise-name');
    const suggestionsDiv = exerciseDiv.querySelector('.exercise-suggestions');
    const detailsDiv = exerciseDiv.querySelector('.exercise-details');
    
    nameInput.value = element.dataset.name;
    suggestionsDiv.style.display = 'none';
    
    // Show exercise details
    detailsDiv.style.display = 'block';
    detailsDiv.querySelector('.met-value').textContent = `MET: ${element.dataset.met}`;
    
    // Update calories estimate
    updateCaloriesEstimate(index);
}

function updateCaloriesEstimate(index) {
    const exerciseDiv = document.getElementById('exercises-container').children[index];
    const nameInput = exerciseDiv.querySelector('.exercise-name');
    const durationInput = exerciseDiv.querySelector('.exercise-duration');
    const detailsDiv = exerciseDiv.querySelector('.exercise-details');
    
    if (!nameInput.value || !durationInput.value) {
        detailsDiv.querySelector('.calories-estimate').textContent = '';
        return;
    }
    
    const [hours, minutes] = durationInput.value.split(':').map(Number);
    const duration = hours + minutes / 60;
    
    // Calculate calories (using default weight of 70kg)
    const met = parseFloat(detailsDiv.querySelector('.met-value').textContent.split(': ')[1]);
    const calories = Math.round(met * 70 * duration);
    
    detailsDiv.querySelector('.calories-estimate').textContent = 
        `Estimated calories: ${calories} cal`;
}

function removeExercise(button) {
    button.closest('.exercise-item').remove();
    // Update indices of remaining exercises
    const exercisesContainer = document.getElementById('exercises-container');
    exercisesContainer.querySelectorAll('.exercise-item').forEach((item, index) => {
        const nameInput = item.querySelector('.exercise-name');
        const durationInput = item.querySelector('.exercise-duration');
        const descriptionInput = item.querySelector('.exercise-description');
        
        nameInput.name = `Exercises[${index}].Name`;
        durationInput.name = `Exercises[${index}].Duration`;
        descriptionInput.name = `Exercises[${index}].Description`;
        nameInput.dataset.exerciseIndex = index;
    });
}

// Add this to your existing form submission code
document.getElementById('add-training-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const exercises = [];
    
    // Collect exercise data
    this.querySelectorAll('.exercise-item').forEach((item, index) => {
        const name = item.querySelector('.exercise-name').value;
        const duration = item.querySelector('.exercise-duration').value;
        const description = item.querySelector('.exercise-description').value;
        
        if (name && duration) {
            exercises.push({
                name: name,
                duration: duration,
                description: description
            });
        }
    });
    
    // Prepare the data
    const data = {
        date: formData.get('Date'),
        description: formData.get('Description'),
        exercises: exercises
    };
    
    // Send the request
    fetch('/Trainings/Add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to add training');
        return response.json();
    })
    .then(() => {
        // Reload the day details
        loadDayDetails(data.date);
        // Reset the form
        this.reset();
        // Clear exercises container
        document.getElementById('exercises-container').innerHTML = '';
    })
    .catch(error => {
        console.error('Error adding training:', error);
        alert('Failed to add training. Please try again.');
    });
});