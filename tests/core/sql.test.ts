import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import * as cm from '../actions/common';

const eq = assert.equal;

it('SQL', () => {
  const sql = mm.sql`${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}`;
  assert.strictEqual(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
  assert.ok(sql instanceof mm.SQL);
});

it('Flatten another SQL', () => {
  const sql = mm.sql`${mm.sql`${mm.sql`${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}`}`}`;
  assert.strictEqual(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
  assert.ok(sql instanceof mm.SQL);
});

it('SQL with input', () => {
  const sql = mm.sql`START${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}END`;
  eq(
    sql.toString(),
    'SQL(E(START, type = 0), E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2), E(END, type = 0))',
  );
});

it('Input', () => {
  const input = mm.input(user.name);
  eq(input.type, user.name);
  eq(input.name, 'name');
});

it('Named input', () => {
  const input = mm.input(user.name, 'haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
});

it('Input (foreign key)', () => {
  const input = mm.input(post.user_id);
  eq((input.type as mm.Column).__foreignColumn, user.id);
  eq(input.name, 'userID');
});

it('Input (joined key)', () => {
  const input = mm.input(post.user_id.join(user).name);
  eq((input.type as mm.Column).__mirroredColumn, user.name);
  eq(input.name, 'userName');
});

it('Raw type input', () => {
  const input = mm.input({ name: 'uint32', defaultValue: 0 }, 'uid');
  assert.deepStrictEqual(input.type, { name: 'uint32', defaultValue: 0 });
  eq(input.toString(), 'SQLVar(uid, desc = {"name":"uint32","defaultValue":0})');
});

it('Empty name for raw type input', () => {
  itThrows(
    () => mm.input({ name: 'uint32', defaultValue: 0 }),
    'Unexpected empty input name for type `uint32`',
  );
});

it('Embed another sql', () => {
  const embedded = mm.sql`_${user.id} = ${mm.input(user.id)}`;
  const sql = mm.sql`START${embedded} OR ${user.name} = ${mm.input(user.name)}`;
  eq(
    sql.toString(),
    'SQL(E(START, type = 0), E(_, type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
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
  const sql = mm.sql`${mm.select(user.id)}`;
  eq(sql.toString(), 'SQL(E(SelectAction(null, null), type = 5))');
});

it('toInput', () => {
  const input = user.name.toInput();
  eq(input.type, user.name);
  eq(input.name, 'name');
});

it('toInput(string)', () => {
  const input = user.name.toInput('haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
});

it('isEqualTo', () => {
  const sql = user.name.isEqualToSQL(mm.sql`"haha"`);
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E("haha", type = 0))',
  );
  const sql2 = user.name.isEqualTo`"haha"`;
  eq(
    sql2.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E("haha", type = 0))',
  );
});

it('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(haha, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNotEqualTo', () => {
  const sql = user.name.isNotEqualToSQL(mm.sql`"haha"`);
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E("haha", type = 0))',
  );

  const sql2 = user.name.isNotEqualTo`"haha"`;
  eq(
    sql2.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E("haha", type = 0))',
  );
});

it('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E(SQLVar(haha, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNull', () => {
  const sql = user.name.isNull();
  eq(sql.toString(), 'SQL(E(Column(name, Table(user)), type = 1), E( IS NULL, type = 0))');
});

it('isNotNull', () => {
  const sql = user.name.isNotNull();
  eq(sql.toString(), 'SQL(E(Column(name, Table(user)), type = 1), E( IS NOT NULL, type = 0))');
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

it('enumerateColumns', () => {
  let s = mm.sql`haha`;
  assert.deepStrictEqual(cm.listColumnsFromSQL(s), []);
  s = mm.sql`kaokdjdf ${user.name} ${post.id.isEqualToInput()}`;
  assert.deepStrictEqual(cm.listColumnsFromSQL(s), [user.name, post.id]);
  s = mm.sql`${mm.coalesce(
    'haha',
    user.name,
    post.id,
    mm.sql`${mm.max(mm.sel(user.follower_count, 'alias'))}`,
  )}`;
  assert.deepStrictEqual(cm.listColumnsFromSQL(s), [user.name, post.id, user.follower_count]);
});

it('findFirstColumn', () => {
  let s = mm.sql`haha`;
  eq(s.findFirstColumn(), null);
  s = mm.sql`kaokdjdf ${user.name}`;
  eq(s.findFirstColumn(), user.name);
  s = mm.sql`${mm.coalesce('haha', user.name)}`;
  eq(s.findFirstColumn(), user.name);
});

it('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = mm.input({ name: 'a', defaultValue: null }, 'id');
  const d = mm.input({ name: 'a', defaultValue: null }, 'id');
  const e = mm.input({ name: 'b', defaultValue: null }, 'id');
  eq(a.name, c.name);
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a, c);
  assert.deepStrictEqual(c, d);
  assert.notDeepStrictEqual(c, e);
});

it('hasColumns', () => {
  const a = mm.sql`sdf sd ${mm.localDatetimeNow()}`;
  const b = mm.sql`sisjsdf`;
  const c = mm.sql`jis df${user.id}`;
  const d = mm.sql`isjdf${user.name.toInput()}`;
  eq(a.hasColumns, false);
  eq(b.hasColumns, false);
  eq(c.hasColumns, true);
  eq(d.hasColumns, true);
});

it('hasCalls', () => {
  const a = mm.sql`sdf sd ${mm.localDatetimeNow()}`;
  const b = mm.sql`sisjsdf`;
  const c = mm.sql`jis df${user.id}`;
  const d = mm.sql`isjdf${user.name.toInput()}`;
  eq(a.hasCalls, true);
  eq(b.hasCalls, false);
  eq(c.hasCalls, false);
  eq(d.hasCalls, false);
});

it('RawColumn', () => {
  const rawCol = mm.sel(user.id, 'haha');
  const sql = mm.sql`${user.id} = ${rawCol}`;
  eq(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(RawColumn(haha, core = Column(id, Table(user))), type = 4))',
  );
});

it('sniffType', () => {
  // Column
  eq(mm.sql`${user.id}`.sniffType(), 'ColType(SQL.BIGINT)');
  eq(mm.sql`haha${user.id}`.sniffType(), 'ColType(SQL.BIGINT)');
  // Call
  eq(mm.sql`${mm.max(mm.sql``)}`.sniffType(), 'ColType(SQL.INT)');
  // Call with a index-based return type from one of its params.
  eq(mm.sql`${mm.ifNull(post.title, post.id)}`.sniffType(), 'ColType(SQL.VARCHAR)');
  // RawColumn
  eq(mm.sql`haha${user.id.as('abc')}`.sniffType(), 'ColType(SQL.BIGINT)');
  eq(mm.sql`haha${mm.sel(mm.sql`abc`, 'name', mm.int().__type)}`.sniffType(), 'ColType(SQL.INT)');
});

it('SQLBuilder', () => {
  const builder = new mm.SQLBuilder();
  builder.push(user.id);
  builder.push(' = 1 OR ');
  builder.push(user.name);
  builder.push(' = ');
  builder.push(mm.input(user.name));
  const sql = builder.toSQL();
  assert.strictEqual(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
  assert.ok(sql instanceof mm.SQL);
});
