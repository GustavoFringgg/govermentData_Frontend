import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'
import type { Tender } from '../types/tender'

const mockTenders: Tender[] = [
  {
    id: 1,
    agency_name: '臺灣菸酒股份有限公司善化啤酒廠',
    tender_name: '善化啤酒廠冷凍室甘水輸送泵',
    tender_mode: '公開招標',
    procurement_nature: '財物類',
    announcement_date: '115/02/23',
    deadline: '115/02/25',
    budget: '2995020',
  },
  {
    id: 2,
    agency_name: '國立臺灣大學醫學院附設醫院',
    tender_name: '新竹醫院115年家具更新案',
    tender_mode: '限制性招標',
    procurement_nature: '工程類',
    announcement_date: '115/02/23',
    deadline: '115/03/02',
    budget: '9116383',
  },
  {
    id: 3,
    agency_name: '測試機關C',
    tender_name: '測試標案C',
    tender_mode: '公開招標',
    procurement_nature: '勞務類',
    announcement_date: '115/02/24',
    deadline: '115/03/05',
    budget: '500000',
  },
]

vi.mock('../services/api', () => ({
  fetchTenders: vi.fn(),
}))

// Stub chart components to avoid canvas issues in test environment
vi.mock('../components/PieChart.vue', () => ({
  default: { template: '<div data-testid="pie-chart">PieChart</div>', props: ['tenders'] },
}))
vi.mock('../components/BarChart.vue', () => ({
  default: { template: '<div data-testid="bar-chart">BarChart</div>', props: ['tenders'] },
}))

import { fetchTenders } from '../services/api'

describe('App.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('renders the title', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('LiyaoData')
  })

  it('renders the crawl button', () => {
    const wrapper = mount(App)
    const btn = wrapper.find('[data-testid="crawl-button"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('開始爬取標案資料')
  })

  it('does not show charts before clicking', () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="charts"]').exists()).toBe(false)
  })

  it('shows loading with progress bar when button is clicked', async () => {
    vi.mocked(fetchTenders).mockImplementation(
      () => new Promise(() => {}),
    )
    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="progress-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="crawl-button"]').text()).toBe('爬取中...')
  })

  it('progress bar advances with elapsed time', async () => {
    vi.mocked(fetchTenders).mockImplementation(
      () => new Promise(() => {}),
    )
    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Advance 10 seconds
    vi.advanceTimersByTime(10000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('10秒')
    expect(wrapper.text()).toContain('20%') // 10/50 = 20%
  })

  it('displays charts and table after successful fetch', async () => {
    vi.mocked(fetchTenders).mockResolvedValue(mockTenders)

    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="charts"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pie-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bar-chart"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('共 3 筆')
    expect(wrapper.text()).toContain('臺灣菸酒股份有限公司善化啤酒廠')
  })

  it('displays error message on fetch failure', async () => {
    vi.mocked(fetchTenders).mockRejectedValue(new Error('Network Error'))

    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error"]').text()).toContain('Network Error')
  })

  it('disables button during loading', async () => {
    vi.mocked(fetchTenders).mockImplementation(
      () => new Promise(() => {}),
    )
    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('[data-testid="crawl-button"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('sorts by budget when clicking the header', async () => {
    vi.mocked(fetchTenders).mockResolvedValue(mockTenders)

    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await flushPromises()

    // Find budget header (last th) and click it
    const headers = wrapper.findAll('th')
    const budgetHeader = headers[headers.length - 1]!
    await budgetHeader.trigger('click')

    // After ascending sort, first row budget should be 500,000 (smallest)
    const firstRowCells = wrapper.findAll('tbody tr:first-child td')
    const budgetCell = firstRowCells[firstRowCells.length - 1]!
    expect(budgetCell.text()).toBe('500,000')

    // Click again for descending
    await budgetHeader.trigger('click')
    const firstRowCellsDesc = wrapper.findAll('tbody tr:first-child td')
    const budgetCellDesc = firstRowCellsDesc[firstRowCellsDesc.length - 1]!
    expect(budgetCellDesc.text()).toBe('9,116,383')
  })

  it('sorts by tender_mode when clicking the header', async () => {
    vi.mocked(fetchTenders).mockResolvedValue(mockTenders)

    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await flushPromises()

    // tender_mode header is the 3rd th (index 2)
    const headers = wrapper.findAll('th')
    await headers[2]!.trigger('click')

    // Ascending: 公開招標 comes before 限制性招標 in zh-Hant
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0]!.text()).toContain('公開招標')
  })

  it('shows pagination controls', async () => {
    vi.mocked(fetchTenders).mockResolvedValue(mockTenders)

    const wrapper = mount(App)
    await wrapper.find('[data-testid="crawl-button"]').trigger('click')
    await flushPromises()

    // Should show pagination info
    expect(wrapper.text()).toContain('1 / 1')
    expect(wrapper.text()).toContain('第 1')
  })
})
