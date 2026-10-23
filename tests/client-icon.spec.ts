// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { decorateAutoPermissionIcons, installAutoPermissionIcon } from '../src/client/icon-injection.ts'
import { en, zh, type AutoModeLocaleKey } from '../src/client/locales.ts'

const translate = (
  dict: Record<AutoModeLocaleKey, string>,
): (key: AutoModeLocaleKey) => string => key => dict[key]

const permissionMenu = () => `
  <div role="menu">
    <button role="menuitem"><span>Read Only</span></button>
    <button role="menuitem"><span>Workspace Write</span></button>
    <button role="menuitem"><span>Sandbox Auto</span></button>
    <button role="menuitem"><span>Full access</span></button>
  </div>
`

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('lang')
})

describe('Sandbox Auto permission icon decorator', () => {
  it('leaves the host Auto review and legacy Auto rows untouched beside our custom preset', () => {
    document.body.innerHTML = `
      ${permissionMenu()}
      <button id="host-trigger" aria-label="Access mode, current: Auto review EXP"><span>Auto review</span><sup>EXP</sup></button>
      <div><div>Permission</div><button id="host-settings" aria-haspopup="menu">Auto</button></div>
    `
    const menu = document.querySelector('[role="menu"]')!
    menu.insertAdjacentHTML('beforeend', `
      <div><button id="host-review" role="menuitem"><span><span aria-label="Auto review EXP"><span>Auto review</span><sup>EXP</sup></span></span></button></div>
      <button id="host-legacy" role="menuitem">Auto</button>
    `)
    const hostReview = document.querySelector<HTMLButtonElement>('#host-review')!
    const hostLegacy = document.querySelector<HTMLButtonElement>('#host-legacy')!
    let hostSelections = 0
    hostReview.addEventListener('click', () => { hostSelections += 1 })
    hostLegacy.addEventListener('click', () => { hostSelections += 1 })
    const dispose = installAutoPermissionIcon(document, translate(zh))
    try {
      expect(document.querySelector('[data-dsh-auto-mode-icon="menu"]')?.textContent).toBe('沙箱自动审批')
      expect(document.querySelectorAll('[data-dsh-auto-mode-icon]')).toHaveLength(1)
      expect(hostReview.textContent).toBe('Auto reviewEXP')
      expect(hostLegacy.textContent).toBe('Auto')
      expect(document.querySelector('#host-trigger')?.getAttribute('aria-label')).toBe('Access mode, current: Auto review EXP')
      expect(document.querySelector('#host-settings')?.textContent).toBe('Auto')
      hostReview.click()
      hostLegacy.click()
      expect(hostSelections).toBe(2)
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).toBeNull()
      document.querySelector<HTMLButtonElement>('[data-dsh-auto-mode-icon="menu"]')!.click()
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).not.toBeNull()
    } finally { dispose() }
  })

  it('does not intercept click, Enter or Tab for official Auto review in the permission popup', () => {
    document.body.innerHTML = `
      <div aria-label="/permission options">
        <input aria-label="Filter options">
        <div role="listbox" aria-label="/permission matches">
          <div id="host-option" role="option" aria-selected="true"><span><span>Auto review</span><sup>EXP</sup></span><span>Run without a sandbox</span></div>
          <div id="plugin-option" role="option"><span>Sandbox Auto</span><span>${en['preset.description']}</span></div>
        </div>
      </div>
    `
    const host = document.querySelector<HTMLElement>('#host-option')!
    const input = document.querySelector<HTMLInputElement>('input')!
    let hostClicks = 0
    let hostEnters = 0
    host.addEventListener('click', () => { hostClicks += 1 })
    input.addEventListener('keydown', () => { hostEnters += 1 })
    const dispose = installAutoPermissionIcon(document, translate(zh))
    try {
      host.click()
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      expect(hostClicks).toBe(1)
      expect(hostEnters).toBe(2)
      expect(host.textContent).toBe('Auto reviewEXPRun without a sandbox')
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).toBeNull()
      expect(document.querySelector('#plugin-option')?.textContent).toContain('沙箱自动审批')
      document.querySelector<HTMLElement>('#plugin-option')!.click()
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).not.toBeNull()
    } finally { dispose() }
  })

  it('recognizes the RC.1 Chinese workspace label and requires acknowledgement', () => {
    document.body.innerHTML = `<div role="menu">
      <button role="menuitem">仅可查看</button>
      <button role="menuitem">工作区内修改</button>
      <button role="menuitem">Sandbox Auto</button>
      <button role="menuitem">完全权限</button>
    </div>`
    const auto = document.querySelectorAll<HTMLButtonElement>('button')[2]!
    let selections = 0
    auto.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document, translate(zh))
    try {
      expect(auto.textContent).toBe('沙箱自动审批')
      expect(auto.dataset.dshAutoModeIcon).toBe('menu')
      auto.click()
      expect(selections).toBe(0)
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).not.toBeNull()
    } finally { dispose() }
  })
  it('marks only Sandbox Auto inside a complete permission menu and the active access trigger', () => {
    document.body.innerHTML = `
      ${permissionMenu()}
      <div role="menu"><button role="menuitem">Sandbox Auto</button></div>
      <button aria-label="访问模式，当前：Sandbox Auto"><span>Sandbox Auto</span><span>⌄</span></button>
    `

    decorateAutoPermissionIcons(document)

    const autoRows = document.querySelectorAll('[data-dsh-auto-mode-icon="menu"]')
    expect(autoRows).toHaveLength(1)
    expect(autoRows[0]?.textContent?.trim()).toBe('Sandbox Auto')
    expect(document.querySelector('[data-dsh-auto-mode-icon="trigger"]')?.getAttribute('aria-label')).toContain('Sandbox Auto')
  })

  it('observes menus added later and removes every owned mark and style on disposal', async () => {
    const dispose = installAutoPermissionIcon(document)
    document.body.innerHTML = permissionMenu()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(document.querySelector('[data-dsh-auto-mode-icon="menu"]')).not.toBeNull()
    const style = document.querySelector('style[data-plugin="@nanmicoder/dsh-auto-mode"]')
    expect(style?.textContent).toContain('mask-image')

    dispose()
    expect(document.querySelector('[data-dsh-auto-mode-icon]')).toBeNull()
    expect(document.querySelector('style[data-plugin="@nanmicoder/dsh-auto-mode"]')).toBeNull()
  })

  it('removes a stale trigger mark after the active mode changes', () => {
    document.body.innerHTML = '<button aria-label="Access mode, current: Sandbox Auto"><span>Sandbox Auto</span></button>'
    const trigger = document.querySelector('button')
    decorateAutoPermissionIcons(document)
    expect(trigger?.getAttribute('data-dsh-auto-mode-icon')).toBe('trigger')

    trigger?.setAttribute('aria-label', 'Access mode, current: Full access')
    if (trigger !== null) trigger.textContent = 'Full access'
    decorateAutoPermissionIcons(document)
    expect(trigger?.hasAttribute('data-dsh-auto-mode-icon')).toBe(false)
  })

  it('requires acknowledgement before replaying the official Sandbox Auto selection', () => {
    document.body.innerHTML = permissionMenu()
    const auto = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'))
      .find(item => item.textContent?.trim() === 'Sandbox Auto')
    expect(auto).toBeDefined()
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document)

    auto?.click()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const checkbox = dialog?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const confirm = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find(button => button.textContent === 'Enable Sandbox Auto')
    expect(dialog?.getAttribute('aria-label')).toBe('Enable Sandbox Auto?')
    expect(selections).toBe(0)
    expect(confirm?.disabled).toBe(true)

    checkbox?.click()
    expect(confirm?.disabled).toBe(false)
    confirm?.click()
    expect(selections).toBe(1)
    expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).toBeNull()

    dispose()
  })

  it('cancels without selecting and localizes the warning in Chinese', () => {
    document.documentElement.lang = 'zh-CN'
    document.body.innerHTML = `
      <div role="menu">
        <button role="menuitem">仅可查看</button>
        <button role="menuitem">可写入工作区</button>
        <button role="menuitem">Sandbox Auto</button>
        <button role="menuitem">完全权限</button>
      </div>
    `
    const auto = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'))
      .find(item => item.textContent?.trim() === 'Sandbox Auto')
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document, translate(zh))

    expect(auto?.textContent).toBe('沙箱自动审批')
    auto?.click()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog?.getAttribute('aria-label')).toBe('确认启用沙箱自动审批？')
    expect(dialog?.textContent).toContain('可写入工作区')
    expect(dialog?.textContent).toContain('Windows 上仅提供部分约束')
    const cancel = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find(button => button.textContent === '取消')
    cancel?.click()
    expect(selections).toBe(0)
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    dispose()
  })

  it('follows the official locale across every Sandbox Auto permission surface', async () => {
    let dict: Record<AutoModeLocaleKey, string> = en
    const t = (key: AutoModeLocaleKey): string => dict[key]
    let notifyLocaleChange = (): void => {}
    document.documentElement.lang = 'en'
    document.body.innerHTML = `
      ${permissionMenu()}
      <button aria-label="Access mode, current: Sandbox Auto"><span>Sandbox Auto</span></button>
      <div>
        <div><div>Permission</div><div>Choose the default permission mode for new sessions</div></div>
        <button aria-haspopup="menu"><span>Sandbox Auto</span><svg></svg></button>
      </div>
      <div aria-label="/permission options">
        <div role="listbox" aria-label="/permission matches">
          <div role="option"><span>Sandbox Auto</span><span>${en['preset.description']}</span></div>
        </div>
      </div>
    `
    const dispose = installAutoPermissionIcon(document, t, (listener) => {
      notifyLocaleChange = listener
      return () => { notifyLocaleChange = () => {} }
    })
    const menuAuto = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'))
      .find(item => item.textContent?.trim() === 'Sandbox Auto')
    menuAuto?.click()
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Enable Sandbox Auto?')

    dict = zh
    notifyLocaleChange()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(menuAuto?.textContent?.trim()).toBe('沙箱自动审批')
    expect(document.querySelector('button[aria-label^="Access mode"]')?.getAttribute('aria-label'))
      .toBe('Access mode, current: 沙箱自动审批')
    expect(document.querySelector('button[aria-haspopup="menu"]')?.textContent?.trim()).toBe('沙箱自动审批')
    expect(document.querySelector('[role="option"]')?.textContent)
      .toContain(zh['preset.description'])
    expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label'))
      .toBe('确认启用沙箱自动审批？')
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('启用沙箱自动审批')

    dispose()
    expect(menuAuto?.textContent?.trim()).toBe('Sandbox Auto')
    expect(document.querySelector('[role="option"]')?.textContent).toContain(en['preset.description'])
  })

  it('does not gate an unrelated menu that happens to contain Sandbox Auto', () => {
    document.body.innerHTML = '<div role="menu"><button role="menuitem">Sandbox Auto</button></div>'
    const auto = document.querySelector<HTMLButtonElement>('button')
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document)

    auto?.click()
    expect(selections).toBe(1)
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    dispose()
  })

  it('gates Sandbox Auto selected from the bare /permission popup', () => {
    document.body.innerHTML = `
      <div aria-label="/permission options">
        <div role="listbox" aria-label="/permission matches">
          <div role="option"><span>Sandbox Auto</span><span>automatic policy</span></div>
        </div>
      </div>
    `
    const auto = document.querySelector<HTMLElement>('[role="option"]')
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document)

    auto?.click()
    expect(selections).toBe(0)
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const checkbox = dialog?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const confirm = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find(button => button.textContent === 'Enable Sandbox Auto')
    checkbox?.click()
    confirm?.click()
    expect(selections).toBe(1)
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    dispose()
  })

  it.each(['Enter', 'Tab'])('gates %s on the active Sandbox Auto row in the /permission popup', (key) => {
    document.body.innerHTML = `
      <div aria-label="/permission options">
        <input aria-label="Filter options">
        <div role="listbox" aria-label="/permission matches">
          <div role="option" aria-selected="true"><span>Sandbox Auto</span><span>automatic policy</span></div>
        </div>
      </div>
    `
    const input = document.querySelector<HTMLInputElement>('input')
    const auto = document.querySelector<HTMLElement>('[role="option"]')
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document)

    input?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    expect(selections).toBe(0)
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const checkbox = dialog?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const confirm = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find(button => button.textContent === 'Enable Sandbox Auto')
    checkbox?.click()
    confirm?.click()
    expect(selections).toBe(1)

    dispose()
  })

  it('preserves Shift+Tab dismissal when our slash option is highlighted', () => {
    document.body.innerHTML = `
      <div aria-label="/permission options">
        <input aria-label="Filter options">
        <div role="listbox" aria-label="/permission matches">
          <div role="option" aria-selected="true"><span><span>Sandbox Auto</span></span></div>
        </div>
      </div>
    `
    let dismissals = 0
    const overlay = document.querySelector('[aria-label="/permission options"]')!
    overlay.addEventListener('keydown', () => { dismissals += 1 })
    const dispose = installAutoPermissionIcon(document)
    try {
      document.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
      expect(dismissals).toBe(1)
      expect(document.querySelector('[data-dsh-auto-mode-risk-dialog]')).toBeNull()
    } finally { dispose() }
  })

  it('removes an open warning and click gate on disposal', () => {
    document.body.innerHTML = permissionMenu()
    const auto = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'))
      .find(item => item.textContent?.trim() === 'Sandbox Auto')
    let selections = 0
    auto?.addEventListener('click', () => { selections += 1 })
    const dispose = installAutoPermissionIcon(document)

    auto?.click()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    dispose()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    auto?.click()
    expect(selections).toBe(1)
  })
})
