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
    await expect(page.getByText('已更新', { exact: true })).toBeVisible()
    console.log('E2E checkpoint: kanban-interview')

    await page.waitForTimeout(800)
    const movedCard = interviewLane.locator('article').filter({ hasText: 'E2E Labs' })
    await movedCard.click()

    const finalDrawer = page.locator('aside').filter({ hasText: 'Agent Engineer' })
    const finalStatus = finalDrawer.getByLabel('状态')
    await expect(finalStatus).toHaveValue('面试中')
    await finalStatus.selectOption('Offer阶段')
    await expect(finalStatus).toHaveValue('Offer阶段')
    await expect(page.getByText('已更新', { exact: true })).toBeVisible()
    console.log('E2E checkpoint: offer-complete')

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


test('投递选项自定义、校招/实习筛选与删除岗位', async () => {
  const userDataDirectory = mkdtempSync(join(tmpdir(), 'jobflow-options-e2e-'))
  const electronApp = await launchJobFlow(userDataDirectory)

  try {
    const page = await electronApp.firstWindow()
    await page.getByRole('link', { name: '投递 Applications' }).click()

    await page.getByRole('button', { name: '选项设置' }).click()
    const optionsDialog = page.getByRole('dialog', { name: '投递选项设置' })

    await optionsDialog.getByLabel('新增岗位方向').fill('Agent Infra')
    await optionsDialog.getByRole('button', { name: '添加方向' }).click()
    await expect(
      optionsDialog.getByRole('button', { name: '删除 Agent Infra' })
    ).toBeVisible()

    await optionsDialog.getByLabel('新增投递渠道').fill('校园官网')
    await optionsDialog.getByRole('button', { name: '添加渠道' }).click()
    await expect(
      optionsDialog.getByRole('button', { name: '删除 校园官网' })
    ).toBeVisible()
    await optionsDialog.getByRole('button', { name: '完成' }).click()

    await page.getByRole('button', { name: '+ 新增岗位' }).first().click()
    await page.getByLabel('公司 *').fill('Options Labs')
    await page.getByLabel('岗位 *').fill('Intern Agent Engineer')
    await page.getByLabel('岗位方向').selectOption('Agent Infra')
    await page.getByLabel('招聘类型').selectOption('实习')
    await page.getByRole('button', { name: '更多信息 ↓' }).click()
    await page.getByLabel('投递渠道').selectOption('校园官网')
    await page.getByRole('button', { name: '保存岗位' }).click()

    const drawer = page.locator('aside').filter({ hasText: 'Intern Agent Engineer' })
    await expect(drawer.getByLabel('招聘类型')).toHaveValue('实习')
    await expect(drawer.getByLabel('岗位方向')).toHaveValue('Agent Infra')
    await expect(drawer.getByLabel('投递渠道')).toHaveValue('校园官网')
    await drawer.getByRole('button', { name: '关闭岗位详情' }).click()

    const typeFilter = page.locator('select').filter({ has: page.locator('option[value="实习"]') }).first()
    await typeFilter.selectOption('实习')
    const row = page.getByRole('row').filter({ hasText: 'Options Labs' })
    await expect(row).toBeVisible()
    await expect(row.getByText('实习', { exact: true })).toBeVisible()

    await row.click()
    const deleteDrawer = page.locator('aside').filter({ hasText: 'Intern Agent Engineer' })
    await deleteDrawer.getByRole('button', { name: '删除岗位' }).click()
    await deleteDrawer.getByRole('button', { name: '确认删除' }).click()
    await expect(page.getByText('岗位已删除', { exact: true })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'Options Labs' })).toHaveCount(0)
  } finally {
    await electronApp.close().catch(() => undefined)
    rmSync(userDataDirectory, { recursive: true, force: true })
  }
})
