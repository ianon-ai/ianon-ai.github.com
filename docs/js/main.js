let navStructure = {};
let currentPage = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  
  // Load navigation structure from JSON
  fetch('nav.json')
    .then(response => response.json())
    .then(data => {
      navStructure = data;
      buildNavigation();
      loadPageFromHash();
    })
    .catch(error => {
      console.error('Error loading navigation:', error);
      document.getElementById('content').innerHTML = `
        <div class="note">
          <div class="note-title">Error</div>
          <p>Could not load navigation structure. Please check that nav.json exists.</p>
        </div>
      `;
    });
  
  // Listen for hash changes (browser back/forward, direct links)
  window.addEventListener('hashchange', loadPageFromHash);
});

// THEME MANAGEMENT

function initializeTheme() {
  const saved = localStorage.getItem('theme');
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (dark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌑';
  document.getElementById('theme-label').textContent = isDark ? 'Light' : 'Dark';

  // Switch Highlight.js theme
  const hljsTheme = document.getElementById('hljs-theme');
  const themeName = isDark ? 'atom-one-dark' : 'atom-one-light';
  hljsTheme.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeName}.min.css`;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

// NAVIGATION BUILDING

function buildNavigation() {
  const navMenu = document.getElementById('nav-menu');
  navMenu.innerHTML = '';

  for (const [section, items] of Object.entries(navStructure)) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'nav-section';

    const title = document.createElement('div');
    title.className = 'nav-section-title';
    title.textContent = section;
    sectionDiv.appendChild(title);

    for (const item of items) {
      const link = document.createElement('a');
      link.className = 'nav-item' + (item.disabled ? ' disabled' : '');
      link.textContent = item.title;
      link.dataset.path = item.path;

      if (!item.disabled) {
        link.href = `#${item.path}`;
      }

      sectionDiv.appendChild(link);
    }

    navMenu.appendChild(sectionDiv);
  }
}

// PAGE LOADING

function loadPageFromHash() {
  const hash = window.location.hash.slice(1);
  
  // If no hash, load the first page
  if (!hash) {
    window.location.hash = 'intro/introduction';
    return;
  }

  // Find the page in navigation structure
  let foundPage = null;
  let foundTitle = null;

  for (const [section, items] of Object.entries(navStructure)) {
    for (const item of items) {
      if (item.path === hash) {
        foundPage = item.path;
        foundTitle = item.title;
        break;
      }
    }
    if (foundPage) break;
  }

  // Load the page if found
  if (foundPage) {
    loadPage(foundPage, foundTitle);
  } else {
    // Invalid hash, redirect to introduction
    window.location.hash = 'intro/introduction';
  }
}

