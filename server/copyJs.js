const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'merged_js.txt');
const targetDirs = ['utils', 'middlewares', 'controllers', 'config', 'models', 'routes', 'services'];
const allowedExtension = '.js';

// Files to include separately
const extraFiles = ['app.js', ];

function mergeJSFilesRecursively(directory, mergedContent = []) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            // Recursively process subdirectories
            mergeJSFilesRecursively(itemPath, mergedContent);
        } else if (path.extname(item) === allowedExtension) {
            console.log(`📄 Merging: ${itemPath.replace(__dirname, '')}`);

            // Read file content
            const content = fs.readFileSync(itemPath, 'utf8');
            mergedContent.push(`\n===== File: ${itemPath.replace(__dirname, '')} =====\n${content}`);
        }
    }

    return mergedContent;
}

function mergeJSFiles() {
    try {
        let mergedContent = [];

        console.log('🔄 Merging JavaScript files...\n');

        // Process only the target directories
        targetDirs.forEach(dir => {
            const dirPath = path.join(__dirname, dir);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                mergeJSFilesRecursively(dirPath, mergedContent);
            }
        });

        // Include extra files (seeder.js, server.js)
        extraFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                console.log(`📄 Merging: ${filePath.replace(__dirname, '')}`);

                // Read file content
                const content = fs.readFileSync(filePath, 'utf8');
                mergedContent.push(`\n===== File: ${filePath.replace(__dirname, '')} =====\n${content}`);
            }
        });

        // Write merged content to output file
        fs.writeFileSync(outputFile, mergedContent.join('\n'), 'utf8');

        console.log(`✅ Merged all .js files from ${targetDirs.join(', ')} and extra files into ${outputFile}`);
    } catch (error) {
        console.error('❌ Error merging files:', error);
    }
}

mergeJSFiles();