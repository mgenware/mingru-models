import * as dd from '../';
import user from './models/user';
import * as assert from 'assert';

const expect = assert.equal;

it('and', () => {
  expect(
    dd.and(dd.sql`1`, user.id.isEqualToInput()).toString(),
    '1 AND `id` = <id: [id]>',
  );
});

it('or', () => {
  expect(
    dd.or(dd.sql`1`, user.id.isEqualToInput()).toString(),
    '1 OR `id` = <id: [id]>',
  );
});
