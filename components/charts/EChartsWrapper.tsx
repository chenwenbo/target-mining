"use client";
import ReactECharts from "echarts-for-react";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: Record<string, any>;
  height?: number | string;
  className?: string;
}

export default function EChartsWrapper({ option, height = 260, className }: Props) {
  return (
    <ReactECharts
      option={option}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      className={className}
      notMerge
      lazyUpdate
    />
  );
}
