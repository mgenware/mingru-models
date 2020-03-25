const Prefix = 'SQL.';

export class DataTypes {
  char = Prefix + 'CHAR';
  varChar = Prefix + 'VARCHAR';
  binary = Prefix + 'BINARY';
  varBinary = Prefix + 'VARBINARY';

  int = Prefix + 'INT';
  bigInt = Prefix + 'BIGINT';
  smallInt = Prefix + 'SMALLINT';
  tinyInt = Prefix + 'TINYINT';
  bool = Prefix + 'BOOL';

  text = Prefix + 'TEXT';
  float = Prefix + 'FLOAT';
  double = Prefix + 'DOUBLE';

  datetime = Prefix + 'DATETIME';
  date = Prefix + 'DATE';
  time = Prefix + 'TIME';

  decimal = 'DECIMAL';

  private integerSet = new Set<string>([
    this.int,
    this.bigInt,
    this.smallInt,
    this.tinyInt,
  ]);

  private numberSet = new Set<string>([
    ...this.integerSet,
    ...[this.double, this.float, this.decimal],
  ]);

  private timeRelatedSet = new Set<string>([
    this.date,
    this.datetime,
    this.time,
  ]);

  isInteger(s: string) {
    return this.integerSet.has(s);
  }

  isNumber(s: string) {
    return this.numberSet.has(s);
  }

  isTimeRelated(s: string) {
    return this.timeRelatedSet.has(s);
  }
}

export default new DataTypes();
