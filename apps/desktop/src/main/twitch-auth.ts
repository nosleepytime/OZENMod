/**
 * Onboarding device-code auth. When a Twitch client id is configured this starts
 * the real device flow (docs/ARCHITECTURE.md §5.1) and polls in the background;
 * on authorization the tokens are encrypted into the vault. Without a client id
 * it returns an honest error — there is no demo path (see SETUP.md).
 */
import { startDeviceFlow, pollDeviceToken } from '@ozenmod/twitch';
import type { DeviceCodeState } from '../ipc-contract';
import { saveTokens } from './token-vault';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function beginTwitchAuth(
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void,
): Promise<DeviceCodeState> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    onLog(
      'error',
      'No Twitch client id in this build. Install an official release, or build with TWITCH_CLIENT_ID set (see SETUP.md).',
    );
    return {
      userCode: '',
      verificationUri: 'https://dev.twitch.tv/console/apps',
      expiresInSeconds: 0,
      status: 'error',
    };
  }

  const flow = await startDeviceFlow({ clientId });

  // Poll in the background until authorized, expired, or errored.
  void (async () => {
    const deadline = Date.now() + flow.expiresIn * 1000;
    while (Date.now() < deadline) {
      await sleep(Math.max(1, flow.interval) * 1000);
      const outcome = await pollDeviceToken({ clientId, deviceCode: flow.deviceCode });
      if (outcome.status === 'authorized') {
        saveTokens(outcome.tokens);
        onLog('info', 'Twitch connected — tokens stored securely. Restart the bot to go live.');
        return;
      }
      if (outcome.status === 'expired') {
        onLog('warn', 'Twitch device code expired — please try connecting again.');
        return;
      }
      if (outcome.status === 'error') {
        onLog('error', `Twitch authorization failed: ${outcome.detail}`);
        return;
      }
    }
  })();

  return {
    userCode: flow.userCode,
    verificationUri: flow.verificationUri,
    expiresInSeconds: flow.expiresIn,
    status: 'waiting',
  };
}
