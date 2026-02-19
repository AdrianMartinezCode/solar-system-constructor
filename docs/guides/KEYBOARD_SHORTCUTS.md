# Windowed UI - Keyboard Shortcuts Reference

## Audience

- People using the **windowed UI** (keyboard + mouse) while exploring/editing a generated universe.

## Prerequisites

- The app is running with the windowed UI enabled.

## Quick start

- `Space`: pause/unpause simulation
- `Ctrl+G`: open/focus Generator
- `Ctrl+E`: open/focus Body/Planet editor
- `Ctrl+W`: close active window
- `Tab` / `Shift+Tab`: cycle windows
- `Escape`: minimize active window

## How-to

### Global shortcuts

### Simulation Control
| Key | Action |
|-----|--------|
| `Space` | Pause/Unpause simulation |
| `T` | Toggle time control panel (future) |

### Window Management
| Key | Action |
|-----|--------|
| `Ctrl+G` | Open/Focus Generator window |
| `Ctrl+H` | Open/Focus Hierarchy window |
| `Ctrl+O` | Open/Focus Overview window |
| `Ctrl+E` | Open/Focus Planet Editor |
| `Ctrl+W` | Close active window |
| `Ctrl+1-9` | Quick switch to window 1-9 |
| `Tab` | Cycle through open windows forward |
| `Shift+Tab` | Cycle through open windows backward |
| `Escape` | Minimize active window |

### 3D Scene (existing)
| Key | Action |
|-----|--------|
| `Left Click + Drag` | Rotate camera |
| `Right Click + Drag` | Pan camera |
| `Mouse Wheel` | Zoom in/out |
| `Click Object` | Select star/planet/group |

### Window controls

### Mouse Actions
| Action | Effect |
|--------|--------|
| **Click Window** | Bring to front and focus |
| **Drag Header** | Move window |
| **Drag to Edge** | Dock window (visual feedback) |
| **Drag Corner** | Resize window |
| **Click ━ Button** | Minimize to taskbar |
| **Click ✕ Button** | Close window |

### Taskbar Actions
| Action | Effect |
|--------|--------|
| **Click Window Button** | Focus/restore if minimized |
| **Click Window Button (active)** | Minimize window |
| **Click ✕ on Button** | Close window |
| **Click Closed Window** | Open window |
| **Select Workspace** | Load preset layout |

### Workspace presets

| Preset | Layout | Best For |
|--------|--------|----------|
| **🔭 Exploration** | Overview (left) + Stats (right) | Browsing, high-level view |
| **✏️ Editing** | Hierarchy (left) + Editor (right) | Detailed object editing |
| **🌌 Generation** | Generator (center) | Creating new universes |
| **💾 Custom** | User-defined | Your personal workflow |

### Tips & tricks

### Efficient Workflows

**Quick Generate**: `Ctrl+G` → Adjust settings → Click "Generate Universe" → `Escape`

**Find & Edit**: `Ctrl+O` → Search object → Click Edit → `Ctrl+E` for quick editor

**Monitor Performance**: Keep Stats window open (small, top-right corner)

**Multi-Window Editing**: Open Hierarchy + Editor side-by-side, select in tree to edit

### Docking Tips
- Drag window to **left edge** for sidebar-style panel
- Drag window to **right edge** for inspector-style panel  
- Drag window to **top edge** for toolbar-style panel
- Drag away from edge to undock

### Search Power
- Use Overview window's search for instant filtering
- Filter by type (Stars, Planets, Groups) for focused results
- Sort by distance to find nearest/farthest objects

### Performance
- Close unused windows with `Ctrl+W`
- Minimize heavy windows (Generator) when not needed
- Keep only essential windows visible for best FPS

### Accessibility

### Screen Reader Support
- All buttons have ARIA labels
- Window titles announced on focus
- Interactive elements have role attributes

### Keyboard-Only Navigation
- Everything accessible without mouse
- Tab through interactive elements
- Visual focus indicators on all controls

### Visual
- High contrast mode compatible
- Large click targets (32×32px minimum)
- Color-blind friendly (not relying only on color)

**Pro Tip**: Press `Ctrl+1` through `Ctrl+9` to instantly access your most-used windows!

## Troubleshooting / FAQ

- **Shortcuts don’t work**: click the canvas/window once to ensure the app has focus, then try again.
- **Browser hotkeys conflict**: some key combos may be intercepted by the browser/OS; prefer the window/taskbar buttons in that case.

## Reference

- Windowed UI design rationale: `docs/UI_REDESIGN_WINDOWED.md`

