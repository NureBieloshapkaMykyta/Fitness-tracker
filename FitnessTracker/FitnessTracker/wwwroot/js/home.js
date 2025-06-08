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
        fetch(`/Meals/ByDate?date=${date}`).then(r => r.json()),
        fetch(`/Trainings/ByDate?date=${date}`).then(r => r.json())
    ]).then(([meals, trainings]) => {
        let html = '';
        html += `<h6 class="fw-bold">Meals</h6>`;
        if (meals.length === 0) html += '<p class="text-muted">No meals recorded.</p>';
        else {
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
        if (trainings.length === 0) html += '<p class="text-muted">No trainings recorded.</p>';
        else {
            html += '<ul class="list-group">';
            for (let training of trainings) {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div><strong>Description:</strong> ${training.description || ''}</div>
                        <div><strong>Exercises:</strong> ${training.exercises && training.exercises.length > 0 ? training.exercises.map(e => e.name).join(', ') : 'None'}</div>
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
                    fetch('/Meals/Delete/' + btn.getAttribute('data-id'), { method: 'POST' })
                        .then(r => r.json())
                        .then(() => loadDayDetails(date));
                }
            };
        });
        document.querySelectorAll('.delete-training-btn').forEach(btn => {
            btn.onclick = function() {
                if (confirm('Delete this training?')) {
                    fetch('/Trainings/Delete/' + btn.getAttribute('data-id'), { method: 'POST' })
                        .then(r => r.json())
                        .then(() => loadDayDetails(date));
                }
            };
        });
    }).catch(() => {
        detailsDiv.innerHTML = '<div class="text-danger">Failed to load data.</div>';
    });
}

// Modal logic for add meal/training
function getSelectedDate() {
    return document.getElementById('selected-date-label').textContent;
}

document.addEventListener('DOMContentLoaded', function() {
    const addMealBtn = document.getElementById('addMealBtn');
    const addTrainingBtn = document.getElementById('addTrainingBtn');
    if (addMealBtn) {
        addMealBtn.onclick = function() {
            document.getElementById('mealDate').value = getSelectedDate();
            new bootstrap.Modal(document.getElementById('addMealModal')).show();
        };
    }
    if (addTrainingBtn) {
        addTrainingBtn.onclick = function() {
            document.getElementById('trainingDate').value = getSelectedDate();
            document.getElementById('trainingDescription').value = '';
            new bootstrap.Modal(document.getElementById('addTrainingModal')).show();
        };
    }
    // Add meal form submit
    const addMealForm = document.getElementById('addMealForm');
    if (addMealForm) {
        addMealForm.onsubmit = function(e) {
            e.preventDefault();
            const date = document.getElementById('mealDate').value;
            fetch('/Meals/Add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            })
            .then(r => r.json())
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById('addMealModal')).hide();
                loadDayDetails(date);
            });
        };
    }
    // Add training form submit
    const addTrainingForm = document.getElementById('addTrainingForm');
    if (addTrainingForm) {
        addTrainingForm.onsubmit = function(e) {
            e.preventDefault();
            const date = document.getElementById('trainingDate').value;
            const description = document.getElementById('trainingDescription').value;
            fetch('/Trainings/Add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description })
            })
            .then(r => r.json())
            .then(() => {
                bootstrap.Modal.getInstance(document.getElementById('addTrainingModal')).hide();
                loadDayDetails(date);
            });
        };
    }
});

// Initial render
const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
renderCalendar(now.getFullYear(), now.getMonth(), todayStr);
document.getElementById('selected-date-label').textContent = todayStr;
loadDayDetails(todayStr);