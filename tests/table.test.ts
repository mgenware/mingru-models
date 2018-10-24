import user from './models/user';

test('table', () => {
  expect(user.TableName).toBe('user');
});
