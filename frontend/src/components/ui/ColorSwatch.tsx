export function ColorSwatch({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((color) => (
        <div key={color} className="flex items-center gap-1.5 group cursor-default">
          <div
            className="h-8 w-8 rounded-full border border-white/10 shadow"
            style={{ backgroundColor: color }}
            title={color}
          />
          <span className="text-xs text-brand-muted font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {color}
          </span>
        </div>
      ))}
    </div>
  );
}
