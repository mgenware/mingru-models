import snakeCase from 'decamelize';

export function trimRight(s: string, find: string): string {
  if (!find) {
    return s;
  }
  if (s.endsWith(find)) {
    return s.substr(0, s.length - find.length);
  }
  return s;
}

export function stripTrailingSnakeID(s: string): string {
  return trimRight(s, '_id');
}

export function toSnakeCase(s: string): string {
  return snakeCase(s);
}
