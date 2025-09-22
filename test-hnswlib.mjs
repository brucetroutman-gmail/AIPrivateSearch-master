import pkg from 'hnswlib-node';
const { HierarchicalNSW, L2Space } = pkg;

try {
  console.log('Testing hnswlib-node...');
  
  const dimension = 384;
  const space = new L2Space(dimension);
  console.log('L2Space created');
  
  const index = new HierarchicalNSW(space, 100);
  console.log('HierarchicalNSW created');
  
  // Test with dummy data
  const testVector = new Array(dimension).fill(0.1);
  index.addPoint(testVector, 0);
  console.log('Test vector added');
  
  const results = index.searchKnn(testVector, 1);
  console.log('Search results:', results);
  
} catch (error) {
  console.error('Error:', error.message);
}