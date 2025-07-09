# RunCloud API Missing Endpoints Analysis

## Summary
This document contains a comprehensive analysis of RunCloud API endpoints that exist in the documentation but are NOT implemented in the MCP server (index.js).

## Missing Endpoints by Category

### 1. Server Management Endpoints

#### Server Settings
- **GET /servers/{id}/settings/ssh** - Get SSH configuration
  - Returns passwordlessLogin, useDns, preventRootLogin settings
  
- **PATCH /servers/{id}/settings/ssh** - Update SSH configuration
  - Parameters: passwordlessLogin, useDns, preventRootLogin
  
- **PATCH /servers/{id}/settings/meta** - Update server metadata
  - Parameters: name, provider
  
- **PATCH /servers/{id}/settings/autoupdate** - Configure auto-update settings
  - Parameters: softwareUpdate, securityUpdate

#### PHP Management
- **GET /servers/{serverId}/php/version** - List available PHP versions
  - Returns array of available PHP versions
  
- **PATCH /servers/{serverId}/php/cli** - Change PHP-CLI version
  - Parameter: phpVersion

#### Shared Servers
- **GET /servers/shared** - List shared servers
  - Query parameter: search (optional)

### 2. Web Application Endpoints

#### Settings Management
- **PATCH /servers/{serverId}/webapps/{webAppId}/settings/php** - Change PHP version
  - Parameter: phpVersion
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/default** - Remove from default
  - Removes web application from default status

#### Web Application Alias
- **POST /servers/{serverId}/webapps/{webAppId}/alias** - Create web application alias
  - Parameters: name, domainName, user, publicPath, phpVersion, stack, stackMode, and all PHP/security settings

#### Git Repository Management
- **PATCH /servers/{serverId}/webapps/{webAppId}/git/{gitId}/script** - Customize GIT deployment script
  - Parameters: autoDeploy, deployScript
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/git/{gitId}** - Remove GIT repository

#### Script Installer
- **GET /servers/{serverId}/webapps/{webAppId}/installer** - Get installed PHP script info
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/installer/{installerId}** - Remove PHP script

#### Domain Management
- **GET /servers/{serverId}/webapps/{webAppId}/domains/{domainId}** - Get specific domain info
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/domains/{domainId}** - Delete specific domain

#### SSL Management (Basic)
- **GET /servers/{serverId}/webapps/{webAppId}/ssl** - Get SSL certificate info
  
- **POST /servers/{serverId}/webapps/{webAppId}/ssl** - Install SSL certificate
  - Parameters: provider, hsts, http, ssl_protocol_id, privateKey (custom), certificate (custom), certificateChain (custom)
  
- **PATCH /servers/{serverId}/webapps/{webAppId}/ssl/{sslId}** - Update SSL configuration
  - Parameters: hsts, http, ssl_protocol_id, privateKey, certificate, certificateChain
  
- **PUT /servers/{serverId}/webapps/{webAppId}/ssl/{sslId}** - Redeploy SSL (Let's Encrypt only)
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/ssl/{sslId}** - Delete SSL certificate

#### SSL Management (Advanced)
- **GET /servers/{serverId}/webapps/{webAppId}/ssl/advanced** - Get advanced SSL status
  
- **POST /servers/{serverId}/webapps/{webAppId}/ssl/advanced** - Switch SSL mode
  - Parameters: advancedSSL, autoSSL
  
- **POST /servers/{serverId}/webapps/{webAppId}/domains/{domainId}/ssl/advanced** - Install advanced SSL
  - Parameters: provider, privateKey, certificate, certificateChain
  
- **GET /servers/{serverId}/webapps/{webAppId}/domains/{domainId}/ssl/advanced** - Get domain SSL info
  
- **PATCH /servers/{serverId}/webapps/{webAppId}/domains/{domainId}/ssl/{sslId}** - Update domain SSL
  
- **PUT /servers/{serverId}/webapps/{webAppId}/domains/{domainId}/ssl/{sslId}** - Redeploy domain SSL
  
- **DELETE /servers/{serverId}/webapps/{webAppId}/domains/{domainId}/ssl/{sslId}** - Delete domain SSL

### 3. Security Endpoints

#### Firewall Management
- **POST /servers/{serverId}/security/firewalls** - Create firewall rule
  - Parameters: type, port, protocol, ipAddress (rich), firewallAction (rich)
  
- **GET /servers/{serverId}/security/firewalls** - List firewall rules
  
- **GET /servers/{serverId}/security/firewalls/{firewallId}** - Get specific firewall rule
  
- **PUT /servers/{serverId}/security/firewalls** - Deploy rules to server
  
- **DELETE /servers/{serverId}/security/firewalls/{firewallId}** - Delete firewall rule

#### Fail2Ban Management
- **GET /servers/{serverId}/security/fail2ban/blockedip** - List blocked IP addresses
  
- **DELETE /servers/{serverId}/security/fail2ban/blockedip** - Unblock IP address
  - Parameter: ip

### 4. Static Data Endpoints

- **GET /static/databases/collations** - Get database collations list
  
- **GET /static/timezones** - Get timezones list
  
- **GET /static/webapps/installers** - Get available script installers
  
- **GET /static/ssl/protocols** - Get available SSL protocols
  - Parameter: webServer (required)

### 5. Settings/Configuration Endpoints

#### 3rd Party API Keys
- **POST /settings/externalapi** - Create new API key
  - Parameters: label, service (cloudflare/linode/digitalocean), username (cloudflare), secret
  
- **GET /settings/externalapi** - List all 3rd party API keys
  - Query parameter: search (optional)
  
- **GET /settings/externalapi/{apiId}** - Get specific API key
  
- **PATCH /settings/externalapi/{apiId}** - Update API key
  - Parameters: label, username, secret
  
- **DELETE /settings/externalapi/{apiId}** - Delete API key

## Implementation Priority

### High Priority (Core Functionality)
1. SSL Management endpoints (both basic and advanced)
2. Firewall/Security endpoints
3. Web application settings endpoints
4. Domain management endpoints

### Medium Priority (Enhanced Features)
1. Server settings endpoints (SSH, metadata, auto-update)
2. Git deployment script customization
3. Static data endpoints
4. 3rd party API key management

### Low Priority (Nice to Have)
1. Web application alias functionality
2. Shared servers endpoint
3. Script installer management endpoints
4. Fail2Ban management

## Notes

1. The current implementation covers most basic CRUD operations but lacks many configuration and settings endpoints.

2. Security-related endpoints (firewall, SSL) are completely missing and should be prioritized.

3. Many "settings" endpoints that allow fine-tuning of server and application configurations are not implemented.

4. The static data endpoints would be useful for populating dropdowns and validating input in client applications.

5. Some endpoints in the documentation might have inconsistent HTTP methods (e.g., GET request shown for POST endpoint) - these should be verified with the actual API.