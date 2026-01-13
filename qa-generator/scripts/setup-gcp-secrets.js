#!/usr/bin/env node

/**
 * GCP Secret Manager Setup Script
 * This script helps set up the OpenAI API key in Google Cloud Secret Manager
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 GCP Secret Manager Setup for Q&A Generator');
  console.log('===============================================\n');

  try {
    // Get project ID
    const projectId = await question('Enter your GCP Project ID: ');
    if (!projectId.trim()) {
      console.error('❌ Project ID is required');
      process.exit(1);
    }

    // Get OpenAI API key
    const apiKey = await question('Enter your OpenAI API Key: ');
    if (!apiKey.trim()) {
      console.error('❌ OpenAI API Key is required');
      process.exit(1);
    }

    // Get secret name (default: Q-A-generator)
    const secretName = await question('Enter secret name (default: Q-A-generator): ') || 'Q-A-generator';

    console.log('\n🚀 Setting up Secret Manager...');

    // Initialize the Secret Manager client
    const client = new SecretManagerServiceClient();

    // Create the secret
    try {
      console.log(`📝 Creating secret: ${secretName}`);
      await client.createSecret({
        parent: `projects/${projectId}`,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
      console.log(`✅ Secret ${secretName} created successfully`);
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`ℹ️  Secret ${secretName} already exists`);
      } else {
        throw error;
      }
    }

    // Add the secret version
    console.log('🔑 Adding API key to secret...');
    await client.addSecretVersion({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(apiKey, 'utf8'),
      },
    });

    console.log('✅ API key added to secret successfully');

    // Test retrieval
    console.log('🧪 Testing secret retrieval...');
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });

    const retrievedKey = version.payload.data.toString();
    if (retrievedKey === apiKey) {
      console.log('✅ Secret retrieval test passed');
    } else {
      console.log('❌ Secret retrieval test failed');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set the following environment variables:');
    console.log(`   GCP_PROJECT_ID=${projectId}`);
    console.log(`   SECRET_NAME=${secretName}`);
    console.log('2. Ensure your application has the necessary IAM permissions:');
    console.log('   - Secret Manager Secret Accessor role');
    console.log('3. For local development, set GOOGLE_APPLICATION_CREDENTIALS to your service account key path');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Help:');
      console.log('1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
      console.log('2. Run: gcloud auth application-default login');
      console.log('3. Or set GOOGLE_APPLICATION_CREDENTIALS to your service account key file');
    }
    
    if (error.message.includes('permission')) {
      console.log('\n💡 Permission Help:');
      console.log('1. Ensure the Secret Manager API is enabled in your GCP project');
      console.log('2. Grant your account the "Secret Manager Admin" role');
      console.log('3. For service accounts, grant "Secret Manager Secret Accessor" role');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
