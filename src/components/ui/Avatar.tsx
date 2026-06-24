interface Props {
  src?:      string | null;
  name:      string;
  size?:     number;
  className?: string;
  /** Optional background color for fallback */
  color?:    string;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function nameToColor(name: string) {
  const COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#10B981',
    '#F97316', '#3B82F6', '#EF4444', '#F59E0B',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ src, name, size = 40, className = '', color }: Props) {
  const bg = color ?? nameToColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar avatar-img ${className}`}
        style={{ width: size, height: size, borderRadius: '50%' }}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback to initial on broken image
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-fallback ${className}`}
      style={{
        width:  size,
        height: size,
        fontSize: size * 0.38,
        background: bg,
      }}
      aria-label={name}
    >
      {getInitial(name)}
    </div>
  );
}
