import * as mm from '../../dist/main.js';
import { eq } from '../assert-aliases.js';

it('Constants', () => {
  eq(mm.constants.T, '1');
  eq(mm.constants.F, '0');
  eq(mm.constants.NULL, 'NULL');
  eq(mm.constants.internalPropPrefix, '__');
});
