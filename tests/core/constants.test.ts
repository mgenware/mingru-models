import * as mm from '../../dist/main.js';
import { eq } from '../assert-aliases.js';

it('Constants', () => {
  eq(mm.constants.t.toString(), 'SQL(E(1, type = 0))');
  eq(mm.constants.f.toString(), 'SQL(E(0, type = 0))');
});
