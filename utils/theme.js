export const THEME_STORAGE_KEY = 'tw_theme'
export const THEME_EVENT = 'tw-theme'

export const THEME_BOOTSTRAP = `(function(){try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light'){document.documentElement.classList.add('theme-light');document.documentElement.style.colorScheme='light'}else{document.documentElement.style.colorScheme='dark'}}catch(e){}})();`

export function readTheme() {
  if (typeof document === 'undefined') return 'dark'
  if (document.documentElement.classList.contains('theme-light')) return 'light'
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const light = theme === 'light'
  document.documentElement.classList.toggle('theme-light', light)
  document.documentElement.style.colorScheme = light ? 'light' : 'dark'
  try {
    localStorage.setItem(THEME_STORAGE_KEY, light ? 'light' : 'dark')
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(THEME_EVENT))
}

export function toggleTheme() {
  applyTheme(readTheme() === 'light' ? 'dark' : 'light')
}
