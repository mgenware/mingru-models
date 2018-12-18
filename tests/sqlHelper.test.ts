import * as dd from '../';
import user from './models/user';

test('and', () => {
  expect(dd.and(dd.sql`1`, user.id.isEqualToInput()).toString()).toBe(
    '1 AND `id` = ?',
  );
});

test('or', () => {
  expect(dd.or(dd.sql`1`, user.id.isEqualToInput()).toString()).toBe(
    '1 OR `id` = ?',
  );
});
