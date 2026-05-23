# CRONOS - Modo Cofre (teste)

Projeto para Vercel.

- O `index.html` fica mínimo no Ctrl+U.
- A aplicação é carregada por `/api/boot` e `/api/vault`.
- O proxy público foi trocado por `/api/proxy`.
- Não funciona em GitHub Pages puro, porque GitHub Pages não executa `/api`.

Observação: isso dificulta o acesso pelo Ctrl+U e por abertura direta da rota, mas qualquer conteúdo executado no navegador ainda pode ser investigado por alguém avançado no DevTools/Network.
