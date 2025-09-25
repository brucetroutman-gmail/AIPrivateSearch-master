
/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'fs-extra';
import path from 'path';

const ALLOWED_DIRS = [
    path.resolve('./sources/local-documents'),
    path.resolve('./data'),
    path.resolve('./lib')
];

function validatePath(filePath) {
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(normalizedPath);
    
    const isAllowed = ALLOWED_DIRS.some(allowedDir => 
        resolvedPath.startsWith(allowedDir)
    );
    
    if (!isAllowed) {
        throw new Error('Path traversal attempt detected: ' + filePath);
    }
    return resolvedPath;
}

export const secureFs = {
    async readFile(filePath, options) {
        const safePath = validatePath(filePath);
        return fs.readFile(safePath, options);
    },
    
    async writeFile(filePath, data, options) {
        const safePath = validatePath(filePath);
        return fs.writeFile(safePath, data, options);
    },
    
    async readdir(dirPath, options) {
        const safePath = validatePath(dirPath);
        return fs.readdir(safePath, options);
    },
    
    async stat(filePath) {
        const safePath = validatePath(filePath);
        return fs.stat(safePath);
    },
    
    createReadStream(filePath, options) {
        const safePath = validatePath(filePath);
        return fs.createReadStream(safePath, options);
    },
    
    createWriteStream(filePath, options) {
        const safePath = validatePath(filePath);
        return fs.createWriteStream(safePath, options);
    },
    
    async remove(filePath) {
        const safePath = validatePath(filePath);
        return fs.remove(safePath);
    },
    
    async ensureDir(dirPath) {
        const safePath = validatePath(dirPath);
        return fs.ensureDir(safePath);
    },
    
    async unlink(filePath) {
        const safePath = validatePath(filePath);
        return fs.unlink(safePath);
    },
    
    async exists(filePath) {
        const safePath = validatePath(filePath);
        try {
            await fs.access(safePath);
            return true;
        } catch {
            return false;
        }
    }
};
/* eslint-enable security/detect-non-literal-fs-filename */
