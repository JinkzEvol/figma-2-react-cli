import { promises as fs } from 'fs';
import * as path from 'path';

export interface VersionRecord {
  versionDir: string;
  baseComponent: string;
  runTimestamp: string;
  previousVersionDir: string | null;
  fileHashes: Record<string, string>;
}

export interface GeneratedPreview {
  versionDir: string;
  baseComponent: string;
  runTimestamp: string;
  tsxContent: string;
  summaryData?: {
    layerCount?: number;
    warnings?: unknown[];
    [key: string]: unknown;
  };
  outputPath: string;
}

/**
 * Scan generator/generated-* directories to find all available conversions
 */
export async function findGeneratedOutputs(): Promise<string[]> {
  const generatorPath = path.join(process.cwd(), 'generator');
  
  try {
    const entries = await fs.readdir(generatorPath);
    return entries.filter(entry => entry.startsWith('generated-'));
  } catch (error) {
    console.warn('Unable to read generator directory:', error);
    return [];
  }
}

/**
 * Get the latest version from a specific generated output directory
 */
export async function getLatestVersion(generatedOutputDir: string): Promise<GeneratedPreview | null> {
  const outputPath = path.join(process.cwd(), 'generator', generatedOutputDir);
  
  try {
    // Check if version-map.json exists
    const versionMapPath = path.join(outputPath, 'version-map.json');
    const versionMapContent = await fs.readFile(versionMapPath, 'utf8');
    const versionMap: VersionRecord[] = JSON.parse(versionMapContent);
    
    if (versionMap.length === 0) {
      return null;
    }
    
    // Get the latest version (last entry)
    const latestVersion = versionMap[versionMap.length - 1];
    const versionPath = path.join(outputPath, latestVersion.versionDir);
    
    // Find the TSX file
    const files = await fs.readdir(versionPath);
    const tsxFile = files.find(f => f.endsWith('.tsx'));
    
    if (!tsxFile) {
      return null;
    }
    
    // Read the TSX content
    const tsxContent = await fs.readFile(path.join(versionPath, tsxFile), 'utf8');
    
    // Try to read summary.json if it exists
    let summaryData;
    try {
      const summaryPath = path.join(versionPath, 'summary.json');
      const summaryContent = await fs.readFile(summaryPath, 'utf8');
      summaryData = JSON.parse(summaryContent);
    } catch {
      // Summary file doesn't exist or is invalid
    }
    
    return {
      versionDir: latestVersion.versionDir,
      baseComponent: latestVersion.baseComponent,
      runTimestamp: latestVersion.runTimestamp,
      tsxContent,
      summaryData,
      outputPath: generatedOutputDir
    };
  } catch (error) {
    console.warn(`Unable to read version data for ${generatedOutputDir}:`, error);
    return null;
  }
}

/**
 * Get all available generated previews
 */
export async function getAllGeneratedPreviews(): Promise<GeneratedPreview[]> {
  const outputs = await findGeneratedOutputs();
  const previews: GeneratedPreview[] = [];
  
  for (const output of outputs) {
    const preview = await getLatestVersion(output);
    if (preview) {
      previews.push(preview);
    }
  }
  
  // Sort by timestamp, most recent first
  return previews.sort((a, b) => 
    new Date(b.runTimestamp).getTime() - new Date(a.runTimestamp).getTime()
  );
}

/**
 * Get the most recent generated preview across all outputs
 */
export async function getMostRecentPreview(): Promise<GeneratedPreview | null> {
  const previews = await getAllGeneratedPreviews();
  return previews.length > 0 ? previews[0] : null;
}