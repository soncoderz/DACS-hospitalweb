/**
 * Script to set up the complete system
 * This will run all initialization scripts in sequence
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting system setup...');

// Function to run a script and wait for it to complete
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${path.basename(scriptPath)}...`);
    
    const process = spawn('node', [scriptPath], { 
      stdio: 'inherit',
      shell: true 
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
        return;
      }
      console.log(`Completed ${path.basename(scriptPath)}`);
      resolve();
    });
  });
}

// Run scripts in sequence
async function setup() {
  try {
    // Step 1: Initialize roles and permissions
    await runScript(path.resolve(__dirname, 'initRolesAndPermissions.js'));
    
    // Step 2: Create default users
    await runScript(path.resolve(__dirname, 'createUsers.js'));
    
    console.log('\n✅ System setup completed successfully!');
    console.log('\nYou can now log in with:');
    console.log('Admin: admin@benhvien.com / admin123');
    console.log('Doctor: doctor@benhvien.com / doctor123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setup(); 