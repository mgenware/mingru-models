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
}

export default new DataTypes();
