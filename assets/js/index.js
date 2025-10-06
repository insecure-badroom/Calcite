// Tab management
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let stealthModeEnabled = false;

// Generate proper URL from search query or URL input
function generateSearchUrl(query) {
  try {
    const url = new URL(query);
    return url.toString();
  } catch {
    try {
      const url = new URL(`https://${query}`);
      if (url.hostname.includes('.')) return url.toString();
    } catch {}
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

// Stealth mode - opens in about:blank popup
function runStealthMode(url) {
  const title = "Google";
  const icon = "https://www.google.com/favicon.ico";
  const popup = window.open("about:blank", "_blank");
  if (!popup || popup.closed) {
    alert("Popup blocked. Please allow popups for stealth mode to work.");
    return false;
  }
  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <link rel="icon" href="${icon}">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="${url}"></iframe>
      </body>
    </html>
  `);
  popup.document.close();
  window.location.href = "https://www.google.com";
  return true;
}

// Create a new tab
function createTab() {
  const tabId = tabIdCounter++;
  const tab = {
    id: tabId,
    title: 'New Tab',
    url: null,
    history: [],
    historyIndex: -1,
    stealthMode: false
  };
  tabs.push(tab);

  // Create tab button
  const tabBtn = document.createElement('div');
  tabBtn.className = 'tab';
  tabBtn.dataset.tabId = tabId;
  tabBtn.innerHTML = `
    <span class="tab-title">New Tab</span>
    <button class="tab-close" onclick="closeTab(${tabId}, event)">×</button>
  `;
  tabBtn.onclick = (e) => {
    if (!e.target.classList.contains('tab-close')) {
      switchTab(tabId);
    }
  };
  
  document.getElementById('tabBar').insertBefore(tabBtn, document.getElementById('newTabBtn'));

  // Create tab content
  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content';
  tabContent.dataset.tabId = tabId;
  tabContent.innerHTML = `
    <div class="home-view">
      <div class="top-right-info">
        <span class="info-item" id="battery-${tabId}">⚡</span>
        <span class="info-item" id="time-${tabId}">⌚</span>
      </div>
      <div class="container">
        <h1 class="title">Calcite<span class="dot">.</span></h1>
        <form class="search-form" onsubmit="handleSearch(event, ${tabId})">
          <input type="text" class="url-input" placeholder="Search or enter URL..." autocomplete="off" />
          <div class="options">
            <label><input type="checkbox" class="blank-mode" /> Stealth (about:blank)</label>
          </div>
          <button type="submit" class="submit-btn">GO</button>
        </form>
      </div>
      <div class="home-nav">
        <button onclick="window.location.href='games.html';" title="Games"><i class="bi bi-joystick"></i></button>
        <button onclick="window.location.href='movies.html';" title="Movies"><i class="bi bi-film"></i></button>
        <button onclick="window.location.href='tidechat.html';" title="Chat"><i class="bi bi-chat-dots"></i></button>
        <button onclick="window.location.href='apps.html';" title="Apps"><i class="bi bi-wrench"></i></button>
        <button onclick="window.location.href='credits.html';" title="Credits"><i class="bi bi-info-circle"></i></button>
      </div>
    </div>
    <div class="browser-view">
      <div class="browser-bar">
        <div class="browser-controls">
          <button class="back-btn" title="Back"><i class="bi bi-arrow-left"></i></button>
          <button class="forward-btn" title="Forward"><i class="bi bi-arrow-right"></i></button>
          <button class="reload-btn" title="Reload"><i class="bi bi-arrow-clockwise"></i></button>
          <button class="home-btn" title="Home"><i class="bi bi-house"></i></button>
        </div>
        <input type="text" class="browser-url" placeholder="Enter URL..." />
      </div>
      <iframe class="browser-iframe"></iframe>
    </div>
  `;
  
  document.getElementById('tabsContainer').appendChild(tabContent);

  // Add event listener for stealth mode checkbox
  const checkbox = tabContent.querySelector('.blank-mode');
  if (checkbox) {
    checkbox.addEventListener('change', function() {
      tab.stealthMode = checkbox.checked;
    });
  }

  // Add event listeners for browser controls
  const backBtn = tabContent.querySelector('.back-btn');
  const forwardBtn = tabContent.querySelector('.forward-btn');
  const reloadBtn = tabContent.querySelector('.reload-btn');
  const homeBtn = tabContent.querySelector('.home-btn');
  const urlBar = tabContent.querySelector('.browser-url');

  if (backBtn) {
    backBtn.addEventListener('click', () => goBack(tabId));
  }
  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => goForward(tabId));
  }
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => reload(tabId));
  }
  if (homeBtn) {
    homeBtn.addEventListener('click', () => goHome(tabId));
  }
  if (urlBar) {
    urlBar.addEventListener('keypress', (e) => handleUrlBarEnter(e, tabId));
  }

  // Update time and battery for this tab
  updateTabInfo(tabId);

  switchTab(tabId);
  return tabId;
}

// Close a tab
function closeTab(tabId, event) {
  if (event) event.stopPropagation();
  
  if (tabs.length === 1) return; // Don't close last tab
  
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  tabs.splice(tabIndex, 1);
  
  document.querySelector(`.tab[data-tab-id="${tabId}"]`).remove();
  document.querySelector(`.tab-content[data-tab-id="${tabId}"]`).remove();
  
  if (activeTabId === tabId) {
    const newActiveTab = tabs[Math.min(tabIndex, tabs.length - 1)];
    switchTab(newActiveTab.id);
  }
}

// Switch to a different tab
function switchTab(tabId) {
  activeTabId = tabId;
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab-id="${tabId}"]`).classList.add('active');
  document.querySelector(`.tab-content[data-tab-id="${tabId}"]`).classList.add('active');
}

// Handle search form submission
function handleSearch(event, tabId) {
  event.preventDefault();
  const tab = tabs.find(t => t.id === tabId);
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const input = tabContent.querySelector('.url-input');
  const blankModeCheckbox = tabContent.querySelector('.blank-mode');
  const query = input.value.trim();
  
  if (!query) return;
  
  const rawUrl = generateSearchUrl(query);
  
  // Check if stealth mode is enabled
  if (blankModeCheckbox && blankModeCheckbox.checked) {
    const encoded = __uv$config.encodeUrl(rawUrl);
    const proxyUrl = __uv$config.prefix + encoded;
    runStealthMode(proxyUrl);
  } else {
    navigateToUrl(tabId, rawUrl);
  }
}

// Navigate to a URL in a tab
function navigateToUrl(tabId, rawUrl) {
  const tab = tabs.find(t => t.id === tabId);
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const tabBtn = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  
  const encoded = __uv$config.encodeUrl(rawUrl);
  const proxyUrl = __uv$config.prefix + encoded;
  
  // Update history
  if (tab.historyIndex < tab.history.length - 1) {
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
  }
  tab.history.push({ proxy: proxyUrl, original: rawUrl });
  tab.historyIndex = tab.history.length - 1;
  tab.url = proxyUrl;
  
  // Update UI
  const homeView = tabContent.querySelector('.home-view');
  const browserView = tabContent.querySelector('.browser-view');
  const iframe = tabContent.querySelector('.browser-iframe');
  const urlBar = tabContent.querySelector('.browser-url');
  
  homeView.style.display = 'none';
  browserView.classList.add('active');
  
  // Show loader
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
  
  iframe.src = proxyUrl;
  urlBar.value = rawUrl;
  
  // Hide loader when iframe loads
  iframe.onload = function() {
    if (loader) {
      loader.style.display = 'none';
    }
  };
  
  // Fallback: hide loader after 10 seconds if onload doesn't fire
  setTimeout(() => {
    if (loader) {
      loader.style.display = 'none';
    }
  }, 10000);
  
  // Update tab title
  try {
    const urlObj = new URL(rawUrl);
    const title = urlObj.hostname || 'New Tab';
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  } catch {
    const title = rawUrl.length > 20 ? rawUrl.substring(0, 20) + '...' : rawUrl;
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  }
  
  // Update navigation buttons
  updateNavigationButtons(tabId);
}

// Handle Enter key in URL bar
function handleUrlBarEnter(event, tabId) {
  if (event.key === 'Enter') {
    const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
    const urlBar = tabContent.querySelector('.browser-url');
    const query = urlBar.value.trim();
    if (query) {
      const rawUrl = generateSearchUrl(query);
      navigateToUrl(tabId, rawUrl);
    }
  }
}

// Go back in history
function goBack(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex <= 0) return;
  
  tab.historyIndex--;
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const iframe = tabContent.querySelector('.browser-iframe');
  const urlBar = tabContent.querySelector('.browser-url');
  
  const historyEntry = tab.history[tab.historyIndex];
  
  // Show loader
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
  
  iframe.src = historyEntry.proxy;
  urlBar.value = historyEntry.original;
  
  // Hide loader when iframe loads
  iframe.onload = function() {
    if (loader) {
      loader.style.display = 'none';
    }
  };
  
  // Fallback timeout
  setTimeout(() => {
    if (loader) {
      loader.style.display = 'none';
    }
  }, 10000);
  
  // Update tab title
  const tabBtn = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  try {
    const urlObj = new URL(historyEntry.original);
    const title = urlObj.hostname || 'New Tab';
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  } catch {
    const title = historyEntry.original.length > 20 ? historyEntry.original.substring(0, 20) + '...' : historyEntry.original;
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  }
  
  // Update button states
  updateNavigationButtons(tabId);
}

