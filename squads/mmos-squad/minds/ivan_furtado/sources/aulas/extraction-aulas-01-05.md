# Extraction Completa - Aulas 01 a 05 (Ivan Furtado / CDR Academy)

> Documento gerado para construcao do knowledge base do AI Mind Clone de Ivan Furtado.
> Cada aula foi analisada integralmente. Toda informacao acionavel, framework, benchmark, regra de decisao, estrategia e mental model foi extraido.

---

## AULA 01 - Planejamento Anual com Base em Dados

### A. FRAMEWORKS

#### Framework: Planejamento Anual por Trimestres (Quarters)
- **Nome**: Planejamento Anual Baseado em Dados
- **Quando usar**: No inicio de cada ano, usando dados dos ultimos 3 meses do ano anterior (outubro, novembro, dezembro)
- **Passos**:
  1. Dividir o ano em 4 trimestres (Q1, Q2, Q3, Q4)
  2. Preencher janeiro usando a MEDIA dos ultimos 3 meses como base
  3. Ajustar a media com base na realidade do mes atual (feeling + dados)
  4. Preencher apenas as linhas em laranja (metricas de input); as demais sao calculadas automaticamente
  5. Para cada mes subsequente, projetar com base em sazonalidades e fatores externos
  6. Criar plano de acao por metrica para cada mes
- **Resultado esperado**: Metas por metricas com plano de acao concreto para atingi-las

#### Framework: Quebra de Receita em Duas Frentes
- **Nome**: Receita de Aquisicao vs Receita de Retencao
- **Erro grave**: Olhar para receita de forma geral (receita captada) sem quebrar
- **Passos**:
  1. Receita de Aquisicao = novos clientes (primeira compra)
  2. Receita de Retencao = clientes recorrentes (segunda, terceira, quarta compra em diante)
  3. Calcular % de LTV (taxa de retencao) usando media dos ultimos 3 meses
  4. Calcular quanto da receita precisa vir de cada frente
- **Onde buscar dados**: Shopify, Nuvemshop (parte de analise), ou Google Analytics

#### Framework: Plano de Acao por Metrica
- **Nome**: Metas sobre Metricas
- **Conceito**: Para cada metrica do planejamento, criar acoes especificas para atingi-la
- **Exemplo para Retencao (16%)**:
  - Quantos disparos de WhatsApp API na semana?
  - Quantas mensagens na comunidade do WhatsApp?
  - Fazer mini lancamento com cupom agressivo + escassez (ex: cupom R$20 off, apenas 10 unidades)
  - Quantos disparos de e-mail marketing? Que dia? Qual oferta?
- **Exemplo para Aprovacao de Pagamento**:
  - Automacao de SMS apos PIX gerado (reforcar pagamento + codigo PIX para copiar)
  - Automacao de e-mail e WhatsApp padrao
- **Exemplo para Ticket Medio**:
  - Order bumps
  - Novos produtos
  - Kits/combos
  - Nao colocar metas fora da curva sem ter meios de atingi-las
- **Exemplo para Taxa de Conversao**:
  - Quebrar em: adicao ao carrinho + conversao de checkout
  - Identificar qual etapa esta fraca e focar ajustes nela
- **Exemplo para Sessoes Organicas**:
  - Publicacoes no Instagram com automacao de MiniChat levando ao site
  - Publicacoes nos Stories com link
  - Sessoes vindas da comunidade de WhatsApp

### B. BENCHMARKS & NUMEROS

| Metrica | Valor de Referencia | Contexto |
|---------|-------------------|----------|
| Taxa de Retencao (LTV) | 12-17% | Media de 3 meses, nicho camisa de time |
| Taxa de Pagamento Aprovado | 79.47% | Media de 3 meses; motivos de nao-aprovacao: PIX nao pago + antifraude |
| Ticket Medio | R$312.36 | Loja de camisa de time |
| Taxa de Conversao Real | 0.7% | Media de 3 meses |
| CPS Midia (Custo por Sessao) | R$0.22 | Media de 3 meses, midia paga |
| Investimento em Midia Paga | R$6,614/mes | Media de 3 meses, loja de camisa de time |
| Sessoes Organicas | ~700-860/mes | Vindas de Instagram + Facebook organico |
| Distribuicao Sessoes Organicas | 76% Instagram, 12% Facebook | Google Analytics referral |

### C. REGRAS DE DECISAO

1. **Receita captada de janeiro**: Pegar media dos ultimos 3 meses + ajustar com base na realidade do mes atual
2. **Retencao**: Usar media de LTV dos ultimos 3 meses como meta
3. **Ticket Medio**: NAO colocar meta fora da curva se nao tem meios de atingi-la; manter consistente a menos que mude oferta
4. **Sazonalidades para camisa de time**:
   - Janeiro: queda (principalmente se drop com feriado chines)
   - Fevereiro: pior mes (feriado chines = pausa de 15 dias); foco em retencao
   - Marco em diante: aumento gradual
   - Copa do Mundo: faturamento pode dobrar/triplicar
   - Pos-Copa: queda inevitavel, voltar ao baseline
   - Outubro: mes mais fraco (antecede Black Friday, consumidores esperam)
   - Novembro (Black Friday): pico
   - Dezembro: final de campeonatos, segundo pico
5. **CPS alto demais**: Problema esta nos CRIATIVOS, nao necessariamente no publico
6. **Sessoes Organicas baixas**: Impacto direto no ROAS geral; investir em conteudo organico

### D. ESTRATEGIAS & TATICAS

1. **Estrategia de Retencao em janeiro (mes fraco)**:
   - Focar mais em retencao do que em aquisicao
   - Mini lancamentos na comunidade do WhatsApp
   - Aquecer publico por periodo curto + soltar cupom agressivo com escassez
   - Descontos mais agressivos para base existente (ja pagou CPA por eles)

2. **Facebook Organico nao negligenciado**:
   - Configurar Instagram para publicar automaticamente no Facebook
   - 12% das sessoes organicas vem do Facebook; nao desperdicar
   - Pagina do Facebook e Instagram devem estar alinhadas (mesma logo, mesmas informacoes)

3. **Automacao de SMS para Pagamento Aprovado**:
   - Automacao de SMS logo apos PIX ser gerado
   - Reforcar pagamento + informar codigo PIX copiavel
   - Complementar automacoes de e-mail e WhatsApp

### E. FERRAMENTAS & PROCESSOS

| Ferramenta | Uso |
|-----------|-----|
| Google Analytics | Sessoes organicas, aquisicao de trafego, dados de referral |
| Shopify / Nuvemshop | Dados de retencao (LTV), pedidos, sessoes |
| Looker Studio | Dashboard de acompanhamento, dados retroativos |
| Planilha de Planejamento Anual | Disponibilizada para alunos; preencher apenas linhas laranja |

**Como captar sessoes organicas no Google Analytics**:
1. Ir em Relatorios > Gerar Leads > Aquisicao de Trafego
2. Mudar dimensao de "Grupo Principal de Canais de Sessao" para "Origem e Midia da Sessao"
3. Pesquisar por "referral"
4. Ver sessoes do Instagram e Facebook separadamente

### F. QUOTES & MENTAL MODELS

- "A gente vai montar metas sobre metricas"
- "Faturamento e ego" (repetido varias vezes em diversas aulas)
- **Analogia da lampada**: "Se algum insight acender uma lampada pra voce, posta um story e marca a gente"
- "Janeiro tende a ser um pouco pior do que dezembro"
- "A gente tem que pensar em todos os pontos que a gente deve executar pra chegar nessas metricas"
- "Isso aqui e muito interessante pra que a gente realmente consiga visualizar de fato metricas palpaveis"
- "O pessoal fala muito de publico errado... Voces normalmente clicam em anuncios que nao fazem sentido pra voce?" (questionamento sobre CPS vs publico)
- "O que manda pra esse CPS abaixar? Criativo."

---

