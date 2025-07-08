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
        version: '1.0.0',
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
              serverId: { type: 'number', description: 'The ID of the server' }
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

        // Web Applications
        {
          name: 'list_webapps',
          description: 'List all web applications on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search web apps by name' },
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
              name: { type: 'string', description: 'Name of the web application' },
              domainName: { type: 'string', description: 'Domain name for the web application' },
              user: { type: 'string', description: 'System user for the web application' },
              phpVersion: { type: 'string', description: 'PHP version (e.g., "php80rc", "php81rc")' },
              stack: { type: 'string', enum: ['hybrid', 'nativenginx'], description: 'Web server stack' },
              stackMode: { type: 'string', enum: ['production', 'development'], description: 'Stack mode' }
            },
            required: ['serverId', 'name', 'domainName', 'user', 'phpVersion', 'stack', 'stackMode']
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

        // Git Integration
        {
          name: 'clone_git_repository',
          description: 'Clone a git repository for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              provider: { type: 'string', enum: ['github', 'gitlab', 'bitbucket', 'custom'], description: 'Git provider' },
              repository: { type: 'string', description: 'Repository URL or path' },
              branch: { type: 'string', description: 'Branch to clone' },
              autoDeploy: { type: 'boolean', description: 'Enable auto deployment' }
            },
            required: ['serverId', 'webappId', 'provider', 'repository']
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
              gitId: { type: 'number', description: 'The ID of the git configuration' },
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
              gitId: { type: 'number', description: 'The ID of the git configuration' }
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
          name: 'add_domain',
          description: 'Add a domain to a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              name: { type: 'string', description: 'Domain name' },
              type: { type: 'string', enum: ['primary', 'alias', 'redirect'], description: 'Domain type' },
              enableWww: { type: 'boolean', description: 'Enable www subdomain' },
              wwwRedirect: { type: 'string', enum: ['none', 'www', 'non-www'], description: 'WWW redirect type' }
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

        // SSL Management
        {
          name: 'install_ssl',
          description: 'Install SSL certificate for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              provider: { type: 'string', enum: ['letsencrypt', 'custom'], description: 'SSL provider' },
              enableHttp: { type: 'boolean', description: 'Enable HTTP' },
              enableHsts: { type: 'boolean', description: 'Enable HSTS' },
              sslCert: { type: 'string', description: 'SSL certificate (for custom provider)' },
              sslKey: { type: 'string', description: 'SSL key (for custom provider)' },
              sslCa: { type: 'string', description: 'SSL CA certificate (for custom provider)' }
            },
            required: ['serverId', 'webappId', 'provider']
          }
        },
        {
          name: 'get_ssl_info',
          description: 'Get SSL certificate information',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' }
            },
            required: ['serverId', 'webappId']
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
              name: { type: 'string', description: 'Name of the database' },
              collation: { type: 'string', description: 'Database collation (default: utf8mb4_unicode_ci)' }
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
              search: { type: 'string', description: 'Search users by username' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_database_user',
          description: 'Create a new database user on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              username: { type: 'string', description: 'Username for the database user' },
              password: { type: 'string', description: 'Password for the database user' }
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
              databaseId: { type: 'number', description: 'The ID of the database' },
              userId: { type: 'number', description: 'The ID of the database user' }
            },
            required: ['serverId', 'databaseId', 'userId']
          }
        },
        {
          name: 'revoke_database_access',
          description: 'Revoke database access from a user',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              databaseId: { type: 'number', description: 'The ID of the database' },
              userId: { type: 'number', description: 'The ID of the database user' }
            },
            required: ['serverId', 'databaseId', 'userId']
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
              search: { type: 'string', description: 'Search users by username' },
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
              username: { type: 'string', description: 'Username' },
              password: { type: 'string', description: 'Password' }
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
          description: 'List all SSH keys for a system user',
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
              name: { type: 'string', description: 'Name of the SSH key' },
              publicKey: { type: 'string', description: 'Public SSH key' }
            },
            required: ['serverId', 'userId', 'name', 'publicKey']
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
          description: 'List all cron jobs on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search cron jobs' },
              page: { type: 'number', description: 'Page number for pagination' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'create_cron_job',
          description: 'Create a new cron job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              label: { type: 'string', description: 'Label for the cron job' },
              username: { type: 'string', description: 'System user to run the cron job' },
              command: { type: 'string', description: 'Command to execute' },
              minute: { type: 'string', description: 'Minute (0-59, *, */n)' },
              hour: { type: 'string', description: 'Hour (0-23, *, */n)' },
              dayOfMonth: { type: 'string', description: 'Day of month (1-31, *, */n)' },
              month: { type: 'string', description: 'Month (1-12, *, */n)' },
              dayOfWeek: { type: 'string', description: 'Day of week (0-7, *, */n)' }
            },
            required: ['serverId', 'label', 'username', 'command', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
          }
        },
        {
          name: 'delete_cron_job',
          description: 'Delete a cron job',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              cronId: { type: 'number', description: 'The ID of the cron job' }
            },
            required: ['serverId', 'cronId']
          }
        },

        // Services
        {
          name: 'list_services',
          description: 'List all services on a server with their status',
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
          description: 'Start, stop, restart, or reload a service on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              action: { type: 'string', enum: ['start', 'stop', 'restart', 'reload'], description: 'Action to perform' },
              service: { type: 'string', enum: ['nginx-rc', 'apache2-rc', 'mysql', 'redis-server', 'memcached', 'beanstalkd', 'supervisord'], description: 'Service name' }
            },
            required: ['serverId', 'action', 'service']
          }
        },

        // Supervisor Jobs
        {
          name: 'list_supervisor_jobs',
          description: 'List all supervisor jobs on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              search: { type: 'string', description: 'Search supervisor jobs' },
              page: { type: 'number', description: 'Page number for pagination' }
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
              name: { type: 'string', description: 'Name of the supervisor job' },
              username: { type: 'string', description: 'System user to run the job' },
              directory: { type: 'string', description: 'Working directory' },
              command: { type: 'string', description: 'Command to execute' },
              processNum: { type: 'number', description: 'Number of processes' },
              autoStart: { type: 'boolean', description: 'Auto start on boot' },
              autoRestart: { type: 'boolean', description: 'Auto restart on failure' },
              startSecs: { type: 'number', description: 'Start seconds' },
              environment: { type: 'string', description: 'Environment variables' }
            },
            required: ['serverId', 'name', 'username', 'directory', 'command']
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
          description: 'Control a supervisor job (start/stop/restart)',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              jobId: { type: 'number', description: 'The ID of the supervisor job' },
              action: { type: 'string', enum: ['start', 'stop', 'restart'], description: 'Action to perform' }
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
              type: { type: 'string', enum: ['agent', 'nginx-error', 'nginx-access', 'apache-error', 'apache-access', 'mysql-general', 'mysql-error', 'mysql-slow-query'], description: 'Log type' },
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
              type: { type: 'string', enum: ['error', 'access'], description: 'Log type' },
              lines: { type: 'number', description: 'Number of lines to retrieve' }
            },
            required: ['serverId', 'webappId', 'type']
          }
        },

        // Security
        {
          name: 'get_firewall_rules',
          description: 'Get firewall rules for a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' }
            },
            required: ['serverId']
          }
        },
        {
          name: 'add_firewall_rule',
          description: 'Add a firewall rule',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              name: { type: 'string', description: 'Name of the rule' },
              type: { type: 'string', enum: ['allow', 'deny'], description: 'Rule type' },
              protocol: { type: 'string', enum: ['tcp', 'udp'], description: 'Protocol' },
              port: { type: 'string', description: 'Port or port range' },
              source: { type: 'string', description: 'Source IP or CIDR' }
            },
            required: ['serverId', 'name', 'type', 'protocol', 'port']
          }
        },
        {
          name: 'delete_firewall_rule',
          description: 'Delete a firewall rule',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              ruleId: { type: 'number', description: 'The ID of the firewall rule' }
            },
            required: ['serverId', 'ruleId']
          }
        },

        // Script Installers
        {
          name: 'install_script',
          description: 'Install a script (WordPress, Joomla, etc.) on a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: { type: 'number', description: 'The ID of the server' },
              webappId: { type: 'number', description: 'The ID of the web application' },
              name: { type: 'string', enum: ['wordpress', 'joomla', 'drupal', 'phpmyadmin', 'prestashop', 'magento'], description: 'Script to install' },
              username: { type: 'string', description: 'Admin username' },
              email: { type: 'string', description: 'Admin email' },
              password: { type: 'string', description: 'Admin password' },
              title: { type: 'string', description: 'Site title' },
              locale: { type: 'string', description: 'Locale (e.g., en_US)' }
            },
            required: ['serverId', 'webappId', 'name', 'username', 'email', 'password']
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
      try {
        const { name, arguments: args } = request.params;

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
          case 'rebuild_webapp':
            return await this.rebuildWebapp(args);

          // Git Integration
          case 'clone_git_repository':
            return await this.cloneGitRepository(args);
          case 'get_git_info':
            return await this.getGitInfo(args);
          case 'change_git_branch':
            return await this.changeGitBranch(args);
          case 'deploy_git':
            return await this.deployGit(args);

          // Domain Management
          case 'list_domains':
            return await this.listDomains(args);
          case 'add_domain':
            return await this.addDomain(args);
          case 'delete_domain':
            return await this.deleteDomain(args);

          // SSL Management
          case 'install_ssl':
            return await this.installSSL(args);
          case 'get_ssl_info':
            return await this.getSSLInfo(args);

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
            return await this.listSSHKeys(args);
          case 'add_ssh_key':
            return await this.addSSHKey(args);
          case 'delete_ssh_key':
            return await this.deleteSSHKey(args);

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

          // Security
          case 'get_firewall_rules':
            return await this.getFirewallRules(args);
          case 'add_firewall_rule':
            return await this.addFirewallRule(args);
          case 'delete_firewall_rule':
            return await this.deleteFirewallRule(args);

          // Script Installers
          case 'install_script':
            return await this.installScript(args);

          // Health Check
          case 'health_check':
            return await this.healthCheck();

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
            `RunCloud API Error: ${error.response.data.message || error.message}`
          );
        }
        throw error;
      }
    });
  }

  // Helper method for API responses
  async apiResponse(promise) {
    const response = await promise;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
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
    return this.apiResponse(api.post('/servers', {
      name: args.name,
      ipAddress: args.ipAddress,
      provider: args.provider
    }));
  }

  async deleteServer(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}`));
  }

  async getServerStats(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/stats`));
  }

  async getServerHardwareInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/hardwareinfo`));
  }

  async getInstallationScript(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/installationscript`));
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
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/custom`, {
      name: args.name,
      domainName: args.domainName,
      user: args.user,
      phpVersion: args.phpVersion,
      stack: args.stack,
      stackMode: args.stackMode
    }));
  }

  async deleteWebapp(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}`));
  }

  async setWebappDefault(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/default`));
  }

  async rebuildWebapp(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/rebuild`));
  }

  // Git Methods
  async cloneGitRepository(args) {
    const data = {
      provider: args.provider,
      repository: args.repository
    };
    if (args.branch) data.branch = args.branch;
    if (args.autoDeploy !== undefined) data.autoDeploy = args.autoDeploy;
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/git`, data));
  }

  async getGitInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/git`));
  }

  async changeGitBranch(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/branch`, {
      branch: args.branch
    }));
  }

  async deployGit(args) {
    return this.apiResponse(api.put(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/script`));
  }

  // Domain Methods
  async listDomains(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/domains`));
  }

  async addDomain(args) {
    const data = { name: args.name };
    if (args.type) data.type = args.type;
    if (args.enableWww !== undefined) data.enableWww = args.enableWww;
    if (args.wwwRedirect) data.wwwRedirect = args.wwwRedirect;
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/domains`, data));
  }

  async deleteDomain(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/webapps/${args.webappId}/domains/${args.domainId}`));
  }

  // SSL Methods
  async installSSL(args) {
    const data = {
      provider: args.provider,
      enableHttp: args.enableHttp || false,
      enableHsts: args.enableHsts || false
    };
    if (args.provider === 'custom') {
      data.sslCert = args.sslCert;
      data.sslKey = args.sslKey;
      if (args.sslCa) data.sslCa = args.sslCa;
    }
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/ssl/basic`, data));
  }

  async getSSLInfo(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/webapps/${args.webappId}/ssl`));
  }

  // Database Methods
  async listDatabases(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/databases`, { params }));
  }

  async createDatabase(args) {
    const data = { name: args.name };
    if (args.collation) data.collation = args.collation;
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
    return this.apiResponse(api.patch(`/servers/${args.serverId}/databaseusers/${args.userId}`, {
      password: args.password
    }));
  }

  async grantDatabaseAccess(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/databases/${args.databaseId}/grant`, {
      userId: args.userId
    }));
  }

  async revokeDatabaseAccess(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/databases/${args.databaseId}/grant/${args.userId}`));
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
    return this.apiResponse(api.patch(`/servers/${args.serverId}/users/${args.userId}`, {
      password: args.password
    }));
  }

  // SSH Key Methods
  async listSSHKeys(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/users/${args.userId}/sshkeys`));
  }

  async addSSHKey(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/users/${args.userId}/sshkeys`, {
      name: args.name,
      publicKey: args.publicKey
    }));
  }

  async deleteSSHKey(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/users/${args.userId}/sshkeys/${args.keyId}`));
  }

  // Cron Job Methods
  async listCronJobs(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/cronjobs`, { params }));
  }

  async createCronJob(args) {
    return this.apiResponse(api.post(`/servers/${args.serverId}/cronjobs`, {
      label: args.label,
      username: args.username,
      command: args.command,
      minute: args.minute,
      hour: args.hour,
      dayOfMonth: args.dayOfMonth,
      month: args.month,
      dayOfWeek: args.dayOfWeek
    }));
  }

  async deleteCronJob(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/cronjobs/${args.cronId}`));
  }

  // Service Methods
  async listServices(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/services`));
  }

  async controlService(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/services`, {
      action: args.action,
      realName: args.service
    }));
  }

  // Supervisor Job Methods
  async listSupervisorJobs(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;
    return this.apiResponse(api.get(`/servers/${args.serverId}/supervisorjobs`, { params }));
  }

  async createSupervisorJob(args) {
    const data = {
      name: args.name,
      username: args.username,
      directory: args.directory,
      command: args.command
    };
    if (args.processNum !== undefined) data.processNum = args.processNum;
    if (args.autoStart !== undefined) data.autoStart = args.autoStart;
    if (args.autoRestart !== undefined) data.autoRestart = args.autoRestart;
    if (args.startSecs !== undefined) data.startSecs = args.startSecs;
    if (args.environment) data.environment = args.environment;
    return this.apiResponse(api.post(`/servers/${args.serverId}/supervisorjobs`, data));
  }

  async deleteSupervisorJob(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/supervisorjobs/${args.jobId}`));
  }

  async controlSupervisorJob(args) {
    return this.apiResponse(api.patch(`/servers/${args.serverId}/supervisorjobs/${args.jobId}`, {
      action: args.action
    }));
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

  // Security Methods
  async getFirewallRules(args) {
    return this.apiResponse(api.get(`/servers/${args.serverId}/firewall`));
  }

  async addFirewallRule(args) {
    const data = {
      name: args.name,
      type: args.type,
      protocol: args.protocol,
      port: args.port
    };
    if (args.source) data.source = args.source;
    return this.apiResponse(api.post(`/servers/${args.serverId}/firewall`, data));
  }

  async deleteFirewallRule(args) {
    return this.apiResponse(api.delete(`/servers/${args.serverId}/firewall/${args.ruleId}`));
  }

  // Script Installer Methods
  async installScript(args) {
    const data = {
      name: args.name,
      username: args.username,
      email: args.email,
      password: args.password
    };
    if (args.title) data.title = args.title;
    if (args.locale) data.locale = args.locale;
    return this.apiResponse(api.post(`/servers/${args.serverId}/webapps/${args.webappId}/installer`, data));
  }

  // Health Check
  async healthCheck() {
    return this.apiResponse(api.get('/ping'));
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RunCloud MCP server running on stdio');
  }
}

const server = new RunCloudMCPServer();
server.run().catch(console.error);