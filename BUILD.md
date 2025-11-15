# Guide de Build

Ce document explique le système de build du Custom Gauge Card.

## Vue d'ensemble

Le projet utilise **Rollup** pour compiler et optimiser le code source modulaire en un fichier JavaScript minifié prêt pour la distribution.

### Avantages du système de build

- **Réduction de taille** : 34KB → 17KB (50% de réduction)
- **Code modulaire** : Séparation logique en 8 modules distincts
- **Maintenance facilitée** : CSS séparé du JavaScript
- **Performance optimale** : Minification et optimisation automatiques

## Structure du projet

```
gauge/
├── src/                          # Code source (à éditer)
│   ├── index.js                  # Point d'entrée principal
│   ├── CustomGaugeCard.js        # Classe Web Component
│   ├── config.js                 # Configuration et thèmes
│   ├── renderer.js               # Logique de rendu HTML
│   ├── state.js                  # Gestion d'état
│   ├── animations.js             # Système d'animation
│   ├── controls.js               # Boutons interactifs
│   ├── utils.js                  # Fonctions utilitaires
│   └── styles.css                # Styles CSS
├── dist/                         # Fichiers compilés (générés)
│   └── custom-gauge-card.js      # Bundle minifié pour production
├── package.json                  # Configuration npm
├── rollup.config.js              # Configuration Rollup
└── custom-gauge-card.js          # Ancien fichier (legacy)
```

## Commandes disponibles

### Installation des dépendances

```bash
npm install
```

Installe tous les outils nécessaires (Rollup, plugins, etc.)

### Build de production

```bash
npm run build
```

Compile le code source et génère `dist/custom-gauge-card.js` (minifié).

### Mode développement

```bash
npm run dev
# ou
npm run watch
```

Compile le code et surveille les modifications pour recompiler automatiquement.

## Workflow de développement

### 1. Faire des modifications

Éditez les fichiers dans le dossier `src/` :

- **Logique métier** : `state.js`, `animations.js`, `controls.js`
- **Interface** : `renderer.js`, `styles.css`
- **Configuration** : `config.js`
- **Utilitaires** : `utils.js`

### 2. Compiler

```bash
npm run build
```

### 3. Tester

Le fichier `dist/custom-gauge-card.js` est prêt à être testé dans Home Assistant.

### 4. Déployer

Pour HACS, le fichier `hacs.json` pointe déjà vers `dist/custom-gauge-card.js`.

## Configuration Rollup

Le fichier `rollup.config.js` configure :

- **Input** : `src/index.js`
- **Output** : `dist/custom-gauge-card.js` (format IIFE)
- **Plugins** :
  - `@rollup/plugin-node-resolve` : Résolution des modules
  - `rollup-plugin-postcss` : Traitement du CSS
  - `@rollup/plugin-terser` : Minification

## Architecture modulaire

### Modules et responsabilités

| Module | Responsabilité |
|--------|---------------|
| `index.js` | Point d'entrée, enregistrement du composant |
| `CustomGaugeCard.js` | Classe principale, cycle de vie |
| `config.js` | Parsing config, gestion des thèmes |
| `renderer.js` | Génération HTML, accessibilité, markers |
| `state.js` | Mise à jour de l'état, gestion des LEDs |
| `animations.js` | Transitions fluides, power save |
| `controls.js` | Boutons interactifs multi-types |
| `utils.js` | Fonctions réutilisables |
| `styles.css` | Styles CSS (variables CSS) |

### Flux de données

```
User Config (YAML)
    ↓
config.js (parseConfig)
    ↓
CustomGaugeCard.setConfig()
    ↓
renderer.js (render)
    ↓
Home Assistant (hass setter)
    ↓
state.js (updateGauge)
    ↓
animations.js (animateValueChange)
    ↓
DOM Updates
```

## Fichier de sortie

Le fichier `dist/custom-gauge-card.js` :

- Contient tout le code nécessaire (JS + CSS)
- Est minifié (variables raccourcies, espaces supprimés)
- Fonctionne de manière autonome
- Taille : ~17KB (vs 34KB original)

## Notes importantes

- **Ne jamais éditer** `dist/custom-gauge-card.js` directement
- Toujours travailler dans `src/`
- Lancer `npm run build` avant de commiter
- Le dossier `dist/` est gitignore (ne pas commiter)
- HACS récupère le fichier depuis les releases GitHub

## Troubleshooting

### Erreur : "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build échoue

Vérifiez que tous les imports dans `src/` sont corrects :
- Extensions `.js` présentes
- Chemins relatifs corrects (`./`, `../`)

### Le bundle ne fonctionne pas

1. Vérifiez la console du navigateur
2. Comparez avec `custom-gauge-card.js` (version legacy)
3. Testez sans minification (éditez `rollup.config.js`)

## Migration depuis l'ancien système

L'ancien fichier `custom-gauge-card.js` (34KB) est conservé pour référence mais n'est plus utilisé. Le nouveau système :

1. Code source dans `src/` (modulaire, maintenable)
2. Build produit `dist/custom-gauge-card.js` (optimisé)
3. HACS distribue le fichier depuis `dist/`

## Prochaines étapes possibles

- Ajouter un linter (ESLint)
- Ajouter des tests unitaires
- Créer une GitHub Action pour build automatique
- Ajouter source maps pour debug
- Support TypeScript (optionnel)
