import * as assert from 'assert';
import * as mm from '../../dist/main.js';
import user from '../models/user.js';

const eq = assert.equal;

it('and', () => {
  eq(
    mm.and(mm.sql`1`, user.id.isEqualToInput()).toString(),
    'SQL(E((, type = 0), E(1, type = 0), E( AND , type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(id, Table(user))), type = 2), E(), type = 0))',
  );
});

it('or', () => {
  eq(
    mm.or(mm.sql`1`, user.id.isEqualToInput()).toString(),
    'SQL(E((, type = 0), E(1, type = 0), E( OR , type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(id, Table(user))), type = 2), E(), type = 0))',
  );
});

it('toInput', () => {
  const input = user.name.toInput();
  eq(input.isArray, false);
  eq(input.type, user.name);
  eq(input.name, undefined);
});

it('toInput(string)', () => {
  const input = user.name.toInput('haha');
  eq(input.type, user.name);
  eq(input.name, 'haha');
});

it('toArrayInput(string)', () => {
  const input = user.name.toArrayInput('haha');
  eq(input.type, user.name);
  eq(input.isArray, true);
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
    'SQL(E(Column(name, Table(user)), type = 1), E( = , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
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
    'SQL(E(Column(name, Table(user)), type = 1), E( <> , type = 0), E(SQLVar(undefined, desc = Column(name, Table(user))), type = 2))',
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

it('isInArrayInput(string)', () => {
  const sql = user.name.isInArrayInput('haha');
  eq(
    sql.toString(),
    'SQL(E(Column(name, Table(user)), type = 1), E( IN , type = 0), E(SQLVar(haha, desc = Column(name, Table(user))), type = 2))',
  );
});
