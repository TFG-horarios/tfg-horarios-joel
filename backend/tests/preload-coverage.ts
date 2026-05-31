import { join } from 'path';
import { Glob } from 'bun';

const glob = new Glob('src/**/*.ts');

for await (const file of glob.scan('.')) {
  if (
    !file.endsWith('.test.ts') &&
    !file.endsWith('.e2e.test.ts') &&
    !file.endsWith('.d.ts')
  ) {
    await import(join(process.cwd(), file));
  }
}
