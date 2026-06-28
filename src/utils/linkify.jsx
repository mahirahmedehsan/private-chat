const URL_REGEX = /(https?:\/\/[^\s<]+|[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s<]*)?)/gi

export function linkify(text) {
  if (!text) return text
  const parts = []
  let lastIndex = 0
  let match

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    let url = match[0]
    const hasProtocol = url.startsWith('http://') || url.startsWith('https://')
    const href = hasProtocol ? url : `https://${url}`
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-light hover:underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    )
    lastIndex = match.index + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
