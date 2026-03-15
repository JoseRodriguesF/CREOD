## Deploy na Vercel

Para colocar o projeto online na Vercel:

1.  **Conecte seu GitHub** na Vercel e importe este repositório.
2.  **Configuração de Variáveis de Ambiente**:
    No painel da Vercel (Project Settings > Environment Variables), adicione todas as chaves do seu arquivo `.env`:
    - `MONGODB_URI`
    - `JWT_SECRET`
    - `SESSION_SECRET`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_CALLBACK_URL` (Aqui coloque: `https://seu-diretorio.vercel.app/api/auth/google/callback`)
    - `NODE_ENV` (coloque `production`)

3.  **Deploy**: O arquivo `vercel.json` que criei cuidará do roteamento automático.

## Configuração de URLs (Google Auth)

Para colocar o projeto em produção ou mudar o domínio, você precisará atualizar os seguintes pontos:

1.  **Google Cloud Console**:
    - Atualize as "URIs de redirecionamento autorizadas" para o seu novo domínio.
    - Exemplo: `https://seu-dominio.com/api/auth/google/callback`

2.  **Arquivo `.env`**:
    - Altere a variável `GOOGLE_CALLBACK_URL` para a nova URL.

3.  **Redirecionamento no `routes/authRoutes.js`**:
    - No callback do Google, altere o `res.redirect` para apontar para a URL do seu Frontend (onde o token será recebido).

## Como Rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura
- `/models`: Esquemas do banco de dados (User, Unit).
- `/routes`: Definição dos endpoints da API.
- `/middleware`: Filtros de segurança (ex: verificação de JWT).
- `/passport-config.js`: Configuração do Google OAuth.
