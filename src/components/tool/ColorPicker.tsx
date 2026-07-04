interface Props {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}

export default function ColorPicker({ value, onChange, presets }: Props) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md font-mono"
      />
      {presets && (
        <div className="flex items-center gap-1">
          {presets.map((c) => (
            <button
              key={c}
              aria-label={`color ${c}`}
              onClick={() => onChange(c)}
              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}