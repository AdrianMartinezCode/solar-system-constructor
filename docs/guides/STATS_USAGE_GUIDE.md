# Stats Panel - Usage Guide

## Audience

- People using the Stats window to understand **performance**, **population**, **orbits**, and **special features** in the current universe.

## Prerequisites

- The app is running with the windowed UI available.
- To see the **Generation** tab, you must have generated a universe via the Generator panel at least once.

## Quick start

1. **Open the Stats window**: Click on "Stats" in the window menu or toolbar
2. **Select a context**: Choose between Global, Isolated (if group isolated), or Selected (if body selected)
3. **Navigate tabs**: Click on Overview, Performance, Population, Orbits, Specials, or Generation
4. **Export data**: Use the 📋 Copy, 📄 JSON, or 📊 CSV buttons at the bottom

## How-to

### Tab guide

### Overview Tab
Your at-a-glance dashboard showing:
- Current FPS and frame time
- Total object counts
- Star and planet counts
- Simulation time and speed
- Particle system totals (if present)

**Best for**: Quick health check of simulation performance and content

### Performance Tab
Deep dive into rendering and simulation performance:
- Real-time FPS and frame time
- 60-second sparkline charts for FPS and frame time history
- Performance statistics (averages, percentiles)
- WebGL renderer stats (draw calls, triangles, textures, etc.)

**Best for**: 
- Diagnosing performance issues
- Monitoring FPS stability
- Understanding rendering workload
- Identifying performance bottlenecks

**Tips**:
- Watch the P95 and P99 frame times to catch occasional stutters
- High triangle counts may indicate too much geometry
- Many draw calls suggest batching opportunities

### Population Tab
Comprehensive breakdown of all objects in your universe:
- Visual donut charts for body type distribution
- Detailed counts for every object type
- Particle totals from disks and belts
- Group hierarchy metrics

**Best for**:
- Understanding universe composition
- Comparing relative populations
- Verifying generation results
- Planning universe additions

**Tips**:
- Use context selector to focus on specific systems
- Donut charts show percentages for quick comparisons
- Check particle totals to understand rendering load

### Orbits Tab
Analyze orbital characteristics and distributions:
- Semi-major axis distribution (orbital distances)
- Eccentricity distribution (orbit shapes)
- Inclination distribution (orbit tilts)
- Mass distribution (log scale)
- Scatter plot: distance vs eccentricity

**Best for**:
- Understanding orbital dynamics
- Finding outliers (very eccentric or distant orbits)
- Verifying generator settings worked as expected
- Academic/educational analysis

**Tips**:
- Collapse sections you don't need to improve performance
- Scatter plot is downsampled to 200 points for large systems
- Hover over scatter points to see individual body names

### Specials Tab
Detailed stats for special features:
- **Black Holes**: spin stats, mass classes, accretion disks, jets, photon rings
- **Protoplanetary Disks**: counts and particle distributions
- **Small Body Belts**: main belt and Kuiper belt statistics
- **Rogue Planets**: trajectory types, speeds, curvature
- **Comets, Rings, Nebulae, Lagrange Points, Trojans**: counts and details

**Best for**:
- Analyzing exotic objects
- Verifying special feature generation
- Understanding black hole properties
- Tracking rogue planet trajectories

**Tips**:
- Black hole spin ranges from 0 (non-rotating) to ~1 (extremal Kerr)
- Particle counts show rendering budget for each feature
- Rogue planet stats help understand trajectory diversity

### Generation Tab
Metadata from the last universe generation:
- Generation timestamp and seed
- Generator configuration summary
- Comprehensive generation totals
- Feature breakdown from generator

**Best for**:
- Reproducing interesting universes (using seed)
- Verifying generator settings
- Comparing intended vs actual results
- Documentation and sharing

**Tips**:
- Only available after generating via the Generator panel
- Copy the seed to recreate the exact same universe
- Use this to fine-tune generator settings

### Context selector

### Global
Shows stats for **all objects** in the entire universe.
- Use when you want universe-wide metrics
- Default context on open

### Isolated
Shows stats for **only the isolated group** and its contents.
- Only appears when a group is isolated
- Great for comparing groups
- Filters all tabs to show only isolated group data

### Selected
Shows stats for **the selected body's entire system**.
- Only appears when a body is selected
- Includes the root star and all its children
- Useful for system-specific analysis

### Export features

### 📋 Copy
- Copies JSON to clipboard
- Includes current performance, population, and simulation state
- Quick way to share stats in chat or documents

### 📄 JSON
- Downloads comprehensive JSON file
- Includes all computed stats and metadata
- Filename includes timestamp
- Best for programmatic analysis or archiving

### 📊 CSV
- Downloads CSV file for spreadsheet import
- Flattened key-value format
- Easy to open in Excel, Google Sheets, etc.
- Best for quick data analysis and charts

