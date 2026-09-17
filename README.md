# ForgeCost V3

Evolução do ZIP V2 original, com os 98 insumos, Cadeira Acapulco, módulos e cálculos preservados.

## Executar
Extraia o ZIP e abra index.html no Edge ou Chrome atualizado. Não precisa instalar dependências. Informe um e-mail válido e uma senha fictícia não vazia. A senha não é verificada, transmitida ou armazenada. O login deve ser repetido ao recarregar; os dados continuam salvos.

Também pode ser servido em HTTP. O armazenamento pertence ao navegador e ao endereço/caminho: antes de mover o app ou limpar o navegador, exporte um backup em Configurações.

## Alterações
- Símbolo F industrial, wordmarks claro/escuro em SVG, favicon, ícones PNG 192/512 e manifesto. Não há service worker.
- Laranja #FF7A00, grafite #10161D, superfícies #19222C e neutros claros; estados de foco, hover, sucesso e alerta.
- Dark/Light completos, seletor no cabeçalho e login, preferência persistida; fontes locais sem dependências externas.
- Tela única de login e mensagem obrigatória; saída e sessão temporária.
- Produtos, insumos, unidades de compra/uso, BOM, perdas, recálculo, categorias, custos, histórico, relatórios e parâmetros de mão de obra da V2.
- Adição/edição/exclusão de processos em horas por unidade na ficha técnica.
- Backup JSON, importação e migração opcional da chave forgecost_v2, sem apagar ou sobrescrever o original.
- Desktop/mobile, com rolagem própria nas tabelas extensas.

A imagem a_clean_high_end_brand_styleboard_ui_mockup_pre.png não estava acessível. Os vetores foram criados segundo a identidade descrita: ForgeCost, F industrial, laranja e grafites. Não foi possível conferir fidelidade ao PNG aprovado.

## Arquitetura e dados
src/services.js: adaptadores auth (current, signIn, signOut) e repository (load, save, validate, legacy).
src/session-ui.js: sessão, tema, backup e processos.
src/app.js: base, módulos e cálculos originais.
src/forgecost.css: identidade e temas, sobre os estilos estruturais originais.

Cada envelope salvo contém version, tenantId, userId, updatedAt e data. Todas as entidades (produtos, insumos, BOM, processos, categorias, histórico e configurações) pertencem a esse envelope. O e-mail normalizado identifica a partição demo. Outro e-mail inicia sua própria cópia dos dados iniciais.

Essa separação local NÃO é autenticação nem isolamento seguro. Quem acessa o navegador pode ler/alterar o armazenamento. Não existe backend, banco remoto, sincronização, recuperação de senha ou auditoria segura. A sessão fica apenas em memória e a senha não é persistida.

A base V2 não é automaticamente atribuída ao primeiro login. Escolha Importar dados da V2 em Configurações, no mesmo endereço da instalação antiga. Para endereços diferentes, exporte o conteúdo JSON da chave forgecost_v2 da V2 e importe como backup. Importações substituem o workspace atual após confirmação; exporte-o primeiro.

## Cálculos e comportamento preservado
Custo de uso = preço de compra / quantidade da compra.
Componente = quantidade usada × (1 + perda/100) × custo de uso.
Mão de obra = horas por unidade × salário / horas mensais.
A precisão interna é preservada; arredondamento ocorre na exibição. A cadeira original custa R$ 93,04.

Alterar preço recalcula fichas. Como na V2, excluir um insumo remove seus componentes após confirmação. Mudar a unidade NÃO converte automaticamente quantidades existentes; revise as fichas. Categorias e relatórios mantêm o escopo simples da V2.

## Integração futura com backend e banco
1. Substitua auth por API/provedor real: valide credenciais no servidor e obtenha userId e tenants autorizados da sessão. Nunca derive a identidade de produção do e-mail digitado. Use sessão segura e cookies HttpOnly/Secure/SameSite, com proteção CSRF apropriada.
2. Substitua repository por chamadas autenticadas. load deve retornar apenas dados autorizados. save é síncrono na demo: na integração assíncrona, refatore saveWorkspace, persist e todos os fluxos de mutação para aguardar a gravação, tratar erros/retry e impedir mensagens de sucesso ou saída antes da confirmação.
3. Normalize tabelas tenants, users, memberships, products, inputs, bom_items, processes, labor_settings, categories e cost_history. Use tenant_id nas tabelas de negócio e created_by/updated_by conforme aplicável. Chaves estrangeiras compostas com tenant_id devem impedir referências cruzadas. Autorize cada operação no servidor e complemente com políticas de banco; não confie no tenant enviado pelo cliente.
4. Recalcule custos no servidor usando precisão decimal, validação de valores/unidades e transações. Defina regras de conversão de unidades, custo congelado, exclusão lógica e histórico imutável. Cálculos locais são apenas prévias.
5. Importe a demo explicitamente com validação no servidor, mapeamento de IDs e associação ao tenant/usuário autenticados. Não confie nos identificadores presentes no backup.
6. Acrescente controle de concorrência (versões/ETags), paginação, backups, auditoria, limites de requisição e recuperação de senha. Teste sessão expirada, indisponibilidade, falha de gravação, conflitos e autorização entre tenants.

API sugerida: POST/DELETE/GET /session; GET/POST /products e /inputs; PATCH/DELETE /products/:id e /inputs/:id; endpoints para composição/processos por produto e configurações por tenant. Nenhum endpoint foi implementado; provedor e banco ainda precisam ser escolhidos.

## Testes realizados
Microsoft Edge headless, abrindo index.html: 98 insumos, custo original, criar/editar/excluir produto, adicionar/remover BOM e perdas, adicionar/remover processos, recálculo de insumo, rejeição de zero horas mensais, separação por e-mail, persistência após reload, preferência de tema, dez módulos, viewport 390 px sem overflow da página e ausência de erros JavaScript no fluxo. Login, desktop claro/escuro e mobile conferidos visualmente. A futura integração requer seus próprios testes de autenticação e banco.
