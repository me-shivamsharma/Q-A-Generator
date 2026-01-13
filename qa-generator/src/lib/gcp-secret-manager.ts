import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

interface SecretManagerConfig {
  projectId: string;
  secretName: string;
}

class GCPSecretManager {
  private client: SecretManagerServiceClient;
  private projectId: string;

  constructor(projectId?: string) {
    this.projectId = projectId || process.env.GCP_PROJECT_ID || '';
    
    if (!this.projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }

    // Initialize the Secret Manager client
    // In production, this will use the service account attached to the GCP resource
    // In development, use GOOGLE_APPLICATION_CREDENTIALS environment variable
    this.client = new SecretManagerServiceClient();
  }

  /**
   * Retrieves a secret from Google Cloud Secret Manager
   * @param secretName - The name of the secret to retrieve
   * @param version - The version of the secret (defaults to 'latest')
   * @returns The secret value as a string
   */
  async getSecret(secretName: string, version: string = 'latest'): Promise<string> {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/${version}`;
      
      console.log(`Fetching secret: ${name}`);
      
      const [response] = await this.client.accessSecretVersion({
        name: name,
      });

      if (!response.payload?.data) {
        throw new Error(`Secret ${secretName} not found or empty`);
      }

      const secretValue = response.payload.data.toString();
      
      if (!secretValue) {
        throw new Error(`Secret ${secretName} is empty`);
      }

      console.log(`Successfully retrieved secret: ${secretName}`);
      return secretValue;
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}:`, error);
      throw new Error(`Failed to retrieve secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves the OpenAI API key from Secret Manager
   * @returns The OpenAI API key
   */
  async getOpenAIApiKey(): Promise<string> {
    const secretName = process.env.SECRET_NAME || 'Q-A-generator';
    return this.getSecret(secretName);
  }

  /**
   * Creates or updates a secret in Google Cloud Secret Manager
   * @param secretName - The name of the secret
   * @param secretValue - The value to store
   */
  async createOrUpdateSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      // First, try to create the secret
      try {
        await this.client.createSecret({
          parent: `projects/${this.projectId}`,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
          },
        });
        console.log(`Created secret: ${secretName}`);
      } catch (error: any) {
        // If secret already exists, that's fine
        if (!error.message?.includes('already exists')) {
          throw error;
        }
        console.log(`Secret ${secretName} already exists`);
      }

      // Add the secret version
      await this.client.addSecretVersion({
        parent: `projects/${this.projectId}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      });

      console.log(`Added version to secret: ${secretName}`);
    } catch (error) {
      console.error(`Error creating/updating secret ${secretName}:`, error);
      throw new Error(`Failed to create/update secret ${secretName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all secrets in the project
   * @returns Array of secret names
   */
  async listSecrets(): Promise<string[]> {
    try {
      const [secrets] = await this.client.listSecrets({
        parent: `projects/${this.projectId}`,
      });

      return secrets.map(secret => {
        const name = secret.name || '';
        return name.split('/').pop() || '';
      }).filter(name => name !== '');
    } catch (error) {
      console.error('Error listing secrets:', error);
      throw new Error(`Failed to list secrets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the connection to Secret Manager
   * @returns true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listSecrets();
      console.log('Successfully connected to GCP Secret Manager');
      return true;
    } catch (error) {
      console.error('Failed to connect to GCP Secret Manager:', error);
      return false;
    }
  }
}

// Singleton instance
let secretManagerInstance: GCPSecretManager | null = null;

/**
 * Get the singleton instance of GCPSecretManager
 */
export function getSecretManager(): GCPSecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new GCPSecretManager();
  }
  return secretManagerInstance;
}

export default GCPSecretManager;
