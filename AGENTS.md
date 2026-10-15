# Pskov Fencing

- Work in this existing Vanilla TypeScript / Vite multipage project. Preserve the eleven routes, JSON content, contacts, SEO and GitHub Pages base `/fencingpskov/`.
- Work without subagents, as requested by the project owner.
- For animation work, read `.agents/skills/motion/SKILL.md`, then its `best-practices/motion.md`. Use the free `motion` package's vanilla APIs; the community `motion-dev-animations` skill is a supplementary reference, not a reason to add React.
- Use real, licensed épée photography/video with documented attribution and required consents. Do not invent federation events, results or portraits. `docs/SOURCES.md` records approved media.
- The project is exclusively 2D. Do not add Blender, GLB, Three.js, model viewers or placeholders. The equipment section is a real photograph.
- Respect reduced motion, touch input, keyboard use and resource cleanup. Check native scroll timelines and Motion's fallback when changing scroll animation code.
- Run `npm run build` and `npm test`. Test widths 320, 375, 390, 430, 768, 1024 and 1440; inspect mobile crops in a browser. Run Lighthouse separately from other browser workloads.
- `PROGRESS.md` records the latest verified state. Publication requires a successful Pages workflow and checking the published version. The site still needs federation management approval.
