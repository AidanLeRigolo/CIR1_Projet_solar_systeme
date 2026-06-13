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
    selectedBody = name;

    // Réinitialiser le rayon de la caméra pour zoomer sur le corps
    const cfg = BODY_CONFIG[name];
    if (cfg) {
        const zoomRadius = cfg.group === 'satellite' ? 10
                         : cfg.group === 'planet'    ? 50
                         : 200;
        spherical.radius = zoomRadius;
    }

    document.querySelectorAll('.body-item').forEach(el =>
        el.classList.toggle('selected', el.dataset.name === name));

    document.getElementById('body-name').textContent =
        name.charAt(0).toUpperCase() + name.slice(1);

    // Mettre en évidence l'orbite sélectionnée
    for (const [n, line] of Object.entries(orbitLines)) {
        line.material.opacity = n === name ? 0.9 : 0.2;
    }
}

function updateSidebar() {
    if (!selectedBody) return;

    const pos = getPosition(selectedBody, timeIndex);
    const vel = getVelocity(selectedBody, timeIndex);
    if (!pos || !vel) return;

    document.getElementById('stat-distance').textContent = formatDistance(pos);
    document.getElementById('stat-velocity').textContent = formatVelocity(vel);

    const mass = BODY_MASSES[selectedBody] || 1e20;
    const d    = Math.sqrt(pos[0]**2 + pos[1]**2 + pos[2]**2);
    const v2   = vel[0]**2 + vel[1]**2 + vel[2]**2;
    const ec   =  0.5 * mass * v2;
    const ep   = -(G * M_SUN * mass) / d;

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
        timeIndex = parseInt(e.target.value);
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