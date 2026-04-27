# Receita Fácil

PWA para leitura inteligente de receitas médicas via QR Code, com modelo B2B2C voltado para farmácias.

## Como funciona

1. Farmácia gera um QR Code único pelo painel `/admin.html`
2. QR Code é impresso e fixado no balcão
3. Cliente escaneia com o celular → abre o app direto no browser (sem instalar nada)
4. Fotografa a receita
5. Claude API processa a imagem e retorna os medicamentos de forma legível em ~4s

## Stack

- **Frontend**: HTML/CSS/JS puro (PWA, sem framework)
- **Backend**: Netlify Functions (serverless)
- **IA**: Claude API (claude-sonnet-4-5 com visão)
- **Deploy**: Netlify (gratuito para MVP)

## Estrutura

```
receita-facil/
├── netlify/
│   └── functions/
│       └── processar-receita.js   ← Netlify Function principal
├── public/
│   ├── index.html                 ← App do cliente (PWA)
│   ├── admin.html                 ← Painel da farmácia (QR Code)
│   └── manifest.json              ← PWA manifest
├── netlify.toml                   ← Configuração do Netlify
└── package.json
```

## Deploy na Netlify

### 1. Variáveis de ambiente

No painel da Netlify → Site settings → Environment variables:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Deploy via Git

```bash
# Clone ou inicie o repositório
git init
git add .
git commit -m "initial commit"

# Conecte ao GitHub e importe na Netlify
# ou use Netlify CLI:
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

### 3. Instalar dependência da função

A Netlify instala automaticamente via `package.json`. Certifique-se que `@anthropic-ai/sdk` está listado.

## Como usar o QR Code

1. Acesse `/admin.html` no seu domínio
2. Preencha o nome e ID da farmácia (ex: `f001`)
3. Informe a URL base do app (ex: `https://meuapp.netlify.app`)
4. Clique em "Gerar QR Code" e baixe o PNG
5. O QR gerado aponta para: `https://meuapp.netlify.app/?f=f001`

O parâmetro `?f=f001` identifica qual farmácia originou o scan para analytics.

## Limites do plano gratuito Netlify

| Recurso | Limite gratuito |
|---|---|
| Bandwidth | 100 GB/mês |
| Functions | 125.000 chamadas/mês |
| Timeout da função | 10 segundos |
| Build minutes | 300 min/mês |

Para escalar: upgrade para Netlify Pro (~$19/mês) que remove o timeout de funções.

## Próximos passos

- [ ] Banco de dados (Neon Postgres) para logs de scan
- [ ] Dashboard com métricas reais por farmácia
- [ ] Integração com base ANVISA (BNAFAR) para genéricos e preços
- [ ] Autenticação da farmácia (NextAuth ou Supabase Auth)
- [ ] Notificação por WhatsApp do resultado (Twilio/Z-API)
- [ ] White-label: logo da farmácia no app via parâmetro

## Custo estimado por scan

| Item | Custo aprox. |
|---|---|
| Claude API (imagem ~800 tokens) | R$ 0,05–0,10 |
| Netlify Function | Grátis (até 125k/mês) |
| **Total por scan** | **~R$ 0,05–0,10** |

Com cobrança de R$ 200/mês por farmácia e ~500 scans/mês: margem de ~75%.

---

*Não substitui orientação médica ou farmacêutica.*