function loadPage(path, title) {
  if (currentPage === path) return;

  currentPage = path;
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '<p class="loading">Loading...</p>';

  // Update active navigation item
  updateActiveNavItem(path);

  // Fetch and render markdown
  fetch(`content/${path}.md`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}.md`);
      }
      return response.text();
    })
    .then(markdown => {
      renderMarkdown(markdown);
    })
    .catch(error => {
      contentDiv.innerHTML = `
        <div class="note">
          <div class="note-title">Page Not Found</div>
          <p>${error.message}</p>
          <p>This page is not yet available or the file is missing.</p>
        </div>
      `;
      console.error('Error loading page:', error);
    });
}

// MARKDOWN RENDERING

function renderMarkdown(markdown) {
  const contentDiv = document.getElementById('content');

  // Configure marked with syntax highlighting
  marked.setOptions({
    breaks: false,
    gfm: true,
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  });

  // Render markdown to HTML
  let html = marked.parse(markdown);

// Convert GitHub alert syntax to HTML
// Match blockquotes with [!TYPE] pattern
  html = html.replace(
    /<blockquote>\s*<p>\[!(\w+)\](.*?)<\/p>\s*<\/blockquote>/gs,
    (match, type, content) => {
      const alertType = type.toLowerCase();
      const iconMap = {
        note: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><g><path d="M11 10.98a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0zm1-4.929a1 1 0 1 0 0 2a1 1 0 0 0 0-2"></path><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2M4 12a8 8 0 1 0 16 0a8 8 0 0 0-16 0" clip-rule="evenodd"></path></g></svg>',
        tip: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.375 8.625L20 8l1.375-.625L22 6l.625 1.375L24 8l-1.375.625L22 10l-.625-1.375ZM18.05 3.95L16 3l2.05-.95L19 0l.95 2.05L22 3l-2.05.95L19 6l-.95-2.05ZM9 22q-.825 0-1.413-.588T7 20h4q0 .825-.588 1.413T9 22Zm-3-3q-.425 0-.713-.288T5 18q0-.425.288-.713T6 17h6q.425 0 .713.288T13 18q0 .425-.288.713T12 19H6Zm-.75-3q-1.725-1.025-2.738-2.75T1.5 9.5q0-3.125 2.188-5.313T9 2q3.125 0 5.313 2.188T16.5 9.5q0 2.025-1.012 3.75T12.75 16h-7.5Zm.6-2h6.3q1.125-.8 1.738-1.975T14.5 9.5q0-2.3-1.6-3.9T9 4Q6.7 4 5.1 5.6T3.5 9.5q0 1.35.612 2.525T5.85 14ZM9 14Z"></path></svg>',
        important: '<svg viewBox="0 0 28 28" width="20" height="20" fill="currentColor"><path d="M14 20a3 3 0 1 1 0 6a3 3 0 0 1 0-6m0 1.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M14 2a5 5 0 0 1 5 5c0 .538-.126 1.257-.304 2.02a40 40 0 0 1-.702 2.551a103 103 0 0 1-1.607 4.765A2.53 2.53 0 0 1 14 18a2.53 2.53 0 0 1-2.387-1.664a103 103 0 0 1-1.607-4.765a40 40 0 0 1-.702-2.55C9.126 8.257 9 7.538 9 7a5 5 0 0 1 5-5m0 1.5A3.5 3.5 0 0 0 10.5 7c0 .355.09.932.265 1.68c.17.734.409 1.581.675 2.453c.533 1.743 1.17 3.553 1.583 4.692c.147.404.534.675.977.675s.83-.27.977-.675c.413-1.14 1.05-2.95 1.583-4.692c.266-.872.505-1.72.675-2.452c.175-.75.265-1.326.265-1.681A3.5 3.5 0 0 0 14 3.5"></path></svg>',
        warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><g><path d="M12 14a1 1 0 0 1-1-1v-3a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1m-1.5 2.5a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0"></path><path d="M10.23 3.216c.75-1.425 2.79-1.425 3.54 0l8.343 15.852C22.814 20.4 21.85 22 20.343 22H3.657c-1.505 0-2.47-1.6-1.77-2.931zM20.344 20L12 4.147L3.656 20z"></path></g></svg>',
        caution: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><g><path stroke-linejoin="round" d="M8 2L2 8.156V16l6 6h8l6-6V8.156L16 2z"></path><path d="M16 12H8"></path></g></svg>'
      };
      const icon = iconMap[alertType] || '📌';
      const cleanContent = content.trim();
      return `<div class="alert alert-${alertType}"><strong>${icon} ${type}:</strong> ${cleanContent}</div>`;
    }
  );

  // Sanitize HTML
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody',
      'tr', 'td', 'th', 'img', 'a', 'hr', 'div', 'span', 'del', 's',
      'svg', 'g', 'circle', 'path', 'line', 'text', 'rect'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'align', 'class', 'id', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
      'font-size', 'font-weight', 'text-anchor', 'clip-rule', 'fill-rule'
    ]
  });

  contentDiv.innerHTML = html;

    // Apply syntax highlighting to code blocks
  document.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });
  
  // Enhance links to open in new tab
  document.querySelectorAll('.content a').forEach(link => {
    if (link.hostname !== window.location.hostname && link.hostname !== '') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  // Scroll to top
  contentDiv.scrollTop = 0;
}

// NAVIGATION STATE

function updateActiveNavItem(path) {
  // Remove active class from all items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Add active class to current item
  const activeItem = document.querySelector(`[data-path="${path}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}
