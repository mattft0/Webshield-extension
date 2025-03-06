document.addEventListener('DOMContentLoaded', () => {
    // Display blocked URL
    const params = new URLSearchParams(window.location.search);
    const blockedUrl = params.get('url') || 'Unknown URL';
    document.getElementById('blocked-url').textContent = `URL: ${blockedUrl}`;

    // Handle back button
    document.getElementById('back-button').addEventListener('click', () => {
        window.history.back();
    });
});