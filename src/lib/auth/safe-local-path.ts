export function safeLocalPath(path: string | null | undefined, fallback: string = '/'): string {
  if (!path) return fallback
  
  // Ensure the path starts with exactly one slash, preventing open redirects
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path
  }
  
  return fallback
}
