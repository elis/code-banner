export const getNonce = () => {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export function escapeRegex(string) {
  // eslint-disable-next-line no-useless-escape
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}
