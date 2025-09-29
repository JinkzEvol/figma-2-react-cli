const fs = require('fs').promises;
const path = require('path');

async function findGeneratedOutputs() {
  const generatorPath = path.join(process.cwd(), 'generator');
  
  try {
    const entries = await fs.readdir(generatorPath);
    return entries.filter(entry => entry.startsWith('generated-'));
  } catch (error) {
    console.warn('Unable to read generator directory:', error);
    return [];
  }
}

async function test() {
  const outputs = await findGeneratedOutputs();
  console.log('Found generated outputs:');
  outputs.forEach((output, i) => console.log(`  ${i + 1}. ${output}`));
  console.log(`\nOur new generated-default is included: ${outputs.includes('generated-default')}`);
  
  if (outputs.includes('generated-default')) {
    console.log('\n✅ SUCCESS: The CLI now generates components in a directory that the UI can detect!');
  } else {
    console.log('\n❌ FAILED: The generated-default directory was not found.');
  }
}

test().catch(console.error);