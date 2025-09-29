
import fs from 'fs-extra';
import path from 'path';

const ALLOWED_DIRS = [
    path.resolve('../../sources'),
    path.resolve('./data'),
    path.resolve('./lib')
];

function validatePath(filePath) {
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Allow any path under the aisearchscore project directory
    const projectRoot = '/Users/Shared/repos/aisearchscore';
    if (resolvedPath.startsWith(projectRoot)) {
        return resolvedPath;
    }
    
    throw new Error('Path traversal attempt detected: ' + filePath);
}

export const secureFs = {
    async readFile(filePath, options) {
        const safePath = validatePath(filePath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.readFile(safePath, options);
    },
    
    async writeFile(filePath, data, options) {
        const safePath = validatePath(filePath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.writeFile(safePath, data, options);
    },
    
    async readdir(dirPath, options) {
        const safePath = validatePath(dirPath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.readdir(safePath, options);
    },
    
    async stat(filePath) {
        const safePath = validatePath(filePath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.stat(safePath);
    },
    
    createReadStream(filePath, options) {
        const safePath = validatePath(filePath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.createReadStream(safePath, options);
    },
    
    createWriteStream(filePath, options) {
        const safePath = validatePath(filePath);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        return fs.createWriteStream(safePath, options);
    }
};
