<script setup lang="ts">
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import type { Tender } from "../types/tender";

ChartJS.register(ArcElement, Tooltip, Legend);

const emit = defineEmits<{ "filter-change": [hiddenLabels: string[]] }>();

const props = defineProps<{
  tenders: Tender[];
  lastUpdated?: string;
}>();

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

const formattedLastUpdated = computed(() => {
  if (!props.lastUpdated) return "";
  const d = new Date(new Date(props.lastUpdated.replace(" ", "T")).getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}時${pad(d.getMinutes())}分`;
});

const chartData = computed<ChartData<"pie">>(() => {
  const countMap = new Map<string, number>();
  for (const t of props.tenders) {
    countMap.set(t.tender_mode, (countMap.get(t.tender_mode) ?? 0) + 1);
  }
  const labels = [...countMap.keys()];
  const data = [...countMap.values()];

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: COLORS.slice(0, labels.length),
      },
    ],
  };
});

const chartOptions: ChartOptions<"pie"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom",
      onClick(_e, legendItem, legend) {
        // 取出實例
        const chart = legend.chart;
        // 1. 切換顯示/隱藏
        chart.toggleDataVisibility(legendItem.index!);
        chart.update();
        // 2. 讀取哪些 index 目前是隱藏狀態
        const hiddenLabels = chart.data.labels?.filter(
          (_, i) => !chart.getDataVisibility(i),
        ) as string[];
        // 3. emit
        emit("filter-change", hiddenLabels);
      },
    },
  },
};
</script>

<template>
  <span v-if="lastUpdated" class="text-xs text-gray-400"
    >上次更新：{{ formattedLastUpdated }}</span
  >
  <div class="w-full max-w-md mx-auto relative">
    <h2 class="text-lg font-semibold text-center mb-4">招標方式比例</h2>
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>
