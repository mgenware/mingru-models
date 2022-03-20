import * as mm from '../../dist/main.js';
import user from '../models/user.js';
import { eq } from '../assert-aliases.js';

it('and', () => {
  eq(
    mm.and(mm.sql`1`, user.id.isEqualToParam()).toString(),
    '`(1 AND Column(id, t=User(user)) = VAR(Column(id, t=User(user))))`',
  );
});

it('or', () => {
  eq(
    mm.or(mm.sql`1`, user.id.isEqualToParam()).toString(),
    '`(1 OR Column(id, t=User(user)) = VAR(Column(id, t=User(user))))`',
  );
});

it('toParam', () => {
  const input = user.name.toParam();
  eq(input.isArray, false);
  eq(input.type, user.name);
  eq(input.name, undefined);
});

it('toParam(string)', () => {
  const input = user.name.toParam('haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
});

it('toArrayParam(string)', () => {
  const input = user.name.toArrayParam('haha');
  eq(input.type, user.name);
  eq(input.isArray, true);
  eq(input.name, 'haha');
});

it('isEqualTo', () => {
  const sql = user.name.isEqualToSQL(mm.sql`"haha"`);
  eq(sql.toString(), '`Column(name, t=User(user)) = "haha"`');
  const sql2 = user.name.isEqualTo`"haha"`;
  eq(sql2.toString(), '`Column(name, t=User(user)) = "haha"`');
});

it('isEqualToParam', () => {
  const sql = user.name.isEqualToParam();
  eq(sql.toString(), '`Column(name, t=User(user)) = VAR(Column(name, t=User(user)))`');
});

it('isEqualToParam(string)', () => {
  const sql = user.name.isEqualToParam('haha');
  eq(sql.toString(), '`Column(name, t=User(user)) = VAR(Column(name, t=User(user)), name=haha)`');
});

it('isNotEqualTo', () => {
  const sql = user.name.isNotEqualToSQL(mm.sql`"haha"`);
  eq(sql.toString(), '`Column(name, t=User(user)) <> "haha"`');

  const sql2 = user.name.isNotEqualTo`"haha"`;
  eq(sql2.toString(), '`Column(name, t=User(user)) <> "haha"`');
});

it('isNotEqualToParam', () => {
  const sql = user.name.isNotEqualToParam();
  eq(sql.toString(), '`Column(name, t=User(user)) <> VAR(Column(name, t=User(user)))`');
});

it('isNotEqualToParam(string)', () => {
  const sql = user.name.isNotEqualToParam('haha');
  eq(sql.toString(), '`Column(name, t=User(user)) <> VAR(Column(name, t=User(user)), name=haha)`');
});

it('isNull', () => {
  const sql = user.name.isNull();
  eq(sql.toString(), '`Column(name, t=User(user)) IS NULL`');
});

it('isNotNull', () => {
  const sql = user.name.isNotNull();
  eq(sql.toString(), '`Column(name, t=User(user)) IS NOT NULL`');
});

it('isInArrayParam(string)', () => {
  const sql = user.name.isInArrayParam('haha');
  eq(
    sql.toString(),
    '`Column(name, t=User(user)) IN VAR(Column(name, t=User(user)), name=haha)[]`',
  );
});

it('scalarType', () => {
  eq(
    new mm.SQLVariable(user.id, 'id', true, undefined, true).scalarVariable(false).toString(),
    'VAR(Column(id, t=User(user)), name=id)[]',
  );
  eq(
    new mm.SQLVariable(user.id, 'id', true, undefined, true).scalarVariable(true).toString(),
    'VAR(Column(id, t=User(user)), name=id)',
  );
});

it('SQLConvertible accepts null', () => {
  const sql = user.name.isEqualTo`${null}`;
  eq(sql.toString(), '`Column(name, t=User(user)) = NULL`');
});