### Performance tips

### Keep It Responsive
1. **Collapse unused sections**: Heavy charts (histograms, scatter plots) can be collapsed
2. **Close when not needed**: Stats window doesn't render when closed/minimized
3. **Use appropriate context**: Filtering to a smaller set improves computation speed
4. **Large universes**: Charts automatically downsample (scatter plots limited to 200 points)

### Understanding Performance Metrics

**Good FPS Range**: 50-60 FPS (smooth)
**Caution Range**: 30-49 FPS (playable but not ideal)
**Warning Range**: < 30 FPS (laggy, needs optimization)

**Frame Time**: Inverse of FPS
- 16.7ms = 60 FPS
- 33.3ms = 30 FPS
- Lower is better

**P95/P99 Frame Time**: Percentile metrics
- P95 = 95% of frames are faster than this
- P99 = 99% of frames are faster than this
- High values indicate occasional stutters

### Keyboard shortcuts

None yet, but planned for future:
- `Ctrl+C`: Copy stats (when Stats window focused)
- `Ctrl+E`: Export JSON
- `1-6`: Switch tabs

## Troubleshooting / FAQ

### Common use cases

### "My simulation is slow, what's wrong?"
1. Open Performance tab
2. Check current FPS
3. Look at WebGL stats: high triangle count? Many draw calls?
4. Check Population tab: too many objects?
5. Check Specials tab: excessive particle counts?

### "Did the generator work as I expected?"
1. Open Generation tab
2. Compare totals to your config
3. Switch to Population tab for detailed breakdown
4. Check Orbits tab for distribution shapes
5. Verify special features in Specials tab

### "How do these two systems compare?"
1. Select first system → use Selected context → note stats
2. Select second system → compare stats
3. Or isolate each group in turn with Isolated context

### "I want to share my universe stats"
1. Switch to Global context (or desired scope)
2. Click 📄 JSON to download complete stats
3. Or 📋 Copy to share quick summary
4. Include Generation tab seed if you want others to recreate it

### Troubleshooting

### "Generation tab shows 'No Generation Data'"
- You need to generate a universe using the Generator panel
- Loading or manually created systems won't have generation metadata
- Generate any universe to populate this tab

### "Charts look empty or weird"
- Check if you have data in that category (e.g., no comets = empty distribution)
- Try Global context instead of Isolated/Selected
- Some distributions only show for orbiting bodies (rogues excluded)

### "Performance stats seem stuck"
- WebGL stats update every 500ms, not every frame
- FPS updates once per second
- This is intentional to reduce overhead

### "Context selector buttons missing"
- Isolated button only appears when a group is isolated
- Selected button only appears when a body is selected
- Both are dynamic based on app state

## Reference

### Advanced usage

### Analyzing Black Hole Populations
1. Open Specials tab
2. Check mass class distribution (stellar/intermediate/supermassive)
3. Review avg/min/max spin
4. Note percentage with disks/jets
5. Compare to generator config

### Understanding Orbital Resonances
1. Open Orbits tab
2. Expand semi-major axis histogram
3. Look for clusters (potential resonances)
4. Check scatter plot for patterns
5. Correlate with eccentricity distribution

### Performance Profiling
1. Note baseline FPS in Performance tab
2. Add objects or change settings
3. Monitor FPS sparkline in real-time
4. Check WebGL stats for what changed
5. Adjust based on bottleneck

### Exporting for Publications
1. Generate universe with known seed
2. Document seed in Generation tab
3. Export JSON with all stats
4. Take screenshots of relevant charts
5. Include context and tab in image captions

### What's new in this version

**Before**: Minimal stats panel with FPS, basic counts, and timeScale

**After**: Comprehensive analytics dashboard with:
- ✨ 6 specialized tabs
- 📊 Multiple chart types (sparklines, histograms, donuts, scatter plots)
- 🎯 Context filtering (global/isolated/selected)
- 📈 Performance monitoring (FPS history, WebGL stats, percentiles)
- 🔬 Deep analytics (black holes, rogues, distributions, group metrics)
- 💾 Export functionality (copy/JSON/CSV)
- ⚡ Optimized for large universes (downsampling, collapsible sections, lazy rendering)

### Future features (planned)

### Related docs

- Stats refactor summary: `docs/STATS_REFACTOR_SUMMARY.md`
- UI implementation summary (windowing): `docs/UI_IMPLEMENTATION_SUMMARY.md`

- Persistent performance history across sessions
- Real-time alerts (FPS drops, errors)
- Comparison mode (compare two universes or generations)
- More chart types (line charts, heat maps)
- Advanced filtering (mass range, distance range, etc.)
- Chart image export
- Keyboard shortcuts
- Customizable dashboard (rearrange, hide tabs)

---

For technical implementation details, see `STATS_REFACTOR_SUMMARY.md`.

