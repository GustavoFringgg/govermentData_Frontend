<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { Tender } from '../types/tender'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  tenders: Tender[]
}>()

const chartData = computed<ChartData<'bar'>>(() => {
  const sorted = [...props.tenders]
    .map((t) => ({ name: t.tender_name, budget: Number(t.budget) }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 10)

  return {
    labels: sorted.map((t) =>
      t.name.length > 15 ? t.name.slice(0, 15) + '…' : t.name,
    ),
    datasets: [
      {
        label: '預算金額 (NTD)',
        data: sorted.map((t) => t.budget),
        backgroundColor: '#3B82F6',
      },
    ],
  }
})

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      ticks: {
        callback: (value) => {
          const num = Number(value)
          if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
          if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K'
          return String(value)
        },
      },
    },
  },
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <h2 class="text-lg font-semibold text-center mb-4">標案預算金額 (Top 10)</h2>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
