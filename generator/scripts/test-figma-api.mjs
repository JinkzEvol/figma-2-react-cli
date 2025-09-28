#!/usr/bin/env node

const args = process.argv.slice(2);
let fileKey;
let nodeId;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--file' && args[i + 1]) {
    fileKey = args[++i];
    continue;
  }
  if (arg === '--node' && args[i + 1]) {
    nodeId = args[++i];
    continue;
  }
  if (arg === '--help') {
    printUsage();
    process.exit(0);
  }
}

function printUsage() {
  console.log('Usage: node scripts/test-figma-api.mjs --file <FILE_KEY> --node <NODE_ID>');
  console.log('Requires FIGMA_TOKEN set in the environment.');
}

if (!fileKey || !nodeId) {
  console.error('Missing required --file and/or --node arguments.');
  printUsage();
  process.exit(1);
}

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error('FIGMA_TOKEN environment variable is not set.');
  process.exit(1);
}

const url = `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`;

async function main() {
  console.log(`Fetching ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const bodyText = await response.text();
    if (!response.ok) {
      console.error('Request failed. Response body:');
      console.error(bodyText);
      process.exit(1);
    }

    console.log('Response received. Parsing JSON...');
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      process.exit(1);
    }

    const nodeKeys = payload?.nodes ? Object.keys(payload.nodes) : [];
    console.log(`Payload keys: ${Object.keys(payload).join(', ')}`);
    console.log(`Node count in response: ${nodeKeys.length}`);
    if (nodeKeys.length > 0) {
      const sampleNode = payload.nodes[nodeKeys[0]];
      console.log('Sample node metadata:');
      console.log(JSON.stringify({
        key: nodeKeys[0],
        name: sampleNode?.document?.name,
        type: sampleNode?.document?.type,
        children: Array.isArray(sampleNode?.document?.children)
          ? sampleNode.document.children.length
          : undefined
      }, null, 2));
    }
  } catch (error) {
    console.error('Fetch failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
