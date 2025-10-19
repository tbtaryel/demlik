export default function Sparkline({ data = [], width = 320, height = 120, stroke = '#2563eb', fill = 'rgba(37,99,235,0.08)' }) {
  if (!data || !data.length) {
    return <div className="w-full h-[120px] bg-gray-50 rounded" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });
  const pathD = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
      <path d={areaD} fill={fill} />
      <path d={pathD} stroke={stroke} strokeWidth="2" fill="none" />
    </svg>
  );
}