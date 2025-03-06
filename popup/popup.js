document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const blockedView = document.getElementById('blocked-view');
    const blockedUrlElement = document.getElementById('blocked-url');
    const backButton = document.getElementById('back-to-main');

    // Check if there's a blocked URL
    chrome.storage.local.get(['currentBlockedUrl'], (result) => {
        if (result.currentBlockedUrl) {
            showBlockedView(result.currentBlockedUrl);
        } else {
            showMainView();
        }
    });

    // Show blocked view
    function showBlockedView(url) {
        mainView.style.display = 'none';
        blockedView.style.display = 'block';
        blockedUrlElement.textContent = `URL: ${url}`;
    }

    // Show main view
    function showMainView() {
        mainView.style.display = 'block';
        blockedView.style.display = 'none';
        updateBlockedList();
    }

    // Back button handler
    backButton.addEventListener('click', () => {
        chrome.storage.local.remove(['currentBlockedUrl'], () => {
            chrome.runtime.sendMessage({
                action: 'popupClosed',
                url: blockedUrlElement.textContent.replace('URL: ', '')
            });
            showMainView();
        });
    });

    // Update history
    function updateBlockedList() {
        chrome.storage.local.get(['blockedSites'], (result) => {
            const blockedSites = result.blockedSites || [];
            document.getElementById('blocked-count').textContent = blockedSites.length;

            const list = document.getElementById('blocked-list');
            list.innerHTML = ''; // Clear existing list

            if (blockedSites.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No recently blocked sites';
                li.className = 'empty-list';
                list.appendChild(li);
                return;
            }

            blockedSites.forEach(site => {
                const li = document.createElement('li');
                const time = new Date(site.time).toLocaleString();
                li.innerHTML = `
                    <div class="site-info">
                        <span class="domain">${site.domain || new URL(site.url).hostname}</span>
                        <span class="time">${time}</span>
                    </div>
                    <button class="remove-site" data-url="${site.url}">X</button>
                `;
                list.appendChild(li);
            });
        });
    }

    // Add custom domain
    document.getElementById('add-domain').addEventListener('click', () => {
        const domain = prompt('Enter a domain to block (ex: example.com)');
        if (!domain) return;

        // Domain validation
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        if (!domainRegex.test(domain)) {
            alert('Invalid domain format. Please enter a valid domain (ex: example.com)');
            return;
        }

        chrome.storage.local.get(['customBlocklist'], (result) => {
            const customList = result.customBlocklist || [];
            if (customList.includes(domain)) {
                alert('This domain is already in the blocklist');
                return;
            }

            customList.push(domain);
            chrome.storage.local.set({ customBlocklist: customList })
                .then(() => {
                    chrome.runtime.sendMessage({ action: 'updateBlocklist' });
                    alert('Domain added successfully');
                })
                .catch(error => {
                    console.error('Error adding domain:', error);
                    alert('Error adding domain');
                });
        });
    });

    // Handle blocked sites removal
    document.getElementById('blocked-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-site')) {
            const url = e.target.dataset.url;
            chrome.storage.local.get(['blockedSites'], (result) => {
                const blockedSites = result.blockedSites || [];
                const updatedSites = blockedSites.filter(site => site.url !== url);
                chrome.storage.local.set({ blockedSites: updatedSites })
                    .then(() => {
                        updateBlockedList();
                    })
                    .catch(error => {
                        console.error('Error removing site:', error);
                    });
            });
        }
    });

    // Listen for background messages
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'updateBlocklist') {
            updateBlockedList();
        }
    });
});