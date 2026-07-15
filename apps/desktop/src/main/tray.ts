/**
 * System tray. The tray keeps the bot reachable when the window is closed
 * (docs/PRODUCT.md §6.4); its icon/tooltip reflects the bot state.
 */
import { Tray, Menu, nativeImage, type BrowserWindow } from 'electron';
import type { BotRuntime } from './bot-runtime';

let tray: Tray | null = null;

// A 1×1 transparent PNG placeholder; the real templated icon ships with assets in M7.
const EMPTY_ICON =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export function createTray(getWindow: () => BrowserWindow | null, runtime: BotRuntime): Tray {
  const icon = nativeImage.createFromBuffer(Buffer.from(EMPTY_ICON, 'base64'));
  tray = new Tray(icon);
  tray.setToolTip('OZENMod');

  const rebuild = () => {
    const status = runtime.getStatus();
    const menu = Menu.buildFromTemplate([
      { label: `OZENMod — ${labelFor(status.state)}`, enabled: false },
      { type: 'separator' },
      {
        label: 'Show window',
        click: () => {
          const win = getWindow();
          win?.show();
          win?.focus();
        },
      },
      {
        label: status.state === 'protecting' ? 'Stop bot' : 'Start bot',
        click: () => (status.state === 'protecting' ? runtime.stop() : runtime.start()),
      },
      { type: 'separator' },
      { label: 'Quit OZENMod', role: 'quit' },
    ]);
    tray?.setContextMenu(menu);
  };

  rebuild();
  runtime.on('status', rebuild);
  return tray;
}

function labelFor(state: string): string {
  switch (state) {
    case 'protecting':
      return 'Protecting';
    case 'starting':
      return 'Starting…';
    case 'stopping':
      return 'Stopping…';
    case 'error':
      return 'Attention needed';
    default:
      return 'Idle';
  }
}
