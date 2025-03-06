// Initialization
let blockedSites = [];
let activePopups = new Set();
let fullBlocklist = [];
const BLOCKLIST_URL = 'https://raw.githubusercontent.com/mattft0/WebShield-blocklist/main/blocklist.json';
const UPDATE_INTERVAL = 24 * 60; // 24 heures en minutes

// Load full blocklist from GitHub
async function loadFullBlocklist() {
    try {
        // Try to load from GitHub
        const response = await fetch(BLOCKLIST_URL);
        if (!response.ok) {
            throw new Error('Failed to load blocklist from GitHub');
        }
        const data = await response.json();
        fullBlocklist = data.domains;

        // Cache the blocklist locally
        chrome.storage.local.set({
            blocklist: data.domains,
            lastUpdate: data.last_updated
        });

        console.log(`Loaded ${data.total_domains} domains from GitHub blocklist`);
        loadCustomBlocklist();
    } catch (err) {
        console.error('Error loading blocklist from GitHub:', err);
        // Try to load from cache
        chrome.storage.local.get(['blocklist', 'lastUpdate'], (result) => {
            if (result.blocklist) {
                fullBlocklist = result.blocklist;
                console.log('Loaded blocklist from cache');
                loadCustomBlocklist();
            } else {
                // Fallback to local file if cache is empty
                fetch(chrome.runtime.getURL('data/full_blocklist.json'))
                    .then(response => response.json())
                    .then(data => {
                        fullBlocklist = data.domains;
                        chrome.storage.local.set({
                            blocklist: data.domains,
                            lastUpdate: new Date().toISOString()
                        });
                        console.log('Loaded blocklist from local file');
                        loadCustomBlocklist();
                    })
                    .catch(error => console.error('Error loading local blocklist:', error));
            }
        });
    }
}

// Setup periodic updates
chrome.alarms.create('updateBlocklist', {
    periodInMinutes: UPDATE_INTERVAL
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateBlocklist') {
        loadFullBlocklist();
    }
});

// Domain validation improvement
function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
}

// Check if a URL matches any blocked domain
function isUrlBlocked(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        return fullBlocklist.some(blockedDomain =>
            domain === blockedDomain || domain.endsWith(`.${blockedDomain}`));
    } catch (err) {
        console.error('Error checking URL:', err);
        return false;
    }
}

// Load custom blocklist
function loadCustomBlocklist() {
    chrome.storage.local.get(['customBlocklist'], (result) => {
        const customList = result.customBlocklist || [];
        if (customList.length > 0) {
            fullBlocklist = [...new Set([...fullBlocklist, ...customList])];
        }
    });
}

// Update blocked sites improvement
function updateBlockedSites(url) {
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL:', url);
        return;
    }

    chrome.storage.local.get(['blockedSites'], (result) => {
        const blockedSites = result.blockedSites || [];

        if (isUrlBlocked(url)) {
            const newBlockedSite = {
                url: url,
                time: new Date().toISOString(),
                domain: new URL(url).hostname
            };

            // Limit history to 100 entries
            const updatedBlockedSites = [newBlockedSite, ...blockedSites].slice(0, 100);
            chrome.storage.local.set({ blockedSites: updatedBlockedSites })
                .catch(error => console.error('Error recording blocked site:', error));
        }
    });
}

// Detect blocks with tabs.onUpdated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = tab.pendingUrl || tab.url;

        // Ignore special URLs
        if (!url ||
            url.startsWith('chrome://') ||
            url.startsWith('about:') ||
            url.startsWith('chrome-extension://')) {
            return;
        }

        if (isUrlBlocked(url)) {
            // Check if a popup is already active for this URL
            if (activePopups.has(url)) {
                return;
            }

            showBlockedPopup(url);
            updateBlockedSites(url);
        }
    }
});

// Show blocked popup
function showBlockedPopup(blockedUrl) {
    // Store the blocked URL in storage for the popup to access
    chrome.storage.local.set({ currentBlockedUrl: blockedUrl })
        .then(() => {
            // Get the active tab in the current window
            return chrome.tabs.query({ active: true, currentWindow: true });
        })
        .then(tabs => {
            if (!tabs || tabs.length === 0) {
                throw new Error('No active tab found');
            }

            const activeTab = tabs[0];

            // Add the URL to active popups set
            activePopups.add(blockedUrl);

            // Update the extension icon badge
            chrome.action.setBadgeText({
                text: '!',
                tabId: activeTab.id
            });

            // Set badge background color
            chrome.action.setBadgeBackgroundColor({
                color: '#FF0000'  // Red to indicate blocking
            });

            // Redirect to blocked page
            const blockedPageUrl = chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(blockedUrl);
            return chrome.tabs.update(activeTab.id, { url: blockedPageUrl });
        })
        .catch(error => {
            console.error('Error showing popup:', error);
            activePopups.add(blockedUrl);
        });
}

// Initialize by loading the full blocklist
loadFullBlocklist();

// Listen for messages
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateBlocklist') {
        loadCustomBlocklist();
    } else if (message.action === 'popupClosed') {
        const url = message.url;
        activePopups.delete(url);
    }
});



