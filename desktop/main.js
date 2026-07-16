// DeadlineIQ Desktop — thin native shell around the deployed web app.
//
// The product's auth (Supabase), billing (Stripe), and data all live
// server-side, so the desktop app loads the production site directly.
// Point it elsewhere (staging, local dev) with DEADLINEIQ_URL.

const { app, BrowserWindow, shell } = require('electron')

const APP_URL = process.env.DEADLINEIQ_URL || 'https://deadlineiq.com'

// In-window navigation is allowed only for the app itself and the
// billing/auth flows it legitimately redirects through. Everything
// else (e.g. "View official source" links) opens in the system browser.
const IN_APP_HOSTS = [
  new URL(APP_URL).host,
  'checkout.stripe.com',
  'billing.stripe.com',
]

function isInAppUrl(url) {
  try {
    const { protocol, host } = new URL(url)
    return (
      protocol === 'https:' &&
      IN_APP_HOSTS.some((h) => host === h || host.endsWith('.' + h))
    )
  } catch {
    return false
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    title: 'DeadlineIQ',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.loadURL(APP_URL)

  // target="_blank" links (official sources, etc.) → system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Same-window navigation outside the allow-list → system browser
  win.webContents.on('will-navigate', (event, url) => {
    if (!isInAppUrl(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
