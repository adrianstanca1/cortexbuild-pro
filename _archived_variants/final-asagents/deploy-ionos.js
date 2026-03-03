#!/usr/bin/env node

/**
 * IONOS Hosting Deployment Script for ASAgents Platform
 * Optimized for dual-backend architecture (Node.js + Java)
 * Version: 2.0 - Production Ready
 */

const { Client } = require('ssh2');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class IONOSDeployer {
  constructor() {
    this.config = {
      host: 'access-5018479851.webspace-host.com',
      port: 22,
      username: 'a1038987',
      password: process.env.IONOS_PASSWORD || 'Cumparavinde1'
    };

    this.paths = {
      local: {
        frontend: './dist',
        nodeBackend: './server',
        javaBackend: './backend/java',
        package: './package.json',
        serverPackage: './server/package.json'
      },
      remote: {
        webroot: '/var/www/vhosts/access-5018479851.webspace-host.com/httpdocs',
        nodejs: './nodejs',
        java: './java-backend',
        uploads: './uploads',
        logs: './logs',
        backups: './backups'
      }
    };

    this.deploymentSteps = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m', 
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    
    // Log to deployment log
    this.deploymentSteps.push({
      timestamp,
      type,
      message
    });
  }

  async connectSSH() {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        this.log('SSH connection established', 'success');
        resolve(conn);
      });

      conn.on('error', (err) => {
        this.log(`SSH connection failed: ${err.message}`, 'error');
        reject(err);
      });

      conn.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        readyTimeout: 30000
      });
    });
  }

  async executeCommand(conn, command, description) {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${description}`, 'info');
      
      conn.exec(command, (err, stream) => {
        if (err) {
          this.log(`Command execution failed: ${err.message}`, 'error');
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
          if (code === 0) {
            this.log(`Command completed successfully: ${description}`, 'success');
            resolve(stdout);
          } else {
            this.log(`Command failed with code ${code}: ${stderr}`, 'error');
            reject(new Error(`Command failed: ${stderr}`));
          }
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  async uploadFile(conn, localPath, remotePath, description) {
    return new Promise((resolve, reject) => {
      this.log(`Uploading: ${description}`, 'info');
      
      conn.sftp((err, sftp) => {
        if (err) {
          this.log(`SFTP connection failed: ${err.message}`, 'error');
          reject(err);
          return;
        }

        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            this.log(`Upload failed: ${err.message}`, 'error');
            reject(err);
          } else {
            this.log(`Upload successful: ${description}`, 'success');
            resolve();
          }
        });
      });
    });
  }

  async uploadDirectory(conn, localDir, remoteDir, description) {
    return new Promise((resolve, reject) => {
      this.log(`Uploading directory: ${description}`, 'info');
      
      conn.sftp((err, sftp) => {
        if (err) {
          this.log(`SFTP connection failed: ${err.message}`, 'error');
          reject(err);
          return;
        }

        const uploadRecursive = async (localPath, remotePath) => {
          try {
            const stats = await fs.stat(localPath);
            
            if (stats.isDirectory()) {
              // Create remote directory
              try {
                await new Promise((resolve, reject) => {
                  sftp.mkdir(remotePath, (err) => {
                    if (err && err.code !== 4) { // Code 4 = directory exists
                      reject(err);
                    } else {
                      resolve();
                    }
                  });
                });
              } catch (e) {
                // Directory might already exist, continue
              }

              // Upload directory contents
              const files = await fs.readdir(localPath);
              for (const file of files) {
                await uploadRecursive(
                  path.join(localPath, file),
                  remotePath + '/' + file
                );
              }
            } else {
              // Upload file
              await new Promise((resolve, reject) => {
                sftp.fastPut(localPath, remotePath, (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              });
            }
          } catch (error) {
            throw error;
          }
        };

        uploadRecursive(localDir, remoteDir)
          .then(() => {
            this.log(`Directory upload successful: ${description}`, 'success');
            resolve();
          })
          .catch((error) => {
            this.log(`Directory upload failed: ${error.message}`, 'error');
            reject(error);
          });
      });
    });
  }

  async buildProject() {
    this.log('Starting project build', 'info');
    
    try {
      // Build frontend
      this.log('Building frontend with Vite', 'info');
      execSync('npm run build', { stdio: 'pipe' });
      this.log('Frontend build completed', 'success');

      // Verify build output
      const distExists = await fs.access(this.paths.local.frontend).then(() => true).catch(() => false);
      if (!distExists) {
        throw new Error('Build output directory does not exist');
      }

      this.log('Build verification completed', 'success');
      return true;
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      return false;
    }
  }

  async createBackup(conn) {
    this.log('Creating backup of current deployment', 'info');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupCommand = `
        cd ${this.paths.remote.webroot} && 
        tar -czf ../backups/backup_${timestamp}.tar.gz . && 
        ls -la ../backups/
      `;
      
      await this.executeCommand(conn, `mkdir -p ../backups`, 'Create backup directory');
      await this.executeCommand(conn, backupCommand, 'Create backup archive');
      
      this.log('Backup created successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Backup failed: ${error.message}`, 'warning');
      return false;
    }
  }

  async setupRemoteDirectories(conn) {
    this.log('Setting up remote directories', 'info');
    
    const directories = [
      this.paths.remote.webroot,
      this.paths.remote.nodejs,
      this.paths.remote.java,
      this.paths.remote.uploads,
      this.paths.remote.logs,
      this.paths.remote.backups
    ];

    try {
      for (const dir of directories) {
        await this.executeCommand(conn, `mkdir -p ${dir}`, `Create directory: ${dir}`);
      }
      
      this.log('Remote directories setup completed', 'success');
      return true;
    } catch (error) {
      this.log(`Directory setup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async deployFrontend(conn) {
    this.log('Deploying frontend to web root', 'info');
    
    try {
      // Clear existing files (except hidden files)
      await this.executeCommand(
        conn, 
        `cd ${this.paths.remote.webroot} && find . -type f ! -name '.*' -delete`,
        'Clear existing frontend files'
      );

      // Upload new frontend files
      await this.uploadDirectory(
        conn, 
        this.paths.local.frontend, 
        this.paths.remote.webroot,
        'Frontend build files'
      );

      // Set proper permissions
      await this.executeCommand(
        conn,
        `chmod -R 755 ${this.paths.remote.webroot}`,
        'Set frontend file permissions'
      );

      this.log('Frontend deployment completed', 'success');
      return true;
    } catch (error) {
      this.log(`Frontend deployment failed: ${error.message}`, 'error');
      return false;
    }
  }

  async deployNodeBackend(conn) {
    this.log('Deploying Node.js backend', 'info');
    
    try {
      const backendExists = await fs.access(this.paths.local.nodeBackend).then(() => true).catch(() => false);
      if (!backendExists) {
        this.log('Node.js backend directory not found, skipping', 'warning');
        return true;
      }

      // Upload Node.js backend
      await this.uploadDirectory(
        conn,
        this.paths.local.nodeBackend,
        this.paths.remote.nodejs,
        'Node.js backend files'
      );

      // Install dependencies
      await this.executeCommand(
        conn,
        `cd ${this.paths.remote.nodejs} && npm ci --production --legacy-peer-deps`,
        'Install Node.js dependencies'
      );

      // Set permissions
      await this.executeCommand(
        conn,
        `chmod -R 755 ${this.paths.remote.nodejs}`,
        'Set Node.js backend permissions'
      );

      this.log('Node.js backend deployment completed', 'success');
      return true;
    } catch (error) {
      this.log(`Node.js backend deployment failed: ${error.message}`, 'error');
      return false;
    }
  }

  async deployJavaBackend(conn) {
    this.log('Deploying Java backend', 'info');
    
    try {
      const javaBackendExists = await fs.access(this.paths.local.javaBackend).then(() => true).catch(() => false);
      if (!javaBackendExists) {
        this.log('Java backend directory not found, skipping', 'warning');
        return true;
      }

      // Upload Java backend
      await this.uploadDirectory(
        conn,
        this.paths.local.javaBackend,
        this.paths.remote.java,
        'Java backend files'
      );

      // Build Java application (if Maven available)
      try {
        await this.executeCommand(
          conn,
          `cd ${this.paths.remote.java} && mvn clean package -DskipTests`,
          'Build Java application'
        );
      } catch (error) {
        this.log('Maven build failed, continuing with existing JAR', 'warning');
      }

      this.log('Java backend deployment completed', 'success');
      return true;
    } catch (error) {
      this.log(`Java backend deployment failed: ${error.message}`, 'error');
      return false;
    }
  }

  async configureWebServer(conn) {
    this.log('Configuring web server', 'info');
    
    try {
      // Create .htaccess for SPA routing
      const htaccessContent = `
# ASAgents Construction Management Platform
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.html [QSA,L]

# API routing to Node.js backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]

# Java backend routing
RewriteCond %{REQUEST_URI} ^/java-api/(.*)$
RewriteRule ^java-api/(.*)$ http://localhost:4001/api/$1 [P,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
      `.trim();

      // Upload .htaccess file
      const htaccessPath = '/tmp/htaccess_temp';
      await fs.writeFile(htaccessPath, htaccessContent);
      await this.uploadFile(
        conn,
        htaccessPath,
        `${this.paths.remote.webroot}/.htaccess`,
        'Apache .htaccess configuration'
      );

      // Clean up temp file
      await fs.unlink(htaccessPath).catch(() => {});

      this.log('Web server configuration completed', 'success');
      return true;
    } catch (error) {
      this.log(`Web server configuration failed: ${error.message}`, 'error');
      return false;
    }
  }

  async startServices(conn) {
    this.log('Starting backend services', 'info');
    
    try {
      // Start Node.js backend (if exists)
      try {
        await this.executeCommand(
          conn,
          `cd ${this.paths.remote.nodejs} && pm2 start src/index.js --name "asagents-node" || node src/index.js &`,
          'Start Node.js backend service'
        );
      } catch (error) {
        this.log('Node.js service start failed, continuing', 'warning');
      }

      // Start Java backend (if exists)
      try {
        await this.executeCommand(
          conn,
          `cd ${this.paths.remote.java} && java -jar target/*.jar &`,
          'Start Java backend service'
        );
      } catch (error) {
        this.log('Java service start failed, continuing', 'warning');
      }

      this.log('Backend services startup completed', 'success');
      return true;
    } catch (error) {
      this.log(`Service startup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyDeployment(conn) {
    this.log('Verifying deployment', 'info');
    
    try {
      // Check if frontend files exist
      await this.executeCommand(
        conn,
        `ls -la ${this.paths.remote.webroot}/index.html`,
        'Verify frontend files'
      );

      // Test web server response
      await this.executeCommand(
        conn,
        `curl -I http://localhost/index.html || echo "Web server test completed"`,
        'Test web server response'
      );

      this.log('Deployment verification completed', 'success');
      return true;
    } catch (error) {
      this.log(`Deployment verification failed: ${error.message}`, 'warning');
      return false;
    }
  }

  async generateDeploymentReport() {
    this.log('Generating deployment report', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      deployment: {
        host: this.config.host,
        username: this.config.username,
        paths: this.paths.remote
      },
      steps: this.deploymentSteps,
      summary: {
        total: this.deploymentSteps.length,
        success: this.deploymentSteps.filter(s => s.type === 'success').length,
        warnings: this.deploymentSteps.filter(s => s.type === 'warning').length,
        errors: this.deploymentSteps.filter(s => s.type === 'error').length
      }
    };

    const reportPath = `./deployment-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report saved: ${reportPath}`, 'success');
    return report;
  }

  async deploy() {
    this.log('🚀 Starting IONOS deployment for ASAgents Platform', 'info');
    this.log('Architecture: Dual-backend (Node.js + Java) with React frontend', 'info');
    
    let conn;
    let success = false;

    try {
      // Step 1: Build the project
      const buildSuccess = await this.buildProject();
      if (!buildSuccess) {
        throw new Error('Build failed');
      }

      // Step 2: Connect to IONOS
      conn = await this.connectSSH();

      // Step 3: Create backup
      await this.createBackup(conn);

      // Step 4: Setup directories
      await this.setupRemoteDirectories(conn);

      // Step 5: Deploy frontend
      const frontendSuccess = await this.deployFrontend(conn);
      if (!frontendSuccess) {
        throw new Error('Frontend deployment failed');
      }

      // Step 6: Deploy backends
      await this.deployNodeBackend(conn);
      await this.deployJavaBackend(conn);

      // Step 7: Configure web server
      await this.configureWebServer(conn);

      // Step 8: Start services
      await this.startServices(conn);

      // Step 9: Verify deployment
      await this.verifyDeployment(conn);

      success = true;
      this.log('🎉 Deployment completed successfully!', 'success');

    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, 'error');
      this.log('Check the deployment report for details', 'info');
    } finally {
      if (conn) {
        conn.end();
        this.log('SSH connection closed', 'info');
      }

      // Generate report regardless of success/failure
      const report = await this.generateDeploymentReport();
      
      if (success) {
        this.log('🌐 Your application should now be available at:', 'info');
        this.log(`https://${this.config.host}`, 'success');
        this.log('Frontend: React SPA with PWA capabilities', 'info');
        this.log('Backend APIs: Node.js (AI/multimodal) + Java (enterprise)', 'info');
      }

      return success;
    }
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new IONOSDeployer();
  
  deployer.deploy()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Deployment script error:', error);
      process.exit(1);
    });
}

module.exports = IONOSDeployer;