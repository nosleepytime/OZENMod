/**
 * Electron main process.
 *
 * Security posture (docs/SECURITY.md §5): the renderer is fully sandboxed
 * (contextIsolation on, nodeIntegration off, sandbox on). The only capability
 * surface is the typed IPC allowlist registered in registerIpc(). External
 * navigation is blocked except for an explicit allowlist.
 */
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { registerIpc } from './ipc';
import { BotRuntime } from './bot-runtime';
import { createTray } from './tray';
import { createAppMenu } from './menu';
import { initUpdater } from './updater';
import { createLiveConnector } from './twitch-live';

const NAV_ALLOWLIST = ['https://www.twitch.tv', 'https://twitch.tv', 'https://github.com'];

let mainWindow: BrowserWindow | null = null;
let runtime: BotRuntime | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0A0A0F',
    title: 'OZENMod',
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Block window.open / target=_blank except for the allowlist (open externally).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (NAV_ALLOWLIST.some((prefix) => url.startsWith(prefix))) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Block in-page navigation away from the app bundle.
  win.webContents.on('will-navigate', (event, url) => {
    const isDev = !!process.env.ELECTRON_RENDERER_URL;
    const devOk = isDev && url.startsWith(process.env.ELECTRON_RENDERER_URL!);
    if (!devOk && !url.startsWith('file://')) event.preventDefault();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

app.whenReady().then(() => {
  runtime = new BotRuntime(app.getVersion(), createLiveConnector());
  mainWindow = createWindow();
  registerIpc(runtime, () => mainWindow);
  createAppMenu();
  createTray(() => mainWindow, runtime);
  void initUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS apps usually stay active until Cmd+Q; here the tray keeps the bot
  // running, so we only quit on non-macOS when the window closes.
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  runtime?.dispose();
});
