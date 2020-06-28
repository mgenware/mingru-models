import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../..';
import user from '../models/user';
import post from '../models/post';
import * as cm from '../actions/common';

const expect = assert.equal;

it('SQL', () => {
  const sql = mm.sql`${user.id} = 1 OR ${user.name} = ${mm.input(user.name)}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
  assert.ok(sql instanceof mm.SQL);
});

it('SQL with input', () => {
  const sql = mm.sql`START${user.id} = 1 OR ${user.name} = ${mm.input(
    user.name,
  )}END`;
  expect(
    sql.toString(),
    'SQL(E(START, type = 0), E(Column(id, Table(user)), type = 1), E( = 1 OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2), E(END, type = 0))',
  );
});

it('Input', () => {
  const input = mm.input(user.name);
  expect(input.type, user.name);
  expect(input.name, 'name');
});

it('Named input', () => {
  const input = mm.input(user.name, 'haha');
  expect(input.type, user.name);
  expect(input.name, 'haha');
});

it('Input (foreign key)', () => {
  const input = mm.input(post.user_id);
  expect((input.type as mm.Column).__foreignColumn, user.id);
  expect(input.name, 'userID');
});

it('Input (joined key)', () => {
  const input = mm.input(post.user_id.join(user).name);
  expect((input.type as mm.Column).__mirroredColumn, user.name);
  expect(input.name, 'userName');
});

it('Raw type input', () => {
  const input = mm.input('uint32', 'uid');
  expect(input.type, 'uint32');
  expect(input.name, 'uid');
});

it('Empty name for raw type input', () => {
  itThrows(
    () => mm.input('uint32'),
    'Unexpected empty input name for type "uint32"',
  );
});

it('Embed another sql', () => {
  const embedded = mm.sql`_${user.id} = ${mm.input(user.id)}`;
  const sql = mm.sql`START${embedded} OR ${user.name} = ${mm.input(user.name)}`;
  expect(
    sql.toString(),
    'SQL(E(START, type = 0), E(_, type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2), E( OR , type = 0), E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(name, desc = Column(name, Table(user))), type = 2))',
  );
});

it('Embed string', () => {
  const sql = mm.sql`${user.id} = ${'123'}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(123, type = 0))',
  );
});

it('Embed an action', () => {
  const sql = mm.sql`${mm.select(user.id)}`;
  expect(sql.toString(), 'SQL(E(SelectAction(null, null), type = 5))');
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
  const sql = user.name.isEqualTo(mm.sql`"haha"`);
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
  const sql = user.name.isNotEqualTo(mm.sql`"haha"`);
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
  const s = mm.sql`haha`;
  expect(mm.convertToSQL(s), s);
  expect(mm.convertToSQL('haha').toString(), 'SQL(E(haha, type = 0))');
  expect(
    mm.convertToSQL(post.user_id).toString(),
    'SQL(E(Column(user_id, Table(post)), type = 1))',
  );
  expect(
    mm.convertToSQL(mm.count(post.user_id)).toString(),
    'SQL(E(SQLCall(3, return = ColType(SQL.INT), params = SQL(E(Column(user_id, Table(post)), type = 1))), type = 3))',
  );
});

it('enumerateColumns', () => {
  let s = mm.sql`haha`;
  assert.deepEqual(cm.listColumnsFromSQL(s), []);
  s = mm.sql`kaokdjdf ${user.name} ${post.id.isEqualToInput()}`;
  assert.deepEqual(cm.listColumnsFromSQL(s), [user.name, post.id]);
  s = mm.sql`${mm.coalesce('haha', user.name, post.id)}`;
  assert.deepEqual(cm.listColumnsFromSQL(s), [user.name, post.id]);
});

it('findFirstColumn', () => {
  let s = mm.sql`haha`;
  expect(s.findFirstColumn(), null);
  s = mm.sql`kaokdjdf ${user.name}`;
  expect(s.findFirstColumn(), user.name);
  s = mm.sql`${mm.coalesce('haha', user.name)}`;
  expect(s.findFirstColumn(), user.name);
});

it('Input.isEqualTo', () => {
  const a = user.id.toInput();
  const b = user.id.toInput();
  const c = mm.input('a', 'id');
  const d = mm.input('a', 'id');
  const e = mm.input('b', 'id');
  expect(a.name, c.name);
  expect(a.isEqualTo(b), true);
  expect(a.isEqualTo(c), false);
  expect(c.isEqualTo(d), true);
  expect(c.isEqualTo(e), false);
});

it('hasColumns', () => {
  const a = mm.sql`sdf sd ${mm.localDatetimeNow()}`;
  const b = mm.sql`sisjsdf`;
  const c = mm.sql`jis df${user.id}`;
  const d = mm.sql`isjdf${user.name.toInput()}`;
  expect(a.hasColumns, false);
  expect(b.hasColumns, false);
  expect(c.hasColumns, true);
  expect(d.hasColumns, true);
});

it('hasCalls', () => {
  const a = mm.sql`sdf sd ${mm.localDatetimeNow()}`;
  const b = mm.sql`sisjsdf`;
  const c = mm.sql`jis df${user.id}`;
  const d = mm.sql`isjdf${user.name.toInput()}`;
  expect(a.hasCalls, true);
  expect(b.hasCalls, false);
  expect(c.hasCalls, false);
  expect(d.hasCalls, false);
});

it('RawColumn', () => {
  const rawCol = mm.sel(user.id, 'haha');
  const sql = mm.sql`${user.id} = ${rawCol}`;
  expect(
    sql.toString(),
    'SQL(E(Column(id, Table(user)), type = 1), E( = , type = 0), E(RawColumn(haha, core = Column(id, Table(user))), type = 4))',
  );
});

it('sniffType', () => {
  // Column
  expect(mm.sql`haha${user.id}`.sniffType(), 'ColType(SQL.BIGINT)');
  // Call
  expect(mm.sql`${mm.max(mm.sql``)}`.sniffType(), 'ColType(SQL.INT)');
  // RawColumn
  expect(mm.sql`haha${user.id.as('abc')}`.sniffType(), 'ColType(SQL.BIGINT)');
  expect(
    mm.sql`haha${mm.sel(mm.sql`abc`, 'name', mm.int().__type)}`.sniffType(),
    'ColType(SQL.INT)',
  );
});
