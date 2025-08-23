export function nonNull<T>(value: T, name?: string, message?: string): Exclude<T, null | undefined> {
  if (value === null || value === undefined) {
    if (message) throw new Error(message);
    const valueName = name ? `"${name}" ` : '';
    throw new Error(`Value ${valueName} should not be null.`);
  }
  return value as Exclude<T, null | undefined>;
}
