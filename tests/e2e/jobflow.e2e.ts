import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Locator,
  type Page
} from '@playwright/test'

async function launchJobFlow(userDataDirectory: string): Promise<ElectronApplication> {
  return electron.launch({
    args: ['--no-sandbox', '.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      JOBFLOW_USER_DATA_DIR: userDataDirectory
    }
  })
}

async function dragWithPointer(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Kanban drag target is not visible.')

  const sourceX = sourceBox.x + sourceBox.width / 2
  const sourceY = sourceBox.y + sourceBox.height / 2
  const targetX = targetBox.x + targetBox.width / 2
  const targetY = targetBox.y + Math.min(100, targetBox.height / 3)

  await page.mouse.move(sourceX, sourceY)
  await page.mouse.down()
  await page.mouse.move(sourceX + 12, sourceY + 12, { steps: 4 })
  await page.mouse.move(targetX, targetY, { steps: 12 })
  await page.mouse.up()
}

test('V1 最终验收：新增 → 测评 → 面试复盘 → Kanban → Offer → 持久化', async () => {
  const userDataDirectory = mkdtempSync(join(tmpdir(), 'jobflow-e2e-'))
  let electronApp = await launchJobFlow(userDataDirectory)

  try {
    let page = await electronApp.firstWindow()
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

    await applicationDrawer.getByLabel('优先级').selectOption('S')
    await expect(applicationDrawer.getByLabel('优先级')).toHaveValue('S')

    await applicationDrawer.getByLabel('状态').selectOption('已投递')
    await expect(
      applicationDrawer.getByText('待投递 → 已投递', { exact: true })
    ).toBeVisible()

    await applicationDrawer.getByLabel('当前节点').fill('简历筛选')
    await applicationDrawer.getByLabel('当前节点').press('Tab')

    await applicationDrawer.getByLabel('状态').selectOption('测评/笔试')
    await expect(
      applicationDrawer.getByText('已投递 → 测评/笔试', { exact: true })
    ).toBeVisible()

    await applicationDrawer.getByRole('button', { name: '关闭岗位详情' }).click()
    console.log('E2E checkpoint: application-assessment')

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
    await page.getByRole('button', { name: '看板', exact: true }).click()

    const card = page.locator('article').filter({ hasText: 'E2E Labs' })
    const interviewLane = page.getByLabel('面试 看板列')
    await expect(card).toBeVisible()
    await dragWithPointer(page, card, interviewLane)
    await expect(interviewLane.getByText('E2E Labs', { exact: true })).toBeVisible()
    console.log('E2E checkpoint: kanban-interview')

    await page.getByRole('button', { name: '列表', exact: true }).click()
    const applicationRow = page.getByRole('row').filter({ hasText: 'E2E Labs' })
    await expect(applicationRow).toBeVisible()
    const statusSelect = applicationRow.getByLabel('E2E Labs 状态')
    await expect(statusSelect).toHaveValue('面试中')
    await statusSelect.selectOption('Offer阶段')
    await expect(statusSelect).toHaveValue('Offer阶段')
    console.log('E2E checkpoint: offer-complete')

    await page.getByRole('row').filter({ hasText: 'E2E Labs' }).click()
    const finalDrawer = page.locator('aside').filter({ hasText: 'Agent Engineer' })
    await expect(
      finalDrawer.getByText('测评/笔试 → 面试中', { exact: true })
    ).toBeVisible()
    await expect(
      finalDrawer.getByText('面试中 → Offer阶段', { exact: true })
    ).toBeVisible()
    await finalDrawer.getByRole('button', { name: '关闭岗位详情' }).click()
    console.log('E2E checkpoint: timeline-verified')

    await electronApp.close()
    console.log('E2E checkpoint: first-session-closed')

    electronApp = await launchJobFlow(userDataDirectory)
    page = await electronApp.firstWindow()
    await page.getByRole('link', { name: '投递 Applications' }).click()
    await expect(page.getByLabel('E2E Labs 状态')).toHaveValue('Offer阶段')

    await page.getByRole('link', { name: '面试 Interviews' }).click()
    await expect(
      page.getByRole('button', { name: /E2E Labs · Agent Engineer/ })
    ).toBeVisible()
    console.log('E2E checkpoint: persistence-verified')
  } finally {
    console.log('E2E checkpoint: closing-electron')
    await electronApp.close().catch(() => undefined)
    console.log('E2E checkpoint: electron-closed')
    rmSync(userDataDirectory, { recursive: true, force: true })
  }
})
