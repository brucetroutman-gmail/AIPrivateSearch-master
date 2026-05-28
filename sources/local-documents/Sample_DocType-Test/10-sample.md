# 10-sample

```javascript
/**
 * Sample JavaScript Document
 * 
 * This JavaScript file tests code processing capabilities in AIPrivateSearch.
 */

class SampleClass {
    constructor(name) {
        this.name = name;
        this.createdAt = new Date();
    }
    
    greet() {
        return `Hello from ${this.name}!`;
    }
    
    getInfo() {
        return {
            name: this.name,
            createdAt: this.createdAt.toISOString(),
            type: 'SampleClass'
        };
    }
}

function main() {
    const sample = new SampleClass("AIPrivateSearch Test");
    console.log(sample.greet());
    console.log("Info:", sample.getInfo());
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SampleClass, main };
}

// Run if called directly
if (typeof window === 'undefined') {
    main();
}
```