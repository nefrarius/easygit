<div align="center">

# ⚡ EasyGit

**Asistente visual de Git** con terminal de comandos en tiempo real.

[![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<pre style="background:#0a0e14; color:#b8cc52; padding:16px; border-radius:8px; font-family:'JetBrains Mono',monospace;">
  ╔══════════════════════════════════╗
  ║  $ git add .                     ║
  ║  $ git commit -m "fix: login"    ║  ← Comandos en vivo
  ║  $ git push                      ║     con animación
  ║  ✔ Todo sincronizado             ║
  ╚══════════════════════════════════╝
</pre>

**Cada comando se muestra antes de ejecutarse.**  
Sin backend. Sin telemetría. 100% local.

</div>

---

## ✨ Funcionalidades

| | Característica | Descripción |
|---|---|---|
| 🖥️ | **Terminal interactiva** | Escribe comandos `git` directo en el panel inferior. ↑/↓ historial. Enter ejecuta. |
| 📊 | **Git Graph** | Árbol visual de commits con colores por rama. Click en hash para copiar. |
| 📝 | **Selección de archivos + Diff** | Checkboxes para elegir qué commiteas. Modal de commit. Panel de diff con colores +/ -. |
| 🔐 | **Aprobación manual** | Los comandos destructivos piden doble confirmación. |
| ⚡ | **Acciones rápidas** | Quick Commit, Sync, Nueva rama, Undo commit, Descartar cambios. Todo en un clic. |
| 🐙 | **GitHub integrado** | Login con token, crear repos (con .gitignore/licencia), push, pull, fork, PRs, merge, **borrar repos**. |
| 📜 | **Historial persistente** | Todos los comandos ejecutados se guardan localmente. Filtro por comando o rama. |
| 🧠 | **Commit messages** | Generación automática basada en archivos modificados. Hook listo para conectar un LLM. |

## 🚀 Instalación

```bash
git clone https://github.com/tu-usuario/easygit
cd easygit
npm install
npm run dev
```

**Requisitos:** Node.js 18+, Git instalado en el sistema.

---

## 💻 Terminal interactiva

El panel inferior de la app es una **terminal git interactiva**:

```
$ git status
$ add .
$ commit -m "feat: login form"
$ push
```

- Escribe comandos con o sin prefijo `git` (`status` o `git status`)
- **↑/↓** navega historial de la sesión
- **Enter** ejecuta el comando en el repo actual
- El resultado se muestra en vivo con ✔ éxito / ✘ error
- Click en cualquier comando para copiarlo al portapapeles

### Comandos disponibles

| Comando | Equivalente |
|---------|-------------|
| `status` | `git status` |
| `add .` | `git add .` |
| `commit -m "msg"` | `git commit -m "msg"` |
| `push` | `git push` |
| `pull` | `git pull` |
| `log --oneline -5` | `git log --oneline -5` |
| `branch` | `git branch` |
| `checkout -b feature` | `git checkout -b feature` |
| `diff` | `git diff` |
| `stash` | `git stash` |

## 📖 Uso

### Abrir un repositorio

1. Abre EasyGit → `npm run dev`
2. Sidebar izquierdo → **"abrir repositorio"** → selecciona tu proyecto
3. O → **"init nuevo repo"** para crear uno nuevo

### Conexión con GitHub

1. Pestaña **GitHub** → **"Conectar con GitHub"**
2. Crea un token en [github.com/settings/tokens](https://github.com/settings/tokens)
   - Permisos: `repo` (Read y Write), `Pull requests` (Read y Write)
3. Pega el token → **Conectar**

### Flujo completo: subir proyecto nuevo a GitHub

```
1. Abre EasyGit → abre tu proyecto local
2. Tab GitHub → "Nuevo repositorio"
3. Configura:
   ┌─────────────────────────────────┐
   │  Nombre:     mi-proyecto        │
   │  Descripción: Un proyecto genial│
   │  Visibilidad: ○ Público  🔒 Priv│
   │  README:     ✔                  │
   │  .gitignore: Node               │
   │  Licencia:   MIT                │
   └─────────────────────────────────┘
4. Clic → "Crear repo y subir código"
   → Repo creado en GitHub
   → Remote configurado automáticamente
   → Código subido con git push
```

### Acciones rápidas

| Botón | Comandos | Descripción |
|-------|----------|-------------|
| **Quick Commit** | `add .` + `commit -m` + `push` | Sube cambios en 1 clic |
| **Sync** | `git pull` | Trae cambios del remoto |
| **Nueva rama** | `checkout -b` + `push -u` | Crea rama y la sube |
| **Undo commit** | `reset --soft HEAD~1` | Deshace el último commit (seguro) |
| **Descartar cambios** 🔴 | `restore .` | **Destructivo** — requiere doble confirmación |

### GitHub

| Acción | Descripción |
|--------|-------------|
| **Push** | Sube cambios al remoto |
| **Pull** | Trae cambios del remoto |
| **Fork** | Forkea el repo actual a tu cuenta |
| **New PR** | Crea pull request (título, base, head, descripción) |
| **Merge PR** | Mergea PRs directamente desde la lista |
| **Crear repo** | Con nombre, descripción, visibilidad, .gitignore y licencia |
| **Listar repos** | Tus repos de GitHub con URL para clonar |

---

## 🖥️ Layout de la app

```
┌────────────────────────────────────────────────────┐
│  ⚡ EasyGit              │  mi-repo              │  ← Title bar
├──────────┬─────────────────────────────────────────┤
│          │  [Repo] [GitHub] [Historial]            │  ← Tabs
│ Sidebar  │                                         │
│          │  ● Rama: main                           │
│ Repos    │  ahead: 2  behind: 0  clean: false      │
│ favs     │                                         │
│          │  Archivos modificados:                  │
│ Rama     │  [M] src/index.js                       │
│ actual   │  [A] src/nuevo.js                       │
│          │                                         │
│          │  [Quick Commit] [Sync] [New branch]     │
│          │  [Undo commit]  [⚠️ Descartar cambios]  │
├──────────┴─────────────────────────────────────────┤
│  $ Terminal                                        │
│  $ git add .                                  ●   │  ← Escribiendo...
│  $ git commit -m "modifica: src/"             ✔   │  ← Exitoso
└────────────────────────────────────────────────────┘
```

---

## 🛡️ Seguridad

| Aspecto | Cómo se maneja |
|---------|---------------|
| **Credenciales Git** | No se guardan. Usa credential helper del sistema o SSH keys. |
| **GitHub Token** | Se almacena en `electron-store` (JSON local en `~/.config/easygit/`). |
| **Ejecución de comandos** | `child_process.execFile()` — sin shell intermedio, sin riesgo de inyección. |
| **Argumentos** | Escapados contra caracteres especiales en nombres de rama o mensajes. |
| **Comandos destructivos** | `restore .`, `reset --hard` → doble confirmación con modal rojo. |
| **Force push** | No implementado. Explícitamente omitido por seguridad. |
| **Telemetría** | Cero. No hay backend, no hay recolección de datos. |
| **Conexiones externas** | Solo las que tú inicias (push, pull, fork, PR a GitHub). |

### ¿Por qué `execFile` y no `exec`?

```javascript
// ✅ SEGURO — Argumentos como array, sin shell
execFile('git', ['commit', '-m', message], { cwd: repoPath })

// ❌ PELIGROSO — Shell interpreta el string, permite inyección
exec(`git commit -m "${message}"`)
```

---

## 🧩 Stack técnico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Shell** | Electron 29 | Ventana de escritorio, IPC entre procesos |
| **UI** | React 18 | Componentes reactivos, estado con hooks |
| **Estilos** | Tailwind CSS 3 | Tema oscuro hacker, colores #b8cc52 / #95e6cb |
| **Git (parseo)** | `simple-git` | Status, branches, log como objetos JS |
| **Git (ejecución)** | `child_process.execFile` | Comando exacto en string para la terminal |
| **Persistencia** | `electron-store` | JSON local, sin base de datos |
| **GitHub API** | `https` nativo | Llamadas directas sin dependencias externas |
| **Fuente** | JetBrains Mono / Fira Code | Monoespaciada para la terminal |

### ¿Por qué `simple-git` + `child_process`?

| `simple-git` | `child_process.execFile` |
|---|---|
| API limpia para leer estado del repo | Captura el string exacto del comando |
| Parsea automático: `status`, `branches`, `log` | Necesario para mostrar en la terminal visual |
| Devuelve objetos JS listos para la UI | Muestra `$ git add .` letra por letra |

---

## 📁 Estructura del proyecto

```
easygit/
├── src/
│   ├── main/                   # Proceso principal de Electron
│   │   ├── main.js                 # Entry point, IPC handlers
│   │   ├── preload.js              # Bridge seguro renderer ↔ main
│   │   ├── gitService.js           # Wrapper de git (simple-git + execFile)
│   │   ├── githubService.js        # API de GitHub vía HTTPS nativo
│   │   └── storeService.js         # Persistencia local (electron-store)
│   ├── renderer/               # UI con React
│   │   ├── index.html
│   │   ├── main.jsx                # Entry point React
│   │   ├── App.jsx                 # Componente principal, lógica de acciones
│   │   ├── index.css               # Tailwind + estilos terminal
│   │   └── components/
│   │       ├── Sidebar.jsx             # Repos favoritos, ramas
│   │       ├── RepoPanel.jsx           # Estado, archivos, acciones
│   │       ├── TerminalPanel.jsx       # Terminal con animación de escritura
│   │       ├── GitHubPanel.jsx         # Login, push, fork, PRs, crear repo
│   │       └── HistoryPanel.jsx        # Historial de comandos
│   └── store/                   # Estado del renderer (hooks React)
│       └── repoStore.js
├── dist/                       # Build de producción
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.mjs
└── README.md
```

---

## 💾 ¿Qué datos guarda?

| Dato | Almacenamiento | Propósito |
|------|---------------|-----------|
| Historial de comandos | `electron-store` (JSON) | Auditoría, pestaña Historial |
| Repos favoritos | `electron-store` (JSON) | Sidebar, acceso rápido |
| GitHub token | `electron-store` (JSON) | Evitar pegar el token cada vez |
| GitHub user info | `electron-store` (JSON) | Mostrar avatar y nombre |

**NO guarda:** contenido de archivos, diffs completos, credenciales de Git, estadísticas de uso, ni ningún dato fuera de tu máquina.

Archivo de datos: `~/.config/easygit/easygit-data.json`

---

## 🧠 Generación de mensajes de commit

**Modo sin IA** (incluido):
```
modifica: src/, docs/; añade: 2 archivos
```

**Hook para LLM** (opcional):
Editar `src/renderer/App.jsx` → función `generateCommitMessage()`. Ahí tienes acceso a `status` con archivos modificados, staged y diff. Conecta cualquier API (Anthropic, OpenAI, etc.) y devuelve el mensaje siguiendo [Conventional Commits](https://www.conventionalcommits.org/).

---

## ❓ Solución de problemas

| Error | Causa | Solución |
|-------|-------|----------|
| `GPU process isn't usable` | Sin GPU en el entorno | En máquina real funciona. Si persiste: `electron . --disable-gpu` |
| `ERR_CONNECTION_REFUSED` | Vite no arrancó antes que Electron | `wait-on` lo maneja. Si no: arranca Vite aparte |
| Push rechazado | Rama desactualizada | Pull primero, resuelve conflictos, push |
| Token inválido | Token expiró o sin permisos | Generar nuevo token con alcance `repo` |
| `remote already exists` | Remote ya configurado | La app hace `set-url` automáticamente |

---

## 📜 Licencia

MIT — Haz lo que quieras con este proyecto.

---

<div align="center">
  
**Hecho con ⚡ para desarrolladores que quieren ver qué está pasando.**

</div>
