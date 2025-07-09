# RunCloud MCP Server

Serwer MCP (Model Context Protocol) zapewniający integrację z API RunCloud, umożliwiający asystentom AI zarządzanie serwerami, aplikacjami webowymi, bazami danych i więcej poprzez język naturalny.

## Co to jest MCP?

MCP (Model Context Protocol) to protokół umożliwiający asystentom AI takim jak Claude interakcję z zewnętrznymi narzędziami i usługami. Ten serwer implementuje MCP, aby zapewnić dostęp do możliwości zarządzania serwerami RunCloud.

## Funkcje

- **100+ narzędzi** pokrywających WSZYSTKIE endpointy API RunCloud
- Kompletne możliwości zarządzania serwerami
- Wdrażanie i konfiguracja aplikacji webowych
- Zarządzanie bazami danych i użytkownikami
- Zaawansowane zarządzanie certyfikatami SSL (podstawowe i per-domena)
- Integracja z Git z personalizacją skryptów wdrożeniowych
- Zarządzanie zadaniami Cron i Supervisor
- Zarządzanie regułami firewall i Fail2Ban
- Ustawienia serwera (SSH, automatyczne aktualizacje, metadane)
- Endpointy danych statycznych (strefy czasowe, zestawienia znaków, instalatory)
- Zarządzanie kluczami API zewnętrznych usług
- Dostęp do logów w czasie rzeczywistym

## Wymagania

- Node.js 16 lub wyższy
- Konto RunCloud z dostępem do API
- Klucz API i Secret API RunCloud (pobierz z RunCloud Dashboard → Settings → API Key)

## Instalacja

1. Sklonuj lub pobierz to repozytorium:
```bash
git clone <url-repozytorium>
cd runcloud-mcp-server
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj dane uwierzytelniające API używając jednej z metod:

### Metoda 1: Zmienne środowiskowe (plik .env)
Utwórz plik `.env` w katalogu głównym projektu:
```env
RUNCLOUD_API_KEY=twój_klucz_api
RUNCLOUD_API_SECRET=twój_secret_api
RUNCLOUD_BASE_URL=https://manage.runcloud.io/api/v2
```

### Metoda 2: Konfiguracja MCP (Zalecana)
Skonfiguruj bezpośrednio w konfiguracji klienta MCP (zobacz sekcję Konfiguracja).

## Konfiguracja

### Dla Claude Desktop

1. Otwórz plik konfiguracyjny Claude Desktop:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Dodaj konfigurację serwera RunCloud:

**Uwaga:** Na macOS, jeśli używasz Node.js z NVM lub Homebrew, użyj pełnej ścieżki do node. Znajdź ją poleceniem `which node`.

```json
{
  "mcpServers": {
    "runcloud": {
      "command": "node",
      "args": ["/bezwzględna/ścieżka/do/runcloud-mcp-server/index.js"],
      "env": {
        "RUNCLOUD_API_KEY": "twój_klucz_api",
        "RUNCLOUD_API_SECRET": "twój_secret_api"
      }
    }
  }
}
```

3. Zrestartuj Claude Desktop, aby załadować nową konfigurację.

### Dla konfiguracji specyficznej dla projektu

Utwórz plik `mcp.json` w katalogu głównym projektu:

```json
{
  "mcpServers": {
    "runcloud": {
      "command": "node",
      "args": ["/bezwzględna/ścieżka/do/runcloud-mcp-server/index.js"],
      "env": {
        "RUNCLOUD_API_KEY": "twój_klucz_api",
        "RUNCLOUD_API_SECRET": "twój_secret_api"
      }
    }
  }
}
```

## Przykłady użycia

Po skonfigurowaniu możesz używać języka naturalnego do interakcji z RunCloud:

1. **Wyświetl wszystkie serwery:**
   - "Pokaż mi wszystkie moje serwery RunCloud"
   - "Wylistuj serwery"

2. **Utwórz aplikację webową:**
   - "Stwórz nową stronę WordPress na serwerze ID 123"
   - "Skonfiguruj aplikację PHP 8.1 z domeną example.com"

3. **Zarządzaj bazami danych:**
   - "Utwórz nową bazę danych o nazwie myapp_db na serwerze 123"
   - "Wylistuj wszystkich użytkowników bazy danych na moim głównym serwerze"

4. **Wdrażanie z Git:**
   - "Wdróż najnowszy kod z mojego repozytorium GitHub"
   - "Zmień branch wdrożeniowy na develop"

5. **Zarządzanie SSL:**
   - "Zainstaluj certyfikat Let's Encrypt dla example.com"
   - "Sprawdź status certyfikatu SSL"

## Uwagi dotyczące bezpieczeństwa

- **Nigdy nie commituj** swoich danych uwierzytelniających API do kontroli wersji
- Przechowuj klucze API bezpiecznie używając zmiennych środowiskowych lub bezpiecznej konfiguracji
- Plik `.env` jest już uwzględniony w `.gitignore`
- Rozważ użycie różnych kluczy API dla różnych środowisk

## Rozwiązywanie problemów

1. **Serwer nie pojawia się w Claude:**
   - Upewnij się, że zrestartowałeś Claude Desktop po konfiguracji
   - Sprawdź, czy ścieżka do `index.js` jest bezwzględna i poprawna
   - Zweryfikuj, czy Twoje dane uwierzytelniające API są prawidłowe

2. **Błędy uwierzytelniania:**
   - Dokładnie sprawdź swój klucz API i Secret
   - Upewnij się, że są właściwie escapowane w konfiguracji JSON
   - Przetestuj dane uwierzytelniające używając: `curl -u TWÓJ_KLUCZ_API:TWÓJ_SECRET_API https://manage.runcloud.io/api/v2/ping`

3. **Błędy wykonywania narzędzi:**
   - Sprawdź logi Claude Desktop dla szczegółowych komunikatów o błędach
   - Upewnij się, że masz odpowiednie uprawnienia w RunCloud
   - Zweryfikuj, czy używane ID serwerów/zasobów istnieją

## Wsparcie

- Dokumentacja API RunCloud: https://runcloud.io/docs/api
- Dokumentacja MCP: https://modelcontextprotocol.io
- Wsparcie RunCloud: https://runcloud.io/support

## Historia wersji

### Wersja 2.0.0
- Kompletna implementacja WSZYSTKICH endpointów API RunCloud (100+ narzędzi)
- Dodano zarządzanie certyfikatami SSL (tryby podstawowy i zaawansowany)
- Dodano zarządzanie regułami firewall i Fail2Ban
- Dodano ustawienia serwera (SSH, automatyczne aktualizacje, metadane)
- Dodano endpointy danych statycznych
- Dodano zarządzanie kluczami API zewnętrznych usług
- Ulepszona integracja z Git z personalizacją skryptów wdrożeniowych
- Pełna zgodność funkcjonalna z RunCloud API v2

### Wersja 1.0.0
- Początkowe wydanie z 60+ podstawowymi endpointami
- Podstawowe zarządzanie serwerem, aplikacjami, bazami danych i użytkownikami

## Autor

Aleksander M.

## Licencja

Licencja MIT - Zobacz plik LICENSE dla szczegółów