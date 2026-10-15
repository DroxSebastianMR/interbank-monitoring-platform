const SENSITIVE_PATTERNS: RegExp[] = [
  /\bbearer\s+[A-Za-z0-9._-]+/gi,
  /\bpostgres(?:ql)?:\/\/[^\s"']+/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\bsk-[A-Za-z0-9_-]{10,}\b/g,
  /\b(?:password|secret|api[_ -]?key)\s*[:=]\s*[^\s,;]+/gi,
];

export function redactAssistantContent(value: string): string {
  return SENSITIVE_PATTERNS.reduce(
    (content, pattern) => content.replace(pattern, '[REDACTED]'),
    value,
  );
}
