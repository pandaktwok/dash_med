"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import {
  performanceChartData,
} from "@/mock-data/dashboard";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";

type ChartType = "bar" | "line";

const barColors = [
  "var(--muted-foreground)",
  "var(--muted-foreground)",
  "var(--foreground)",
  "var(--muted-foreground)",
  "var(--muted-foreground)",
  "var(--muted-foreground)",
];

const chartConfig = {
  atual: { label: "Esta semana" },
  anterior: { label: "Semana passada" },
};

type DataPoint = (typeof performanceChartData)[number];

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const diff = point.atual - point.anterior;
  return (
    <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl min-w-36">
      <div className="font-medium mb-1">{point.day}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Esta semana</span>
        <span className="font-mono font-medium tabular-nums">{point.atual}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Semana passada</span>
        <span className="font-mono tabular-nums text-muted-foreground">{point.anterior}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border mt-1 pt-1">
        <span className="text-muted-foreground">Diferença</span>
        <span
          className={
            diff >= 0
              ? "font-mono font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
              : "font-mono font-medium tabular-nums text-rose-600 dark:text-rose-400"
          }
        >
          {diff >= 0 ? "+" : ""}
          {diff}
        </span>
      </div>
    </div>
  );
}

export function PerformanceChart() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [showGrid, setShowGrid] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);

  const resetToDefault = () => {
    setChartType("bar");
    setShowGrid(true);
    setSmoothCurve(true);
  };

  const data = performanceChartData;
  const totalAtual = data.reduce((acc, d) => acc + d.atual, 0);
  const totalAnterior = data.reduce((acc, d) => acc + d.anterior, 0);
  const change =
    totalAnterior === 0
      ? 0
      : Math.round(((totalAtual - totalAnterior) / totalAnterior) * 100);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-medium text-base">Atendimentos</h3>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tipo de Gráfico</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType("bar")}>
                  Gráfico de Barras {chartType === "bar" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("line")}>
                  Gráfico de Linhas {chartType === "line" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={(value) => setShowGrid(!!value)}
            >
              Mostrar Grade
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={smoothCurve}
              onCheckedChange={(value) => setSmoothCurve(!!value)}
              disabled={chartType === "bar"}
            >
              Curva Suave
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToDefault}>
              Restaurar Padrão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-semibold tabular-nums">{totalAtual}</span>
          <span className="text-sm text-muted-foreground">
            atendimentos esta semana
          </span>
          <span
            className={
              change >= 0
                ? "text-sm text-emerald-600 dark:text-emerald-400"
                : "text-sm text-rose-600 dark:text-rose-400"
            }
          >
            {change >= 0 ? "+" : ""}
            {change}% vs semana passada
          </span>
        </div>
        <ChartContainer config={chartConfig} className="h-[175px] w-full">
          {chartType === "bar" ? (
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
              )}
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis hide />
              <ChartTooltip content={<ComparisonTooltip />} />
              <Bar dataKey="atual" radius={[4, 4, 0, 0]} strokeWidth={0}>
                {data.map((entry, index) => (
                  <Cell key={entry.day} fill={barColors[index]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
              )}
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis hide />
              <ChartTooltip content={<ComparisonTooltip />} />
              <Line
                type={smoothCurve ? "monotone" : "linear"}
                dataKey="atual"
                stroke="var(--foreground)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "var(--foreground)",
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
