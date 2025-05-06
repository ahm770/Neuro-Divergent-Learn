const fs = require('fs');
const path = require('path');

const srcFolder = path.join(__dirname, 'src');
const outputFile = path.join(srcFolder, 'merged.txt');
const excludedDirs = ['node_modules', 'build', 'dist', '.git'];
const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function mergeFilesRecursively(directory, mergedContent = []) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            const folderName = path.basename(itemPath);
            if (!excludedDirs.includes(folderName)) {
                mergeFilesRecursively(itemPath, mergedContent);
            }
        } else if (allowedExtensions.includes(path.extname(item))) {
            console.log(`📄 Copying: ${itemPath.replace(__dirname, '')}`);
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

        // Always start at root of src
        if (fs.existsSync(srcFolder)) {
            mergeFilesRecursively(srcFolder, mergedContent);
        }

        fs.writeFileSync(outputFile, mergedContent.join('\n'), 'utf8');

        console.log(`✅ Merged all .ts, .tsx, .js, .jsx files into ${outputFile}`);
    } catch (error) {
        console.error('❌ Error merging files:', error);
    }
}

mergeFiles();
