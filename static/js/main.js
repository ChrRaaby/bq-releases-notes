// Application State
let state = {
    updates: [],
    categories: [],
    activeFilter: 'all',
    searchQuery: '',
    sortBy: 'newest',
    selectedUpdate: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    cacheTime: document.getElementById('cache-time'),
    spinnerIcon: document.querySelector('.spinner-icon'),
    cardsContainer: document.getElementById('cards-container'),
    loadingContainer: document.getElementById('loading-container'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    typePillsContainer: document.getElementById('type-pills-container'),
    sortSelect: document.getElementById('sort-select'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    
    // Stats elements
    statAll: document.getElementById('stat-all').querySelector('.stat-num'),
    statFeatures: document.getElementById('stat-features').querySelector('.stat-num'),
    statFixes: document.getElementById('stat-fixes').querySelector('.stat-num'),
    statOther: document.getElementById('stat-other').querySelector('.stat-num'),
    
    // Modal elements
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalTweet: document.getElementById('btn-modal-tweet'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    tweetTextPreview: document.getElementById('tweet-text-preview'),
    charCounter: document.getElementById('char-counter'),
    charWarning: document.getElementById('char-warning')
};

// Init Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleaseNotes();
    setupEventListeners();
    setupDialogFallback();
});

// Event Listeners
function setupEventListeners() {
    // Refresh action
    elements.refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        elements.clearSearch.hidden = state.searchQuery === '';
        render();
    });

    // Clear search
    elements.clearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearch.hidden = true;
        render();
    });

    // Sort selection
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        render();
    });

    // Reset filters
    elements.resetFiltersBtn.addEventListener('click', resetFilters);

    // Export CSV action
    elements.exportCsvBtn.addEventListener('click', exportToCSV);

    // Theme toggle action
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Modal Events
    elements.closeModalBtn.addEventListener('click', closeComposerModal);
    elements.btnModalCancel.addEventListener('click', closeComposerModal);
    
    // Textarea input for character counting & preview update
    elements.tweetTextarea.addEventListener('input', (e) => {
        const text = e.target.value;
        updateTweetPreview(text);
    });

    // Tweet action
    elements.btnModalTweet.addEventListener('click', executeTweet);
}

// Dialog Close Fallback for Backdrop Click (Safari compatibility)
function setupDialogFallback() {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        elements.tweetModal.addEventListener('click', (event) => {
            if (event.target !== elements.tweetModal) return;
            
            const rect = elements.tweetModal.getBoundingClientRect();
            const isDialogContent = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            
            if (!isDialogContent) {
                closeComposerModal();
            }
        });
    }
}

// Fetch Release Notes from API
async function fetchReleaseNotes(forceRefresh = false) {
    // Show loading
    setLoadingState(true);
    
    try {
        const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            state.updates = data.updates;
            state.categories = data.types;
            elements.cacheTime.textContent = data.last_updated;
            
            // Build filter pills
            buildFilterPills();
            
            // Render view
            render();
        } else {
            alert('Failed to load release notes: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        alert('An error occurred while fetching release notes.');
    } finally {
        setLoadingState(false);
    }
}

// UI States
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.spinnerIcon.classList.add('loading');
        elements.refreshBtn.disabled = true;
        elements.loadingContainer.hidden = false;
        elements.cardsContainer.hidden = true;
        elements.emptyState.hidden = true;
    } else {
        elements.spinnerIcon.classList.remove('loading');
        elements.refreshBtn.disabled = false;
        elements.loadingContainer.hidden = true;
        elements.cardsContainer.hidden = false;
    }
}

// Dynamic Filter Pills Generation
function buildFilterPills() {
    // Keep 'All' pill and clear others
    const allPill = elements.typePillsContainer.querySelector('[data-type="all"]');
    elements.typePillsContainer.innerHTML = '';
    elements.typePillsContainer.appendChild(allPill);
    
    state.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'pill';
        button.dataset.type = category.toLowerCase();
        button.textContent = category;
        
        button.addEventListener('click', () => {
            elements.typePillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            state.activeFilter = category.toLowerCase();
            render();
        });
        
        elements.typePillsContainer.appendChild(button);
    });
    
    // Add click handler to All pill too
    allPill.addEventListener('click', () => {
        elements.typePillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        allPill.classList.add('active');
        state.activeFilter = 'all';
        render();
    });
}

