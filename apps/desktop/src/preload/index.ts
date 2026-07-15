/**
 * Preload — the sandboxed bridge. Runs with contextIsolation so it can use a
 * limited set of Electron APIs, and exposes exactly the OzenmodApi surface on
 * window.ozenmod via contextBridge. Nothing else crosses into the renderer.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { CommandIntent, ModerationEvent } from '@ozenmod/shared';
import type { BotStatus, LogEntry, OzenmodApi } from '../ipc-contract';

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_e: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: OzenmodApi = {
  getStatus: () => ipcRenderer.invoke('bot:getStatus'),
  startBot: () => ipcRenderer.invoke('bot:start'),
  stopBot: () => ipcRenderer.invoke('bot:stop'),
  getSystemInfo: () => ipcRenderer.invoke('bot:systemInfo'),
  getFeed: () => ipcRenderer.invoke('bot:feed'),
  getReviewQueue: () => ipcRenderer.invoke('bot:review'),
  getLogs: () => ipcRenderer.invoke('bot:logs'),
  beginTwitchAuth: () => ipcRenderer.invoke('auth:beginTwitch'),
  runCommand: (raw: string) => ipcRenderer.invoke('assistant:run', raw),
  confirmCommand: (intent: CommandIntent) => ipcRenderer.invoke('assistant:confirm', intent),
  onStatus: (cb: (s: BotStatus) => void) => subscribe<BotStatus>('evt:status', cb),
  onFeed: (cb: (e: ModerationEvent) => void) => subscribe<ModerationEvent>('evt:feed', cb),
  onLog: (cb: (l: LogEntry) => void) => subscribe<LogEntry>('evt:log', cb),
};

contextBridge.exposeInMainWorld('ozenmod', api);