// Go forward in history
function goForward(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;
  
  tab.historyIndex++;
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const iframe = tabContent.querySelector('.browser-iframe');
  const urlBar = tabContent.querySelector('.browser-url');
  
  const historyEntry = tab.history[tab.historyIndex];
  
  // Show loader
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
  
  iframe.src = historyEntry.proxy;
  urlBar.value = historyEntry.original;
  
  // Hide loader when iframe loads
  iframe.onload = function() {
    if (loader) {
      loader.style.display = 'none';
    }
  };
  
  // Fallback timeout
  setTimeout(() => {
    if (loader) {
      loader.style.display = 'none';
    }
  }, 10000);
  
  // Update tab title
  const tabBtn = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  try {
    const urlObj = new URL(historyEntry.original);
    const title = urlObj.hostname || 'New Tab';
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  } catch {
    const title = historyEntry.original.length > 20 ? historyEntry.original.substring(0, 20) + '...' : historyEntry.original;
    tab.title = title;
    tabBtn.querySelector('.tab-title').textContent = title;
  }
  
  // Update button states
  updateNavigationButtons(tabId);
}

// Update navigation button states (enable/disable)
function updateNavigationButtons(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  if (!tabContent) return;
  
  const backBtn = tabContent.querySelector('.back-btn');
  const forwardBtn = tabContent.querySelector('.forward-btn');
  
  if (backBtn) {
    backBtn.disabled = tab.historyIndex <= 0;
  }
  
  if (forwardBtn) {
    forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
  }
}

