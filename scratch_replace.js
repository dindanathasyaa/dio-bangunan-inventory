const fs = require('fs');
const path = require('path');

function replaceRecursively(dir) {
    const files = fs.readdirSync(dir);
    let changes = 0;
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            changes += replaceRecursively(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("'en-US'")) {
                content = content.replace(/'en-US'/g, "'id-ID'");
                fs.writeFileSync(fullPath, content);
                changes++;
            }
        }
    }
    return changes;
}

const changes = replaceRecursively('frontend/src/components');
console.log('Replaced en-US with id-ID in ' + changes + ' files.');
