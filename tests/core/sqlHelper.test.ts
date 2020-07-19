import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';

const eq = assert.equal;

it('and', () => {
  eq(
    mm.and(mm.sql`1`, user.id.isEqualToInput()).toString(),
    'SQL(E(1, type = 0), E( AND , type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});

it('or', () => {
  eq(
    mm.or(mm.sql`1`, user.id.isEqualToInput()).toString(),
    'SQL(E(1, type = 0), E( OR , type = 0), E(Column(id, Table(user)), type = 1), E( = , type = 0), E(SQLVar(id, desc = Column(id, Table(user))), type = 2))',
  );
});
