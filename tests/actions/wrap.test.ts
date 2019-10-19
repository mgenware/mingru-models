import * as mm from '../../';
import user from '../models/user';
import * as assert from 'assert';
import post from '../models/post';

const expect = assert.equal;
const ok = assert.ok;

it('WrappedAction', () => {
  class UserTA extends mm.TableActions {
    t = mm.deleteOne().byID();
    t2 = this.t.wrap({
      id: '1',
    });
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t2;
  ok(v instanceof mm.WrappedAction);
  ok(v instanceof mm.Action);
  expect(v.actionType, mm.ActionType.wrap);
  expect(v.action, ta.t);
  assert.deepEqual(v.args, {
    id: '1',
  });
});

it('Chaining', () => {
  class UserTA extends mm.TableActions {
    t = mm.insert().setInputs();
    t2 = this.t
      .wrap({
        name: 'a',
        def_value: 'b',
      })
      .wrap({
        def_value: 'c',
        follower_count: 123,
      });
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t2;
  assert.deepEqual(v.args, {
    name: 'a',
    def_value: 'c',
    follower_count: 123,
  });
  expect(v.isTemp, false);
});

it('Uninitialized wrapped action __table n __name', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .byID()
      .wrap({ id: 23 });
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t;
  expect(v.__table, user);
  expect(v.__name, 't');
  expect(v.isTemp, true);
});

it('Uninitialized wrapped action __table n __name (with from)', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .deleteOne()
      .from(post)
      .byID()
      .wrap({ id: 23 });
  }
  const ta = mm.ta(user, UserTA);
  const v = ta.t;
  expect(v.__table, post);
  expect(v.__name, 't');
  expect(v.isTemp, true);
});

it('SavedContextValue', () => {
  const v = new mm.SavedContextValue('a');
  expect(v.name, 'a');
});

it('Wrap and from', async () => {
  class UserTA extends mm.TableActions {
    t = mm
      .updateOne()
      .setInputs()
      .byID();
  }
  const userTA = mm.ta(user, UserTA);
  class PostTA extends mm.TableActions {
    s = mm
      .updateSome()
      .from(user)
      .set(user.name, mm.sql`${mm.input(user.name)}`)
      .setInputs(user.snake_case_name, user.follower_count)
      .where(
        mm.sql`${user.name.toInput()} ${user.id.toInput()} ${user.snake_case_name.toInput()} ${user.name.toInput()}`,
      );
    t1 = this.s.wrap({ sig: '"haha"' });
    t2 = userTA.t.wrap({ sig: '"SIG"' });
    t3 = mm
      .updateOne()
      .setInputs()
      .byID()
      .wrap({ title: '"t3"' });
  }
  assert.doesNotThrow(() => mm.ta(post, PostTA));
});
