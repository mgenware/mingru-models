import * as dd from '../../';
import user from '../models/user';
import post from '../models/post';
import { Column } from '../../';
import * as assert from 'assert';

const expect = assert.equal;
const ok = assert.ok;

it('SQL', () => {
  const sql = dd.sql`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
  ok(sql instanceof dd.SQL);
});

it('SQL with input', () => {
  const sql = dd.sql`START${user.id} = 1 OR ${user.name} = ${dd.input(
    user.name,
  )}END`;
  expect(
    sql.toString(),
    'SQL(E(START, type = 0), E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2), E(END, type = 0))',
  );
});

it('Input', () => {
  const input = dd.input(user.name);
  expect(input.type, user.name);
  expect(input.name, 'name');
});

it('Named input', () => {
  const input = dd.input(user.name, 'haha');
  expect(input.type, user.name);
  expect(input.name, 'haha');
});

it('Input (foreign key)', () => {
  const input = dd.input(post.user_id);
  expect((input.type as Column).foreignColumn, user.id);
  expect(input.name, 'userID');
});

it('Input (joined key)', () => {
  const input = dd.input(post.user_id.join(user).name);
  expect((input.type as dd.Column).mirroredColumn, user.name);
  expect(input.name, 'userName');
});

it('Raw type input', () => {
  const input = dd.input('uint32', 'uid');
  expect(input.type, 'uint32');
  expect(input.name, 'uid');
});

it('Empty name for raw type input', () => {
  assert.throws(() => dd.input('uint32'), 'empty input name');
});

it('Embed another sql', () => {
  const embedded = dd.sql`_${user.id} = ${dd.input(user.id)}`;
  const sql = dd.sql`START${embedded} OR ${user.name} = ${dd.input(user.name)}`;
  expect(
    sql.toString(),
    'SQL(E(START, type = 0), E(_, type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('Embed string', () => {
  const sql = dd.sql`${user.id} = ${'123'}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(123, type = 0))',
  );
});

it('toInput', () => {
  const input = user.name.toInput();
  expect(input.type, user.name);
  expect(input.name, 'name');
});

it('toInput(string)', () => {
  const input = user.name.toInput('haha');
  expect(input.type, user.name);
  expect(input.name, 'haha');
});

it('isEqualTo', () => {
  const sql = user.name.isEqualTo(dd.sql`"haha"`);
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E("haha", type = 0))',
  );
});

it('isEqualToInput', () => {
  const sql = user.name.isEqualToInput();
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isEqualToInput(string)', () => {
  const sql = user.name.isEqualToInput('haha');
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(haha, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNotEqualTo', () => {
  const sql = user.name.isNotEqualTo(dd.sql`"haha"`);
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E("haha", type = 0))',
  );
});

it('isNotEqualToInput', () => {
  const sql = user.name.isNotEqualToInput();
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNotEqualToInput(string)', () => {
  const sql = user.name.isNotEqualToInput('haha');
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E(SQLVar(haha, desc = Column(name, Table(user))), type = 2))',
  );
});

it('isNull', () => {
  const sql = user.name.isNull();
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( IS NULL, type = 0))',
  );
});

it('isNotNull', () => {
  const sql = user.name.isNotNull();
  expect(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( IS NOT NULL, type = 0))',
  );
});

it('makeSQL', () => {
  const s = dd.sql`haha`;
  expect(dd.convertToSQL(s), s);
  expect(dd.convertToSQL('haha').toString(), 'SQL(E(haha, type = 0))');
  expect(
    dd.convertToSQL(post.user_id).toString(),
    'SQL(E(Column(user_id, Table(post)), type = 1))',
  );
  expect(
    dd.convertToSQL(dd.count(post.user_id)).toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(user_id, Table(post)), type = 1))), type = 3))',
  );
});

it('findColumn', () => {
  let s = dd.sql`haha`;
  expect(s.findColumn(), null);
  s = dd.sql`kaokdjdf ${user.name}`;
  expect(s.findColumn(), user.name);
  s = dd.sql`${dd.coalesce('haha', user.name)}`;
  expect(s.findColumn(), user.name);
});

it('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = dd.input('a', 'id');
  const d = dd.input('a', 'id');
  const e = dd.input('b', 'id');
  expect(a.name, c.name);
  expect(a.isEqualTo(b), true);
  expect(a.isEqualTo(c), false);
  expect(c.isEqualTo(d), true);
  expect(c.isEqualTo(e), false);
});

it('hasColumns', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasColumns, false);
  expect(b.hasColumns, false);
  expect(c.hasColumns, true);
  expect(d.hasColumns, true);
});

it('hasCalls', () => {
  const a = dd.sql`sdf sd ${dd.datetimeNow()}`;
  const b = dd.sql`sisjsdf`;
  const c = dd.sql`jis df${user.id}`;
  const d = dd.sql`isjdf${user.name.toInput()}`;
  expect(a.hasCalls, true);
  expect(b.hasCalls, false);
  expect(c.hasCalls, false);
  expect(d.hasCalls, false);
});

it('RawColumn', () => {
  const rawCol = dd.sel(user.id, 'haha');
  const sql = dd.sql`${user.id} = ${rawCol}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(RawColumn(haha, core = Column(id, Table(user))), type = 4))',
  );
});

it('sniffType', () => {
  // Column
  expect(dd.sql`haha${user.id}`.sniffType(), 'ColType(SQL.BIGINT)');
  // Call
  expect(dd.sql`${dd.max(dd.sql``)}`.sniffType(), 'ColType(SQL.INT)');
  // RawColumn
  expect(dd.sql`haha${user.id.as('abc')}`.sniffType(), 'ColType(SQL.BIGINT)');
  expect(
    dd.sql`haha${dd.sel(dd.sql`abc`, 'name', dd.int().type)}`.sniffType(),
    'ColType(SQL.INT)',
  );
});
