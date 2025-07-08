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

dotenv.config();

const RUNCLOUD_API_KEY = process.env.RUNCLOUD_API_KEY;
const RUNCLOUD_API_SECRET = process.env.RUNCLOUD_API_SECRET;
const RUNCLOUD_BASE_URL = process.env.RUNCLOUD_BASE_URL || 'https://manage.runcloud.io/api/v2';

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
        {
          name: 'list_servers',
          description: 'List all servers in your RunCloud account',
          inputSchema: {
            type: 'object',
            properties: {
              search: {
                type: 'string',
                description: 'Search servers by name'
              },
              page: {
                type: 'number',
                description: 'Page number for pagination'
              }
            }
          }
        },
        {
          name: 'get_server',
          description: 'Get detailed information about a specific server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              }
            },
            required: ['serverId']
          }
        },
        {
          name: 'list_webapps',
          description: 'List all web applications on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              search: {
                type: 'string',
                description: 'Search web apps by name'
              },
              page: {
                type: 'number',
                description: 'Page number for pagination'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              webappId: {
                type: 'number',
                description: 'The ID of the web application'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              name: {
                type: 'string',
                description: 'Name of the web application'
              },
              domainName: {
                type: 'string',
                description: 'Domain name for the web application'
              },
              user: {
                type: 'string',
                description: 'System user for the web application'
              },
              phpVersion: {
                type: 'string',
                description: 'PHP version (e.g., "php80rc", "php81rc")'
              },
              stack: {
                type: 'string',
                enum: ['hybrid', 'nativenginx'],
                description: 'Web server stack'
              },
              stackMode: {
                type: 'string',
                enum: ['production', 'development'],
                description: 'Stack mode'
              }
            },
            required: ['serverId', 'name', 'domainName', 'user', 'phpVersion', 'stack', 'stackMode']
          }
        },
        {
          name: 'list_databases',
          description: 'List all databases on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              search: {
                type: 'string',
                description: 'Search databases by name'
              },
              page: {
                type: 'number',
                description: 'Page number for pagination'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              name: {
                type: 'string',
                description: 'Name of the database'
              },
              collation: {
                type: 'string',
                description: 'Database collation (default: utf8mb4_unicode_ci)'
              }
            },
            required: ['serverId', 'name']
          }
        },
        {
          name: 'list_database_users',
          description: 'List all database users on a server',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              search: {
                type: 'string',
                description: 'Search users by username'
              },
              page: {
                type: 'number',
                description: 'Page number for pagination'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              username: {
                type: 'string',
                description: 'Username for the database user'
              },
              password: {
                type: 'string',
                description: 'Password for the database user'
              }
            },
            required: ['serverId', 'username', 'password']
          }
        },
        {
          name: 'list_services',
          description: 'List all services on a server with their status',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              }
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
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              action: {
                type: 'string',
                enum: ['start', 'stop', 'restart', 'reload'],
                description: 'Action to perform on the service'
              },
              service: {
                type: 'string',
                enum: ['nginx-rc', 'apache2-rc', 'mysql', 'redis-server', 'memcached', 'beanstalkd', 'supervisord'],
                description: 'Service name to control'
              }
            },
            required: ['serverId', 'action', 'service']
          }
        },
        {
          name: 'deploy_git',
          description: 'Deploy code from git repository for a web application',
          inputSchema: {
            type: 'object',
            properties: {
              serverId: {
                type: 'number',
                description: 'The ID of the server'
              },
              webappId: {
                type: 'number',
                description: 'The ID of the web application'
              },
              gitId: {
                type: 'number',
                description: 'The ID of the git configuration'
              }
            },
            required: ['serverId', 'webappId', 'gitId']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'list_servers':
            return await this.listServers(args);
          case 'get_server':
            return await this.getServer(args);
          case 'get_server_stats':
            return await this.getServerStats(args);
          case 'list_webapps':
            return await this.listWebapps(args);
          case 'get_webapp':
            return await this.getWebapp(args);
          case 'create_webapp':
            return await this.createWebapp(args);
          case 'list_databases':
            return await this.listDatabases(args);
          case 'create_database':
            return await this.createDatabase(args);
          case 'list_database_users':
            return await this.listDatabaseUsers(args);
          case 'create_database_user':
            return await this.createDatabaseUser(args);
          case 'list_services':
            return await this.listServices(args);
          case 'control_service':
            return await this.controlService(args);
          case 'deploy_git':
            return await this.deployGit(args);
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

  async listServers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;

    const response = await api.get('/servers', { params });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async getServer(args) {
    const response = await api.get(`/servers/${args.serverId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async getServerStats(args) {
    const response = await api.get(`/servers/${args.serverId}/stats`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async listWebapps(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;

    const response = await api.get(`/servers/${args.serverId}/webapps`, { params });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async getWebapp(args) {
    const response = await api.get(`/servers/${args.serverId}/webapps/${args.webappId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async createWebapp(args) {
    const response = await api.post(`/servers/${args.serverId}/webapps/custom`, {
      name: args.name,
      domainName: args.domainName,
      user: args.user,
      phpVersion: args.phpVersion,
      stack: args.stack,
      stackMode: args.stackMode
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async listDatabases(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;

    const response = await api.get(`/servers/${args.serverId}/databases`, { params });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async createDatabase(args) {
    const data = { name: args.name };
    if (args.collation) data.collation = args.collation;

    const response = await api.post(`/servers/${args.serverId}/databases`, data);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async listDatabaseUsers(args) {
    const params = {};
    if (args.search) params.search = args.search;
    if (args.page) params.page = args.page;

    const response = await api.get(`/servers/${args.serverId}/databaseusers`, { params });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async createDatabaseUser(args) {
    const response = await api.post(`/servers/${args.serverId}/databaseusers`, {
      username: args.username,
      password: args.password
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async listServices(args) {
    const response = await api.get(`/servers/${args.serverId}/services`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async controlService(args) {
    const response = await api.patch(`/servers/${args.serverId}/services`, {
      action: args.action,
      realName: args.service
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async deployGit(args) {
    const response = await api.put(`/servers/${args.serverId}/webapps/${args.webappId}/git/${args.gitId}/script`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RunCloud MCP server running on stdio');
  }
}

const server = new RunCloudMCPServer();
server.run().catch(console.error);