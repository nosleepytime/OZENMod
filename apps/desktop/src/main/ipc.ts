/**
 * Registers the typed IPC allowlist — the renderer's only capability surface.
 * Each channel maps one-to-one to a method on OzenmodApi (see ipc-contract.ts);
 * the preload bridge invokes these and nothing else.
 */
import { ipcMain, type BrowserWindow } from 'electron';
import type { CommandIntent } from '@ozenmod/shared';
import type { BotRuntime } from './bot-runtime';
import { beginTwitchAuth } from './twitch-auth';

export function registerIpc(runtime: BotRuntime, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('bot:getStatus', () => runtime.getStatus());
  ipcMain.handle('bot:start', () => runtime.start());
  ipcMain.handle('bot:stop', () => runtime.stop());
  ipcMain.handle('bot:systemInfo', () => runtime.getSystemInfo());
  ipcMain.handle('bot:feed', () => runtime.getFeed());
  ipcMain.handle('bot:review', () => runtime.getReviewQueue());
  ipcMain.handle('bot:logs', () => runtime.getLogs());

  ipcMain.handle('auth:beginTwitch', () =>
    beginTwitchAuth((level, message) =>
      getWindow()?.webContents.send('evt:log', { at: Date.now(), level, message }),
    ),
  );

  ipcMain.handle('assistant:run', (_e, raw: string) => runtime.runCommand(raw));
  ipcMain.handle('assistant:confirm', (_e, intent: CommandIntent) =>
    runtime.confirmCommand(intent),
  );

  // Push events to the renderer.
  const send = (channel: string, payload: unknown) => {
    getWindow()?.webContents.send(channel, payload);
  };
  runtime.on('status', (s) => send('evt:status', s));
  runtime.on('feed', (e) => send('evt:feed', e));
  runtime.on('log', (l) => send('evt:log', l));
}
