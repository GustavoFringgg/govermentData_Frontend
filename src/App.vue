<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Tender } from './types/tender'
import { fetchTenders } from './services/api'
import PieChart from './components/PieChart.vue'
import BarChart from './components/BarChart.vue'

const tenders = ref<Tender[]>([])
const loading = ref(false)
const error = ref('')
const hasFetched = ref(false)

// --- Loading timer ---
const ESTIMATED_SECONDS = 50
const elapsedSeconds = ref(0)
let timerId: ReturnType<typeof setInterval> | null = null

function startTimer() {
  elapsedSeconds.value = 0
  timerId = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

onUnmounted(() => stopTimer())

const progressPercent = computed(() =>
  Math.min(Math.round((elapsedSeconds.value / ESTIMATED_SECONDS) * 100), 99),
)

const formattedElapsed = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
})

// --- Sorting ---
type SortKey = 'tender_mode' | 'procurement_nature' | 'budget'
const sortKey = ref<SortKey | ''>('')
const sortAsc = ref(true)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

function sortIcon(key: SortKey): string {
  if (sortKey.value !== key) return '⇅'
  return sortAsc.value ? '↑' : '↓'
}

const sortedTenders = computed(() => {
  if (!sortKey.value) return tenders.value
  const key = sortKey.value
  const dir = sortAsc.value ? 1 : -1
  return [...tenders.value].sort((a, b) => {
    if (key === 'budget') {
      return (Number(a.budget) - Number(b.budget)) * dir
    }
    return a[key].localeCompare(b[key], 'zh-Hant') * dir
  })
})

// --- Pagination ---
const pageSize = ref(20)
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedTenders.value.length / pageSize.value)),
)

const pagedTenders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedTenders.value.slice(start, start + pageSize.value)
})

function goToPage(page: number) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

// Reset to page 1 when sorting changes
function handleSort(key: SortKey) {
  toggleSort(key)
  currentPage.value = 1
}

// --- Crawl ---
async function handleCrawl() {
  loading.value = true
  error.value = ''
  startTimer()
  try {
    tenders.value = await fetchTenders()
    hasFetched.value = true
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = '取得資料失敗，請稍後再試'
    }
  } finally {
    stopTimer()
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-800">
    <!-- Header -->
    <header class="bg-blue-600 text-white py-6 shadow-md">
      <h1 class="text-3xl font-bold text-center">LiyaoData</h1>
      <p class="text-center text-blue-100 mt-1">政府標案資料儀表板</p>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Crawl Button -->
      <div class="flex justify-center mb-8">
        <button
          data-testid="crawl-button"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="handleCrawl"
        >
          {{ loading ? '爬取中...' : '開始爬取標案資料' }}
        </button>
      </div>

      <!-- Loading with progress bar -->
      <div v-if="loading" class="max-w-lg mx-auto py-12" data-testid="loading">
        <div class="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-5">
          <p class="text-gray-700 text-lg font-medium">正在爬取資料，請稍候...</p>

          <!-- Progress bar -->
          <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              class="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              :style="{ width: progressPercent + '%' }"
              data-testid="progress-bar"
            ></div>
          </div>

          <div class="flex justify-between w-full text-sm text-gray-500">
            <span>已耗時 {{ formattedElapsed }}</span>
            <span>預估進度 {{ progressPercent }}%</span>
          </div>

          <p class="text-xs text-gray-400">預估約需 {{ ESTIMATED_SECONDS }} 秒，實際時間依網路狀況而定</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 mb-8 text-center" data-testid="error">
        {{ error }}
      </div>

      <!-- Charts -->
      <div v-if="hasFetched && !loading && tenders.length > 0" data-testid="charts" class="space-y-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-white rounded-xl shadow p-6">
            <PieChart :tenders="tenders" />
          </div>
          <div class="bg-white rounded-xl shadow p-6">
            <BarChart :tenders="tenders" />
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
          <div class="flex items-center justify-between p-6 pb-2">
            <h2 class="text-lg font-semibold">標案列表 (共 {{ tenders.length }} 筆)</h2>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <label for="pageSize">每頁</label>
              <select
                id="pageSize"
                v-model.number="pageSize"
                class="border border-gray-300 rounded px-2 py-1"
                @change="currentPage = 1"
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span>筆</span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left table-fixed min-w-[960px]">
              <thead class="bg-gray-100 text-gray-600">
                <tr>
                  <th class="px-4 py-3 w-[18%]">機關名稱</th>
                  <th class="px-4 py-3 w-[28%]">標案名稱</th>
                  <th
                    class="px-4 py-3 w-[12%] cursor-pointer select-none hover:text-blue-600"
                    @click="handleSort('tender_mode')"
                  >
                    招標方式 <span class="text-xs">{{ sortIcon('tender_mode') }}</span>
                  </th>
                  <th
                    class="px-4 py-3 w-[10%] cursor-pointer select-none hover:text-blue-600"
                    @click="handleSort('procurement_nature')"
                  >
                    採購性質 <span class="text-xs">{{ sortIcon('procurement_nature') }}</span>
                  </th>
                  <th class="px-4 py-3 w-[10%]">公告日期</th>
                  <th class="px-4 py-3 w-[10%]">截止日期</th>
                  <th
                    class="px-4 py-3 w-[12%] text-right cursor-pointer select-none hover:text-blue-600"
                    @click="handleSort('budget')"
                  >
                    預算金額 <span class="text-xs">{{ sortIcon('budget') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in pagedTenders" :key="t.id" class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 break-words">{{ t.agency_name }}</td>
                  <td class="px-4 py-3 truncate" :title="t.tender_name">{{ t.tender_name }}</td>
                  <td class="px-4 py-3">{{ t.tender_mode }}</td>
                  <td class="px-4 py-3">{{ t.procurement_nature }}</td>
                  <td class="px-4 py-3">{{ t.announcement_date }}</td>
                  <td class="px-4 py-3">{{ t.deadline }}</td>
                  <td class="px-4 py-3 text-right font-mono">{{ Number(t.budget).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-6 py-4 border-t text-sm text-gray-500">
            <span>
              第 {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, sortedTenders.length) }} 筆，共 {{ sortedTenders.length }} 筆
            </span>
            <div class="flex items-center gap-1">
              <button
                class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="currentPage <= 1"
                @click="goToPage(1)"
              >
                «
              </button>
              <button
                class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                ‹
              </button>
              <span class="px-3 py-1">{{ currentPage }} / {{ totalPages }}</span>
              <button
                class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                ›
              </button>
              <button
                class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="currentPage >= totalPages"
                @click="goToPage(totalPages)"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="hasFetched && !loading && tenders.length === 0 && !error" class="text-center text-gray-400 py-16">
        查無標案資料
      </div>
    </main>
  </div>
</template>
