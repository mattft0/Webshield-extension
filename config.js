document.addEventListener('DOMContentLoaded', () => {
    // Load and display statistics
    updateStats();

    // Load and display domains
    loadAllDomains();

    // Add domain button handler
    document.getElementById('add-domain-btn').addEventListener('click', addDomain);

    // Domain input enter key handler
    document.getElementById('new-domain').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addDomain();
        }
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-domains-tab`).classList.add('active');
        });
    });

    // Search functionality
    document.getElementById('custom-search').addEventListener('input', (e) => {
        filterDomains('custom-domains-list', e.target.value);
    });

    document.getElementById('default-search').addEventListener('input', (e) => {
        filterDomains('default-domains-list', e.target.value);
    });
});

function updateStats() {
    chrome.storage.local.get(['blockedSites', 'customBlocklist', 'blocklist'], (result) => {
        const blockedSites = result.blockedSites || [];
        const customBlocklist = result.customBlocklist || [];
        const defaultBlocklist = result.blocklist || [];

        // Update total blocks
        document.getElementById('total-blocks').textContent = blockedSites.length;

        // Update custom domains count
        document.getElementById('custom-domains').textContent = customBlocklist.length;
        document.getElementById('custom-count').textContent = customBlocklist.length;

        // Update default domains count
        document.getElementById('default-count').textContent = defaultBlocklist.length;

        // Update last block time
        if (blockedSites.length > 0) {
            const lastBlock = new Date(blockedSites[0].time);
            const timeAgo = getTimeAgo(lastBlock);
            document.getElementById('last-block').textContent = timeAgo;
        }
    });
}

function loadAllDomains() {
    // Load custom domains
    chrome.storage.local.get(['customBlocklist'], (result) => {
        const customBlocklist = result.customBlocklist || [];
        displayDomains('custom-domains-list', customBlocklist, true);
    });

    // Load default blocklist
    chrome.storage.local.get(['blocklist'], (result) => {
        const defaultBlocklist = result.blocklist || [];
        displayDomains('default-domains-list', defaultBlocklist, false);
    });
}

function displayDomains(containerId, domains, isCustom) {
    const domainsList = document.getElementById(containerId);
    domainsList.innerHTML = '';

    domains.sort().forEach(domain => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';

        const domainText = document.createElement('span');
        domainText.textContent = domain;

        domainItem.appendChild(domainText);

        if (isCustom) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteDomain(domain);
            domainItem.appendChild(deleteBtn);
        }

        domainsList.appendChild(domainItem);
    });
}

function filterDomains(containerId, searchTerm) {
    const domainItems = document.getElementById(containerId).getElementsByClassName('domain-item');
    const term = searchTerm.toLowerCase();

    Array.from(domainItems).forEach(item => {
        const domain = item.getElementsByTagName('span')[0].textContent.toLowerCase();
        item.style.display = domain.includes(term) ? '' : 'none';
    });
}

function addDomain() {
    const input = document.getElementById('new-domain');
    const domain = input.value.trim().toLowerCase();

    if (!domain) {
        alert('Please enter a domain');
        return;
    }

    if (!isValidDomain(domain)) {
        alert('Please enter a valid domain (e.g., example.com)');
        return;
    }

    chrome.storage.local.get(['customBlocklist', 'blocklist'], (result) => {
        const customBlocklist = result.customBlocklist || [];
        const defaultBlocklist = result.blocklist || [];

        if (customBlocklist.includes(domain)) {
            alert('This domain is already in your custom blocklist');
            return;
        }

        if (defaultBlocklist.includes(domain)) {
            alert('This domain is already in the default blocklist');
            return;
        }

        const updatedList = [...customBlocklist, domain];
        chrome.storage.local.set({ customBlocklist: updatedList }, () => {
            input.value = '';
            loadAllDomains();
            updateStats();
            // Notify background script to update rules
            chrome.runtime.sendMessage({ action: 'updateBlocklist' });
        });
    });
}

function deleteDomain(domain) {
    if (confirm(`Are you sure you want to remove ${domain} from the blocklist?`)) {
        chrome.storage.local.get(['customBlocklist'], (result) => {
            const customBlocklist = result.customBlocklist || [];
            const updatedList = customBlocklist.filter(d => d !== domain);

            chrome.storage.local.set({ customBlocklist: updatedList }, () => {
                loadAllDomains();
                updateStats();
                // Notify background script to update rules
                chrome.runtime.sendMessage({ action: 'updateBlocklist' });
            });
        });
    }
}

function isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    if (interval === 1) return '1 year ago';

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    if (interval === 1) return '1 month ago';

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    if (interval === 1) return '1 day ago';

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    if (interval === 1) return '1 hour ago';

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    if (interval === 1) return '1 minute ago';

    if (seconds < 10) return 'just now';

    return Math.floor(seconds) + ' seconds ago';
} 