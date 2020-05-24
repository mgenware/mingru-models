import { promisify } from 'util';
import { stat } from 'fs';
import * as assert from 'assert';

const statAsync = promisify(stat);
const expect = assert.equal;

it('Verify type definition files', async () => {
  expect((await statAsync('./dist/main.d.ts')).isFile(), true);
});
