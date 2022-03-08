import snakeCase from 'decamelize';
import toTypeString from 'to-type-string';

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

function formatDescValue(v: unknown) {
  if (v === true) {
    return '1';
  }
  if (v === false) {
    return '0';
  }
  return `${v}`;
}

export function desc(obj: unknown, content: unknown, props?: Record<string, unknown>) {
  const type = toTypeString(obj);
  let propsStr = '';
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v !== undefined && v !== '') {
        propsStr += `, ${k}=${formatDescValue(v)}`;
      }
    }
  }
  const contentStr = content === '' ? '-' : `${content}`;
  return `${type}(${contentStr}${propsStr})`;
}
