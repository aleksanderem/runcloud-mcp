import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

// Get API credentials from environment variables
// Priority: MCP env vars > .env file > error
const RUNCLOUD_API_KEY = process.env.RUNCLOUD_API_KEY;
const RUNCLOUD_API_SECRET = process.env.RUNCLOUD_API_SECRET;
const RUNCLOUD_BASE_URL = process.env.RUNCLOUD_BASE_URL || 'https://manage.runcloud.io/api/v2';

// Validate credentials
if (!RUNCLOUD_API_KEY || !RUNCLOUD_API_SECRET) {
  console.error('Error: RUNCLOUD_API_KEY and RUNCLOUD_API_SECRET are required.');
  console.error('Please set them in:');
  console.error('1. MCP configuration env vars, or');
  console.error('2. .env file in the project root');
  process.exit(1);
}

// Create axios instance with auth
const api = axios.create({
  baseURL: RUNCLOUD_BASE_URL,
  auth: {
    username: RUNCLOUD_API_KEY,
    password: RUNCLOUD_API_SECRET
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

class RunCloudMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'runcloud-mcp-server',
        version: '2.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Server Management
        {
          name: 'list_servers',
          description: 'List all servers in your RunCloud account',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search servers by name' },
              page: { type: 'number', description: 'Page number for pagination' }
            }
          }
        },
        {
          name: 'get_server',
          description: 'Get detailed information about a specific server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_server',
          description: 'Create a new server',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Server name' },
              ipAddress: { type: 'string', description: 'Server IP address' },
              provider: { type: 'string', description: 'Server provider' }
            },
            required: ['name', 'ipAddress']
          }
        },
        {
          name: 'delete_server',
          description: 'Delete a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server to delete' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'get_server_stats',
          description: 'Get statistics for a specific server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'get_server_hardware_info',
          description: 'Get hardware information for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'get_installation_script',
          description: 'Get installation script for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        
        // Server Settings
        {
          name: 'get_ssh_settings',
          description: 'Get SSH configuration for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'update_ssh_settings',
          description: 'Update SSH configuration for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              passwordlessLogin: { type: 'boolean', description: 'Enable passwordless login' },
              useDns: { type: 'boolean', description: 'Use DNS for SSH' },
              preventRootLogin: { type: 'boolean', description: 'Prevent root login' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'update_server_metadata',
          description: 'Update server metadata (name, provider)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              name: { type: 'string', description: 'New server name' },
              provider: { type: 'string', description: 'Server provider' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'update_server_autoupdate',
          description: 'Configure auto-update settings for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              softwareUpdate: { type: 'boolean', description: 'Enable software updates' },
              securityUpdate: { type: 'boolean', description: 'Enable security updates' }
            },
            required: ['serverId']
          }
        },
        
        // PHP Management
        {
          name: 'list_php_versions',
          description: 'List available PHP versions on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'change_php_cli_version',
          description: 'Change PHP-CLI version on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              phpVersion: { type: 'string', description: 'PHP version (e.g., "php74", "php80", "php81")' }
            },
            required: ['serverId', 'phpVersion']
          }
        },
        
        // Shared Servers
        {
          name: 'list_shared_servers',
          description: 'List shared servers',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search shared servers by name' }
            }
          }
        },
        
        // Web Applications (Existing + New)
        {
          name: 'list_webapps',
          description: 'List all web applications on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search web applications by name' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'get_webapp',
          description: 'Get detailed information about a specific web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'create_webapp',
          description: 'Create a new web application on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              name: { type: 'string', description: 'Web application name' },
              domainName: { type: 'string', description: 'Primary domain name' },
              user: { type: 'number', description: 'System user ID' },
              publicPath: { type: 'string', description: 'Public path (default: /)' },
              phpVersion: { type: 'string', description: 'PHP version (e.g., "php81")' },
              stack: { type: 'string', description: 'Stack (native, hybrid)' },
              stackMode: { type: 'string', description: 'Stack mode (production, development)' },
              clickjackingProtection: { type: 'boolean', description: 'Enable clickjacking protection' },
              xssProtection: { type: 'boolean', description: 'Enable XSS protection' },
              mimeSniffingProtection: { type: 'boolean', description: 'Enable MIME sniffing protection' },
              processManager: { type: 'string', description: 'Process manager (dynamic, ondemand, static)' },
              processManagerMaxChildren: { type: 'number', description: 'Max children processes' },
              processManagerMaxRequests: { type: 'number', description: 'Max requests per process' },
              processManagerStartServers: { type: 'number', description: 'Start servers (for dynamic)' },
              processManagerMinSpareServers: { type: 'number', description: 'Min spare servers (for dynamic)' },
              processManagerMaxSpareServers: { type: 'number', description: 'Max spare servers (for dynamic)' },
              openBasedir: { type: 'string', description: 'Open basedir restriction' },
              timezone: { type: 'string', description: 'Timezone (e.g., UTC)' },
              disableFunctions: { type: 'string', description: 'Comma-separated disabled functions' },
              maxExecutionTime: { type: 'number', description: 'Max execution time in seconds' },
              maxInputTime: { type: 'number', description: 'Max input time in seconds' },
              maxInputVars: { type: 'number', description: 'Max input variables' },
              memoryLimit: { type: 'number', description: 'Memory limit in MB' },
              postMaxSize: { type: 'number', description: 'Max POST size in MB' },
              uploadMaxFilesize: { type: 'number', description: 'Max upload file size in MB' },
              sessionGcMaxlifetime: { type: 'number', description: 'Session GC max lifetime in seconds' },
              allowUrlFopen: { type: 'boolean', description: 'Allow URL fopen' }
            },
            required: ['serverId', 'name', 'domainName', 'user']
          }
        },
        {
          name: 'delete_webapp',
          description: 'Delete a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'set_webapp_default',
          description: 'Set a web application as default',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'remove_webapp_default',
          description: 'Remove web application from default status',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'rebuild_webapp',
          description: 'Rebuild a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'update_webapp_settings',
          description: 'Update web application settings',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              publicPath: { type: 'string', description: 'Public path' },
              stack: { type: 'string', description: 'Stack (native, hybrid)' },
              stackMode: { type: 'string', description: 'Stack mode (production, development)' },
              clickjackingProtection: { type: 'boolean' },
              xssProtection: { type: 'boolean' },
              mimeSniffingProtection: { type: 'boolean' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'change_webapp_php_version',
          description: 'Change PHP version for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              phpVersion: { type: 'string', description: 'PHP version (e.g., "php81")' }
            },
            required: ['serverId', 'webappId', 'phpVersion']
          }
        },
        {
          name: 'create_webapp_alias',
          description: 'Create a web application alias',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              name: { type: 'string', description: 'Alias name' },
              domainName: { type: 'string', description: 'Domain name for alias' },
              user: { type: 'number', description: 'System user ID' },
              publicPath: { type: 'string', description: 'Public path' },
              phpVersion: { type: 'string', description: 'PHP version' },
              stack: { type: 'string', description: 'Stack type' },
              stackMode: { type: 'string', description: 'Stack mode' },
              clickjackingProtection: { type: 'boolean', description: 'Enable clickjacking protection' },
              xssProtection: { type: 'boolean', description: 'Enable XSS protection' },
              mimeSniffingProtection: { type: 'boolean', description: 'Enable MIME sniffing protection' },
              processManager: { type: 'string', description: 'Process manager (dynamic, ondemand, static)' },
              processManagerMaxChildren: { type: 'number', description: 'Max children processes' },
              processManagerMaxRequests: { type: 'number', description: 'Max requests per process' },
              processManagerStartServers: { type: 'number', description: 'Start servers (for dynamic)' },
              processManagerMinSpareServers: { type: 'number', description: 'Min spare servers (for dynamic)' },
              processManagerMaxSpareServers: { type: 'number', description: 'Max spare servers (for dynamic)' },
              openBasedir: { type: 'string', description: 'Open basedir restriction' },
              timezone: { type: 'string', description: 'Timezone (e.g., UTC)' },
              disableFunctions: { type: 'string', description: 'Comma-separated disabled functions' },
              maxExecutionTime: { type: 'number', description: 'Max execution time in seconds' },
              maxInputTime: { type: 'number', description: 'Max input time in seconds' },
              maxInputVars: { type: 'number', description: 'Max input variables' },
              memoryLimit: { type: 'number', description: 'Memory limit in MB' },
              postMaxSize: { type: 'number', description: 'Max POST size in MB' },
              uploadMaxFilesize: { type: 'number', description: 'Max upload file size in MB' },
              sessionGcMaxlifetime: { type: 'number', description: 'Session GC max lifetime in seconds' },
              allowUrlFopen: { type: 'boolean', description: 'Allow URL fopen' }
            },
            required: ['serverId', 'webappId', 'name', 'domainName', 'user']
          }
        },
        
        // Git Integration
        {
          name: 'clone_git_repository',
          description: 'Clone a git repository for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              provider: { type: 'string', description: 'Git provider (github, gitlab, bitbucket, custom)' },
              repository: { type: 'string', description: 'Repository URL or path' },
              branch: { type: 'string', description: 'Branch name' },
              autoDeploy: { type: 'boolean', description: 'Enable auto-deployment' },
              deployKey: { type: 'string', description: 'Deploy key for private repositories' }
            },
            required: ['serverId', 'webappId', 'provider', 'repository', 'branch']
          }
        },
        {
          name: 'get_git_info',
          description: 'Get git repository information for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'change_git_branch',
          description: 'Change git branch for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              gitId: { type: 'number', description: 'The ID of the git repository' },
              branch: { type: 'string', description: 'New branch name' }
            },
            required: ['serverId', 'webappId', 'gitId', 'branch']
          }
        },
        {
          name: 'deploy_git',
          description: 'Deploy code from git repository',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              gitId: { type: 'number', description: 'The ID of the git repository' }
            },
            required: ['serverId', 'webappId', 'gitId']
          }
        },
        {
          name: 'update_git_deployment_script',
          description: 'Customize GIT deployment script',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              gitId: { type: 'number', description: 'The ID of the git repository' },
              autoDeploy: { type: 'boolean', description: 'Enable auto-deployment' },
              deployScript: { type: 'string', description: 'Custom deployment script' }
            },
            required: ['serverId', 'webappId', 'gitId']
          }
        },
        {
          name: 'delete_git_repository',
          description: 'Remove GIT repository from web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              gitId: { type: 'number', description: 'The ID of the git repository' }
            },
            required: ['serverId', 'webappId', 'gitId']
          }
        },
        
        // Domain Management
        {
          name: 'list_domains',
          description: 'List all domains for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'get_domain',
          description: 'Get information about a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' }
            },
            required: ['serverId', 'webappId', 'domainId']
          }
        },
        {
          name: 'add_domain',
          description: 'Add a domain to a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              name: { type: 'string', description: 'Domain name' }
            },
            required: ['serverId', 'webappId', 'name']
          }
        },
        {
          name: 'delete_domain',
          description: 'Delete a domain from a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' }
            },
            required: ['serverId', 'webappId', 'domainId']
          }
        },
        
        // SSL Management (Basic)
        {
          name: 'get_ssl_info',
          description: 'Get SSL certificate information for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'install_ssl',
          description: 'Install SSL certificate for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              provider: { type: 'string', description: 'SSL provider (letsencrypt, custom)' },
              hsts: { type: 'boolean', description: 'Enable HSTS' },
              http: { type: 'boolean', description: 'Allow HTTP access' },
              ssl_protocol_id: { type: 'number', description: 'SSL protocol ID' },
              privateKey: { type: 'string', description: 'Private key (custom provider only)' },
              certificate: { type: 'string', description: 'Certificate (custom provider only)' },
              certificateChain: { type: 'string', description: 'Certificate chain (custom provider only)' }
            },
            required: ['serverId', 'webappId', 'provider']
          }
        },
        {
          name: 'update_ssl',
          description: 'Update SSL configuration for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' },
              hsts: { type: 'boolean', description: 'Enable HSTS' },
              http: { type: 'boolean', description: 'Allow HTTP access' },
              ssl_protocol_id: { type: 'number', description: 'SSL protocol ID' },
              privateKey: { type: 'string', description: 'Private key' },
              certificate: { type: 'string', description: 'Certificate' },
              certificateChain: { type: 'string', description: 'Certificate chain' }
            },
            required: ['serverId', 'webappId', 'sslId']
          }
        },
        {
          name: 'redeploy_ssl',
          description: 'Redeploy SSL certificate (Let\'s Encrypt only)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' }
            },
            required: ['serverId', 'webappId', 'sslId']
          }
        },
        {
          name: 'delete_ssl',
          description: 'Delete SSL certificate from a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' }
            },
            required: ['serverId', 'webappId', 'sslId']
          }
        },
        
        // SSL Management (Advanced)
        {
          name: 'get_advanced_ssl_status',
          description: 'Get advanced SSL status for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'switch_ssl_mode',
          description: 'Switch SSL mode between basic and advanced',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              advancedSSL: { type: 'boolean', description: 'Enable advanced SSL mode' },
              autoSSL: { type: 'boolean', description: 'Enable auto SSL' }
            },
            required: ['serverId', 'webappId', 'advancedSSL']
          }
        },
        {
          name: 'install_domain_ssl',
          description: 'Install SSL certificate for a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' },
              provider: { type: 'string', description: 'SSL provider (letsencrypt, custom)' },
              privateKey: { type: 'string', description: 'Private key' },
              certificate: { type: 'string', description: 'Certificate' },
              certificateChain: { type: 'string', description: 'Certificate chain' }
            },
            required: ['serverId', 'webappId', 'domainId', 'provider']
          }
        },
        {
          name: 'get_domain_ssl_info',
          description: 'Get SSL information for a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' }
            },
            required: ['serverId', 'webappId', 'domainId']
          }
        },
        {
          name: 'update_domain_ssl',
          description: 'Update SSL certificate for a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' },
              privateKey: { type: 'string', description: 'Private key' },
              certificate: { type: 'string', description: 'Certificate' },
              certificateChain: { type: 'string', description: 'Certificate chain' }
            },
            required: ['serverId', 'webappId', 'domainId', 'sslId']
          }
        },
        {
          name: 'redeploy_domain_ssl',
          description: 'Redeploy SSL certificate for a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' }
            },
            required: ['serverId', 'webappId', 'domainId', 'sslId']
          }
        },
        {
          name: 'delete_domain_ssl',
          description: 'Delete SSL certificate from a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              domainId: { type: 'number', description: 'The ID of the domain' },
              sslId: { type: 'number', description: 'The ID of the SSL certificate' }
            },
            required: ['serverId', 'webappId', 'domainId', 'sslId']
          }
        },
        
        // Database Management
        {
          name: 'list_databases',
          description: 'List all databases on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search databases by name' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_database',
          description: 'Create a new database on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              name: { type: 'string', description: 'Database name' },
              collation: { type: 'string', description: 'Database collation' }
            },
            required: ['serverId', 'name']
          }
        },
        {
          name: 'delete_database',
          description: 'Delete a database',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              databaseId: { type: 'number', description: 'The ID of the database' }
            },
            required: ['serverId', 'databaseId']
          }
        },
        
        // Database Users
        {
          name: 'list_database_users',
          description: 'List all database users on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search users by name' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_database_user',
          description: 'Create a new database user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              username: { type: 'string', description: 'Database username' },
              password: { type: 'string', description: 'Database password' }
            },
            required: ['serverId', 'username', 'password']
          }
        },
        {
          name: 'delete_database_user',
          description: 'Delete a database user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the database user' }
            },
            required: ['serverId', 'userId']
          }
        },
        {
          name: 'update_database_user_password',
          description: 'Update database user password',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the database user' },
              password: { type: 'string', description: 'New password' }
            },
            required: ['serverId', 'userId', 'password']
          }
        },
        {
          name: 'grant_database_access',
          description: 'Grant database access to a user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the database user' },
              databaseId: { type: 'number', description: 'The ID of the database' }
            },
            required: ['serverId', 'userId', 'databaseId']
          }
        },
        {
          name: 'revoke_database_access',
          description: 'Revoke database access from a user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the database user' },
              databaseId: { type: 'number', description: 'The ID of the database' }
            },
            required: ['serverId', 'userId', 'databaseId']
          }
        },
        
        // System Users
        {
          name: 'list_system_users',
          description: 'List all system users on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search users by name' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_system_user',
          description: 'Create a new system user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              username: { type: 'string', description: 'System username' },
              password: { type: 'string', description: 'System user password' }
            },
            required: ['serverId', 'username', 'password']
          }
        },
        {
          name: 'delete_system_user',
          description: 'Delete a system user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the system user' }
            },
            required: ['serverId', 'userId']
          }
        },
        {
          name: 'update_system_user_password',
          description: 'Update system user password',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the system user' },
              password: { type: 'string', description: 'New password' }
            },
            required: ['serverId', 'userId', 'password']
          }
        },
        
        // SSH Keys
        {
          name: 'list_ssh_keys',
          description: 'List SSH keys for a system user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the system user' }
            },
            required: ['serverId', 'userId']
          }
        },
        {
          name: 'add_ssh_key',
          description: 'Add SSH key for a system user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the system user' },
              label: { type: 'string', description: 'SSH key label' },
              publicKey: { type: 'string', description: 'SSH public key' }
            },
            required: ['serverId', 'userId', 'label', 'publicKey']
          }
        },
        {
          name: 'delete_ssh_key',
          description: 'Delete SSH key',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              userId: { type: 'number', description: 'The ID of the system user' },
              keyId: { type: 'number', description: 'The ID of the SSH key' }
            },
            required: ['serverId', 'userId', 'keyId']
          }
        },
        
        // Cron Jobs
        {
          name: 'list_cron_jobs',
          description: 'List all cron jobs for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'create_cron_job',
          description: 'Create a new cron job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              label: { type: 'string', description: 'Cron job label' },
              command: { type: 'string', description: 'Command to execute' },
              user: { type: 'string', description: 'User to run as' },
              cronExpression: { type: 'string', description: 'Cron expression (e.g., "0 0 * * *")' }
            },
            required: ['serverId', 'webappId', 'label', 'command', 'user', 'cronExpression']
          }
        },
        {
          name: 'delete_cron_job',
          description: 'Delete a cron job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              cronId: { type: 'number', description: 'The ID of the cron job' }
            },
            required: ['serverId', 'webappId', 'cronId']
          }
        },
        
        // Services
        {
          name: 'list_services',
          description: 'List all services with their status',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'control_service',
          description: 'Control a service (start, stop, restart, reload)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              serviceName: { type: 'string', description: 'Service name' },
              action: { type: 'string', description: 'Action (start, stop, restart, reload)' }
            },
            required: ['serverId', 'serviceName', 'action']
          }
        },
        
        // Supervisor Jobs
        {
          name: 'list_supervisor_jobs',
          description: 'List all supervisor jobs',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_supervisor_job',
          description: 'Create a new supervisor job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              jobName: { type: 'string', description: 'Job name' },
              user: { type: 'string', description: 'User to run as' },
              command: { type: 'string', description: 'Command to execute' },
              directory: { type: 'string', description: 'Working directory' },
              processCount: { type: 'number', description: 'Number of processes' },
              autoStart: { type: 'boolean', description: 'Auto-start job' },
              autoRestart: { type: 'boolean', description: 'Auto-restart job' }
            },
            required: ['serverId', 'jobName', 'user', 'command']
          }
        },
        {
          name: 'delete_supervisor_job',
          description: 'Delete a supervisor job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              jobId: { type: 'number', description: 'The ID of the supervisor job' }
            },
            required: ['serverId', 'jobId']
          }
        },
        {
          name: 'control_supervisor_job',
          description: 'Control a supervisor job (start, stop, restart)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              jobId: { type: 'number', description: 'The ID of the supervisor job' },
              action: { type: 'string', description: 'Action (start, stop, restart)' }
            },
            required: ['serverId', 'jobId', 'action']
          }
        },
        
        // Logs
        {
          name: 'get_server_logs',
          description: 'Get server logs',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              type: { type: 'string', description: 'Log type (nginx_error, nginx_access, mysql_error, etc.)' },
              lines: { type: 'number', description: 'Number of lines to retrieve' }
            },
            required: ['serverId', 'type']
          }
        },
        {
          name: 'get_webapp_logs',
          description: 'Get web application logs',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              type: { type: 'string', description: 'Log type (error, access, php_error)' },
              lines: { type: 'number', description: 'Number of lines to retrieve' }
            },
            required: ['serverId', 'webappId', 'type']
          }
        },
        
        // Script Installers
        {
          name: 'get_installed_script',
          description: 'Get installed PHP script information',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
          }
        },
        {
          name: 'remove_installed_script',
          description: 'Remove installed PHP script',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              installerId: { type: 'number', description: 'The ID of the installer' }
            },
            required: ['serverId', 'webappId', 'installerId']
          }
        },
        {
          name: 'install_script',
          description: 'Install a script (WordPress, Joomla, Drupal, phpMyAdmin, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              installerId: { type: 'number', description: 'The ID of the installer script' },
              admin_username: { type: 'string', description: 'Admin username' },
              admin_email: { type: 'string', description: 'Admin email' },
              admin_password: { type: 'string', description: 'Admin password' },
              site_title: { type: 'string', description: 'Site title' },
              language: { type: 'string', description: 'Installation language' }
            },
            required: ['serverId', 'webappId', 'installerId']
          }
        },
        
        // Firewall Management
        {
          name: 'create_firewall_rule',
          description: 'Create a new firewall rule',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              type: { type: 'string', description: 'Rule type (ip, port)' },
              port: { type: 'number', description: 'Port number (for port type)' },
              protocol: { type: 'string', description: 'Protocol (tcp, udp)' },
              ipAddress: { type: 'string', description: 'IP address (for ip type)' },
              firewallAction: { type: 'string', description: 'Action (accept, reject)' }
            },
            required: ['serverId', 'type']
          }
        },
        {
          name: 'list_firewall_rules',
          description: 'List all firewall rules',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'get_firewall_rule',
          description: 'Get information about a specific firewall rule',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              firewallId: { type: 'number', description: 'The ID of the firewall rule' }
            },
            required: ['serverId', 'firewallId']
          }
        },
        {
          name: 'deploy_firewall_rules',
          description: 'Deploy firewall rules to the server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'delete_firewall_rule',
          description: 'Delete a firewall rule',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              firewallId: { type: 'number', description: 'The ID of the firewall rule' }
            },
            required: ['serverId', 'firewallId']
          }
        },
        
        // Fail2Ban Management
        {
          name: 'list_blocked_ips',
          description: 'List blocked IP addresses in Fail2Ban',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'unblock_ip',
          description: 'Unblock an IP address from Fail2Ban',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              ip: { type: 'string', description: 'IP address to unblock' }
            },
            required: ['serverId', 'ip']
          }
        },
        
        // Static Data Endpoints
        {
          name: 'list_database_collations',
          description: 'Get list of available database collations',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'list_timezones',
          description: 'Get list of available timezones',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'list_script_installers',
          description: 'Get list of available script installers',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'list_ssl_protocols',
          description: 'Get list of available SSL protocols',
          inputSchema: {
            type: 'object',
            properties: {
              webServer: { type: 'string', description: 'Web server type (nginx, apache)' }
            },
            required: ['webServer']
          }
        },
        
        // 3rd Party API Keys
        {
          name: 'create_external_api_key',
          description: 'Create a new 3rd party API key',
          inputSchema: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'API key label' },
              service: { type: 'string', description: 'Service (cloudflare, linode, digitalocean)' },
              username: { type: 'string', description: 'Username (for cloudflare)' },
              secret: { type: 'string', description: 'API key/secret' }
            },
            required: ['label', 'service', 'secret']
          }
        },
        {
          name: 'list_external_api_keys',
          description: 'List all 3rd party API keys',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search API keys by label' }
            }
          }
        },
        {
          name: 'get_external_api_key',
          description: 'Get information about a specific API key',
          inputSchema: {
            type: 'object',
            properties: {
              apiId: { type: 'number', description: 'The ID of the API key' }
            },
            required: ['apiId']
          }
        },
        {
          name: 'update_external_api_key',
          description: 'Update a 3rd party API key',
          inputSchema: {
            type: 'object',
            properties: {
              apiId: { type: 'number', description: 'The ID of the API key' },
              label: { type: 'string', description: 'API key label' },
              username: { type: 'string', description: 'Username' },
              secret: { type: 'string', description: 'API key/secret' }
            },
            required: ['apiId']
          }
        },
        {
          name: 'delete_external_api_key',
          description: 'Delete a 3rd party API key',
          inputSchema: {
            type: 'object',
            properties: {
              apiId: { type: 'number', description: 'The ID of the API key' }
            },
            required: ['apiId']
          }
        },
        
        // Health Check
        {
          name: 'health_check',
          description: 'Check API health status',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Server Management
          case 'list_servers':
            return await this.listServers(args);
          case 'get_server':
            return await this.getServer(args);
          case 'create_server':
            return await this.createServer(args);
          case 'delete_server':
            return await this.deleteServer(args);
          case 'get_server_stats':
            return await this.getServerStats(args);
          case 'get_server_hardware_info':
            return await this.getServerHardwareInfo(args);
          case 'get_installation_script':
            return await this.getInstallationScript(args);
          
          // Server Settings
          case 'get_ssh_settings':
            return await this.getSshSettings(args);
          case 'update_ssh_settings':
            return await this.updateSshSettings(args);
          case 'update_server_metadata':
            return await this.updateServerMetadata(args);
          case 'update_server_autoupdate':
            return await this.updateServerAutoupdate(args);
          
          // PHP Management
          case 'list_php_versions':
            return await this.listPhpVersions(args);
          case 'change_php_cli_version':
            return await this.changePhpCliVersion(args);
          
          // Shared Servers
          case 'list_shared_servers':
            return await this.listSharedServers(args);
          
          // Web Applications
          case 'list_webapps':
            return await this.listWebapps(args);
          case 'get_webapp':
            return await this.getWebapp(args);
          case 'create_webapp':
            return await this.createWebapp(args);
          case 'delete_webapp':
            return await this.deleteWebapp(args);
          case 'set_webapp_default':
            return await this.setWebappDefault(args);
          case 'remove_webapp_default':
            return await this.removeWebappDefault(args);
          case 'rebuild_webapp':
            return await this.rebuildWebapp(args);
          case 'update_webapp_settings':
            return await this.updateWebappSettings(args);
          case 'change_webapp_php_version':
            return await this.changeWebappPhpVersion(args);
          case 'create_webapp_alias':
            return await this.createWebappAlias(args);
          
          // Git Integration
          case 'clone_git_repository':
            return await this.cloneGitRepository(args);
          case 'get_git_info':
            return await this.getGitInfo(args);
          case 'change_git_branch':
            return await this.changeGitBranch(args);
          case 'deploy_git':
            return await this.deployGit(args);
          case 'update_git_deployment_script':
            return await this.updateGitDeploymentScript(args);
          case 'delete_git_repository':
            return await this.deleteGitRepository(args);
          
          // Domain Management
          case 'list_domains':
            return await this.listDomains(args);
          case 'get_domain':
            return await this.getDomain(args);
          case 'add_domain':
            return await this.addDomain(args);
          case 'delete_domain':
            return await this.deleteDomain(args);
          
          // SSL Management (Basic)
          case 'get_ssl_info':
            return await this.getSslInfo(args);
          case 'install_ssl':
            return await this.installSsl(args);
          case 'update_ssl':
            return await this.updateSsl(args);
          case 'redeploy_ssl':
            return await this.redeploySsl(args);
          case 'delete_ssl':
            return await this.deleteSsl(args);
          
          // SSL Management (Advanced)
          case 'get_advanced_ssl_status':
            return await this.getAdvancedSslStatus(args);
          case 'switch_ssl_mode':
            return await this.switchSslMode(args);
          case 'install_domain_ssl':
            return await this.installDomainSsl(args);
          case 'get_domain_ssl_info':
            return await this.getDomainSslInfo(args);
          case 'update_domain_ssl':
            return await this.updateDomainSsl(args);
          case 'redeploy_domain_ssl':
            return await this.redeployDomainSsl(args);
          case 'delete_domain_ssl':
            return await this.deleteDomainSsl(args);
          
          // Database Management
          case 'list_databases':
            return await this.listDatabases(args);
          case 'create_database':
            return await this.createDatabase(args);
          case 'delete_database':
            return await this.deleteDatabase(args);
          
          // Database Users
          case 'list_database_users':
            return await this.listDatabaseUsers(args);
          case 'create_database_user':
            return await this.createDatabaseUser(args);
          case 'delete_database_user':
            return await this.deleteDatabaseUser(args);
          case 'update_database_user_password':
            return await this.updateDatabaseUserPassword(args);
          case 'grant_database_access':
            return await this.grantDatabaseAccess(args);
          case 'revoke_database_access':
            return await this.revokeDatabaseAccess(args);
          
          // System Users
          case 'list_system_users':
            return await this.listSystemUsers(args);
          case 'create_system_user':
            return await this.createSystemUser(args);
          case 'delete_system_user':
            return await this.deleteSystemUser(args);
          case 'update_system_user_password':
            return await this.updateSystemUserPassword(args);
          
          // SSH Keys
          case 'list_ssh_keys':
            return await this.listSshKeys(args);
          case 'add_ssh_key':
            return await this.addSshKey(args);
          case 'delete_ssh_key':
            return await this.deleteSshKey(args);
          
          // Cron Jobs
          case 'list_cron_jobs':
            return await this.listCronJobs(args);
          case 'create_cron_job':
            return await this.createCronJob(args);
          case 'delete_cron_job':
            return await this.deleteCronJob(args);
          
          // Services
          case 'list_services':
            return await this.listServices(args);
          case 'control_service':
            return await this.controlService(args);
          
          // Supervisor Jobs
          case 'list_supervisor_jobs':
            return await this.listSupervisorJobs(args);
          case 'create_supervisor_job':
            return await this.createSupervisorJob(args);
          case 'delete_supervisor_job':
            return await this.deleteSupervisorJob(args);
          case 'control_supervisor_job':
            return await this.controlSupervisorJob(args);
          
          // Logs
          case 'get_server_logs':
            return await this.getServerLogs(args);
          case 'get_webapp_logs':
            return await this.getWebappLogs(args);
          
          // Script Installers
          case 'get_installed_script':
            return await this.getInstalledScript(args);
          case 'remove_installed_script':
            return await this.removeInstalledScript(args);
          case 'install_script':
            return await this.installScript(args);
          
          // Firewall Management
          case 'create_firewall_rule':
            return await this.createFirewallRule(args);
          case 'list_firewall_rules':
            return await this.listFirewallRules(args);
          case 'get_firewall_rule':
            return await this.getFirewallRule(args);
          case 'deploy_firewall_rules':
            return await this.deployFirewallRules(args);
          case 'delete_firewall_rule':
            return await this.deleteFirewallRule(args);
          
          // Fail2Ban Management
          case 'list_blocked_ips':
            return await this.listBlockedIps(args);
          case 'unblock_ip':
            return await this.unblockIp(args);
          
          // Static Data Endpoints
          case 'list_database_collations':
            return await this.listDatabaseCollations(args);
          case 'list_timezones':
            return await this.listTimezones(args);
          case 'list_script_installers':
            return await this.listScriptInstallers(args);
          case 'list_ssl_protocols':
            return await this.listSslProtocols(args);
          
          // 3rd Party API Keys
          case 'create_external_api_key':
            return await this.createExternalApiKey(args);
          case 'list_external_api_keys':
            return await this.listExternalApiKeys(args);
          case 'get_external_api_key':
            return await this.getExternalApiKey(args);
          case 'update_external_api_key':
            return await this.updateExternalApiKey(args);
          case 'delete_external_api_key':
            return await this.deleteExternalApiKey(args);
          
          // Health Check
          case 'health_check':
            return await this.healthCheck(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error.response) {
          throw new McpError(
            ErrorCode.InternalError,
            `RunCloud API error: ${error.response.data.message || error.response.statusText}`
          );
        }
        throw error;
      }
    });
  }

  // Helper method for API responses
  async apiResponse(promise) {
    try {
      const response = await promise;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      if (error.response) {
        throw new McpError(
          ErrorCode.InternalError,
          `RunCloud API error: ${error.response.data.message || error.response.statusText}`
        );
      }
      throw error;
    }
  }

  // Server Management Methods
  async listServers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get('/servers', { params }));
  }

  async getServer(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}`));
  }

  async createServer(args) {
    const data = {
      name: args.name,
      ipAddress: args.ipAddress,
      provider: args.provider || 'custom'
    };
    return this.apiResponse(api.post('/servers', data));
  }

  async deleteServer(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}`));
  }

  async getServerStats(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/stats`));
  }

  async getServerHardwareInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/hardwareInfo`));
  }

  async getInstallationScript(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/installationScript`));
  }

  // Server Settings Methods
  async getSshSettings(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/settings/ssh`));
  }

  async updateSshSettings(args) {
    const data = {};
    if (args.passwordlessLogin !== undefined) data.passwordlessLogin = args.passwordlessLogin;
    if (args.useDns !== undefined) data.useDns = args.useDns;
    if (args.preventRootLogin !== undefined) data.preventRootLogin = args.preventRootLogin;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/settings/ssh`, data));
  }

  async updateServerMetadata(args) {
    const data = {};
    if (args.name) data.name = args.name;
    if (args.provider) data.provider = args.provider;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/settings/meta`, data));
  }

  async updateServerAutoupdate(args) {
    const data = {};
    if (args.softwareUpdate !== undefined) data.softwareUpdate = args.softwareUpdate;
    if (args.securityUpdate !== undefined) data.securityUpdate = args.securityUpdate;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/settings/autoupdate`, data));
  }

  // PHP Management Methods
  async listPhpVersions(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/php/version`));
  }

  async changePhpCliVersion(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/php/cli`, { phpVersion: args.phpVersion }));
  }

  // Shared Servers
  async listSharedServers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    return this.apiResponse(api.get('/servers/shared', { params }));
  }

  // Web Application Methods
  async listWebapps(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps`, { params }));
  }

  async getWebapp(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}`));
  }

  async createWebapp(args) {
    const data = {
      name: args.name,
      domainName: args.domainName,
      user: args.user,
      publicPath: args.publicPath || '/',
      phpVersion: args.phpVersion || 'php74',
      stack: args.stack || 'native',
      stackMode: args.stackMode || 'production',
      clickjackingProtection: args.clickjackingProtection === false ? false : true,
      xssProtection: args.xssProtection === false ? false : true,
      mimeSniffingProtection: args.mimeSniffingProtection === false ? false : true,
      processManager: args.processManager || 'ondemand',
      processManagerMaxChildren: args.processManagerMaxChildren || 50,
      processManagerMaxRequests: args.processManagerMaxRequests || 500,
      timezone: args.timezone || 'UTC',
      disableFunctions: args.disableFunctions || '',
      maxExecutionTime: args.maxExecutionTime || 30,
      maxInputTime: args.maxInputTime || 60,
      maxInputVars: args.maxInputVars || 1000,
      memoryLimit: args.memoryLimit || 256,
      postMaxSize: args.postMaxSize || 256,
      uploadMaxFilesize: args.uploadMaxFilesize || 256,
      sessionGcMaxlifetime: args.sessionGcMaxlifetime || 1440,
      allowUrlFopen: args.allowUrlFopen === false ? false : true
    };
    
    // Add dynamic process manager fields if needed
    if (data.processManager === 'dynamic') {
      data.processManagerStartServers = args.processManagerStartServers || 2;
      data.processManagerMinSpareServers = args.processManagerMinSpareServers || 1;
      data.processManagerMaxSpareServers = args.processManagerMaxSpareServers || 3;
    }
    
    // Add openBasedir if provided
    if (args.openBasedir !== undefined) {
      data.openBasedir = args.openBasedir;
    }
    
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/custom`, data));
  }

  async deleteWebapp(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}`));
  }

  async setWebappDefault(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/default`));
  }

  async removeWebappDefault(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/default`));
  }

  async rebuildWebapp(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/rebuild`));
  }

  async updateWebappSettings(args) {
    const data = {};
    if (args.publicPath !== undefined) data.publicPath = args.publicPath;
    if (args.stack) data.stack = args.stack;
    if (args.stackMode) data.stackMode = args.stackMode;
    if (args.clickjackingProtection !== undefined) data.clickjackingProtection = args.clickjackingProtection;
    if (args.xssProtection !== undefined) data.xssProtection = args.xssProtection;
    if (args.mimeSniffingProtection !== undefined) data.mimeSniffingProtection = args.mimeSniffingProtection;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/settings/fpmnginx`, data));
  }

  async changeWebappPhpVersion(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/settings/php`, { phpVersion: args.phpVersion }));
  }

  async createWebappAlias(args) {
    const data = {
      name: args.name,
      domainName: args.domainName,
      user: args.user,
      publicPath: args.publicPath || '/',
      phpVersion: args.phpVersion || 'php74',
      stack: args.stack || 'native',
      stackMode: args.stackMode || 'production',
      clickjackingProtection: args.clickjackingProtection === false ? false : true,
      xssProtection: args.xssProtection === false ? false : true,
      mimeSniffingProtection: args.mimeSniffingProtection === false ? false : true,
      processManager: args.processManager || 'ondemand',
      processManagerMaxChildren: args.processManagerMaxChildren || 50,
      processManagerMaxRequests: args.processManagerMaxRequests || 500,
      timezone: args.timezone || 'UTC',
      disableFunctions: args.disableFunctions || '',
      maxExecutionTime: args.maxExecutionTime || 30,
      maxInputTime: args.maxInputTime || 60,
      maxInputVars: args.maxInputVars || 1000,
      memoryLimit: args.memoryLimit || 256,
      postMaxSize: args.postMaxSize || 256,
      uploadMaxFilesize: args.uploadMaxFilesize || 256,
      sessionGcMaxlifetime: args.sessionGcMaxlifetime || 1440,
      allowUrlFopen: args.allowUrlFopen === false ? false : true
    };
    
    // Add dynamic process manager fields if needed
    if (data.processManager === 'dynamic') {
      data.processManagerStartServers = args.processManagerStartServers || 2;
      data.processManagerMinSpareServers = args.processManagerMinSpareServers || 1;
      data.processManagerMaxSpareServers = args.processManagerMaxSpareServers || 3;
    }
    
    // Add openBasedir if provided
    if (args.openBasedir !== undefined) {
      data.openBasedir = args.openBasedir;
    }
    
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/alias`, data));
  }

  // Git Integration Methods
  async cloneGitRepository(args) {
    const data = {
      provider: args.provider,
      repository: args.repository,
      branch: args.branch,
      autoDeploy: args.autoDeploy || false
    };
    if (args.deployKey) data.deployKey = args.deployKey;
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/git`, data));
  }

  async getGitInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/git`));
  }

  async changeGitBranch(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/branch`, { branch: args.branch }));
  }

  async deployGit(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/deploy`));
  }

  async updateGitDeploymentScript(args) {
    const data = {};
    if (args.autoDeploy !== undefined) data.autoDeploy = args.autoDeploy;
    if (args.deployScript) data.deployScript = args.deployScript;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/script`, data));
  }

  async deleteGitRepository(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}`));
  }

  // Domain Management Methods
  async listDomains(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/domains`));
  }

  async getDomain(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}`));
  }

  async addDomain(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/domains`, { name: args.name }));
  }

  async deleteDomain(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}`));
  }

  // SSL Management (Basic) Methods
  async getSslInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/ssl`));
  }

  async installSsl(args) {
    const data = {
      provider: args.provider,
      hsts: args.hsts !== false,
      http: args.http !== false
    };
    if (args.ssl_protocol_id) data.ssl_protocol_id = args.ssl_protocol_id;
    if (args.provider === 'custom') {
      data.privateKey = args.privateKey;
      data.certificate = args.certificate;
      if (args.certificateChain) data.certificateChain = args.certificateChain;
    }
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/ssl`, data));
  }

  async updateSsl(args) {
    const data = {};
    if (args.hsts !== undefined) data.hsts = args.hsts;
    if (args.http !== undefined) data.http = args.http;
    if (args.ssl_protocol_id) data.ssl_protocol_id = args.ssl_protocol_id;
    if (args.privateKey) data.privateKey = args.privateKey;
    if (args.certificate) data.certificate = args.certificate;
    if (args.certificateChain) data.certificateChain = args.certificateChain;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/${args.sslId}`, data));
  }

  async redeploySsl(args) {
    return this.apiResponse(api.put(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/${args.sslId}`));
  }

  async deleteSsl(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/${args.sslId}`));
  }

  // SSL Management (Advanced) Methods
  async getAdvancedSslStatus(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/advanced`));
  }

  async switchSslMode(args) {
    const data = {
      advancedSSL: args.advancedSSL,
      autoSSL: args.autoSSL || false
    };
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/advanced`, data));
  }

  async installDomainSsl(args) {
    const data = {
      provider: args.provider
    };
    if (args.provider === 'custom') {
      data.privateKey = args.privateKey;
      data.certificate = args.certificate;
      if (args.certificateChain) data.certificateChain = args.certificateChain;
    }
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}/ssl/advanced`, data));
  }

  async getDomainSslInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}/ssl/advanced`));
  }

  async updateDomainSsl(args) {
    const data = {};
    if (args.privateKey) data.privateKey = args.privateKey;
    if (args.certificate) data.certificate = args.certificate;
    if (args.certificateChain) data.certificateChain = args.certificateChain;
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}/ssl/${args.sslId}`, data));
  }

  async redeployDomainSsl(args) {
    return this.apiResponse(api.put(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}/ssl/${args.sslId}`));
  }

  async deleteDomainSsl(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}/ssl/${args.sslId}`));
  }

  // Database Management Methods
  async listDatabases(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/databases`, { params }));
  }

  async createDatabase(args) {
    const data = {
      name: args.name,
      collation: args.collation || 'utf8mb4_general_ci'
    };
    return this.apiResponse(api.post(`/servers/${args.serverId}/databases`, data));
  }

  async deleteDatabase(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/databases/${args.databaseId}`));
  }

  // Database User Methods
  async listDatabaseUsers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/databaseusers`, { params }));
  }

  async createDatabaseUser(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/databaseusers`, {
      username: args.username,
      password: args.password
    }));
  }

  async deleteDatabaseUser(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/databaseusers/${args.userId}`));
  }

  async updateDatabaseUserPassword(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/databaseusers/${args.userId}`, { password: args.password }));
  }

  async grantDatabaseAccess(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/databaseusers/${args.userId}/grant`, { databaseId: args.databaseId }));
  }

  async revokeDatabaseAccess(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/databaseusers/${args.userId}/grant/${args.databaseId}`));
  }

  // System User Methods
  async listSystemUsers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/users`, { params }));
  }

  async createSystemUser(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/users`, {
      username: args.username,
      password: args.password
    }));
  }

  async deleteSystemUser(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/users/${args.userId}`));
  }

  async updateSystemUserPassword(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/users/${args.userId}`, { password: args.password }));
  }

  // SSH Key Methods
  async listSshKeys(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/users/${args.userId}/sshkeys`));
  }

  async addSshKey(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/users/${args.userId}/sshkeys`, {
      label: args.label,
      publicKey: args.publicKey
    }));
  }

  async deleteSshKey(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/users/${args.userId}/sshkeys/${args.keyId}`));
  }

  // Cron Job Methods
  async listCronJobs(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/cronjobs`));
  }

  async createCronJob(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/cronjobs`, {
      label: args.label,
      command: args.command,
      user: args.user,
      cronExpression: args.cronExpression
    }));
  }

  async deleteCronJob(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/cronjobs/${args.cronId}`));
  }

  // Service Methods
  async listServices(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/services`));
  }

  async controlService(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/services/${args.serviceName}`, { action: args.action }));
  }

  // Supervisor Job Methods
  async listSupervisorJobs(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/supervisorjobs`));
  }

  async createSupervisorJob(args) {
    const data = {
      jobName: args.jobName,
      user: args.user,
      command: args.command,
      directory: args.directory || '',
      processCount: args.processCount || 1,
      autoStart: args.autoStart !== false,
      autoRestart: args.autoRestart !== false
    };
    return this.apiResponse(api.post(`/servers/${args.serverId}/supervisorjobs`, data));
  }

  async deleteSupervisorJob(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/supervisorjobs/${args.jobId}`));
  }

  async controlSupervisorJob(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/supervisorjobs/${args.jobId}`, { action: args.action }));
  }

  // Log Methods
  async getServerLogs(args) {
    const params = {};
    if (args.lines) params.lines = args.lines;
    return this.apiResponse(api.get(`/servers/${args.serverId}/logs/${args.type}`, { params }));
  }

  async getWebappLogs(args) {
    const params = {};
    if (args.lines) params.lines = args.lines;
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/logs/${args.type}`, { params }));
  }

  // Script Installer Methods
  async getInstalledScript(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/installer`));
  }

  async removeInstalledScript(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/installer/${args.installerId}`));
  }

  async installScript(args) {
    const data = {
      installerId: args.installerId
    };
    if (args.admin_username) data.admin_username = args.admin_username;
    if (args.admin_email) data.admin_email = args.admin_email;
    if (args.admin_password) data.admin_password = args.admin_password;
    if (args.site_title) data.site_title = args.site_title;
    if (args.language) data.language = args.language;
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/installer`, data));
  }

  // Firewall Management Methods
  async createFirewallRule(args) {
    const data = {
      type: args.type
    };
    if (args.type === 'port') {
      data.port = args.port;
      data.protocol = args.protocol || 'tcp';
    } else if (args.type === 'ip') {
      data.ipAddress = args.ipAddress;
      data.firewallAction = args.firewallAction || 'accept';
    }
    return this.apiResponse(api.post(`/servers/${args.serverId}/security/firewalls`, data));
  }

  async listFirewallRules(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/security/firewalls`));
  }

  async getFirewallRule(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/security/firewalls/${args.firewallId}`));
  }

  async deployFirewallRules(args) {
    return this.apiResponse(api.put(`/servers/${args.serverId}/security/firewalls`));
  }

  async deleteFirewallRule(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/security/firewalls/${args.firewallId}`));
  }

  // Fail2Ban Management Methods
  async listBlockedIps(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/security/fail2ban/blockedip`));
  }

  async unblockIp(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/security/fail2ban/blockedip`, { data: { ip: args.ip } }));
  }

  // Static Data Methods
  async listDatabaseCollations(args) {
    return this.apiResponse(api.get('/static/databases/collations'));
  }

  async listTimezones(args) {
    return this.apiResponse(api.get('/static/timezones'));
  }

  async listScriptInstallers(args) {
    return this.apiResponse(api.get('/static/webapps/installers'));
  }

  async listSslProtocols(args) {
    return this.apiResponse(api.get('/static/ssl/protocols', { params: { webServer: args.webServer } }));
  }

  // 3rd Party API Key Methods
  async createExternalApiKey(args) {
    const data = {
      label: args.label,
      service: args.service,
      secret: args.secret
    };
    if (args.username) data.username = args.username;
    return this.apiResponse(api.post('/settings/externalapi', data));
  }

  async listExternalApiKeys(args) {
    const params = {};
    if (args.search) params.search = args.search;
    return this.apiResponse(api.get('/settings/externalapi', { params }));
  }

  async getExternalApiKey(args) {
    return this.apiResponse(api.get(`/settings/externalapi/${args.apiId}`));
  }

  async updateExternalApiKey(args) {
    const data = {};
    if (args.label) data.label = args.label;
    if (args.username) data.username = args.username;
    if (args.secret) data.secret = args.secret;
    return this.apiResponse(api.patch(`/settings/externalapi/${args.apiId}`, data));
  }

  async deleteExternalApiKey(args) {
    return this.apiResponse(api.delete(`/settings/externalapi/${args.apiId}`));
  }

  // Health Check Method
  async healthCheck(args) {
    return this.apiResponse(api.get('/ping'));
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RunCloud MCP Server (v2.0.1) running...');
  }
}

const server = new RunCloudMCPServer();
server.run().catch(console.error);