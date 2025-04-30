const fs = require('fs');
const path = require('path');

const srcFolder = path.join(__dirname, 'src');
const outputFile = path.join(srcFolder, 'merged.txt');
const targetDirs = ['app', 'components', 'utils', 'services', 'store'];
const allowedExtensions = ['.ts', '.tsx', '.js'];

function mergeFilesRecursively(directory, mergedContent = []) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            // Recursively process subdirectories
            mergeFilesRecursively(itemPath, mergedContent);
        } else if (allowedExtensions.includes(path.extname(item))) {
            console.log(`📄 Copying: ${itemPath.replace(__dirname, '')}`);
            
            // Read and append only files with .ts, .tsx, or .js extensions
            const content = fs.readFileSync(itemPath, 'utf8');
            mergedContent.push(`\n===== File: ${itemPath.replace(__dirname, '')} =====\n${content}`);
        }
    }

    return mergedContent;
}

function mergeFiles() {
    try {
        let mergedContent = [];

        console.log('🔄 Merging files...\n');

        // Process only the target directories inside `src/`
        targetDirs.forEach(dir => {
            const dirPath = path.join(srcFolder, dir);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                mergeFilesRecursively(dirPath, mergedContent);
            }
        });

        fs.writeFileSync(outputFile, mergedContent.join('\n'), 'utf8');

        console.log(`✅ Merged all .ts, .tsx, .js files from ${targetDirs.join(', ')} into ${outputFile}`);
    } catch (error) {
        console.error('❌ Error merging files:', error);
    }
}

mergeFiles();