import user from '../models/user';

test('Table name', () => {
  expect(user.__name).toBe('user');
});
