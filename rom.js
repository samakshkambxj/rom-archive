// ===== PAGE LOAD =====
window.addEventListener('load', () => document.body.classList.add('loaded'));

// ===== MOBILE NAV =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
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

// ===== GET ROM ID FROM URL =====
const params = new URLSearchParams(window.location.search);
const romId = params.get('id');

// ===== RENDER ROM DETAIL =====
const romDetail = document.getElementById('romDetail');
const rom404 = document.getElementById('rom404');

function renderDetail(build) {
  document.title = `${build.name} — ROM Archive`;

  const isActive = build.status === 'active';
  const activeDevices = build.activeDevices || [];
  const hasScreenshots = build.screenshots && build.screenshots.length > 0;
  const hasFeatures = build.features && build.features.length > 0;

  romDetail.innerHTML = `
    <!-- HERO BANNER -->
    <section class="rom-hero">
      <div class="rom-hero-bg" style="background-image: url('${build.banner}')"></div>
      <div class="rom-hero-overlay"></div>
      <div class="container rom-hero-content">
        <a href="index.html" class="rom-back">&larr; Back to Archive</a>
        <div class="rom-hero-info">
          <span class="rom-card-status ${build.status}">${build.status}</span>
          <h1>${build.name}</h1>
          <p class="rom-hero-sub">Android ${build.android} &middot; ${build.devices.length} device${build.devices.length > 1 ? 's' : ''}</p>
        </div>
      </div>
    </section>

    <!-- INFO SECTION -->
    <section class="rom-info-section">
      <div class="container">
        <div class="rom-info-grid">
          <div class="rom-info-main">
            <h2>About</h2>
            <p class="rom-long-desc">${build.longDescription || build.description}</p>

            ${hasFeatures ? `
            <h2>Features</h2>
            <ul class="rom-features">
              ${build.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            ` : ''}

            ${build.changelog ? `
            <h2>Changelog</h2>
            <div class="rom-changelog">
              <pre>${build.changelog}</pre>
            </div>
            ` : ''}
          </div>

          <div class="rom-info-sidebar">
            <div class="rom-sidebar-card">
              <h3>Info</h3>
              <div class="rom-sidebar-row">
                <span class="rom-sidebar-label">Status</span>
                <span class="rom-card-status ${build.status}">${build.status}</span>
              </div>
              <div class="rom-sidebar-row">
                <span class="rom-sidebar-label">Android</span>
                <span>${build.android}</span>
              </div>
              <div class="rom-sidebar-row">
                <span class="rom-sidebar-label">Devices</span>
                <div class="rom-sidebar-devices">
                  ${build.devices.map(d => {
                    const isDeviceActive = isActive && activeDevices.includes(d);
                    return `<span class="device-tag${isDeviceActive ? ' active-device' : ' inactive'}">${d}</span>`;
                  }).join('')}
                </div>
              </div>
              ${build.tags && build.tags.length ? `
              <div class="rom-sidebar-row">
                <span class="rom-sidebar-label">Tags</span>
                <div class="rom-sidebar-tags">
                  ${build.tags.map(t => `<span class="rom-tag">${t}</span>`).join('')}
                </div>
              </div>
              ` : ''}
            </div>

            <div class="rom-sidebar-card">
              <h3>Download</h3>
              ${isActive ? `
                <a href="${build.download}" target="_blank" rel="noopener" class="btn btn-primary rom-download-btn">Download from GitHub</a>
              ` : `
                <a href="#" class="btn disabled rom-download-btn">Unavailable</a>
                <p class="rom-download-note">This ROM is currently inactive.</p>
              `}
            </div>
          </div>
        </div>
      </div>
    </section>

    ${hasScreenshots ? `
    <!-- SCREENSHOTS -->
    <section class="rom-screenshots-section">
      <div class="container">
        <h2>Screenshots</h2>
        <div class="rom-screenshots-scroll">
          ${build.screenshots.map(s => `
            <div class="rom-screenshot-item">
              <img src="${s}" alt="${build.name} screenshot" loading="lazy" onerror="this.parentElement.style.display='none'">
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  `;
}

// ===== FETCH DATA =====
if (!romId) {
  rom404.style.display = 'block';
} else {
  fetch('data/builds.json')
    .then(r => r.json())
    .then(data => {
      const build = data.find(b => b.id === romId);
      if (!build) {
        rom404.style.display = 'block';
        return;
      }
      renderDetail(build);
    })
    .catch(() => {
      rom404.style.display = 'block';
    });
}
