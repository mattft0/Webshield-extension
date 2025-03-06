document.addEventListener('DOMContentLoaded', () => {
    // Theme handling
    const themeToggle = document.getElementById('theme-toggle');

    // Load saved theme
    chrome.storage.local.get(['theme'], (result) => {
        if (result.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = 'Light';
        }
    });

    // Theme toggle handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? 'Light' : 'Dark';

        // Save theme preference
        chrome.storage.local.set({ theme: newTheme });
    });

    // Display blocked URL
    const params = new URLSearchParams(window.location.search);
    const blockedUrl = params.get('url') || 'Unknown URL';
    document.getElementById('blocked-url').textContent = `URL: ${blockedUrl}`;

    // Handle back button - redirect to a safe page
    document.getElementById('back-button').addEventListener('click', () => {
        // Informer le background script que le popup est fermé
        chrome.runtime.sendMessage({
            action: 'popupClosed',
            url: blockedUrl
        });

        // Rediriger vers une page sûre (Google)
        chrome.tabs.update({ url: 'https://www.google.com' });
    });

    // Handle first proceed button - show warning
    document.getElementById('proceed-button').addEventListener('click', () => {
        document.getElementById('danger-warning').classList.add('show');
        document.getElementById('proceed-button').style.display = 'none';
    });

    // Handle final proceed button - continue to site
    document.getElementById('final-proceed').addEventListener('click', () => {
        // Informer le background script que l'utilisateur continue malgré l'avertissement
        chrome.runtime.sendMessage({
            action: 'proceedAnyway',
            url: blockedUrl
        });

        // Récupérer l'URL d'origine et y retourner
        const originalUrl = blockedUrl.replace('URL: ', '');
        chrome.tabs.update({ url: originalUrl });
    });
});