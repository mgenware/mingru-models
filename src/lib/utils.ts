import snakeCase = require('lodash.snakecase');
import camelCase = require('lodash.camelcase');

export default class Utils {
  static capitalizeFirstLetter(s: string) {
    if (!s) {
      return s;
    }
    return s.charAt(0).toUpperCase() + s.substr(1);
  }

  static capitalizeColumnName(name: string): string {
    return Utils.makeTrailingIDAllCaps(Utils.capitalizeFirstLetter(name));
  }

  static trimRight(s: string, find: string): string {
    if (!find) {
      return s;
    }
    if (s.endsWith(find)) {
      return s.substr(0, s.length - find.length);
    }
    return s;
  }

  static stripTrailingSnakeID(s: string): string {
    return Utils.trimRight(s, '_id');
  }

  static makeTrailingIDAllCaps(s: string): string {
    if (s.endsWith('Id')) {
      return s.substr(0, s.length - 'Id'.length) + 'ID';
    }
    return s;
  }

  static toSnakeCase(s: string): string {
    return snakeCase(s);
  }

  static toCamelCase(s: string): string {
    return Utils.makeTrailingIDAllCaps(camelCase(s));
  }
}
