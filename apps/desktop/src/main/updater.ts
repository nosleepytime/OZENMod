/**
 * Auto-updates via electron-updater (GitHub Releases provider, free).
 *
 * Windows (NSIS): background download + install on restart.
 * macOS: auto-install requires paid code signing, which the free tier does not
 * assume — there we only notify and let the user open the download page
 * (docs/ARCHITECTURE.md §8). Wired fully in milestone M7; kept behind the
 * packaged check so `dev` never tries to reach a release feed.
 */
import { app } from 'electron';

export async function initUpdater(): Promise<void> {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = await import('electron-updater');
    autoUpdater.autoDownload = process.platform === 'win32';
    autoUpdater.on('error', (err) => console.error('[updater]', err));
    await autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.error('[updater] initialization failed', err);
  }
}
