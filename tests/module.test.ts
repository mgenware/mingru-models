import { promises as fsPromises } from 'fs';
import * as assert from 'assert';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
it('Verify type definition files', async () => {
  assert.ok((await fsPromises.stat('./dist/main.d.ts')).isFile());
});
