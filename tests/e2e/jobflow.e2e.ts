import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, expect, test } from '@playwright/test'

test('新增岗位 → 投递 → 面试复盘 → Offer 主链路', async () => {
  const userDataDirectory = mkdtempSync(join(tmpdir(), 'jobflow-e2e-'))
  const electronApp = await electron.launch({
    args: ['--no-sandbox', '.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      JOBFLOW_USER_DATA_DIR: userDataDirectory
    }
  })

  try {
    const page = await electronApp.firstWindow()
    console.log('E2E checkpoint: window-ready')
    await expect(page).toHaveTitle('JobFlow')
    await expect(page.getByText('JobFlow', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: '投递 Applications' }).click()
    await page.getByRole('button', { name: '+ 新增岗位' }).first().click()

    await page.getByLabel('公司 *').fill('E2E Labs')
    await page.getByLabel('岗位 *').fill('Agent Engineer')
    await page.getByRole('button', { name: '保存岗位' }).click()
    console.log('E2E checkpoint: application-created')

    const applicationDrawer = page.locator('aside').filter({ hasText: 'Agent Engineer' })
    await expect(applicationDrawer.getByText('E2E Labs', { exact: true })).toBeVisible()
    await applicationDrawer.getByLabel('状态').selectOption('已投递')
    await expect(page.getByText('已更新', { exact: true })).toBeVisible()
    await applicationDrawer.getByLabel('当前节点').fill('简历筛选')
    await applicationDrawer.getByLabel('当前节点').press('Tab')
    await applicationDrawer.getByRole('button', { name: '关闭岗位详情' }).click()
    console.log('E2E checkpoint: application-progressed')

    await page.getByRole('link', { name: '面试 Interviews' }).click()
    await page.getByRole('button', { name: '+ 添加面试' }).click()
    await page.getByLabel('岗位').selectOption({ label: 'E2E Labs · Agent Engineer' })
    await page.getByLabel('轮次').selectOption('一面')
    await page.getByRole('button', { name: '添加面试', exact: true }).click()
    console.log('E2E checkpoint: interview-created')

    const interviewRow = page.getByRole('button', { name: /E2E Labs · Agent Engineer/ })
    await expect(interviewRow).toBeVisible()
    await interviewRow.click()

    const interviewDrawer = page.locator('aside').filter({ hasText: 'E2E Labs · 一面' })
    await interviewDrawer.getByLabel('结果').selectOption('通过')
    await interviewDrawer.getByLabel('主要问题').fill('RAG 评测与 Agent Memory')
    await interviewDrawer.getByLabel('自评').selectOption('4')
    await interviewDrawer.getByLabel('没答好的 / 后续改进').fill('补强长任务评测')
    await interviewDrawer.getByRole('button', { name: '保存复盘' }).click()
    await expect(interviewDrawer.getByRole('button', { name: '保存复盘' })).toBeEnabled()
    await interviewDrawer.getByRole('button', { name: '关闭' }).click()
    console.log('E2E checkpoint: interview-reviewed')

    await page.getByRole('link', { name: /投递/ }).click()
    await page.getByLabel('E2E Labs 状态').selectOption('Offer阶段')
    await expect(page.getByLabel('E2E Labs 状态')).toHaveValue('Offer阶段')
    await expect(page.getByText('已更新', { exact: true })).toBeVisible()
    console.log('E2E checkpoint: offer-complete')
  } finally {
    console.log('E2E checkpoint: closing-electron')
    await electronApp.close()
    console.log('E2E checkpoint: electron-closed')
    rmSync(userDataDirectory, { recursive: true, force: true })
  }
})
