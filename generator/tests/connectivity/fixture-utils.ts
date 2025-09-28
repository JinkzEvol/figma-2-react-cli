import { promises as fs } from 'node:fs';
import path from 'node:path';

type PathSegment = string;

export function fixturePath(...segments: PathSegment[]): string {
  return path.join(__dirname, '__fixtures__', ...segments);
}

export async function loadJsonFixture<T>(...segments: PathSegment[]): Promise<T> {
  const filePath = fixturePath(...segments);
  const contents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(contents) as T;
}

export async function copyFixtureDir(sourceRelativeDir: PathSegment, destination: string): Promise<void> {
  const sourceDir = fixturePath(sourceRelativeDir);
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourceEntryPath = path.join(sourceDir, entry.name);
    const destinationEntryPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyFixtureDir(path.join(sourceRelativeDir, entry.name), destinationEntryPath);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destinationEntryPath), { recursive: true });
      await fs.copyFile(sourceEntryPath, destinationEntryPath);
    }
  }
}