## AULA 02 - Estrategias de Black Friday

### A. FRAMEWORKS

#### Framework: Preparacao Completa para Black Friday
- **Nome**: Black Friday Completo (Site + Criativo + Equipe + Processo + Trafego + Estrategia + Oferta + Metrica)
- **Passos**:
  1. Definir metas realisticas (nao 10x do faturamento atual)
  2. Calcular CPA maximo, CPA ideal e ROAS minimo
  3. Definir objetivo da Black (aquisicao de base vs lucro imediato)
  4. Escolher oferta e testar "Se eu fosse cliente, compraria?"
  5. Alinhar TODA comunicacao da empresa com a oferta
  6. Preparar site (banners, videocommerce, barra de anuncios)
  7. Preparar criativos
  8. Estrategia de trafego (Black Week + semana da Black)
  9. Trabalhar base existente (comunidade, app, WhatsApp)
  10. Executar e monitorar

#### Framework: Black Week (nao apenas Black Friday)
- **Nome**: Black Week Strategy
- **Conceito**: Comecar ofertando no inicio de novembro, nao esperar o dia da Black
- **Motivo**: No dia da Black, o leilao esta carisimo (CPM sobe muito por causa de Magazine Luiza, Shopee, etc.)
- **Execucao**:
  1. Dia 1 de novembro: soltar desconto menor / progressivo menos agressivo
  2. Ao longo de novembro: ir aumentando a agressividade da oferta
  3. Terceira semana de novembro: oferta mais agressiva
  4. Na semana da Black: acelerar e fechar forte
- **Resultado real**: "Dia 1 de novembro, soltamos desconto mais baixo, tivemos 15-20 mil em 30 minutos ate meia noite e meia. So com comunidade."
- **Resultado total**: "R$1.400.000 na Black (ano passado)"

#### Framework: Simulacao de Margem e ROAS Minimo
- **Nome**: Planilha de Simulacao de Margem
- **Inputs necessarios**:
  1. Meta de faturamento
  2. Ticket medio
  3. Taxa de chargeback media (ex: 2%)
  4. Taxa de checkout/gateway (ex: 5.99%)
  5. Imposto sobre receita (ex: 3%)
  6. CMV (Custo de Mercadoria Vendida) - CUIDADO: considerar a oferta (ex: pague 2 leve 3 = pagar 3 camisas)
  7. CPA alvo (media dos ultimos 90 dias)
- **Outputs**:
  - Investimento necessario em trafego
  - Margem de contribuicao (margem bruta - CPA)
  - ROAS minimo
  - ROAS de break-even
  - Lucro bruto estimado
  - Simulacao por faixa de ROAS
  - Simulacao por aumento de orcamento
  - Impacto do LTV em D+60 e D+90

#### Framework: LTV Pos-Black Friday
- **Nome**: Bola de Neve do LTV
- **Conceito**: A Black gera base que compra novamente sem investir mais em trafego
- **Exemplo numerico**:
  - R$500K faturamento, R$83K lucro bruto
  - LTV D+60 de 1.24%: +R$1,848 de lucro bruto em 30 dias
  - LTV D+90 de 4%: +R$10K de lucro bruto em 90 dias
  - De R$83K para R$93K sem investir mais nada
- **Media LTV trabalhada**: 3% (camisas de time, recompra em 3-6 meses)

### B. BENCHMARKS & NUMEROS

| Metrica | Valor | Contexto |
|---------|-------|----------|
| Margem bruta minima | 15% | Abaixo disso, chance alta de prejuizo |
| Margem bruta ideal | 20%+ | Meta para operacoes saudaveis |
| Markup ideal | 2x+ | Maioria trabalha com 1.8x (apertado) |
| Markup apertado | 1.8x | "E um markup apertado, sendo bem sincero" |
| ROAS break-even | ~3.36 | Para operacao com markup 2x e custos tipicos |
| ROAS para margem 16% | 7.6 | "Pouquissimos estejam com ROAS desse" |
| ROAS para margem 19% | 10 | Com CPA de R$50 |
| CPA medio mercado (inicio) | R$50-60 | "Media do pessoal que chega pra gente quando comeca assessoria" |
| LTV D+90 target | 3-4% | Media para camisa de time |
| Receita de comunidade | 10-15% do faturamento | Comunidade WhatsApp |
| Receita de app | 20-23% do faturamento | App da loja |
| Black Friday total | R$1,400,000 | Resultado pessoal ano anterior |

### C. REGRAS DE DECISAO

1. **CPA reduzido = margem muito maior**: CPA de R$50 = margem 16%; CPA de R$35 = margem 20% (4pp de diferenca)
2. **Markup < 1.8x**: Sinal de alerta, margem muito apertada
3. **Margem bruta < 15%**: "Garanto que a chance de ter prejuizo e alta"
4. **Objetivo da SUA Black**: Definir ANTES se e (a) aquisicao de leads para base OU (b) lucrar agora
5. **Posicao de Ivan**: Black = aquisicao de leads. "Disposto a abaixar margem liquida, ter faturamento mais expressivo, adquirir mais leads para base"
6. **Teste de oferta**: "Se eu fosse cliente, eu teria vontade de comprar nessa oferta?" - Se a resposta for nao, mude a oferta
7. **CPM na Black**: VAI subir, e normal. Por isso fazer Black Week para vender antes do pico de custo

### D. ESTRATEGIAS & TATICAS

#### Ofertas que Funcionam (ranking Ivan)

1. **Desconto Progressivo (FAVORITA)**:
   - 1 produto: sem desconto (ou pequeno)
   - 2 produtos: R$100 off
   - 3 produtos: R$150 off
   - 4 produtos: R$250 off
   - Combinar com barra de progressao/gamificacao no site
   - "No meu ver, e uma das melhores ofertas para Black"

2. **Cupom de Desconto**:
   - 15%, 20% (se fizer sentido para margem)

3. **Personalizacao Gratuita**:
   - Menos atrativa sozinha, melhor como complemento

4. **Pague X Leve Y** (menos preferida):
   - "Nao sou muito fa dessa"
   - Se ja faz pague 2 leve 3, tem que reinventar para pague 2 leve 4 ou pague 3 leve 5

#### Gamificacao no Site
- Barra de progressao mostrando descontos conforme adiciona produtos
- Confetes/animacoes quando atinge nivel
- "Abram o aplicativo da Shopee... 50 roletas na tua tela, foguetes, confetes. Porque essa estrategia de gamificacao funciona"
- Referencia: Temu, Shopee

#### Alinhamento Total de Comunicacao
Todos os pontos de contato DEVEM refletir a oferta:
- Destaques do Instagram
- Arte fixada
- TODOS os banners do site (home, colecoes, pagina de produto)
- Videocommerce (por clube se possivel)
- Barra de anuncio do site
- Criativos de trafego
- Stories diarios
- Foto do suporte WhatsApp
- Descricao da comunidade WhatsApp

#### Banners Especificos
- Banners por time com oferta da Black
- Banner levando para comunidade WhatsApp
- Banner levando para app
- "Tirando o site e o Instagram, sao os dois canais de contato mais quente que existem: Comunidade e App"

#### Trabalhar a Base (PONTO-CHAVE #1)
- "Se eu pudesse colocar um so ponto-chave, colocaria isso: trabalhar muito bem a sua base"
- Comunidade WhatsApp gerou R$15-20K em 30 minutos na Black anterior
- App representava 20-23% do faturamento em alguns meses

### E. FERRAMENTAS & PROCESSOS

| Ferramenta | Uso |
|-----------|-----|
| Planilha de Simulacao de Margem | Calcular ROAS minimo, CPA ideal, margem por cenario |
| Videocommerce | Video no canto do site alinhado com oferta |
| Barra de Progressao (gamificacao) | Mostrar desconto progressivo visualmente |

### F. QUOTES & MENTAL MODELS

