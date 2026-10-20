# Spotter AI — Backend

API de roteamento inteligente e análise meteorológica preditiva para transporte rodoviário de cargas pesadas. Avalia riscos climáticos em tempo real (vento cruzado, chuva, neve), limiares de segurança por peso de carga (GVW) e evolução temporal em corredores de até 48 horas.

---

## 🏛 Arquitetura em Camadas

O backend adota uma arquitetura em camadas desacoplada e independente de persistência direta:

```
                  ┌────────────────────────┐
                  │    HTTP Requests       │
                  └───────────┬────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Camada de Apresentação (routing/views.py)                   │
│  - Endpoint handlers (APIView)                               │
│  - Swagger / OpenAPI metadata (drf-spectacular)              │
│  - Validação de entrada e serialização de saída              │
└─────────────────────────────┬────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Camada de Serviços / Casos de Uso (routing/services/)       │
│  - Orquestração do caso de uso (trip_analysis, geocoding)     │
│  - Injeção de dependências dos provedores externos           │
└──────────────┬──────────────────────────────┬────────────────┘
               ▼                              ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│  Domínio Puro                │  │  Integrações Externas      │
│  (routing/domain/)           │  │  (routing/integrations/)   │
│  - sampling: amostragem rota │  │  - routing: OSRM           │
│  - risk: avaliação de risco  │  │  - weather: Open-Meteo     │
│  - recommend: ranking rotas  │  │  - geocoding: Nominatim    │
│  - entities: aggregates/VOs  │  │  - Retry, timeouts e sessão│
└──────────────────────────────┘  └────────────────────────────┘
```

---

## 🚀 Instalação e Execução Local

### 1. Pré-requisitos
- Python 3.12+
- Virtualenv ativo

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e ajuste se necessário:
```bash
cp .env.example .env
```

### 3. Instalar Dependências
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Executar Servidor de Desenvolvimento
```bash
python manage.py runserver 8000
```
O servidor iniciará em `http://127.0.0.1:8000`.

---

## 📑 Documentação da API

Com o servidor rodando, acesse a documentação interativa:
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`
- **OpenAPI Schema (JSON/YAML):** `http://localhost:8000/api/schema/`

---

## 🧪 Testes e Cobertura de Código

O projeto possui uma suíte de testes automatizados com meta de cobertura de **≥ 90%** (cobertura atual: **~99%**):

```bash
# Executar todos os testes com relatório de cobertura
pytest

# Executar apenas testes unitários
pytest -m unit

# Executar apenas testes de integração
pytest -m integration

# Executar testes ponta a ponta (E2E)
pytest -m e2e

# Validar contrato OpenAPI sem disparar o servidor
python manage.py spectacular --validate --fail-on-warn
```

---

## 🛡 Padronização de Erros

Todas as respostas de erro da API seguem um formato JSON previsível e tipado:

```json
{
  "code": "routing_provider_error",
  "message": "Routing service provider (OSRM) encountered a failure.",
  "details": {
    "provider": "OSRM"
  }
}
```

Códigos HTTP mapeados:
- `400 Bad Request`: parâmetros de requisição inválidos (`code: "validation_error"`)
- `404 Not Found`: rota não encontrada entre os pontos (`code: "no_route_found"`)
- `502 Bad Gateway`: falha em serviço terceiro upstream (`code: "*_provider_error"`)
- `504 Gateway Timeout`: timeout em serviço terceiro (`code: "provider_timeout"`)
- `500 Internal Server Error`: falha inesperada tratada de forma segura sem vazamento de detalhes (`code: "internal_server_error"`)
