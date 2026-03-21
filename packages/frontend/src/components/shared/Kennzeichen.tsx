interface KennzeichenProps {
  plate: string;
  className?: string;
}

export default function Kennzeichen({ plate, className = '' }: KennzeichenProps) {
  const width = 260;
  const height = 56;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: width / 2, height: height / 2 }}
    >
      {/* Outer border */}
      <rect
        x="1"
        y="1"
        width={width - 2}
        height={height - 2}
        rx="4"
        ry="4"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="2"
      />

      {/* Blue EU strip */}
      <rect x="2" y="2" width="32" height={height - 4} rx="3" ry="3" fill="#003399" />

      {/* EU stars circle */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const cx = 18 + 8 * Math.cos(angle);
        const cy = 16 + 8 * Math.sin(angle);
        return (
          <text
            key={i}
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFCC00"
            fontSize="5"
          >
            ★
          </text>
        );
      })}

      {/* Country code D */}
      <text
        x="18"
        y="44"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fontWeight="bold"
      >
        D
      </text>

      {/* License plate text */}
      <text
        x={(width + 32) / 2}
        y={height / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#000000"
        fontFamily="'Courier New', Courier, monospace"
        fontSize="26"
        fontWeight="bold"
        letterSpacing="2"
      >
        {plate}
      </text>
    </svg>
  );
}
