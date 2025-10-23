import { CollectionsUtil } from './server/s01_server-first-app/lib/utils/collectionsUtil.mjs';
import fs from 'fs';

async function debugCollectionNames() {
  console.log('=== Collection Name Debug ===');
  
  // Check what collections are available
  const collections = await CollectionsUtil.getCollectionNames();
  console.log('Available collections:', collections);
  
  // Check if Medical-Practice exists
  const medicalCollection = collections.find(c => c.toLowerCase().includes('medical'));
  console.log('Medical collection found:', medicalCollection);
  
  // Check directory listing
  const collectionsPath = CollectionsUtil.getCollectionsPath();
  console.log('Collections path:', collectionsPath);
  
  const dirs = fs.readdirSync(collectionsPath);
  console.log('Directory listing:', dirs);
}

debugCollectionNames();