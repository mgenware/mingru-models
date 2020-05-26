import * as assert from 'assert';
import * as mm from '../..';
import user from '../models/user';

const expect = assert.equal;

it('and', () => {
  expect(
    mm.and(mm.sql`1`, user.id.isEqualToInput()).toString(),
    '1 AND `id` = <id: [id]>',
  );
});

it('or', () => {
  expect(
    mm.or(mm.sql`1`, user.id.isEqualToInput()).toString(),
    '1 OR `id` = <id: [id]>',
  );
});
