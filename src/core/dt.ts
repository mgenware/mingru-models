const Prefix = 'SQL.';

export class DataTypes {
  char = Prefix + 'CHAR';
  varChar = Prefix + 'VARCHAR';

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

  private integerSet = new Set<string>([
    this.int,
    this.bigInt,
    this.smallInt,
    this.tinyInt,
  ]);

  isInteger(s: string) {
    return this.integerSet.has(s);
  }
}

export default new DataTypes();
