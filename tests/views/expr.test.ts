import * as dd from '../..';
import user from '../models/user';
import Expr from '../../lib/actions/expr';

test('Expr', () => {
  const v = dd.action('t')
    .select(user.id, user.name)
    .from(user)
    .where`${user.id} = 1 OR ${user.name} = ${dd.input(user.name)}`;

    expect(v.whereExpr).not.toBeNull();
    const expr = v.whereExpr as Expr;
    const equals = expr.equalsTo(
      ['', ' = 1 OR ', ' = ', ''],
      [user.id, user.name, dd.input(user.name)],
    );
    expect(equals).toBe(true);
});
