import { runConversionFromFile, lumosOutputToHtml } from './dist/services/mappingService.js';

async function test() {
  try {
    console.log('Testing Lumos class generation...');
    const output = await runConversionFromFile('./src/asset/figma.json');
    const html = lumosOutputToHtml(output);

    console.log('Sample HTML output:');
    console.log(html.substring(0, 500) + '...');

    // Check for Lumos classes
    const lumosClasses = html.match(/class="[^"]*"/g) || [];
    console.log('\nFound Lumos classes:');
    lumosClasses.slice(0, 5).forEach(cls => console.log('  ' + cls));

    // Check for specific Lumos patterns
    const hasLumosPadding = html.includes('u-padding-');
    const hasLumosTypography = html.includes('u-text-style-');
    const hasLumosGap = html.includes('u-gap-');
    const hasLumosContainer = html.includes('u-container-');

    console.log('\nLumos utility detection:');
    console.log('  Padding utilities:', hasLumosPadding);
    console.log('  Typography utilities:', hasLumosTypography);
    console.log('  Gap utilities:', hasLumosGap);
    console.log('  Container utilities:', hasLumosContainer);

  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();