const Prefix = 'SQL.';

export class DataTypes {
  char = Prefix + 'CHAR';
  varChar = Prefix + 'VARCHAR';

  int = Prefix + 'INT';
  bigInt = Prefix + 'BIGINT';
  smallInt = Prefix + 'SMALLINT';
  tinyInt = Prefix + 'TINYINT';

  text = Prefix + 'TEXT';
}

export default new DataTypes();