// Reload current page
function reload(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const iframe = tabContent.querySelector('.browser-iframe');
  
  // Show loader
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
  
  iframe.src = iframe.src;
  
  // Hide loader when iframe loads
  iframe.onload = function() {
    if (loader) {
      loader.style.display = 'none';
    }
  };
  
  // Fallback: hide loader after 10 seconds
  setTimeout(() => {
    if (loader) {
      loader.style.display = 'none';
    }
  }, 10000);
}

// Go to home page
function goHome(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  const tabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
  const tabBtn = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
  const homeView = tabContent.querySelector('.home-view');
  const browserView = tabContent.querySelector('.browser-view');
  
  homeView.style.display = 'flex';
  browserView.classList.remove('active');
  
  // Reset tab title
  tab.title = 'New Tab';
  tabBtn.querySelector('.tab-title').textContent = 'New Tab';
  
  // Clear input
  const input = tabContent.querySelector('.url-input');
  if (input) input.value = '';
}

// Initialize on page load
window.onload = function() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
  
  // Create first tab
  createTab();
  
  // New tab button
  const newTabBtn = document.getElementById('newTabBtn');
  if (newTabBtn) {
    newTabBtn.onclick = () => createTab();
  }
  
  // Update all tabs' info every second
  setInterval(() => {
    tabs.forEach(tab => updateTabInfo(tab.id));
  }, 1000);
};

// Update battery and time for a specific tab
function updateTabInfo(tabId) {
  const batteryEl = document.getElementById(`battery-${tabId}`);
  const timeEl = document.getElementById(`time-${tabId}`);
  
  // Update time
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = `⌚ ${now.toLocaleTimeString()}`;
  }
  
  // Update battery
  if (batteryEl && navigator.getBattery) {
    navigator.getBattery().then(battery => {
      batteryEl.textContent = `⚡ ${Math.round(battery.level * 100)}%`;
    });
  }
}

// Handle links (for games, apps pages, etc.)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      var linkText = link.textContent;
      console.log("Loading " + linkText + "...");
      const loader = document.getElementById('loader');
      const content = document.getElementById('content');
      if (loader) loader.style.display = 'block';
      if (content) content.style.display = 'none';
      var iframe = document.getElementById('gameFrame');
      if (iframe) {
        iframe.onload = function () {
          if (loader) loader.style.display = 'none';
          if (content) content.style.display = 'block';
        };
      }
    });
  });
});
