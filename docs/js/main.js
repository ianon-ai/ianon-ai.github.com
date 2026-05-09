let navStructure = {};
let currentPage = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();

  fetch(`${getBasePath()}/nav.json`)
    .then(response => response.json())
    .then(data => {
      navStructure = data;
      buildNavigation();
      loadPageFromUrl();
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

  window.addEventListener('popstate', loadPageFromUrl);

  // Backward compatibility for old #/ links
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;

    if (hash.startsWith('#/')) {
      let cleanPath = hash.slice(2);
      let headingId = null;

      if (cleanPath.includes('@')) {
        [cleanPath, headingId] = cleanPath.split('@');
      }

      navigateTo(cleanPath, headingId, true);
    }
  });

});


function getBasePath() {
  const repoPath = '/ianon-ai.github.com';

  if (window.location.pathname.startsWith(repoPath)) {
    return repoPath;
  }

  return '';
}

const routeAliases = {
  'intro/introduction': 'introduction',
  'intro/faq': 'faq',
  'intro/links': 'links',
  'roadmap/roadmap': 'roadmap'
};

const reverseRouteAliases = Object.fromEntries(
  Object.entries(routeAliases).map(([internalPath, publicPath]) => [publicPath, internalPath])
);

function getPublicPath(path) {
  return routeAliases[path] || path;
}

function getInternalPath(path) {
  return reverseRouteAliases[path] || path;
}

function getCleanUrl(path, headingId = null) {
  const basePath = getBasePath();
  const cleanPath = getPublicPath(path).replace(/^\/+|\/+$/g, '');
  const heading = headingId ? `#${headingId}` : '';

  return `${basePath}/${cleanPath}${heading}`;
}

function getPathFromLocation() {
  const basePath = getBasePath();
  let path = window.location.pathname;

  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }

  path = path.replace(/^\/+|\/+$/g, '');

  let headingId = null;

  // Old hash-route support: /#/privacy/secure-routing
  if (window.location.hash.startsWith('#/')) {
    path = window.location.hash.slice(2).replace(/^\/+|\/+$/g, '');
  } else if (window.location.hash.length > 1) {
    headingId = window.location.hash.slice(1);
  }

  // Old @ heading support
  if (path.includes('@')) {
    [path, headingId] = path.split('@');
  }

  path = getInternalPath(path);

  if (!path) {
    path = 'intro/introduction';
  }

  return { path, headingId };
}

function findPage(path) {
  for (const [section, items] of Object.entries(navStructure)) {
    for (const item of items) {
      if (item.path === path && !item.disabled) {
        return {
          path: item.path,
          title: item.title,
          section
        };
      }
    }
  }

  return null;
}

function resolveRoute(path) {
  const exactPage = findPage(path);

  if (exactPage) {
    return exactPage;
  }

  // Section route support:
  // /privacy -> first page under privacy/*
  // /token -> first page under token/*
  if (!path.includes('/')) {
    for (const [section, items] of Object.entries(navStructure)) {
      const firstItem = items.find(item => !item.disabled && item.path.startsWith(`${path}/`));

      if (firstItem) {
        return {
          path: firstItem.path,
          title: firstItem.title,
          section
        };
      }
    }
  }

  return findPage('intro/introduction');
}

function navigateTo(path, headingId = null, replace = false) {
  const resolvedPage = resolveRoute(path);

  if (!resolvedPage) return;

  const url = getCleanUrl(resolvedPage.path, headingId);

  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }

  loadPageFromUrl();
}

function loadPageFromUrl() {
  const { path, headingId } = getPathFromLocation();
  const resolvedPage = resolveRoute(path);

  if (!resolvedPage) {
    navigateTo('intro/introduction', null, true);
    return;
  }

  if (path !== resolvedPage.path) {
    window.history.replaceState({}, '', getCleanUrl(resolvedPage.path, headingId));
  }

  loadPage(resolvedPage.path, resolvedPage.title, headingId);
  closeSidebar();
}


// THEME MANAGEMENT

function initializeTheme() {
  const saved = localStorage.getItem('theme');
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (dark ? 'dark' : 'light');
  applyTheme(theme);

  const docsText = document.querySelector('.docs-text');
  if (docsText) {
    docsText.src = theme === 'dark' ? '/images/docs-text-white.png' : '/images/docs-text-black.png';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  const themeIcon = document.getElementById('theme-icon');
  const docsText = document.querySelector('.docs-text');
  
  if (isDark) {
    themeIcon.innerHTML = '<svg viewBox="0 0 21 21" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 14.5c2.219 0 4-1.763 4-3.982a4.003 4.003 0 0 0-4-4.018c-2.219 0-4 1.781-4 4s1.781 4 4 4M4.136 4.136L5.55 5.55m9.9 9.9l1.414 1.414M1.5 10.5h2m14 0h2M4.135 16.863L5.55 15.45m9.899-9.9l1.414-1.415M10.5 19.5v-2m0-14v-2" opacity=".3"/><g transform="translate(-210 -1)"><path d="M220.5 2.5v2m6.5.5l-1.5 1.5"/><circle cx="220.5" cy="11.5" r="4"/><path d="m214 5l1.5 1.5m5 14v-2m6.5-.5l-1.5-1.5M214 18l1.5-1.5m-4-5h2m14 0h2"/></g></svg>';
    docsText.src = '/images/docs-text-white.png';
  } else {
    themeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12.808c-.5 5.347-5.849 9.14-11.107 7.983C-.078 18.6 1.15 3.909 11.11 3 6.395 9.296 14.619 17.462 21 12.808"/></svg>';
    docsText.src = '/images/docs-text-black.png';
  }

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
        link.href = getCleanUrl(item.path);

        link.addEventListener('click', event => {
          event.preventDefault();
          navigateTo(item.path);
        });
      }

      sectionDiv.appendChild(link);
    }

    navMenu.appendChild(sectionDiv);
  }
}

