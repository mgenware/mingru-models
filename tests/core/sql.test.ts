import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('SQL', () => {
  const sql = mm.sql`${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}`;
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
  );
  ok(sql instanceof mm.SQL);
});

it('Flatten another SQL', () => {
  const sql = mm.sql`${mm.sql`${mm.sql`${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}`}`}`;
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
  );
  ok(sql instanceof mm.SQL);
});

it('SQL with input', () => {
  const sql = mm.sql`START${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}END`;
  eq(
    sql.toString(),
    'SQL(E(START, type = 0), E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2), E(END, type = 0))',
  );
});

it('Input', () => {
  const input = mm.input(user.name);
  eq(input.type, user.name);
  eq(input.name, undefined);
  eq(input.column, user.name);
});

it('Named input', () => {
  const input = mm.input(user.name, 'haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
  eq(input.column, user.name);
});

it('Input (foreign key)', () => {
  const col = post.user_id;
  const input = mm.input(col);
  eq((input.type as mm.Column).__getData().foreignColumn, user.id);
  eq(input.name, undefined);
  eq(input.column, col);
});

it('Input (joined key)', () => {
  const col = post.user_id.join(user).name;
  const input = mm.input(col);
  eq((input.type as mm.Column).__getData().mirroredColumn, user.name);
  eq(input.name, undefined);
  eq(input.column, col);
});

it('Raw type input', () => {
  const input = mm.input({ type: 'uint32', defaultValue: 0 }, 'uid');
  deepEq(input.type, { type: 'uint32', defaultValue: 0 });
  eq(input.toString(), 'SQLVar(uid, desc = {"type":"uint32","defaultValue":0})');
});

it('Empty name for raw type input', () => {
  itThrows(
    () => mm.input({ type: 'uint32', defaultValue: 0 }),
    'Unexpected empty input name for type `uint32`',
  );
});

it('Embed another sql', () => {
  const embedded = mm.sql`_${user.id} = ${mm.input(user.id)}`;
  const sql = mm.sql`START${embedded} OR ${user.name} = ${mm.input(user.name)}`;
  eq(
    sql.toString(),
    'SQL(E(START, type = 0), E(_, type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(id, Table(user))), type = 2), E( OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
  );
});

it('Embed string', () => {
  const sql = mm.sql`${user.id} = ${'123'}`;
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(123, type = 0))',
  );
});

it('Embed an action', () => {
  const sql = mm.sql`${mm.selectRow(user.id)}`;
  eq(sql.toString(), 'SQL(E(SelectAction(), type = 5))');
});

it('makeSQL', () => {
  const s = mm.sql`haha`;
  eq(mm.convertToSQL(s), s);
  eq(mm.convertToSQL('haha').toString(), 'SQL(E(haha, type = 0))');
  eq(mm.convertToSQL(post.user_id).toString(), 'SQL(E(Column(user_id, Table(post)), type = 1))');
  eq(
    mm.convertToSQL(mm.count(post.user_id)).toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(user_id, Table(post)), type = 1))), type = 3))',
  );
});

it('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = mm.input({ type: 'a', defaultValue: null }, 'id');
  const d = mm.input({ type: 'a', defaultValue: null }, 'id');
  const e = mm.input({ type: 'b', defaultValue: null }, 'id');
  eq(a.name, undefined);
  eq(a.column, user.id);
  deepEq(a, b);
  assert.notDeepStrictEqual(a, c);
  deepEq(c, d);
  assert.notDeepStrictEqual(c, e);
});

it('SelectedColumn', () => {
  const rawCol = mm.sel(user.id, 'haha');
  const sql = mm.sql`${user.id} = ${rawCol}`;
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SelectedColumn(haha, core = Column(id, Table(user))), type = 4))',
  );
});

it('SQLBuilder', () => {
  const builder = new mm.SQLBuilder();
  builder.push(user.id);
  builder.push(' = 1 OR ');
  builder.push(user.name);
  builder.push(' = ');
  builder.push(mm.input(user.name));
  const sql = builder.toSQL();
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
  );
  ok(sql instanceof mm.SQL);
});
