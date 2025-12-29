#!/usr/bin/env node

/**
 * Debug script specifically for Alex voice issues
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function testAlexVoice() {
  console.log('🔍 Debugging Alex voice...\n');
  
  // Test 1: Check if Alex voice exists
  console.log('1. Checking available voices...');
  const voicesProcess = spawn('say', ['-v', '?']);
  let voicesOutput = '';
  
  voicesProcess.stdout.on('data', (data) => {
    voicesOutput += data.toString();
  });
  
  await new Promise((resolve) => {
    voicesProcess.on('close', () => {
      const alexVoices = voicesOutput.split('\n').filter(line => 
        line.toLowerCase().includes('alex')
      );
      
      if (alexVoices.length > 0) {
        console.log('✅ Alex voice found:');
        alexVoices.forEach(voice => console.log(`   ${voice}`));
      } else {
        console.log('❌ Alex voice not found');
        console.log('Available voices:');
        voicesOutput.split('\n').slice(0, 10).forEach(voice => 
          console.log(`   ${voice}`)
        );
      }
      resolve();
    });
  });
  
  // Test 2: Direct say command with Alex
  console.log('\n2. Testing direct say command with Alex...');
  try {
    const outputFile = 'debug-alex-direct.aiff';
    const sayProcess = spawn('say', ['-v', 'Alex', '-o', outputFile, 'Alex direct test']);
    
    await new Promise((resolve, reject) => {
      sayProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Direct say command succeeded');
        } else {
          console.log(`❌ Direct say command failed with code ${code}`);
        }
        resolve();
      });
      
      sayProcess.on('error', (error) => {
        console.log(`❌ Direct say command error: ${error.message}`);
        resolve();
      });
    });
    
    // Check if file was created
    try {
      const stats = await fs.stat(outputFile);
      console.log(`   File created: ${outputFile} (${stats.size} bytes)`);
      
      // Try to play it
      console.log('   Testing playback...');
      const playProcess = spawn('afplay', [outputFile]);
      await new Promise((resolve) => {
        playProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Playback succeeded');
          } else {
            console.log(`❌ Playback failed with code ${code}`);
          }
          resolve();
        });
      });
      
    } catch (error) {
      console.log(`❌ File not created: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  // Test 3: Compare with working voice
  console.log('\n3. Comparing with Samantha voice...');
  try {
    const samanthaFile = 'debug-samantha-direct.aiff';
    const sayProcess = spawn('say', ['-v', 'Samantha', '-o', samanthaFile, 'Samantha comparison test']);
    
    await new Promise((resolve) => {
      sayProcess.on('close', async (code) => {
        if (code === 0) {
          const stats = await fs.stat(samanthaFile);
          console.log(`✅ Samantha file created: ${stats.size} bytes`);
        } else {
          console.log(`❌ Samantha test failed with code ${code}`);
        }
        resolve();
      });
    });
    
  } catch (error) {
    console.log(`❌ Samantha test failed: ${error.message}`);
  }
  
  console.log('\n🔍 Debug complete. Check the generated files:');
  console.log('   debug-alex-direct.aiff');
  console.log('   debug-samantha-direct.aiff');
}

testAlexVoice().catch(console.error);