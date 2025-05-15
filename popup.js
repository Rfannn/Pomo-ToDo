let timerInterval = null;

const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const presetButtons = document.querySelectorAll(".preset");
const newTaskInput = document.getElementById("new-task");
const addTaskBtn = document.getElementById("add-task");
const taskList = document.getElementById("task-list");

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll('li').forEach(li => {
    tasks.push({
      text: li.querySelector('span').textContent,
      done: li.classList.contains('done')
    });
  });
  chrome.storage.local.set({ tasks });
}

function loadTasks() {
  chrome.storage.local.get(['tasks'], (result) => {
    if (Array.isArray(result.tasks)) {
      taskList.innerHTML = '';
      result.tasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("task");
        if (task.done) li.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => {
          li.classList.toggle("done", checkbox.checked);
          saveTasks();
        });

        const span = document.createElement("span");
        span.textContent = task.text;

        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.className = "del-btn";
        delBtn.addEventListener("click", () => {
          li.remove();
          saveTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);
        taskList.appendChild(li);
      });
    }
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay(seconds) {
  timerDisplay.textContent = formatTime(seconds);
}

let currentTimer = {
  remainingTime: 25 * 60,
  isRunning: false,
};

function fetchTimerState() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (!response) return;

    currentTimer.remainingTime = response.remainingTime;
    currentTimer.isRunning = response.isRunning;

    updateTimerDisplay(currentTimer.remainingTime);

    if (timerInterval) clearInterval(timerInterval);

    if (currentTimer.isRunning) {
      timerInterval = setInterval(() => {
        currentTimer.remainingTime--;
        if (currentTimer.remainingTime <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          updateTimerDisplay(0);
        } else {
          updateTimerDisplay(currentTimer.remainingTime);
        }
      }, 1000);
    } else {
      timerInterval = null;
    }
  });
}

function startTimer() {
  chrome.runtime.sendMessage({ action: 'start' }, () => {
    fetchTimerState();
  });
}

function resetTimer() {
  chrome.runtime.sendMessage({ action: 'reset' }, () => {
    fetchTimerState();
  });
}

function setPreset(minutes) {
  chrome.runtime.sendMessage({ action: 'setPreset', minutes }, () => {
    fetchTimerState();
  });
}

// listeners
startBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const minutes = parseInt(btn.getAttribute("data-minutes"));
    setPreset(minutes);
  });
});

const toggleBtn = document.getElementById('dark-mode-toggle');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    toggleBtn.textContent = document.body.classList.contains('dark') ? '🌞' : '🌛';
  });
addTaskBtn.addEventListener("click", () => {
  const text = newTaskInput.value.trim();
  if (!text) return;

  const li = document.createElement("li");
  li.classList.add("task");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.addEventListener("change", () => {
    li.classList.toggle("done", checkbox.checked);
    saveTasks();
  });

  const span = document.createElement("span");
  span.textContent = text;

  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.className = "del-btn";
  delBtn.addEventListener("click", () => {
    li.remove();
    saveTasks();
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);
  taskList.insertBefore(li, taskList.firstChild);
  newTaskInput.value = "";

  saveTasks();
});

// Load tasks and timer state on popup open
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  fetchTimerState();
});
