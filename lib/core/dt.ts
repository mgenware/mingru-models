const Prefix = 'SQL.';

export class DataTypes {
  Char = Prefix + 'CHAR';
  VarChar = Prefix + 'VARCHAR';

  Int = Prefix + 'INT';
  BigInt = Prefix + 'BIGINT';
  SmallInt = Prefix + 'SMALLINT';
  TinyInt = Prefix + 'TINYINT';

  Text = Prefix + 'TEXT';
}

export default new DataTypes();