- "Faturamento e ego"
- "Se eu fosse cliente, eu teria vontade ou desejo de comprar nessa oferta?"
- "A Black, eu to disposto a abaixar um pouco a minha margem liquida, ter um faturamento mais expressivo, consequentemente adquirir mais leads pra minha base"
- "Trabalhem muito bem a propria base" (regra #1 da Black)
- "Toda a comunicacao da empresa esta voltada para oferta... quando eu falo tudo, e TUDO, mano"
- "Ate a foto do suporte do WhatsApp precisa estar alinhada"
- "Pague 2 Leve 3, tem que se reinventar"
- Sobre markup 1.8x: "E um markup apertado, cara. Sendo bem sincero."

---

## AULA 03 - Estrategia de Equipe Comercial (Recuperacao de Vendas X1)

> Aula com convidado Alex (precursor das lojas nichadas de camisa de time). Focada em recuperacao de vendas via WhatsApp X1 (1-para-1).

### A. FRAMEWORKS

#### Framework: Recuperacao de Vendas X1 no WhatsApp
- **Nome**: Estrutura X1 de Recuperacao
- **Resultados**: ~R$3,000,000 recuperados, com ~R$300,000 investidos (ROAS ~10x)
- **Tipos de lead perdido a recuperar**:
  1. **Carrinho abandonado** (95% da recuperacao - PRINCIPAL)
  2. PIX nao pago
  3. Boleto nao pago
  4. Cartao recusado
  5. Chargeback
- **Resultado potencial**: 20% da receita paga pode vir de recuperacao X1

#### Framework: Sequencia de 4 Mensagens
- **Nome**: Funil de Recuperacao em 4 Contatos
- **Regra**: Cliente normalmente compra entre a 2a e 4a mensagem
- **Sequencia**:
  1. **Dia 1 - Chamar Atencao**: Mensagem curta de curiosidade
  2. **Dia 2 - Facilitacao**: Suporte ativo, passar confianca, facilitar pagamento (ex: 3x sem juros)
  3. **Dia 3 - Identificacao de Objecao**: Entender POR QUE nao comprou, contornar objecao
  4. **Dia 4 - Oferta Irresistivel + CTA Urgente**: Brinde (chaveiro), cupom (5-15%), encerramento com CTA claro

#### Framework: Primeira Mensagem de Curiosidade
- **Nome**: Mensagem "Ola, esse numero e do [Nome]?"
- **Origem**: Insight da Morgana Kaiser no evento Drophouse (Fernando Pintos)
- **Por que funciona**: Gera curiosidade ("O que essa pessoa quer comigo? Sera importante?")
- **Resultado**: Taxa de resposta muito alta
- **Aplicacao**: Usar em QUALQUER tipo de lead (carrinho, PIX, cartao recusado)

#### Framework: Contorno de Objecoes
- **Nome**: 10-15 Objecoes Padrao
- **Principais objecoes**:
  1. **"Ta caro"** -> "Uma oficial custa R$700, aqui ta R$250, e a qualidade e a mesma"
  2. **Medo de golpe/confianca** -> Mandar CNPJ, endereco, tempo de abertura, Instagram, Google Maps, foto/video da loja
  3. **Nao entende a promocao** -> Pague 2 Leve 3 confunde muita gente; explicar claramente
  4. **Qualidade do produto** -> Enviar fotos/videos detalhados
- **Regra**: Humanizar ao maximo (audio, foto, video). "Pessoas confiam em pessoas"

#### Framework: Recuperacao de Chargeback
- **Nome**: Notificacao Extrajudicial (estrategia agressiva)
- **Passos**:
  1. Ter um numero simulando contato com advogada
  2. Mandar notificacao extrajudicial (formatada como oficial)
  3. Informar que pedido esta em transito, se quiser solicitar chargeback, aguardar recebimento
  4. Pedir que realize pagamento novamente
- **Contexto**: "Uma estrategia um pouco mais agressiva"

### B. BENCHMARKS & NUMEROS

| Metrica | Valor | Contexto |
|---------|-------|----------|
| Total recuperado (historico Alex) | R$3,000,000 | Via X1 WhatsApp |
| Investimento em operacao | 8-10% do valor recuperado | ~R$300K para R$3M |
| Receita recuperada max | 20% da receita paga | Melhor caso em uma operacao |
| Taxa pagamento com todas automacoes | 90% | Operacao com SMS + WhatsApp + Email + X1 |
| Lucro bruto (50% margem) | R$1,500,000 | Do total recuperado |
| Lucro liquido (pos custos) | R$1,375,000 | Descontando operacao |
| Exemplo rapido: R$176K | 15 dias | Uma operacao especifica |
| Carrinho abandonado | 95% | Da recuperacao total |
| Tempo maximo resposta | 20 minutos | Apos cliente responder |
| Cupom maximo na recuperacao | 5-15% | Depende da conversa/lead |
| Conversao compra | 2a-4a mensagem | Quando o cliente normalmente compra |

### C. REGRAS DE DECISAO

1. **NUNCA usar ChatGPT para scripts de venda** -> Mensagens robotizadas nao convertem
2. **Cupom NAO na primeira mensagem** -> Primeiro identificar objecao; as vezes nao e preco
3. **Tempo de resposta < 20 minutos** -> Lead esfria rapido
4. **Lead quente = prioridade** -> Quanto menos tempo desde o carrinho, mais quente
5. **Constancia**: Bater no mesmo lead varias vezes (4 contatos). Maioria nao compra no primeiro
6. **Carrinho > PIX > Cartao > Boleto**: Em ordem de potencial de recuperacao
7. **Treinar equipe do zero e preferivel**: Pessoa sem vicios de venda e mais barata e moldavel
8. **NUNCA excluir comentarios negativos no Facebook**: Ocultar sim, excluir nao (piora metricas do Face)

### D. ESTRATEGIAS & TATICAS

1. **Estrategia de Confianca**:
   - Enviar CNPJ registrado
   - Endereco da empresa
   - Tempo de abertura
   - Link do Instagram com muitos seguidores
   - Localizacao Google Maps (se loja fisica)
   - Foto/video da loja
   - Reclame Aqui positivo
   - Avaliacoes de clientes

2. **Estrategia de Humanizacao**:
   - Mandar audio ao inves de texto
   - Mandar foto e video
   - Ter um rosto na rede social (influencer, colaborador)
   - Compartilhar redes sociais (quanto mais, melhor)
   - YouTube fortalece muito a confianca

3. **Ofertas para Recuperacao**:
   - Chaveiro de brinde ("custaria R$30 mas mando gratis")
   - Cupom 5-15% (usar com criterio, nao na primeira mensagem)
   - Parcelamento facilitado (3x sem juros)
   - Sempre com CTA claro: "Posso te ajudar a finalizar agora com esse cupom?"

### E. FERRAMENTAS & PROCESSOS

| Ferramenta | Uso |
|-----------|-----|
| WhatsApp Business | Canal de recuperacao X1 |
| Automacoes (e-mail, WhatsApp, SMS) | Complementar ao X1 |
| Trello/Kanban | Organizar leads por status de recuperacao |

**SOP de Recuperacao**:
1. Identificar lead perdido (carrinho, PIX, cartao, boleto)
2. Enviar mensagem de curiosidade ("Ola, esse numero e do [Nome]?")
3. Aguardar resposta (manter tempo < 20 min)
4. Dia 1: Abordagem com incentivo de compra imediata
5. Dia 2: Facilitar compra + passar confianca
6. Dia 3: Identificar e contornar objecao
7. Dia 4: Oferta irresistivel + CTA urgente
8. Registrar objecoes para melhorar site/comunicacao

### F. QUOTES & MENTAL MODELS

- "Automacao e bom? Muito bom. Mas no X1 e um algo a mais"
- "Esse dinheiro esta na mesa. Se eu nao for atras, nao estaria no meu caixa"
- "Ola, esse numero e do [Nome]?" (mensagem campeã de curiosidade)
- "Pessoas confiam em pessoas" (humanizacao)
- "A objecao e uma porta pra venda" (objecao = oportunidade)
- "Treinar equipe do zero e preferivel a contratar especialista caro"
- "O cara esta na duvida? Manda audio, manda foto, manda video" (humanizar)
- Alex sobre lojas nichadas: "A taxa de conversao de uma loja com as cores do clube era muito maior que lojas genericas" (origem das lojas nichadas)

---

## AULA 04 - Estrategia Completa de Meta Ads

### A. FRAMEWORKS

#### Framework: Estrutura Completa de Campanhas Meta Ads
- **Nome**: Pipeline de Campanhas (da Coleta a Escala)
- **Filosofia central**: "Facebook e teste. Teste infinito. Voce nunca vai parar de testar no Face."
- **Fluxo**:
  1. **Coleta de Dados** (campanha permanente)
  2. **Catalogo Advantage+** (apos 7 dias de coleta)
  3. **Teste Criativo** (variavel isolada)
  4. **Teste de Publico** (variavel isolada)
  5. **Escala** (ABOmax, CBO, Advantage+, Lookalike)
  6. **Remarketing** (ABO, segmentado por temperatura)
- **Regra critica**: NAO e tabua engessada. Se teste criativo esta vendendo, NAO pause para ir pro teste publico. Rode em paralelo.
- **Resultado**: "Quando voce chegar na etapa de escala, provavelmente ja vai estar escalado"

#### Framework: Coleta de Dados
- **Nome**: Campanha de Coleta de Dados
- **Estrutura**: 1 campanha, 2 conjuntos de anuncios
- **Conjunto 1**: Objetivo = Ver Conteudo, catalogo padrao de todos os produtos, R$7/dia
- **Conjunto 2**: Objetivo = Adicao ao Carrinho, catalogo padrao de todos os produtos, R$7/dia
- **Segmentacao**: Interesses relevantes (Brasileirao, Libertadores, ESPN, futebol, compradores envolvidos, compras online)
- **Catalogo**: Padrao (NAO Advantage+)
- **Regra**: "Primeira campanha que a gente sobe e a ultima que a gente mata"
- **Por que nunca matar**: Novos produtos sao incluidos no catalogo; compra dados continuamente
- **Otimizacao**: NENHUMA (nao mexer em orcamento, nao otimizar)
- **Metricas boas**:
  - Ver Conteudo: < R$0.10 por acao
  - Adicao ao Carrinho: < R$1.00

#### Framework: Catalogo Advantage+
- **Nome**: Campanha Advantage+ (Catalogo Todos os Produtos)
- **Quando subir**: Apos 7 dias de Coleta de Dados rodando (pode acelerar investindo mais na coleta)
- **Estrutura**: 1 campanha Advantage+, catalogo de todos os produtos
- **Publico**: Aberto (a coleta ja inteligenciou o catalogo)
- **Resultado exemplo**: R$1,500 investido -> R$12,000 retorno (ROAS 7, CPA R$28)
- **Resultados de clientes**: CPAs de R$2-6.50 (excepcionais)
- **Evolucao**:
  1. Campanha mae (todos os produtos, aberto)
  2. Identificar clubes que vendem mais
  3. Criar campanhas filiais nichadas por clube (conjunto de catalogo + segmentacao do clube)
- **Otimizacao**: Analogia da Escada (ver abaixo)
- **REGRA**: "O pior inimigo no catalogo e a pressa. Catalogo precisa de tempo."

#### Framework: Teste Criativo (Variavel Isolada)
- **Nome**: Teste de Criativo Individual
- **Estrutura**: 1 campanha, 3 conjuntos, MESMA segmentacao, MESMO criativo em cada conjunto
- **Tipo**: ABO ou CBO
- **Segmentacao**: Apenas interesse do clube (ex: Santos). Sem idade, sem genero, sem localizacao
- **Por que mesma segmentacao**: Testar APENAS o criativo como variavel
- **Organizacao em Trello**:
  1. Coluna: Ideias de criativos
  2. Coluna: Criativos em teste
  3. Coluna: Criativos validados
  4. Coluna: Criativos reprovados
  5. Coluna: Criativos para segunda chance (vendeu algo mas nao validou)

#### Framework: Teste de Publico (Variavel Isolada)
- **Nome**: Teste de Publico Individual
- **Estrutura**: 1 campanha, 5 conjuntos (ou mais, ate 15), CRIATIVO VALIDADO em todos, SEGMENTACAO DIFERENTE em cada
- **Regra**: Pelo menos 1 conjunto com segmentacao "fora da caixa"
- **Variaveis para testar**: Genero, idade, regiao, interesse, comportamento, posicionamento, dispositivo
- **Publicos "fora da caixa" ja validados**:
  - Cerveja, churrasco, Brahma
  - Caze TV, TNT Sports, Sport TV
  - Funkzinho carioca (para publico do Rio)
  - Society/futebol amador
  - Influenciadores que o publico acompanha
  - Estado do clube, cidade (cuidado com CPM)
- **Publicos validados para mulher**:
  - Compradores envolvidos + compras na internet
  - Interesse no clube + interesse em Virginia + IPINC
  - Faixa 18-24, estado especifico, so Instagram
- **Regra**: SEMPRE colocar pelo menos a segmentacao do clube. "Se eu acertar a porra desse publico fora da caixa, eu surfo sozinho"

#### Framework: ABOmax (Escala por Duplicacao)
- **Nome**: ABOmax / Estrategia de Duplicacao
- **Estrutura inicial**: 1 campanha, 5 conjuntos, 1 anuncio (APENAS informacoes validadas)
- **Execucao**:
  1. Dos 5 conjuntos, 3 vendem -> matar os 2 que nao vendem
  2. Duplicar os 3 que vendem para 3, 5, 10 novos conjuntos
  3. Repetir: vendeu -> duplicar; bateu CPA max sem vender -> matar
  4. Olhar gerenciador CONSTANTEMENTE
- **Rigor**: "Sou MUITO rigoroso em relacao a CPA nessa campanha"
- **Limite de duplicacao**: "Ja dupliquei 90, 150 conjuntos" (depende do orcamento e atencao)
- **ALERTA**: NUNCA duplicar e dormir/sumir. Tem que monitorar.
- **Otimizacao**: Analogia da Escada nos conjuntos que estao vendendo bem
- **Aplica-se a**: Campanhas ABO e CBO. NAO aplica-se a Advantage+ (vertical, nao horizontal)

#### Framework: CBO Semanal/Quinzenal (Reciclagem)
- **Nome**: CBO de Reciclagem
- **Conceito**: Dar segunda chance a criativos/publicos da coluna "segunda chance" do Trello
- **Execucao**: 1 campanha CBO por semana com todos os criativos que nao validaram mas tiveram vendas
- **Por que CBO**: Facebook decide onde gastar; bom para testar em massa

#### Framework: Advantage+ para Escala
- **Nome**: Campanha Advantage+ (Escala Vertical)
- **Regra**: Campanha VERTICAL (um unico conjunto com orcamento alto)
- **NAO duplicar conjuntos** (causa sobreposicao de leilao)
- **Otimizacao**: APENAS orcamento (analogia da escada)
- **Configuracao do publico Advantage+**:
  - Publico engajado: Add to Cart 30d, View Content 30d, interacao catalogo 180d
  - Clientes existentes: compradores dos ultimos 90 dias (testou 30, 60, 90; 90 performou melhor)

#### Framework: Remarketing Segmentado por Temperatura
- **Nome**: Remarketing ABO (Quente/Morno/Frio)
- **Estrutura**: 1 campanha ABO, 3 conjuntos
- **Divisao de publico**:
  - Quente: 7 dias
  - Morno: 14 dias
  - Frio: 30 dias
- **Por que ABO e nao CBO**: CBO gastaria so no publico frio (maior volume)
- **Tipos de remarketing testados**:
  1. **UGC/Influenciador**: Manter mesma campanha e ir alimentando com novos UGCs (campanhas armazenam inteligencia)
  2. **Catalogo**: Todos os produtos nos 3 conjuntos de temperatura
  3. **Imagem com desconto nichado**: "10% off em todos os produtos do Timao. Use cupom TIMAO10"
- **Eventos para testar**: Add to Cart, Page View, View Content, Finalizacao de Compra, Inclusao Info Pagamento
- **Quando rodar**: Quando CPM nao estiver estourado (CPM R$90-100 = pouco publico ainda)

#### Framework: Lookalike por Porcentagem
- **Nome**: Campanha Lookalike 1-10%
- **Estrutura**: 1 campanha, 10 conjuntos (cada um = uma porcentagem de semelhanca)
- **Criativos**: APENAS validados do clube especifico
- **Pre-requisito**: Gasto relevante, dados suficientes
- **Resultado**: R$14K investido -> R$90K retorno em 1 dia (ROAS 6)
- **Duplicacao**: Conjuntos que vendem podem ser duplicados (ABOmax dentro do Lookalike)
- **Publico no conjunto**: APENAS o personalizado (lookalike). Sem adicionar interesse do clube novamente.

#### Framework: Analogia da Escada (Otimizacao de Orcamento)
- **Nome**: Estrategia da Escada
- **Aplica-se a**: TODAS as campanhas exceto Coleta de Dados
- **Regras**:
  1. Bom resultado -> subir 1 degrau (aumentar orcamento)
  2. Bom resultado de novo (2 dias) -> subir mais 1 degrau
  3. Resultado ruim -> ficar no mesmo degrau por 2-3 dias
  4. Resultado ruim permaneceu -> descer 1 degrau
  5. Continua ruim -> descer mais 1 degrau
  6. Chegou em orcamento minimo e ainda ruim -> MATAR campanha
- **Aumento de orcamento**: Depende do valor (R$50 -> R$70; R$1000 -> R$1250). Nao existe regra fixa.
- **Exemplo real**: Campanha que foi de R$75/dia ate R$1,200/dia e voltou, subindo e descendo varias vezes

#### Framework: Estrategia de Alavancagem (Sazonalidade)
- **Nome**: Alavancagem de Orcamento em Picos
- **APENAS em dias de sazonalidade extrema** (pos-campeonato, finais)
- **Execucao**:
  1. Identificar horarios de pico (10h-12h e 18h-22h30)
  2. Nos conjuntos com resultado otimo, jogar orcamento para R$25K-30K
  3. Nao vai gastar tudo (o periodo e curto)
  4. Quando acabar o horario de pico, VOLTAR o orcamento ao normal
  5. NUNCA dormir com orcamento alto
- **ALERTA**: "Pelo amor de Deus, nao facam isso no dia-a-dia. E loucura."

### B. BENCHMARKS & NUMEROS

| Metrica | Valor | Contexto |
|---------|-------|----------|
| CPS Midia (custo por sessao) bom | < R$0.22 | Midia paga |
| CPM conta de anuncio (antes coleta) | R$22-25 | Sem coleta de dados |
| CPM apos coleta de dados | R$8 | Pos 7-15 dias de coleta |
| Custo Add to Cart (coleta) bom | < R$1.00 | Campanha de coleta |
| Custo View Content (coleta) bom | < R$0.10 | Campanha de coleta |
| CPA baixo (catalogo) | R$2-6.50 | Resultado excepcional de clientes |
| CPA medio (catalogo Advantage+) | R$28 | Com ticket mais baixo |
| CPA campanha de escala | R$50-80 | Campanhas com alto investimento |
| ROAS catalogo | 7-8 | Campanha Advantage+ |
| ROAS escala (Lookalike) | 6 | R$14K -> R$90K em 1 dia |
| ROAS coleta de dados | 1.6 | Normal e esperado (objetivo nao e vender) |
| Investimento coleta de dados | R$7/dia por conjunto | 2 conjuntos = R$14/dia |
| Orcamento Advantage+ inicial | R$30-50/dia | Depende do caixa |
| % orcamento para teste | Dedicar porcentagem fixa | Nunca parar de testar |
| Compradores homens | 98% | Loja de camisa de time |
| Faixa etaria top | 18-24 e 25-34 | Loja de camisa de time |
| Facebook Reels compras | Muito baixo (1) | Quase todas vindas de Instagram |
| Posicionamentos que convertem | Instagram Reels, Instagram Stories | Nicho camisa de time |
| Campanhas simultaneas na escala | 10-15 campanhas | Trazendo resultado todo dia |

### C. REGRAS DE DECISAO

1. **Facebook e teste**: Destinar porcentagem do orcamento para testar SEMPRE
2. **Nunca dependa de uma unica campanha**: Escala horizontal (varias campanhas, criativos, publicos)
3. **Acertou a mao? Continue testando**: "Nao existe resultado bom que nao possa melhorar"
4. **Entenda o objetivo de cada campanha**:
   - Coleta: comprar dados (ROAS baixo e normal)
   - Catalogo: CPA barato, ROAS alto, orcamento menor
   - Escala: ROAS mais baixo, orcamento alto, faturamento expressivo
5. **Sazonalidades**:
   - Final de mes: CPA mais caro (normal para TODAS as lojas)
   - Comeco de mes: CPA mais barato -> testar mais criativos no inicio do mes
   - Final de campeonato: melhor momento para camisa de time
6. **CPA muito caro, nao vendeu**: Matar conjunto (ser rigoroso em duplicacao)
7. **Catalogo Advantage+**: NUNCA duplicar conjuntos (sobreposicao de leilao). Otimizar apenas orcamento.
8. **Remarketing CPM alto (R$90-100)**: Nao e momento de rodar. Usar publico da etapa anterior do funil.
9. **Comentarios negativos**: OCULTAR, nunca excluir. Excluir prejudica metricas do Facebook.
10. **Pixel no codigo do tema + App nativo**: NAO ter os dois (duplicacao de metrica). Escolher um.
11. **App nativo da Shopify (Facebook & Instagram)**: Melhor performance de catalogo; compartilhamento de dados no MAXIMO

### D. ESTRATEGIAS & TATICAS

#### Configuracoes Criticas no Facebook
1. **Integrar App Nativo da Shopify (Facebook & Instagram)**:
   - Dados compartilhados no MAXIMO
   - Melhor performance de catalogo vs Flexify ou Quintas
   - Cria catalogos automaticamente por colecao
   - NAO ter pixel no codigo do tema simultaneamente

2. **Conectar Google Analytics na conta de anuncios**:
   - Gerenciador de Eventos > Integracoes de Parceiros > Analises
   - Analytics e a plataforma mais avancada para coletar dados
   - Mais dados para o Facebook = melhor performance

3. **Configurar Publico Advantage+**:
   - Publico engajado: Add to Cart 30d + View Content 30d + interacao catalogo 180d
   - Clientes existentes: compradores dos ultimos 90 dias

4. **Categoria de produto na Shopify**: Colocar "futebol" (nao futebol americano)

5. **UTMs nativas do Facebook** (traqueamento sem plataforma paga):
   - Origem: `{{site_source_name}}`
   - Meio: `{{adset.name}}`
   - Nome campanha: `{{campaign.name}}`
   - Conteudo: `{{ad.name}}`
   - UTM term: `{{placement}}`
   - Copiar tudo apos `?` e colar em "Parametros de URL"

6. **Configuracao de catalogo no anuncio**:
   - Product Name + descricao com preco atual
   - CTA: "Saiba Mais" (nao "Comprar Agora") para coleta de dados
   - Otimizacoes do Facebook: TODAS exceto IA (gerar fundo, musica)
   - Formato: Imagem unica em carrossel (NAO apresentacao multimidia)

#### Criativos que Funcionam
1. **Anuncio que NAO parece anuncio**: Gerar desejo, humanizacao
2. **Apito no inicio do criativo**: Chamar atencao nos 3 primeiros segundos
3. **Criativo sem fala/narracao**: Musica de fundo + visual gerando desejo (escalou muito para publico feminino)
4. **UGC (User Generated Content)**: Para remarketing. Manter na mesma campanha e ir alimentando
5. **Story Ads**: Formato story com fontes de stories, parece conteudo organico
6. **Preco no criativo**: Afasta curioso, atrai qualificado
7. **Teste de variacoes**: Mesmo video/imagem com CTAs diferentes (40% off, Leve 3 Pague 2, etc.)
8. **Fotos profissionais de produto**: Modelar Nike, Adidas, ProDirect. "E outro catalogo quando voce tem esse tipo de foto"
9. **NUNCA usar foto com fundo de grade**: "Pare de usar foto com fundo de grade, a nao ser que venda atacado"

#### Organizacao e Nomenclatura
- Nomenclatura clara nas campanhas (especialmente lojas multi-time)
- Criativos nomeados (C1, C2, C3, C4...)
- Organizacao em Trello por status de criativo

#### Contingencia
1. **Operacao nichada/agressiva**: AdSpower + Proxy
2. **Ambos (nichada e generica)**: Contingencia de Pixel
   - BM mae cria o pixel
   - Compartilha pixel e catalogo com BMs filiais
   - Rodar trafego pelas BMs filiais
   - Se BM mae cai, assets continuam acessiveis nas filiais
3. **Operacao generica**: Nao precisa contingencia tao estruturada, mas SEMPRE compartilhar ativos

### E. FERRAMENTAS & PROCESSOS

| Ferramenta | Uso |
|-----------|-----|
| App Nativo Shopify (Facebook & Instagram) | Integracao de catalogo e pixel |
| Google Analytics | Conectar na conta de anuncios para mais dados |
| InstaAI | Puxar dados do Facebook via API para Looker Studio |
| Looker Studio | Dashboard de analise de metricas |
| AdSpower | Contingencia de contas de anuncio |
| Proxy | Evitar identificacao de padrao entre contas |
| Extensao Chrome (mineracao) | Ver anuncios escalados de concorrentes, filtrar por replicas |
| Trello | Organizar criativos (ideias, em teste, validados, reprovados, segunda chance) |
| PokeImports / Coala | Importar produtos de outras lojas Shopify |
| BkReviews | Importar avaliacoes via CSV |

### F. QUOTES & MENTAL MODELS

- "Facebook e teste. Teste infinito. Voce nunca vai parar de testar no Face."
- "Nao existe resultado bom que nao possa melhorar"
- "Priorize escala horizontal" (nunca depender de 1 campanha)
- "Entenda o objetivo de cada campanha" (repetido 10+ vezes)
- "Tudo que e nichado tem uma conversao maior" (regra fundamental)
- "Se eu acertar esse publico fora da caixa, eu surfo sozinho" (sobre publicos diferenciados)
- "Primeira campanha que a gente sobe e a ultima que a gente mata" (coleta de dados)
- "Catalogo, o pior inimigo vai ser a pressa"
- "Voce prefere um ROAS de 12 faturando R$100K ou um ROAS de 6 faturando R$1M?" (sobre escala)
- "A tendencia e: quanto mais investir, mais o ROAS vai descer"
- "Numeros falam com a gente. Basta saber escutar."
- "Delegar e largar tem uma diferenca muito grande"
- "Eu quero ensinar voces a serem empresarios fodas" (sobre delegar trafego)
- "O que pode quebrar nosso negocio hoje?" (pergunta da Sala de Guerra semanal)
- "Anuncio que nao se parece com anuncio" (tendencia de criativo que funciona)
- "Por que voces vendem camisa a R$229? Porque toda a estrutura do site justifica isso. Inclusive a foto do produto." (sobre qualidade visual)
- Sobre Facebook Reels: "Uma compra, mano. Por que voce vai rodar pro Facebook?"

#### Mental Model: Sala de Guerra (Sexta-feira)
- Reuniao semanal com lideres de setor
- Regra: "Finjam que estao bebados, tirem todo filtro"
- Pode falar palavrao, ser direto
- Pergunta obrigatoria: "O que pode quebrar nosso negocio hoje?"
- Objetivo: Desenvolver "cabeca de dono" nos colaboradores

#### Mental Model: Delegacao Estruturada
- Contratar colaborador e treinar com seus conhecimentos
- Pessoa do zero = melhor (sem vicios)
- Compartilhar o Miro/estrategia com gestor/agencia
- Delegar != Largar
- Engrenagem deve rodar sem voce
- Bonificar equipe: "Nao tem como querer que equipe seja engajada se recebe R$800/mes"

---

## AULA 05 - Estrategia de Automacoes e CRM

### A. FRAMEWORKS

#### Framework: Automacoes de E-mail e WhatsApp Completas
- **Nome**: Estrutura Completa de Automacoes (CRM)
- **Resultado**: 31% de taxa de recuperacao media (mercado: 10-15%)
- **Resultado numerico**: R$155K em vendas recuperadas em um mes (dinheiro que nao entraria)
- **Plataforma principal**: Reportana (R$159/mes) - custo-beneficio. Para escala: Klaviyo (e-mail) + Reportana (WhatsApp)
- **Eventos com automacao**:
  1. Pedido Pago (com upsell)
  2. PIX Gerado e Vencido
  3. Cartao Recusado
  4. Carrinho Abandonado (MAIS RESULTADO)
  5. Atualizacoes de Rastreio (postado, saiu para entrega, falha, entregue)
  6. Pedido Entregue + Funil de Remarketing (90-120 dias)

#### Framework: Janelas de Funil por Evento
- **Nome**: Janela de Tempo por Automacao
- **Duracoes**:

| Evento | Janela | Notas |
|--------|--------|-------|
| Carrinho Abandonado | 30 dias | Testou 60 e 90 dias; conversao muito baixa apos 30 |
| Pedido Pago | 3 dias | Upsell com desconto 15-20% |
| PIX Gerado/Vencido | 5 dias | Oferta de desconto apos vencimento |
| Cartao Recusado | 3 dias | Oferta de pagamento via PIX |
| Pedido Entregue (Remarketing) | 90-120 dias | Baseado no tempo medio de recompra |

#### Framework: Funil de Remarketing Pos-Entrega
- **Nome**: Funil de Remarketing (90-120 dias)
- **Conceito**: Calcular tempo medio de recompra dos clientes recorrentes e criar funil com essa duracao
- **Passos**:
  1. Identificar media de tempo para segunda/terceira compra
  2. Criar funil de automacao com essa duracao
  3. Enviar mensagens periodicas tentando reativar
  4. Oferecer desconto na automacao de pedido entregue
- **Em desenvolvimento**: Mostrar no e-mail produtos que o cliente visualizou (nao nativo da Reportana; Klaviyo ja tem)

#### Framework: Objecoes por Evento
- **Nome**: Quebra de Objecao por Evento
- **3 principais objecoes**: Preco, Confianca/Credibilidade, Qualidade
- **PIX nao pago**: Maioria e por PRECO -> oferecer 5% de desconto adicional alem do desconto do PIX
- **Cartao recusado (antifraude)**: Oferecer pagamento via PIX (nao tem como destornar)
- **Carrinho abandonado**: Pode ser qualquer das 3 -> sequencia de mensagens para identificar

#### Framework: Evolucao de E-mail em 2 Fases
- **Nome**: E-mail V1 (Esqueleto) -> V2 (Profissional)
- **Fase 1 (V1 - Primeiros 2-3 meses)**:
  - E-mail basico: apenas copy, CTA, botao e logo
  - Imagens em JPEG (mais leves que PNG)
  - Pouco negrito, pouco maiusculo (evita spam)
  - Objetivo: construir reputacao do dominio com a plataforma
- **Fase 2 (V2 - Apos reputacao construida)**:
  - E-mail profissional modelando Nike/Adidas
  - 80% imagem, 20% escrita
  - Fotos de produtos, sessoes de confianca, multiplos CTAs
  - Testar V2 vs V1: se taxa de abertura cair muito, dominio nao esta pronto
- **Regra de transicao**: Se taxa de abertura nao cair de forma grotesca, pode migrar para V2

#### Framework: Copy de E-mail com Sexy Canvas
- **Nome**: Metodologia Sexy Canvas (Andre Diamant)
- **Conceito**: Usar os 7 pecados capitais para persuadir o cliente
- **Implementacao com IA**:
  1. Criar projeto no Claude (ou ChatGPT) chamado "Andre Diamant"
  2. Fazer upload dos livros do Andre Diamant (PDFs)
  3. Dar instrucoes em texto sobre como o projeto deve responder
  4. Pedir para otimizar e-mails ou criar novos seguindo a metodologia
- **Prompt exemplo**: "Andre, amanha dia X tenho disparo de e-mail para toda a base sobre Dia dos Pais. Utilize metodologia Sexy Canvas, siga padroes Nike/Adidas, crie o melhor e-mail possivel para conversao maxima."
- **Resultado**: IA gera banners sugeridos, copy, cabeçalho, estrutura completa

#### Framework: Segmentacao de Base por Clube
- **Nome**: Listas Segmentadas na Reportana
- **Tipos de segmentacao**:
  1. Carrinho abandonado por clube (ex: "produto contem Palmeiras")
  2. Compradores por clube
  3. Clientes dos ultimos 180 dias
  4. Clientes que abriram e-mails
  5. Clientes que ja receberam compras
- **Criacao**: Automatica e retroativa (puxa historico da loja). Atualiza sozinha.
- **Uso**: Disparos nichados por clube + automacoes segmentadas

#### Framework: Teste A/B de Automacoes
- **Nome**: Randomizacao de Copy
- **Execucao na Reportana**: Funcao "Randomizar" joga 50% leads para versao A, 50% para versao B
- **Metricas para comparar**:
  1. **Conversao por Envio**: Receita gerada por cada envio da automacao
  2. **Conversao por Clique**: Receita gerada por cada clique na automacao
- **Exemplo real**: Segundo contato carrinho abandonado = R$53/envio, R$533/clique
- **Processo**: Testar variacoes de copy, identificar padrao, chegar em porcentagem cada vez maior de recuperacao

### B. BENCHMARKS & NUMEROS

| Metrica | Valor | Contexto |
|---------|-------|----------|
| Taxa recuperacao media (Ivan) | 31% | Sobre carrinhos abandonados; media de todos clientes |
| Taxa recuperacao mercado | 10-15% | Media do mercado |
| Recuperacao total mes | R$155K | Soma de todos clientes CDR Labs |
| Carrinhos abandonados (mes) | R$454K | Total de carrinhos abandonados dos clientes |
| Automacao e-mail (2 meses) | R$30K | Uma operacao |
| Automacao WhatsApp | R$55K | Uma operacao, 60-70% do total |
| Automacao e-mail | R$30K | Uma operacao, 30-40% do total |
| Total automacoes 1 operacao | R$85K | E-mail + WhatsApp |
| Disparo e-mail (1 loja/mes) | R$15K | Somente disparos de campanha |
| Conversao por envio (carrinho #2) | R$53 | Por cada envio |
| Conversao por clique (carrinho #2) | R$533 | Por cada clique |
| Taxa abertura e-mail | 23% | Automacoes de e-mail |
| Taxa abertura WhatsApp | 90%+ | Automacoes |
| Taxa desinscricao e-mail | 0.10% | Abaixo de 1% |
| Frequencia disparo e-mail | 2-3x por semana | Normal: 2; sazonalidade: 3 |
| Reportana mensal | R$159 | Plataforma de automacao |
| Klaviyo | R$300-500+ | Variavel por base de leads |
| Emojis no assunto | +42-50% taxa abertura | Pesquisa do Gemini; fonte gringa |
| E-mail: imagem vs texto | 80% imagem, 20% texto | O que mais converte |
| Metricas de operacao (Ivan) |  |  |
| Adicao ao carrinho (e-commerce geral) | 8-10% | Media do mercado |
| Adicao ao carrinho (Ivan) | 13-15% | Operacoes dele |
| Conversao checkout (e-commerce geral) | 18-20% | Media do mercado |
| Conversao checkout (Ivan) | 25-30% | Operacoes dele |
| Conversao por sessao (e-commerce geral) | 1% | Media do mercado |
| Conversao por sessao (Ivan) | 1.5-1.7% | Operacoes dele |

### C. REGRAS DE DECISAO

1. **Tem trafego rodando? TEM QUE TER automacao ativa.** "Automacao tem que ser crucial."
2. **Nao menosprezem e-mail**: E-mail converte menos em taxa, mas WhatsApp tem abertura de 90%+ e converte mais em volume absoluto
3. **Comecar com e-mail basico (V1)**: Evitar spam, construir reputacao. Migrar para V2 apos 2-3 meses.
4. **PIX vencido**: Oferecer desconto adicional (objecao principal e preco)
5. **Cartao recusado (antifraude)**: Oferecer pagamento PIX (sem estorno possivel)
6. **Pedido pago**: Upsell com 15-20% desconto (CPA ja foi pago)
7. **Klaviyo vs Reportana**: Faturando R$100K+/mes -> Klaviyo para e-mail + Reportana para WhatsApp
8. **Disparo WhatsApp Business**: "Cai muito facil. 3-4 disparos cai." -> Usar API oficial
9. **Carrinho abandonado e-mail de time brasileiro em automacao**: Usar imagem de produto INTERNACIONAL (nao pode mandar camisa do Corinthians para palmeirense)
10. **Muito negrito/maiusculo no e-mail**: Aumenta chance de cair no spam
11. **Modelar Nike e Adidas**: E-mails quadrados (sem borda arredondada) passam sofisticacao no subconsciente
12. **Links no e-mail**: Se fala de varios clubes -> link para COLECAO. Se nichado para 1 clube -> link para PRODUTO.
13. **Fonte do e-mail**: Helvetica, tamanho 16 para texto, 28 para cabeçalho
14. **Additicao carrinho < 8%**: "Pagina do produto esta horrivel. Liga o alerta."
15. **Olhar para dados sempre**: "Numeros estao querendo dizer alguma coisa pra gente. A gente tem que saber analisar."

### D. ESTRATEGIAS & TATICAS

#### Assuntos de E-mail que Convertem (Gatilho de Curiosidade)
- "Comece da melhor forma, [Nome]" (com cupom 5% no dia 1 do mes) -> R$3K conversao
- "O mundo vai parar" (sobre semifinal) -> 84% taxa abertura
- "As mais desejadas do momento" (com emoji sugestivo para publico masculino)
- **Regra**: Sempre usar pelo menos 1 emoji no assunto (max 2)
- **Pesquisa**: E-mails com emoji no assunto tem 42-50% mais abertura

#### Estrutura de E-mail Profissional (V2, modelando Nike/Adidas)
1. Banner/imagem de cabecalho (alinhado com oferta)
2. Heading (fonte Helvetica, 28px, bold, maiusculo)
3. Copy curta (Helvetica, 16px, pouco negrito)
4. Botao CTA #1 (fundo preto, fonte branca, sem borda arredondada, alinhado a esquerda)
5. Sessao de 2 colunas: foto produto + copy de qualidade (alternando lados)
6. Botao CTA #2 (borda preta, fundo branco - variacao visual)
7. Repetir sessao 2 colunas (3 vezes alternando)
8. Sessao de produtos recomendados (2 colunas com foto, titulo, preco, parcelamento, botao)
9. Botao "Ver todas as camisas" (para quem nao se interessou pelos produtos mostrados)
10. Rodape: logo + redes sociais (Instagram, YouTube, TikTok) + CNPJ

#### Automacao PIX Vencido (Diferencial)
- 90% das lojas so tem automacao padrao de PIX (lembrete de pagamento)
- Apos PIX vencer: enviar oferta com desconto adicional (5%+)
- Objecao principal: preco
- "Poucas pessoas fazem CTA apos PIX vencido. Isso daqui faz diferenca."

#### Automacao Cartao Recusado
- NAO e cartao sem limite; e quando plataforma identifica possivel fraude
- Oferecer pagamento via PIX
- PIX nao tem como destornar (elimina risco de chargeback)

#### Automacao Pedido Pago (Upsell)
- 15-20% desconto para segunda compra
- Pode ser mais agressivo porque CPA ja foi pago
- Enviar no primeiro ou segundo contato pos-compra

#### Videocommerce por Colecao
- Nao usar app pago; HTML customizado
- Um video para home, um por colecao (por clube), um por produto escalado
- Funciona muito bem para taxa de conversao

#### Avaliacoes Customizadas
- Avaliacoes com foto + mencao da loja ("Recomendo demais [nome da loja]")
- Especialmente eficaz para publico feminino
- "Mulher tem muito costume de olhar avaliacao"

#### CDR Labs CRM Dashboard
- Atualiza automaticamente todo dia
- Metricas rastreadas:
  - Taxa de conversao por etapa do funil
  - Taxa de adicao ao carrinho
  - Conversao de checkout
  - Conversao por sessao
  - Taxa de pedido pago
  - LTV
  - Resultado de campanhas e-mail
  - Resultado de automacoes
  - Taxa de conversao diaria

### E. FERRAMENTAS & PROCESSOS

| Ferramenta | Uso | Custo |
|-----------|-----|-------|
| Reportana | Automacoes e-mail + WhatsApp + listas + disparos | R$159/mes |
| Klaviyo | E-mail marketing avancado (servidor proprio, segmentacao) | R$300-500+/mes |
| Claude AI | Criar projetos de copy (metodologia Sexy Canvas) | Pago |
| Gemini | Pesquisa de benchmarks e dados de mercado | Gratuito |
| Google Sheets / GPT | Calcular conversao por envio e por clique | - |
| API Oficial WhatsApp | Disparos em massa sem risco de queda | Custo por mensagem |

**Reportana vs Klaviyo**:
- Reportana: R$159, bom custo-beneficio, servidor compartilhado (limita taxa de entrega)
- Klaviyo: servidor proprio por loja, segmentacao avancada (mostra produtos visualizados), mais cara
- Recomendacao: Ate R$100K/mes -> Reportana. Acima -> Klaviyo (e-mail) + Reportana (WhatsApp)

**Como calcular conversao por envio**:
1. Pegar dados da Reportana (envios, cliques, receita)
2. Jogar no ChatGPT: "Quero calcular conversao por envio" + mostrar dados
3. GPT gera as formulas

**Import/Export de automacoes**:
- Reportana permite importar/exportar automacoes entre lojas
- Criar esqueleto V1, exportar, importar na nova loja, ajustar (logo, oferta, identidade visual)

### F. QUOTES & MENTAL MODELS

- "Nao menosprezem a porra do e-mail" (enfatico)
- "Faturamento e ego" (repetido novamente)
- "Automacao tem que ser crucial. Tem trafego rodando, tem que ter automacao ativa."
- "Com dados, voces tem respostas. Com dados, voces sabem pra onde ir."
- "Um dos motivos que me fez ter resultado tao expressivo e rapido foi sempre olhar para numero"
- "Numeros estao querendo dizer alguma coisa pra gente. A gente tem que saber analisar e entender."
- "A gente testa, olha pra numeros, olha pra dados, identifica padrao e ajusta. Isso pra tudo, nao e so pra e-mail."
- Sobre modelar Nike/Adidas: "No subconsciente dele, por a gente modelar grandes e-commerce, ele tem esse comportamento... 'essa loja tem visual de loja gigantesca, de loja que passa confianca'"
- "Entre no funil reverso de grandes marcas: gere um PIX na Nike, abandone carrinho na Adidas, para entender os e-mails deles"
- "CDR = Constancia, Dados e Resultado"
- "Olhem para dados. Eu acho que um dos motivos que fez eu ter um resultado tao expressivo e rapido no digital foi sempre olhar para numero."
- "Muitas vezes nao e o CPA que esta caro, nao e o problema nos anuncios, o problema e na sua operacao"

---

## TEMAS TRANSVERSAIS (Presentes em Multiplas Aulas)

### Principios Fundamentais de Ivan Furtado

1. **Dados acima de tudo**: "Olhem para numeros. Numeros falam com a gente." (Aulas 01, 04, 05)
2. **Faturamento e ego**: Lucro e margem sao o que importam (Aulas 01, 02, 05)
3. **Tudo que e nichado converte mais**: Lojas nichadas, publicos nichados, e-mails nichados (Aulas 03, 04, 05)
4. **Teste infinito**: Nunca parar de testar (Facebook, e-mail, copy, publico) (Aulas 01, 04, 05)
5. **Trabalhe a base existente**: CPA ja foi pago; retentor e mais barato que aquisicao (Aulas 01, 02, 03, 05)
6. **Modele grandes marcas**: Nike e Adidas como referencia para e-mails, site, fotos (Aulas 04, 05)
7. **Entenda o objetivo**: Cada campanha, cada metrica, cada acao tem um objetivo especifico (Aulas 01, 02, 04)
8. **Delegue (nao largue)**: Treinar equipe, criar processos, ser estrategico (Aula 04)
9. **Identifique padroes**: A habilidade mais valiosa em trafego e marketing (Aulas 04, 05)
10. **Gamificacao funciona**: Shopee, Temu, barra de progressao (Aula 02)

### Metricas-Chave que Ivan Monitora

| Metrica | Onde Monitorar |
|---------|---------------|
| ROAS | Gerenciador de Anuncios |
| CPA | Gerenciador de Anuncios |
| CPS (Custo por Sessao) | Planilha / Looker Studio |
| CPM | Gerenciador de Anuncios |
| Taxa de Conversao por Sessao | Shopify / Analytics |
| Taxa de Adicao ao Carrinho | Shopify / Analytics |
| Taxa de Conversao de Checkout | Shopify / Analytics |
| Taxa de Pagamento Aprovado | Shopify |
| LTV / Retencao | Shopify / Analytics |
| Ticket Medio | Shopify |
| Sessoes Organicas | Google Analytics |
| Markup | Planilha (preco venda / custo produto) |
| Margem Bruta | Planilha |
| Conversao por Envio | Reportana + Planilha |
| Conversao por Clique | Reportana + Planilha |
| Taxa Recuperacao | Reportana |
| Taxa Abertura E-mail | Reportana / Klaviyo |

### Stack Tecnologico Completo (Ivan / CDR)

| Categoria | Ferramenta |
|-----------|-----------|
| E-commerce | Shopify (principal), Nuvemshop |
| Trafego Pago | Meta Ads, Google Ads |
| Automacao E-mail + WhatsApp | Reportana (custo-beneficio), Klaviyo (escala) |
| API WhatsApp | Reportana (API oficial) |
| Analytics | Google Analytics 4 |
| Dashboard | Looker Studio + InstaAI (API Facebook) |
| Contingencia | AdSpower + Proxy |
| Organizacao | Trello (criativos), Planilhas Google |
| IA para Copy | Claude AI (projeto Sexy Canvas) |
| Pesquisa | Gemini |
| Avaliacoes | BkReviews |
| Import de produtos | PokeImports, Coala |
| Mineracao de anuncios | Extensao Chrome (filtro por replicas) |
| CRM / Relatorio | Dashboard CDR Labs (Looker Studio customizado) |

---

*Extraction realizada em 2026-02-16. Total: 5 aulas, ~6 horas de conteudo transcrito.*
*Documento para uso exclusivo na construcao do AI Mind Clone de Ivan Furtado.*
