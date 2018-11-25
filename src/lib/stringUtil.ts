import snakeCase = require('lodash.snakecase');
import camelCase = require('lodash.camelcase');

export function capitalizeFirstLetter(s: string) {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.substr(1);
}

export function capitalizeColumnName(name: string): string {
  if (name === 'id') {
    return 'ID';
  }
  return capitalizeFirstLetter(name);
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

export function stripEndingSnakeID(s: string): string {
  return trimRight(s, '_id');
}

export function toSnakeCase(s: string): string {
  return snakeCase(s);
}

export function toCamelCase(s: string): string {
  const res = camelCase(s);
  if (res.endsWith('Id')) {
    return res.substr(0, res.length - 'Id'.length) + 'ID';
  }
  return res;
}
