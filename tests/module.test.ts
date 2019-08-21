import { promisify } from 'util';
import { stat } from 'fs';
const statAsync = promisify(stat);
import * as assert from 'assert';

const expect = assert.equal;

it('Verify type definition files', async () => {
  expect((await statAsync('./dist/main.d.ts')).isFile(), true);
});
