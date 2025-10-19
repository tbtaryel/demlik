import Highcharts from 'highcharts';
import { useEffect, useRef } from 'react';

export default function XUChart({ data = [], height = 180, color = '#7b1e21', stepMs = 10000 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const seriesData = Array.isArray(data) ? data.map((v) => Number(v) || 0) : [];
    const pointStart = Date.now() - Math.max(0, seriesData.length - 1) * stepMs;
    const fill = Highcharts.color(color).setOpacity(0.15).get('rgba');
    const options = {
      chart: {
        type: 'area',
        height,
        spacing: [10, 10, 10, 10],
        backgroundColor: 'transparent',
        zooming: { type: 'x' },
        resetZoomButton: {
          position: { align: 'right', verticalAlign: 'top', x: 0, y: 0 },
        },
      },
      lang: { resetZoom: 'Uzaklaştır' },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        enabled: true,
        useHTML: false,
        formatter: function () {
          const d = new Date(this.x);
          const dt = d.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          const val = (this.y ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
          return `<b>${dt}</b><br/>Son: ${val}`;
        },
      },
      xAxis: {
        type: 'datetime',
        labels: { enabled: true },
        tickLength: 0,
        gridLineWidth: 1,
        gridLineColor: '#e5e5e5',
        tickInterval: 60 * 60 * 1000, // 1 saat
      },
      yAxis: {
        title: { text: null },
        labels: { enabled: true },
        gridLineWidth: 1,
        gridLineColor: '#e5e5e5',
        tickAmount: 7,
      },
      plotOptions: {
        series: { animation: false },
        area: {
          marker: { enabled: false },
          lineWidth: 3,
          color,
          fillColor: fill,
          fillOpacity: 0.15,
        },
      },
      series: [
        {
          name: 'XU100',
          data: seriesData,
          pointStart,
          pointInterval: stepMs,
          threshold: null,
        },
      ],
    };
    chartRef.current = Highcharts.chart(containerRef.current, options);
    return () => {
      try { chartRef.current && chartRef.current.destroy(); } catch (_) {}
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const seriesData = Array.isArray(data) ? data.map((v) => Number(v) || 0) : [];
      const pointStart = Date.now() - Math.max(0, seriesData.length - 1) * stepMs;
      const s = chart.series && chart.series[0];
      if (s) {
        s.update({ data: seriesData, pointStart, pointInterval: stepMs }, false);
        chart.redraw();
      }
    }
  }, [data, stepMs]);

  return <div ref={containerRef} style={{ height }} />;
}