function initUI() {
    buildBodyList();
    bindControls();
}

function buildBodyList() {
    const list = document.getElementById('body-list');
    list.innerHTML = '';

    for (const name of bodyNames) {
        const cfg = BODY_CONFIG[name];
        if (!cfg) continue;

        const item  = document.createElement('div');
        item.className     = 'body-item';
        item.dataset.name  = name;

        const dot   = document.createElement('div');
        dot.className      = 'body-dot';
        dot.style.background = '#' + cfg.color.toString(16).padStart(6, '0');

        const label = document.createElement('div');
        label.className    = 'body-label';
        label.textContent  = name.charAt(0).toUpperCase() + name.slice(1);

        item.appendChild(dot);
        item.appendChild(label);
        item.addEventListener('click', () => selectBody(name));
        list.appendChild(item);
    }
}

function selectBody(name) {
    selectedBody       = name;
    isTransitioning    = true;
    transitionProgress = 0;

    // Zoom : caméra à 10 rayons du corps
    const size       = getBodySize(name);
    spherical.radius = size * 10;

    document.querySelectorAll('.body-item').forEach(el =>
        el.classList.toggle('selected', el.dataset.name === name));
    document.getElementById('body-name').textContent =
        name.charAt(0).toUpperCase() + name.slice(1);

    for (const [n, line] of Object.entries(orbitLines)) {
        line.material.opacity = n === name ? 0.6
            : (BODY_CONFIG[n]?.group === 'satellite' ? 0.08 : 0.15);
    }
}

function updateSidebar() {
    if (!selectedBody || !dataLoaded) return;

    const pos = getPosition(selectedBody, timeIndex);
    const vel = getVelocity(selectedBody, timeIndex);
    if (!pos || !vel) return;

    // Distance au Soleil
    const sunPos = getPosition('sun', timeIndex) || [0, 0, 0];
    const dx = pos[0] - sunPos[0];
    const dy = pos[1] - sunPos[1];
    const dz = pos[2] - sunPos[2];
    const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);

    // formatDistance attend une distance en metres, pas un vecteur pos
    const au = d / 1.496e11;
    document.getElementById('stat-distance').textContent =
        au < 0.1
        ? (d / 1e3).toExponential(2) + ' km'
        : au.toFixed(4) + ' AU';

    // formatVelocity attend un vecteur vitesse
    const v = Math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2);
    document.getElementById('stat-velocity').textContent =
        (v / 1000).toFixed(2) + ' km/s';

    // Énergie
    const mass = BODY_MASSES[selectedBody] || 1e20;
    const v2   = vel[0]**2 + vel[1]**2 + vel[2]**2;
    const ec   =  0.5 * mass * v2;
    const ep   = -(G * M_SUN * mass) / Math.max(d, 1e6);

    document.getElementById('stat-ec').textContent     = formatEnergy(ec);
    document.getElementById('stat-ep').textContent     = formatEnergy(ep);
    document.getElementById('stat-etotal').textContent = formatEnergy(ec + ep);
}

function bindControls() {
    document.getElementById('btn-play').addEventListener('click', () => {
        playing = !playing;
        document.getElementById('btn-play').textContent =
            playing ? '⏸ Pause' : '▶ Play';
    });

    document.getElementById('speed-slider').addEventListener('input', e => {
        speed = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = speed;
    });

    document.getElementById('time-slider').addEventListener('input', e => {
        timeFloat = parseInt(e.target.value);
        timeIndex = Math.floor(timeFloat);
        playing   = false;
        document.getElementById('btn-play').textContent = '▶ Play';
    });

    document.getElementById('btn-reset-view').addEventListener('click', () => {
        selectedBody     = null;
        spherical.radius = 500;
        spherical.theta  = 0.5;
        spherical.phi    = 1.0;
        document.getElementById('body-name').textContent = '—';
        document.querySelectorAll('.body-item').forEach(el =>
            el.classList.remove('selected'));
        for (const line of Object.values(orbitLines)) {
            line.material.opacity = 0.4;
        }
    });
}