// Calculate Dashboard Stats
function updateStats(filteredUpdates) {
    const allCount = state.updates.length;
    const featuresCount = state.updates.filter(u => u.type.toLowerCase() === 'feature').length;
    const fixesCount = state.updates.filter(u => {
        const type = u.type.toLowerCase();
        return type === 'fix' || type === 'issue' || type === 'known issue';
    }).length;
    const otherCount = allCount - featuresCount - fixesCount;
    
    // Update dashboard labels
    elements.statAll.textContent = allCount;
    elements.statFeatures.textContent = featuresCount;
    elements.statFixes.textContent = fixesCount;
    elements.statOther.textContent = otherCount;
}

// Reset all filtering parameters
function resetFilters() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.hidden = true;
    
    state.activeFilter = 'all';
    elements.typePillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    elements.typePillsContainer.querySelector('[data-type="all"]').classList.add('active');
    
    state.sortBy = 'newest';
    elements.sortSelect.value = 'newest';
    
    render();
}

// Get Badge CSS Class depending on type
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t === 'feature') return 'badge-feature';
    if (t === 'fix' || t === 'issue' || t === 'known issue') return 'badge-fix';
    if (t === 'deprecation' || t === 'breaking change') return 'badge-deprecation';
    return 'badge-general';
}

// Main Render Loop
function render() {
    // 1. Filter updates
    let filtered = state.updates.filter(update => {
        // Category pill filter
        const matchCategory = state.activeFilter === 'all' || update.type.toLowerCase() === state.activeFilter;
        
        // Search filter
        const textToSearch = `${update.date} ${update.type} ${update.content}`.toLowerCase();
        const matchSearch = state.searchQuery === '' || textToSearch.includes(state.searchQuery);
        
        return matchCategory && matchSearch;
    });
    
    // Update stats bar (show totals for entire dataset, not just search)
    updateStats(filtered);
    
    // 2. Sort updates
    filtered.sort((a, b) => {
        const dateA = new Date(a.short_date);
        const dateB = new Date(b.short_date);
        return state.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    // 3. Render Cards
    elements.cardsContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        elements.emptyState.hidden = false;
        elements.cardsContainer.hidden = true;
        return;
    }
    
    elements.emptyState.hidden = true;
    elements.cardsContainer.hidden = false;
    
    filtered.forEach((update, index) => {
        const card = document.createElement('article');
        card.className = 'note-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        // Render badges
        const badgeClass = getBadgeClass(update.type);
        
        // Setup card content
        card.innerHTML = `
            <div class="note-header">
                <div class="note-meta">
                    <span class="note-date">${update.date}</span>
                    <span class="badge ${badgeClass}">${update.type}</span>
                </div>
                ${update.link ? `
                    <a href="${update.link}" target="_blank" rel="noopener noreferrer" class="note-source-link" title="Open source documentation">
                        <span>Source</span>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                    </a>
                ` : ''}
            </div>
            
            <div class="note-body">
                ${update.content}
            </div>
            
            <div class="note-footer">
                <button class="btn btn-secondary btn-copy-content" title="Copy update content to clipboard">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Text</span>
                </button>
                <button class="btn btn-tweet btn-card-tweet" title="Share on Twitter/X">
                    <svg class="icon x-logo" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Tweet</span>
                </button>
            </div>
        `;
        
        // Add events to card actions
        const copyBtn = card.querySelector('.btn-copy-content');
        copyBtn.addEventListener('click', () => {
            copyToClipboard(getRawTextFromHtml(update.content), copyBtn);
        });
        
        const tweetBtn = card.querySelector('.btn-card-tweet');
        tweetBtn.addEventListener('click', () => {
            openComposerModal(update);
        });
        
        elements.cardsContainer.appendChild(card);
    });
}

// Convert HTML content into plaintext for tweeting/copying
function getRawTextFromHtml(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Add spacing after lists or paragraphs
    tempDiv.querySelectorAll('p, li').forEach(el => {
        el.innerHTML += '\n';
    });
    
    return tempDiv.textContent || tempDiv.innerText || '';
}

// Clipboard copying utility
async function copyToClipboard(text, buttonElement) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Animate button success
        const label = buttonElement.querySelector('span');
        const origText = label.textContent;
        label.textContent = 'Copied!';
        buttonElement.classList.add('btn-success');
        
        setTimeout(() => {
            label.textContent = origText;
            buttonElement.classList.remove('btn-success');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Could not copy text to clipboard.');
    }
}

// Tweet Composer Modal Controls
function openComposerModal(update) {
    state.selectedUpdate = update;
    
    // Create pre-composed message
    const rawText = getRawTextFromHtml(update.content).trim();
    // Truncate raw text if it is very long to avoid breaking the tweet limit
    let snippet = rawText;
    if (snippet.length > 180) {
        snippet = snippet.substring(0, 177) + '...';
    }
    
    const urlText = update.link ? ` ${update.link}` : '';
    const presetTweet = `BigQuery Release (${update.date}): [${update.type}]\n\n${snippet}${urlText}\n#BigQuery #GoogleCloud`;
    
    elements.tweetTextarea.value = presetTweet;
    updateTweetPreview(presetTweet);
    
    // Show Modal
    elements.tweetModal.showModal();
}

function closeComposerModal() {
    elements.tweetModal.close();
    state.selectedUpdate = null;
}

// Live Update Modal Preview & Count Characters
function updateTweetPreview(text) {
    // Render text in preview card, making links colored
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const formattedText = text.replace(urlPattern, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    elements.tweetTextPreview.innerHTML = formattedText;
    
    // Character count logic (Twitter counts URL as 23 characters usually, but we'll show raw length for simplicity)
    const charCount = text.length;
    elements.charCounter.textContent = `${charCount} / 280`;
    
    if (charCount > 280) {
        elements.charCounter.classList.add('error');
        elements.charWarning.hidden = false;
        elements.btnModalTweet.disabled = true;
        elements.btnModalTweet.style.opacity = '0.5';
    } else {
        elements.charCounter.classList.remove('error');
        elements.charWarning.hidden = true;
        elements.btnModalTweet.disabled = false;
        elements.btnModalTweet.style.opacity = '1';
    }
}

// Open tweet intent tab
function executeTweet() {
    const tweetText = elements.tweetTextarea.value;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank');
    closeComposerModal();
}

// Export Filtered Release Notes to CSV
function exportToCSV() {
    let filtered = state.updates.filter(update => {
        const matchCategory = state.activeFilter === 'all' || update.type.toLowerCase() === state.activeFilter;
        const textToSearch = `${update.date} ${update.type} ${update.content}`.toLowerCase();
        const matchSearch = state.searchQuery === '' || textToSearch.includes(state.searchQuery);
        return matchCategory && matchSearch;
    });
    
    filtered.sort((a, b) => {
        const dateA = new Date(a.short_date);
        const dateB = new Date(b.short_date);
        return state.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if (filtered.length === 0) {
        alert("No release notes to export.");
        return;
    }

    const headers = ["Date", "Type", "Content", "Link"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    filtered.forEach(update => {
        const rawContent = getRawTextFromHtml(update.content).trim();
        
        const escapeCsvField = (text) => {
            if (!text) return '""';
            return `"${text.replace(/"/g, '""')}"`;
        };

        const row = [
            escapeCsvField(update.date),
            escapeCsvField(update.type),
            escapeCsvField(rawContent),
            escapeCsvField(update.link)
        ];
        csvRows.push(row.join(","));
    });

    const csvContent = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const categorySuffix = state.activeFilter !== 'all' ? `_${state.activeFilter}` : '';
    const searchSuffix = state.searchQuery ? `_filtered` : '';
    link.setAttribute("download", `bigquery_release_notes${categorySuffix}${searchSuffix}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
}

function toggleTheme() {
    if (document.body.classList.contains('light-theme')) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
}
