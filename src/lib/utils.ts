import snakeCase from 'decamelize';
import camelCase from 'camelcase';

export function forceAllCapsTrailingID(s: string): string {
  if (s.endsWith('Id')) {
    // eslint-disable-next-line prefer-template
    return s.substr(0, s.length - 'Id'.length) + 'ID';
  }
  return s;
}

export function capitalizeFirstLetter(s: string): string {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.substr(1);
}

export function capitalizeColumnName(name: string): string {
  return forceAllCapsTrailingID(capitalizeFirstLetter(name));
}

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

export function toCamelCase(s: string): string {
  return forceAllCapsTrailingID(camelCase(s, { preserveConsecutiveUppercase: true }));
}

export function toPascalCase(s: string): string {
  const res = forceAllCapsTrailingID(
    camelCase(s, { preserveConsecutiveUppercase: true, pascalCase: true }),
  );
  if (res === 'Id') {
    return 'ID';
  }
  return res;
}

export function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