// PAGE LOADING


function loadPage(path, title, headingId = null) {
  if (currentPage === path) return;

  currentPage = path;
  const contentDiv = document.getElementById('content');

  // Find section name for breadcrumb
  let sectionName = '';
  for (const [section, items] of Object.entries(navStructure)) {
    for (const item of items) {
      if (item.path === path) {
        sectionName = section;
        break;
      }
    }
    if (sectionName) break;
  }

  // Update breadcrumb
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `<span class="breadcrumb-section">${sectionName}</span><span class="breadcrumb-sep">/</span><span class="breadcrumb-page">${title}</span>`;
  }

  // Update active navigation item
  updateActiveNavItem(path);

  // Fetch and render markdown
  fetch(`${getBasePath()}/content/${path}.md`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}.md`);
      }
      return response.text();
    })
    .then(markdown => {
      renderMarkdown(markdown, headingId);
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

function renderMarkdown(markdown, headingId = null) {
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
        tip: '<svg viewBox="-4 0 19 19" width="20" height="20" fill="currentColor"><path d="M10.328 6.83a5.9 5.9 0 0 1-1.439 3.64 2.9 2.9 0 0 0-.584 1v1.037a.95.95 0 0 1-.95.95h-3.71a.95.95 0 0 1-.95-.95V11.47a2.9 2.9 0 0 0-.584-1A5.9 5.9 0 0 1 .67 6.83a4.83 4.83 0 0 1 9.28-1.878 4.8 4.8 0 0 1 .38 1.88zm-.95 0a3.878 3.878 0 0 0-7.756 0c0 2.363 2.023 3.409 2.023 4.64v1.037h3.71V11.47c0-1.231 2.023-2.277 2.023-4.64M7.83 14.572a.475.475 0 0 1-.475.476h-3.71a.475.475 0 0 1 0-.95h3.71a.475.475 0 0 1 .475.474m-.64 1.262a.24.24 0 0 1-.078.265 2.67 2.67 0 0 1-3.274 0 .237.237 0 0 1 .145-.425h2.983a.24.24 0 0 1 .225.16z"/></path></svg>',
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
      'details', 'summary',
      'svg', 'g', 'circle', 'path', 'line', 'text', 'rect'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'align', 'class', 'id', 'open', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
      'font-size', 'font-weight', 'text-anchor', 'clip-rule', 'fill-rule', 'data-target'
    ]
  });

  document.getElementById('content-body').innerHTML = html;

  // Fix relative image paths for clean URLs
  document.querySelectorAll('#content-body img').forEach(img => {
    const src = img.getAttribute('src');

    if (
      !src ||
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:') ||
      src.startsWith('/')
    ) {
      return;
    }

    img.src = `${getBasePath()}/${src.replace(/^\.?\//, '')}`;
  });

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

  document.querySelectorAll('.faq-section-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();

    const targetId = link.getAttribute('data-target');
    const target = document.getElementById(targetId);

    if (target) {
      const contentDiv = document.getElementById('content');
      contentDiv.scrollTo({
        top: target.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  });
});

  // Scroll to top
  contentDiv.scrollTop = 0;

  // Add anchor links to headings
  addHeadingAnchors();

    // Scroll to heading if provided
  if (headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function addHeadingAnchors() {
  const headings = document.querySelectorAll('#content-body h1, #content-body h2, #content-body h3');
  
  headings.forEach((heading, index) => {
    // Create ID from heading text if it doesn't have one
    if (!heading.id) {
      heading.id = heading.textContent
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    // Create anchor link
    const anchor = document.createElement('a');
    anchor.href = `#${heading.id}`;
    anchor.className = 'heading-anchor';
    anchor.textContent = '#';
    anchor.title = 'Copy link to this heading';
    anchor.onclick = (e) => {
      e.preventDefault();

      const pagePath = (currentPage || 'intro/introduction')
        .split('@')[0]
        .replace(/^\/+|\/+$/g, '');

      const url = `${window.location.origin}${getBasePath()}/${pagePath}@${heading.id}`;

      console.log('Copied URL:', url);
      navigator.clipboard.writeText(url);

      anchor.textContent = '✓';
      setTimeout(() => anchor.textContent = '#', 1500);
    };

    heading.appendChild(anchor);
  });
}

// MOBILE SIDEBAR TOGGLE

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  sidebar.classList.toggle('open');
  menuToggle.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  if (window.innerWidth <= 950) {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
  }
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');

  // Check if click is outside sidebar and menu toggle
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    }
  }
});

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
