import { useEffect, useState } from 'react';
import type { LogEntry, LogLevel } from '../../ipc-contract';
import { getApi } from '../mock-api';
import { Icons } from '../icons';
import { formatTime } from '../components/bits';

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: 'lvl-info',
  action: 'lvl-action',
  ai: 'lvl-ai',
  warn: 'lvl-warn',
  error: 'lvl-error',
};

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const api = getApi();
    void api.getLogs().then(setLogs);
    const off = api.onLog((entry) => setLogs((l) => [...l, entry].slice(-500)));
    return off;
  }, []);

  return (
    <div className="view">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <b style={{ fontSize: 16, marginRight: 8 }}>Logs</b>
        <span className="chip chip-accent">All</span>
        <span className="chip">Info</span>
        <span className="chip">Actions</span>
        <span className="chip">AI</span>
        <span className="chip">Warnings</span>
        <span className="chip">Errors</span>
        <span className="grow" />
        <button className="btn btn-outline btn-sm">
          <Icons.download className="ic ic-sm" /> Export
        </button>
        <button className="btn btn-outline btn-sm">
          <Icons.trash className="ic ic-sm" /> Clear
        </button>
      </div>

      <div className="card card-pad" style={{ flex: 1, overflow: 'auto' }}>
        <div className="console">
          {logs.map((entry, i) => (
            <div className="console-line" key={i}>
              <span className="console-time">{formatTime(entry.at)}</span>
              <span className={`lvl ${LEVEL_CLASS[entry.level]}`}>{entry.level.toUpperCase()}</span>
              <span style={{ color: 'var(--text-2)' }}>{entry.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
          fontSize: 12,
          color: 'var(--text-3)',
        }}
      >
        <span>Session log · {logs.length} entries</span>
        <span className="grow" />
        <span>Tokens and keys are redacted automatically</span>
      </div>
    </div>
  );
}
