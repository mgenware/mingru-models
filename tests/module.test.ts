import { promisify } from 'util';
import { stat } from 'fs';
const statAsync = promisify(stat);

test('Verify type definition files', async () => {
  expect((await statAsync('./dist/main.d.ts')).isFile()).toBeTruthy();
});
