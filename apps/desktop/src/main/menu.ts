/**
 * Application menu. Minimal on purpose — the app is driven from its own UI; the
 * menu carries only standard OS conveniences and links out to the project.
 */
import { app, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { GITHUB_URL } from '@ozenmod/shared';

export function createAppMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' as const }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click: () => void shell.openExternal(`${GITHUB_URL}/tree/main/docs`),
        },
        { label: 'Report an issue', click: () => void shell.openExternal(`${GITHUB_URL}/issues`) },
        { label: 'GitHub', click: () => void shell.openExternal(GITHUB_URL) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
