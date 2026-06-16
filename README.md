# Projet Kepler — CIR1 ISEN Brest 2026

Simulation 3D du système solaire — calcul des trajectoires en C, visualisation web avec Three.js.

---

## Prérequis

- **GCC** (fourni avec MinGW sur Windows)
- **make** (fourni avec MinGW)
- **Python 3** (pour le serveur web local)
- Un navigateur web moderne (Chrome, Firefox, Edge)

---

## Lancer la simulation

### Étape 1 — Compiler et générer les trajectoires

```bash
cd c_core
make
./bin/kepler.exe
```

La simulation tourne environ 10-15 secondes et génère le fichier `web/data/trajectoire.json`.

### Étape 2 — Lancer le serveur web

```bash
cd web
python -m http.server 8000
```

### Étape 3 — Ouvrir dans le navigateur

```
http://localhost:8000
```

---

## Navigation dans la simulation

| Action | Effet |
|--------|-------|
| Clic gauche + glisser | Rotation de la caméra |
| Molette | Zoom / dézoom |
| Clic sur un corps | Focus et zoom sur ce corps |
| Clic dans la liste (panneau droit) | Focus sur le corps sélectionné |
| Bouton ↺ Vue système | Revenir à la vue d'ensemble |

---

## Contenu de la simulation

- **8 planètes** — Mercure à Neptune avec orbites elliptiques réelles
- **11 satellites** — Lune, Phobos, Deimos, Io, Europa, Titan, Rhea, Titania, Oberon, Triton, Proteus
- **Comète de Halley** — orbite rétrograde sur 10 ans
- **Barycentre** — le Soleil se déplace autour du centre de masse du système
- **5 ans** de simulation à dt = 1800s (30 minutes)

---

## Structure du projet

```
CIR1_Projet/
├── c_core/
│   ├── include/       → fichiers .h
│   ├── src/           → fichiers .c
│   ├── obj/           → fichiers .o (générés)
│   ├── bin/           → exécutable (généré)
│   └── Makefile
│
├── web/
│   ├── index.html
│   ├── style.css
│   ├── js/
│   │   ├── config.js        → couleurs, tailles, masses
│   │   ├── loader.js        → chargement JSON
│   │   ├── scale.js         → conversion mètres → Three.js
│   │   ├── interpolation.js → interpolation Hermite
│   │   ├── simulation.js    → moteur Three.js
│   │   └── ui.js            → panneau latéral
│   └── data/
│       └── trajectoire.json → généré par le C
│
├── docs/
└── README.md
```

---

## En cas de problème

**`make` introuvable** → utiliser `mingw32-make` à la place

**Écran noir dans le navigateur** → vérifier que `trajectoire.json` existe dans `web/data/`

**Erreur 404 sur le JSON** → s'assurer de lancer le serveur depuis le dossier `web/`

**Simulation lente** → réduire la vitesse avec le slider dans le panneau droit
