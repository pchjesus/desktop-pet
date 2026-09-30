Desktop Pet v0.1.6 Electron CLI fix

Purpose:
- Avoid the Windows .bin/electron.cmd path that is unexpectedly re-entering Electron's downloader in this environment.
- Use the verified Electron CLI entry point directly via Node for source runs.
- If a manually downloaded Electron binary already exists, prepare-electron.js now creates path.txt automatically when missing.

Apply:
1. Extract this patch into the existing desktop-pet-v0.1.6-source folder and overwrite files.
2. Keep your existing node_modules folder and manually downloaded node_modules\\electron\\dist\\electron.exe.
3. In CMD, run:
   node node_modules\\electron\\cli.js --version
   npm.cmd test
   npm.cmd run check
   npm.cmd start
4. If the app opens, close it and run BUILD-WINDOWS.bat.

This patch does not include node_modules or the Electron binary.
