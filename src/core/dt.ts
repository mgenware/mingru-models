/* eslint-disable prefer-template */
const Prefix = 'SQL.';

export class DataTypes {
  readonly char = Prefix + 'CHAR';
  readonly varChar = Prefix + 'VARCHAR';
  readonly binary = Prefix + 'BINARY';
  readonly varBinary = Prefix + 'VARBINARY';

  readonly int = Prefix + 'INT';
  readonly bigInt = Prefix + 'BIGINT';
  readonly smallInt = Prefix + 'SMALLINT';
  readonly tinyInt = Prefix + 'TINYINT';
  readonly bool = Prefix + 'BOOL';

  readonly text = Prefix + 'TEXT';
  readonly float = Prefix + 'FLOAT';
  readonly double = Prefix + 'DOUBLE';

  readonly datetime = Prefix + 'DATETIME';
  readonly date = Prefix + 'DATE';
  readonly time = Prefix + 'TIME';
  readonly timestamp = Prefix + 'TIMESTAMP';

  readonly decimal = 'DECIMAL';

  private integerSet = new Set<string>([this.int, this.bigInt, this.smallInt, this.tinyInt]);

  private numberSet = new Set<string>([
    ...this.integerSet,
    ...[this.double, this.float, this.decimal],
  ]);

  private timeRelatedSet = new Set<string>([this.date, this.datetime, this.time, this.timestamp]);

  isInteger(s: string): boolean {
    return this.integerSet.has(s);
  }

  isNumber(s: string): boolean {
    return this.numberSet.has(s);
  }

  isTimeRelated(s: string): boolean {
    return this.timeRelatedSet.has(s);
  }
}

export default new DataTypes();
