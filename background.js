let timerInterval = null;
let remainingTime = 25 * 60;  // 25 minutes default
let isRunning = false;

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      chrome.storage.local.set({ remainingTime });
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      remainingTime = 25 * 60;
      chrome.storage.local.set({ remainingTime });
      // todo: send notif
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    startTimer();
    sendResponse({ success: true, remainingTime, isRunning });
  } else if (request.action === "stop") {
    stopTimer();
    sendResponse({ success: true, isRunning });
  } else if (request.action === "reset") {
    stopTimer();
    remainingTime = 25 * 60;
    chrome.storage.local.set({ remainingTime });
    sendResponse({ success: true, remainingTime, isRunning });
  } else if (request.action === "getState") {
    sendResponse({ remainingTime, isRunning });
  } else if (request.action === "setPreset") {
    stopTimer();
    remainingTime = request.minutes * 60;
    chrome.storage.local.set({ remainingTime });
    sendResponse({ success: true, remainingTime, isRunning });
  }
  return true;
});

// on service worker open, load timer
chrome.storage.local.get(["remainingTime"], (result) => {
  if (result.remainingTime !== undefined) {
    remainingTime = result.remainingTime;
  } else {
    remainingTime = 25 * 60;
  }
});
