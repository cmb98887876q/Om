document.addEventListener('DOMContentLoaded', () => {
    checkServerHealthBadge();

    const btnHealth = document.getElementById('btnHealth');
    const btnTest = document.getElementById('btnTest');
    const btnEcho = document.getElementById('btnEcho');
    const btnPrivate = document.getElementById('btnPrivate');
    const btnPrivateFail = document.getElementById('btnPrivateFail');
    const btnStaticCheck = document.getElementById('btnStaticCheck');
    
    const echoFormContainer = document.getElementById('echoFormContainer');
    const btnSendEcho = document.getElementById('btnSendEcho');
    const btnCancelEcho = document.getElementById('btnCancelEcho');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // Event Listeners
    btnHealth.addEventListener('click', () => executeRequest('GET', '/api/health'));
    btnTest.addEventListener('click', () => executeRequest('GET', '/api/test'));
    
    btnEcho.addEventListener('click', () => {
        echoFormContainer.style.display = echoFormContainer.style.display === 'none' ? 'block' : 'none';
    });

    btnCancelEcho.addEventListener('click', () => {
        echoFormContainer.style.display = 'none';
    });

    btnSendEcho.addEventListener('click', () => {
        const name = document.getElementById('inputName').value;
        const message = document.getElementById('inputMessage').value;
        executeRequest('POST', '/api/echo', { name, message });
        echoFormContainer.style.display = 'none';
    });

    btnPrivate.addEventListener('click', () => {
        // Using a test token that matches our environment variable for demonstration purposes
        executeRequest('GET', '/api/private', null, { 'Authorization': 'Bearer my-secure-test-token-12345' });
    });

    btnPrivateFail.addEventListener('click', () => {
        executeRequest('GET', '/api/private', null, { 'Authorization': 'Bearer invalid-wrong-token' });
    });

    btnStaticCheck.addEventListener('click', () => {
        // Attempts to fetch a private server file directly via static file serving
        executeRequest('GET', '/server.js');
    });

    btnClearHistory.addEventListener('click', clearHistory);
});

async function checkServerHealthBadge() {
    const badge = document.getElementById('serverBadge');
    try {
        const res = await fetch('/api/health');
        if (res.ok) {
            badge.textContent = 'Server Online';
            badge.className = 'server-badge online';
        } else {
            badge.textContent = 'Server Error';
            badge.className = 'server-badge offline';
        }
    } catch (e) {
        badge.textContent = 'Server Offline';
        badge.className = 'server-badge offline';
    }
}

async function executeRequest(method, endpoint, bodyData = null, customHeaders = {}) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const responseOutput = document.getElementById('responseOutput');
    const statusCodeBadge = document.getElementById('statusCodeBadge');
    const durationBadge = document.getElementById('durationBadge');

    // UI Loading State
    loadingIndicator.style.display = 'block';
    responseOutput.textContent = '';
    statusCodeBadge.textContent = 'Loading...';
    statusCodeBadge.className = 'status-badge na';
    durationBadge.textContent = '-- ms';

    const startTime = performance.now();
    let status = 0;
    let responseData;

    try {
        const options = {
            method: method,
            headers: {
                ...customHeaders
            }
        };

        if (bodyData) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(endpoint, options);
        status = response.status;
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Update Status Badge
        statusCodeBadge.textContent = `Status: ${status}`;
        statusCodeBadge.className = status >= 200 && status < 300 ? 'status-badge success' : 'status-badge error';
        durationBadge.textContent = `${duration} ms`;

        // Display Formatted Response
        if (typeof responseData === 'object') {
            responseOutput.textContent = JSON.stringify(responseData, null, 2);
        } else {
            responseOutput.textContent = responseData;
        }

        // Add to History
        addHistoryRow(endpoint, new Date().toLocaleTimeString(), status, `${duration} ms`);

    } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        status = 500;
        statusCodeBadge.textContent = `Status: Network Error`;
        statusCodeBadge.className = 'status-badge error';
        durationBadge.textContent = `${duration} ms`;

        const errObj = {
            error: true,
            message: error.message || 'Failed to fetch'
        };
        responseOutput.textContent = JSON.stringify(errObj, null, 2);

        addHistoryRow(endpoint, new Date().toLocaleTimeString(), 'ERR', `${duration} ms`);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function addHistoryRow(endpoint, time, status, duration) {
    const historyBody = document.getElementById('historyBody');
    const emptyRow = historyBody.querySelector('.empty-row');
    if (emptyRow) {
        emptyRow.remove();
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><code>${endpoint}</code></td>
        <td>${time}</td>
        <td><span class="status-badge ${status === 200 ? 'success' : 'error'}">${status}</span></td>
        <td>${duration}</td>
    `;
    historyBody.prepend(tr);

    // Keep history clean (max 15 rows)
    if (historyBody.children.length > 15) {
        historyBody.removeChild(historyBody.lastChild);
    }
}

function clearHistory() {
    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = `
        <tr class="empty-row">
            <td colspan="4">No requests recorded yet.</td>
        </tr>
    `;
}
