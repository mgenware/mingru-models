import * as assert from 'assert';
import { itThrows } from 'it-throws';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { eq, ok, deepEq } from '../assert-aliases.js';

it('SQL', () => {
  const sql = mm.sql`${user.id} = 1 OR ${user.name} = ${mm.param(user.name)}`;
  eq(
    sql.toString(),
    '`Column(id, t=User(user)) = 1 OR Column(name, t=User(user)) = VAR(Column(name, t=User(user)))`',
  );
  ok(sql instanceof mm.SQL);
});

it('Flatten another SQL', () => {
  const sql = mm.sql`${mm.sql`${mm.sql`${user.id} = 1 OR ${user.name} = ${mm.param(user.name)}`}`}`;
  eq(
    sql.toString(),
    '`Column(id, t=User(user)) = 1 OR Column(name, t=User(user)) = VAR(Column(name, t=User(user)))`',
  );
  ok(sql instanceof mm.SQL);
});

it('SQL with input', () => {
  const sql = mm.sql`START${user.id} = 1 OR ${user.name} = ${mm.param(user.name)}END`;
  eq(
    sql.toString(),
    '`STARTColumn(id, t=User(user)) = 1 OR Column(name, t=User(user)) = VAR(Column(name, t=User(user)))END`',
  );
});

it('Input', () => {
  const input = mm.param(user.name);
  eq(input.type, user.name);
  eq(input.name, undefined);
  eq(input.column, user.name);
});

it('Named input', () => {
  const input = mm.param(user.name, 'haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
  eq(input.column, user.name);
});

it('Input (foreign key)', () => {
  const col = post.user_id;
  const input = mm.param(col);
  eq((input.type as mm.Column).__getData().foreignColumn, user.id);
  eq(input.name, undefined);
  eq(input.column, col);
});

it('Input (joined key)', () => {
  const col = post.user_id.join(user).name;
  const input = mm.param(col);
  eq((input.type as mm.Column).__getData().mirroredColumn, user.name);
  eq(input.name, undefined);
  eq(input.column, col);
});

it('Raw type input', () => {
  const input = mm.param({ type: 'uint32', defaultValue: 0 }, 'uid');
  deepEq(input.type, { type: 'uint32', defaultValue: 0 });
  eq(input.toString(), 'VAR({"type":"uint32","defaultValue":0}, name=uid)');
});

it('Empty name for raw type input', () => {
  itThrows(
    () => mm.param({ type: 'uint32', defaultValue: 0 }),
    'Unexpected empty param name for type `uint32`',
  );
});

it('Embed another sql', () => {
  const embedded = mm.sql`_${user.id} = ${mm.param(user.id)}`;
  const sql = mm.sql`START${embedded} OR ${user.name} = ${mm.param(user.name)}`;
  eq(
    sql.toString(),
    '`START_Column(id, t=User(user)) = VAR(Column(id, t=User(user))) OR Column(name, t=User(user)) = VAR(Column(name, t=User(user)))`',
  );
});

it('Embed string', () => {
  const sql = mm.sql`${user.id} = ${'123'}`;
  eq(sql.toString(), '`Column(id, t=User(user)) = 123`');
});

it('Embed an action', () => {
  const sql = mm.sql`${mm.selectRow(user.id)}`;
  eq(sql.toString(), '`SelectAction(-)`');
});

it('makeSQL', () => {
  const s = mm.sql`haha`;
  eq(mm.convertToSQL(s), s);
  eq(mm.convertToSQL('haha').toString(), '`haha`');
  eq(mm.convertToSQL(post.user_id).toString(), '`Column(user_id, t=Post(post))`');
  eq(
    mm.convertToSQL(mm.count(post.user_id)).toString(),
    '`COUNT(`Column(user_id, t=Post(post))`)`',
  );
});

it('Input.isEqualTo', () => {
  const a = user.id.toParam();
  const b = user.id.toParam();
  const c = mm.param({ type: 'a', defaultValue: null }, 'id');
  const d = mm.param({ type: 'a', defaultValue: null }, 'id');
  const e = mm.param({ type: 'b', defaultValue: null }, 'id');
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
    '`Column(id, t=User(user)) = SelectedColumn(haha, core=Column(id, t=User(user)))`',
  );
});

it('SQLBuilder', () => {
  const builder = new mm.SQLBuilder();
  builder.push(user.id);
  builder.push(' = 1 OR ');
  builder.push(user.name);
  builder.push(' = ');
  builder.push(mm.param(user.name));
  const sql = builder.toSQL();
  eq(
    sql.toString(),
    '`Column(id, t=User(user)) = 1 OR Column(name, t=User(user)) = VAR(Column(name, t=User(user)))`',
  );
  ok(sql instanceof mm.SQL);
});
