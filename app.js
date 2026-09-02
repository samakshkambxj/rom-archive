// ===== PAGE LOAD =====
window.addEventListener('load', () => document.body.classList.add('loaded'));

// ===== MOBILE NAV =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ===== SCROLL PROGRESS =====
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  scrollProgress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
});

// ===== PARTICLES =====
const pCanvas = document.getElementById('particlesCanvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];
function resizeCanvas() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
function initParticles() {
  particles = [];
  const count = Math.min(50, Math.floor(window.innerWidth / 25));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * pCanvas.width,
      y: Math.random() * pCanvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.3 + 0.1
    });
  }
}
initParticles();
function animateParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => {
    p.x += p.dx; p.y += p.dy;
    if (p.x < 0 || p.x > pCanvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > pCanvas.height) p.dy *= -1;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(120,120,255,${p.o})`;
    pCtx.fill();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== ROM DATA & RENDERING =====
let allBuilds = [];
let activeDevice = 'all';
let activeRom = 'all';
let activeStatus = 'all';

const romGrid = document.getElementById('romGrid');
const deviceGrid = document.getElementById('deviceGrid');
const deviceFilters = document.getElementById('deviceFilters');
const romFilters = document.getElementById('romFilters');
const statusFilters = document.getElementById('statusFilters');
const emptyState = document.getElementById('emptyState');

// Banner fallback colors per ROM
const bannerColors = {
  'lunaris': '#1a1a3e',
  'evolution-x': '#0d2137',
  'crdroid': '#1a0d2e',
  'axionos': '#0e1a1a',
  'project-infinity-x': '#1a0e2e',
  'project-ascp': '#0e1a0e',
  'rising-os': '#2e1a0e',
  'avium-ui': '#0e1a2e'
};

function createRomCard(build) {
  const card = document.createElement('div');
  card.className = 'rom-card' + (build.status !== 'active' ? ' inactive' : '');
  const bgColor = bannerColors[build.id] || '#111128';
  const isActive = build.status === 'active';
  const activeDevices = build.activeDevices || [];

  card.innerHTML = `
    <div class="rom-card-banner" style="background: ${bgColor}; display: flex; align-items: center; justify-content: center;">
      <span style="font-family: var(--font-mono); font-size: 24px; font-weight: 700; opacity: 0.3;">${build.name}</span>
    </div>
    <div class="rom-card-body">
      <div class="rom-card-header">
        <span class="rom-card-name">${build.name}</span>
        <span class="rom-card-status ${build.status}">${build.status}</span>
      </div>
      <p class="rom-card-desc">${build.description}</p>
      <div class="rom-card-meta">
        <span class="rom-card-android">Android ${build.android}</span>
      </div>
      <div class="rom-card-device-tags">
        ${build.devices.map(d => {
          const isDeviceActive = isActive && activeDevices.includes(d);
          const cls = isDeviceActive ? ' active-device' : (!isActive || activeDevices.length === 0 ? ' inactive' : ' inactive');
          return `<span class="device-tag${cls}" data-device="${d}">${d}</span>`;
        }).join('')}
      </div>
      <div class="rom-card-actions">
        <a href="${build.download}" target="_blank" rel="noopener" class="btn btn-primary${isActive ? '' : ' disabled'}">${isActive ? 'Download' : 'Unavailable'}</a>
        ${build.source ? `<a href="${build.source}" target="_blank" rel="noopener" class="btn btn-outline${isActive ? '' : ' disabled'}">Source</a>` : ''}
      </div>
    </div>
  `;
  // Device tag click (only for active devices)
  card.querySelectorAll('.device-tag:not(.inactive)').forEach(tag => {
    tag.addEventListener('click', () => {
      activeDevice = tag.dataset.device;
      updateFilterUI();
      renderBuilds();
    });
  });
  return card;
}

function createDeviceCard(name, builds) {
  const card = document.createElement('div');
  card.className = 'device-card';
  const romNames = builds.map(b => b.name);
  card.innerHTML = `
    <div class="device-card-name">${name}</div>
    <div class="device-card-chip">Mediatek</div>
    <div class="device-card-roms">
      ${romNames.map(n => `<span class="pill">${n}</span>`).join('')}
    </div>
  `;
  return card;
}

function renderBuilds() {
  const filtered = allBuilds.filter(b => {
    const deviceMatch = activeDevice === 'all' || b.devices.includes(activeDevice);
    const romMatch = activeRom === 'all' || b.name === activeRom;
    const statusMatch = activeStatus === 'all' || b.status === activeStatus;
    return deviceMatch && romMatch && statusMatch;
  });

  romGrid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(b => romGrid.appendChild(createRomCard(b)));
  }
}

function renderDevices() {
  const deviceMap = {};
  allBuilds.forEach(b => {
    b.devices.forEach(d => {
      if (!deviceMap[d]) deviceMap[d] = [];
      deviceMap[d].push(b);
    });
  });
  deviceGrid.innerHTML = '';
  Object.entries(deviceMap).forEach(([name, builds]) => {
    deviceGrid.appendChild(createDeviceCard(name, builds));
  });
}

function renderFilters() {
  // Device filters
  const devices = new Set();
  allBuilds.forEach(b => b.devices.forEach(d => devices.add(d)));
  devices.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.device = d;
    btn.textContent = d;
    deviceFilters.appendChild(btn);
  });

  // ROM filters
  const roms = new Set(allBuilds.map(b => b.name));
  roms.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.rom = r;
    btn.textContent = r;
    romFilters.appendChild(btn);
  });
}

function updateFilterUI() {
  deviceFilters.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.device === activeDevice);
  });
  romFilters.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.rom === activeRom);
  });
  statusFilters.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.status === activeStatus);
  });
}

// Filter click handlers
document.addEventListener('click', e => {
  if (e.target.dataset.device !== undefined) {
    activeDevice = e.target.dataset.device;
    updateFilterUI();
    renderBuilds();
  }
  if (e.target.dataset.rom !== undefined) {
    activeRom = e.target.dataset.rom;
    updateFilterUI();
    renderBuilds();
  }
  if (e.target.dataset.status !== undefined) {
    activeStatus = e.target.dataset.status;
    updateFilterUI();
    renderBuilds();
  }
});

// ===== FETCH DATA =====
fetch('data/builds.json')
  .then(r => r.json())
  .then(data => {
    allBuilds = data;
    renderFilters();
    renderBuilds();
    renderDevices();

    // Update hero badge count
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      const deviceCount = new Set(data.flatMap(b => b.devices)).size;
      badge.innerHTML = `<span class="dot"></span> ${data.length} ROMs &middot; ${deviceCount} Devices`;
    }
  })
  .catch(err => {
    romGrid.innerHTML = '<p style="color:var(--muted); text-align:center; grid-column:1/-1;">Failed to load ROM data.</p>';
    console.error(err);
  });
