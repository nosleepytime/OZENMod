'use client';

/** Small interactive controls that persist changes via their onChange callback. */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`toggle${checked ? ' on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <span className="seg">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={`seg-item${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 999,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </span>
  );
}
