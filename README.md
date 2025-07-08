# RunCloud MCP Server

MCP (Model Context Protocol) server that provides integration with RunCloud API, allowing AI assistants to manage servers, web applications, databases, and more through natural language.

## What is MCP?

MCP (Model Context Protocol) is a protocol that enables AI assistants like Claude to interact with external tools and services. This server implements MCP to provide access to RunCloud's server management capabilities.

## Features

- **60+ tools** covering all major RunCloud API endpoints
- Full server management capabilities
- Web application deployment and configuration
- Database and user management
- SSL certificate management
- Git integration for deployments
- Cron job and supervisor job management
- Firewall and security configuration
- Real-time log access

## Prerequisites

- Node.js 16 or higher
- RunCloud account with API access
- RunCloud API Key and API Secret (get them from RunCloud Dashboard → Settings → API Key)

## Installation

1. Clone or download this repository:
```bash
git clone <repository-url>
cd runcloud-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API credentials using one of these methods:

### Method 1: Environment Variables (.env file)
Create a `.env` file in the project root:
```env
RUNCLOUD_API_KEY=your_api_key_here
RUNCLOUD_API_SECRET=your_api_secret_here
RUNCLOUD_BASE_URL=https://manage.runcloud.io/api/v2
```

### Method 2: MCP Configuration (Recommended)
Configure directly in your MCP client configuration (see Configuration section).

## Configuration

### For Claude Desktop

1. Open Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the RunCloud server configuration:

**Note:** On macOS, if you're using Node.js from NVM or Homebrew, use the full path to node executable. Find it with `which node`.

```json
{
  "mcpServers": {
    "runcloud": {
      "command": "node",
      "args": ["/absolute/path/to/runcloud-mcp-server/index.js"],
      "env": {
        "RUNCLOUD_API_KEY": "your_api_key_here",
        "RUNCLOUD_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

3. Restart Claude Desktop to load the new configuration.

### For Project-Specific Configuration

Create an `mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "runcloud": {
      "command": "node",
      "args": ["/absolute/path/to/runcloud-mcp-server/index.js"],
      "env": {
        "RUNCLOUD_API_KEY": "your_api_key_here",
        "RUNCLOUD_API_SECRET": "your_api_secret_here"
      }
    }
  }
}
```

## Available Tools (60+ endpoints)

### Server Management
- `list_servers` - List all servers in your RunCloud account
- `get_server` - Get detailed information about a specific server
- `create_server` - Create a new server
- `delete_server` - Delete a server
- `get_server_stats` - Get statistics for a specific server
- `get_server_hardware_info` - Get hardware information for a server
- `get_installation_script` - Get installation script for a server

### Web Applications
- `list_webapps` - List all web applications on a server
- `get_webapp` - Get detailed information about a specific web application
- `create_webapp` - Create a new web application on a server
- `delete_webapp` - Delete a web application
- `set_webapp_default` - Set a web application as default
- `rebuild_webapp` - Rebuild a web application

### Git Integration
- `clone_git_repository` - Clone a git repository for a web application
- `get_git_info` - Get git repository information
- `change_git_branch` - Change git branch
- `deploy_git` - Deploy code from git repository

### Domain Management
- `list_domains` - List all domains for a web application
- `add_domain` - Add a domain to a web application
- `delete_domain` - Delete a domain

### SSL Management
- `install_ssl` - Install SSL certificate (Let's Encrypt or custom)
- `get_ssl_info` - Get SSL certificate information

### Database Management
- `list_databases` - List all databases on a server
- `create_database` - Create a new database
- `delete_database` - Delete a database
- `list_database_users` - List all database users
- `create_database_user` - Create a new database user
- `delete_database_user` - Delete a database user
- `update_database_user_password` - Update database user password
- `grant_database_access` - Grant database access to a user
- `revoke_database_access` - Revoke database access from a user

### System Users
- `list_system_users` - List all system users
- `create_system_user` - Create a new system user
- `delete_system_user` - Delete a system user
- `update_system_user_password` - Update system user password

### SSH Keys
- `list_ssh_keys` - List SSH keys for a system user
- `add_ssh_key` - Add SSH key for a system user
- `delete_ssh_key` - Delete SSH key

### Cron Jobs
- `list_cron_jobs` - List all cron jobs
- `create_cron_job` - Create a new cron job
- `delete_cron_job` - Delete a cron job

### Services
- `list_services` - List all services with their status
- `control_service` - Start, stop, restart, or reload a service

### Supervisor Jobs
- `list_supervisor_jobs` - List all supervisor jobs
- `create_supervisor_job` - Create a new supervisor job
- `delete_supervisor_job` - Delete a supervisor job
- `control_supervisor_job` - Control a supervisor job (start/stop/restart)

### Logs
- `get_server_logs` - Get server logs (nginx, apache, mysql, etc.)
- `get_webapp_logs` - Get web application logs

### Security
- `get_firewall_rules` - Get firewall rules
- `add_firewall_rule` - Add a firewall rule
- `delete_firewall_rule` - Delete a firewall rule

### Script Installers
- `install_script` - Install scripts (WordPress, Joomla, Drupal, phpMyAdmin, etc.)

### Health Check
- `health_check` - Check API health status

## Usage Examples

Once configured, you can use natural language to interact with RunCloud:

1. **List all servers:**
   - "Show me all my RunCloud servers"
   - "List servers"

2. **Create a web application:**
   - "Create a new WordPress site on server ID 123"
   - "Set up a PHP 8.1 application with domain example.com"

3. **Manage databases:**
   - "Create a new database called myapp_db on server 123"
   - "List all database users on my main server"

4. **Deploy from Git:**
   - "Deploy the latest code from my GitHub repository"
   - "Change the deployment branch to develop"

5. **SSL Management:**
   - "Install Let's Encrypt SSL for example.com"
   - "Check SSL certificate status"

## Security Notes

- **Never commit** your API credentials to version control
- Store API keys securely using environment variables or secure configuration
- The `.env` file is already included in `.gitignore`
- Consider using different API keys for different environments

## Troubleshooting

1. **Server not appearing in Claude:**
   - Ensure you've restarted Claude Desktop after configuration
   - Check that the path to `index.js` is absolute and correct
   - Verify your API credentials are valid

2. **Authentication errors:**
   - Double-check your API Key and Secret
   - Ensure they're properly escaped in JSON configuration
   - Test credentials using: `curl -u YOUR_API_KEY:YOUR_API_SECRET https://manage.runcloud.io/api/v2/ping`

3. **Tool execution errors:**
   - Check the Claude Desktop logs for detailed error messages
   - Ensure you have proper permissions on RunCloud
   - Verify the server/resource IDs you're using exist

## Development

To modify or extend this server:

1. The main server code is in `index.js`
2. All RunCloud API endpoints are implemented as separate methods
3. Add new tools by:
   - Adding tool definition in `setupToolHandlers()`
   - Adding case in the switch statement
   - Implementing the method

## Support

- RunCloud API Documentation: https://runcloud.io/docs/api
- MCP Documentation: https://modelcontextprotocol.io
- RunCloud Support: https://runcloud.io/support

## Author

Aleksander M.

## License

MIT License - See LICENSE file for details