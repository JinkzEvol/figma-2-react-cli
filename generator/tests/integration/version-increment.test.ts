import { ensureVersionDir, updateVersionMap } from '../../src/versioning/versioning';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * T043 Version increment test – expects second run to link to previous versionDir.
 */

describe('integration: version increment', () => {
  test('second run links previous versionDir', async () => {
    const tmp = path.join(process.cwd(), 'generator', '.tmp-version-test');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });

    // First run
    const ensure1 = await ensureVersionDir({ outParent: tmp, baseComponent: 'PrimaryComponent' });
    const file1 = path.join(ensure1.versionDir, 'CompA.v1.tsx');
    await fs.writeFile(file1, 'console.log("v1");');
    await updateVersionMap({ outParent: tmp, baseComponent: 'PrimaryComponent' }, ensure1, [file1]);

    // Second run
    const ensure2 = await ensureVersionDir({ outParent: tmp, baseComponent: 'PrimaryComponent' });
    const file2 = path.join(ensure2.versionDir, 'CompA.v2.tsx');
    await fs.writeFile(file2, 'console.log("v2");');
    const map = await updateVersionMap({ outParent: tmp, baseComponent: 'PrimaryComponent' }, ensure2, [file2]);

    expect(map.length).toBe(2);
    expect(map[1].previousVersionDir).toBe(map[0].versionDir);
  });
});
