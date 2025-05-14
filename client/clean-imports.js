const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Process all JSX files
glob('src/**/*.jsx', (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  console.log(`Found ${files.length} JSX files`);

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const newContent = content.replace(/import\s+['"]\.\.\/\.\.\/styles\/.*\.css['"]\s*;/g, '');
      
      if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log(`Updated: ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  });

  console.log('Done!');
}); 