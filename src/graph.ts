import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

const width = 900;
const height = 450;

const chartCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: "#0f172a", // dark Discord-friendly background
});

export async function generatePointsGraph(
  data: RankEntry[],
  stats: Stats
): Promise<Buffer> {
  // Sort data by timestamp to ensure correct order
  const { id, rank, league, points, leagueName } = stats;
  const title = `Ranked History - ${id} | Rank: ${rank} | League: ${leagueName} | Points: ${points} RS`;
  const sorted = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const labels = sorted.map((entry) =>
    new Date(entry.timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
  );

  const graphPoints = sorted.map((entry) => entry.points);

  const config: ChartConfiguration<"line"> = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Rank Progression",
          data: graphPoints,

          tension: 0.25,
          borderWidth: 1.5,
          pointRadius: 0.5,
          pointHoverRadius: 3,

          segment: {
            borderColor: (ctx) => {
              const y0 = ctx.p0.parsed.y;
              const y1 = ctx.p1.parsed.y;

              // Guard against null values
              if (y0 == null || y1 == null) {
                return "#94a3b8"; // neutral color
              }

              return y1 > y0
                ? "#22c55e" // green (upward)
                : y1 < y0
                ? "#ef4444" // red (downward)
                : "#94a3b8"; // neutral (flat)
            },
          },
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
          },
        },
        title: {
          display: true,
          text: title,
          color: "#f8fafc",
          font: {
            size: 18,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#cbd5f5" },
          grid: { color: "rgba(148,163,184,0.2)" },
        },
        y: {
          ticks: { color: "#cbd5f5" },
          grid: { color: "rgba(148,163,184,0.2)" },
          title: {
            display: true,
            text: "Points",
            color: "#e5e7eb",
          },
        },
      },
    },
  };

  return await chartCanvas.renderToBuffer(config);
}
