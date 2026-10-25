# Diagnostic Windows build: mouse input
Branch: debug/windows-input-diagnostics (based on fix/windows-mouse-forwarding).
No main merge or Electron upgrade. Probe is passive and logs locally only.

1. Close any earlier Desktop Pet process.
2. Run DesktopPet-0.1.12-INPUT-DIAGNOSTIC.exe (Portable, no installation).
3. Select Growlithe, click once, click repeatedly, drag and try right-click when the fault occurs.
4. Keep the cursor over the pet for at least 3 seconds once input stops.
5. Exit the app. Look for DesktopPet-input-diagnostic-YYYY-MM-DDT*.log on Desktop.
   Fallback folders: Documents, then Electron userData.
6. Share the LOG in chat if comfortable.

Log fields: timestamps, window-relative cursor, monitor scale, native ignored flag,
input receiver events, drag state, Chromium trusted flag and browser pointer coordinates.
No keyboard, entered text, screen contents, other app names or automatic uploads.
Bounded to 2 MiB per run. Real input on the affected PC is NOT verified by Windows CI.
Interpretation: overPet=true and ignored=false with no renderer-pointerdown after
a real mouse click suggests a native event delivery issue; renderer-pointerdown
without corresponding pointerup/drag-end suggests a pointer flow issue.
