import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Limpando banco de dados...")

  // Delete in correct order (respecting foreign keys)
  await prisma.tarefa.deleteMany()
  await prisma.contaReceber.deleteMany()
  await prisma.campanha.deleteMany()
  await prisma.membroEquipe.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.user.deleteMany()

  console.log("Criando usuarios...")

  // ==================== USERS ====================
  const carlos = await prisma.user.create({
    data: {
      name: "Carlos Silva",
      email: "admin@agencia.com",
      password: bcrypt.hashSync("admin123", 10),
      role: "ADMIN",
    },
  })

  const ana = await prisma.user.create({
    data: {
      name: "Ana Martins",
      email: "ana@agencia.com",
      password: bcrypt.hashSync("ana123", 10),
      role: "GESTOR",
    },
  })

  const bruno = await prisma.user.create({
    data: {
      name: "Bruno Costa",
      email: "bruno@agencia.com",
      password: bcrypt.hashSync("bruno123", 10),
      role: "GESTOR",
    },
  })

  const daniela = await prisma.user.create({
    data: {
      name: "Daniela Souza",
      email: "daniela@agencia.com",
      password: bcrypt.hashSync("daniela123", 10),
      role: "ANALISTA",
    },
  })

  const eduardo = await prisma.user.create({
    data: {
      name: "Eduardo Lima",
      email: "eduardo@agencia.com",
      password: bcrypt.hashSync("eduardo123", 10),
      role: "ANALISTA",
    },
  })

  console.log("Criando membros da equipe...")

  // ==================== MEMBROS EQUIPE ====================
  await prisma.membroEquipe.create({
    data: { userId: carlos.id, cargo: "GESTOR_CONTA" },
  })

  await prisma.membroEquipe.create({
    data: { userId: ana.id, cargo: "ANALISTA_MIDIA" },
  })

  await prisma.membroEquipe.create({
    data: { userId: bruno.id, cargo: "GESTOR_CONTA" },
  })

  await prisma.membroEquipe.create({
    data: { userId: daniela.id, cargo: "DESIGNER" },
  })

  await prisma.membroEquipe.create({
    data: { userId: eduardo.id, cargo: "COPYWRITER" },
  })

  console.log("Criando clientes...")

  // ==================== CLIENTES ====================
  const techstore = await prisma.cliente.create({
    data: {
      nome: "TechStore Brasil",
      cnpj: "12.345.678/0001-01",
      segmento: "Eletronicos",
      contato: "Ricardo Mendes",
      email: "contato@techstore.com.br",
      telefone: "(11) 99999-0001",
      plataforma: "SHOPIFY",
      urlLoja: "https://techstore.com.br",
      status: "ATIVO",
      feeMensal: 8000,
      modeloCobranca: "FIXO",
      gestorId: carlos.id,
    },
  })

  const modabella = await prisma.cliente.create({
    data: {
      nome: "Moda Bella",
      cnpj: "23.456.789/0001-02",
      segmento: "Moda",
      contato: "Camila Ferreira",
      email: "contato@modabella.com.br",
      telefone: "(11) 99999-0002",
      plataforma: "VTEX",
      urlLoja: "https://modabella.com.br",
      status: "ATIVO",
      feeMensal: 12000,
      modeloCobranca: "HIBRIDO",
      gestorId: carlos.id,
    },
  })

  const petparadise = await prisma.cliente.create({
    data: {
      nome: "Pet Paradise",
      cnpj: "34.567.890/0001-03",
      segmento: "Pet",
      contato: "Marcos Almeida",
      email: "contato@petparadise.com.br",
      telefone: "(21) 99999-0003",
      plataforma: "NUVEMSHOP",
      urlLoja: "https://petparadise.com.br",
      status: "ATIVO",
      feeMensal: 5000,
      modeloCobranca: "FIXO",
      gestorId: carlos.id,
    },
  })

  const casadecor = await prisma.cliente.create({
    data: {
      nome: "Casa & Decor",
      cnpj: "45.678.901/0001-04",
      segmento: "Casa e Decoracao",
      contato: "Juliana Rocha",
      email: "contato@casadecor.com.br",
      telefone: "(31) 99999-0004",
      plataforma: "SHOPIFY",
      urlLoja: "https://casadecor.com.br",
      status: "ATIVO",
      feeMensal: 7500,
      modeloCobranca: "PERCENTUAL",
      gestorId: bruno.id,
    },
  })

  const fitnutrition = await prisma.cliente.create({
    data: {
      nome: "Fit Nutrition",
      cnpj: "56.789.012/0001-05",
      segmento: "Suplementos",
      contato: "Pedro Santos",
      email: "contato@fitnutrition.com.br",
      telefone: "(41) 99999-0005",
      plataforma: "WOOCOMMERCE",
      urlLoja: "https://fitnutrition.com.br",
      status: "ATIVO",
      feeMensal: 6000,
      modeloCobranca: "FIXO",
      gestorId: bruno.id,
    },
  })

  const beautylab = await prisma.cliente.create({
    data: {
      nome: "Beauty Lab",
      cnpj: "67.890.123/0001-06",
      segmento: "Cosmeticos",
      contato: "Fernanda Lima",
      email: "contato@beautylab.com.br",
      telefone: "(51) 99999-0006",
      plataforma: "VTEX",
      urlLoja: "https://beautylab.com.br",
      status: "PAUSADO",
      feeMensal: 10000,
      modeloCobranca: "HIBRIDO",
      gestorId: bruno.id,
    },
  })

  const sportszone = await prisma.cliente.create({
    data: {
      nome: "Sports Zone",
      cnpj: "78.901.234/0001-07",
      segmento: "Esportes",
      contato: "Lucas Barbosa",
      email: "contato@sportszone.com.br",
      telefone: "(61) 99999-0007",
      plataforma: "SHOPIFY",
      urlLoja: "https://sportszone.com.br",
      status: "ATIVO",
      feeMensal: 9000,
      modeloCobranca: "FIXO",
      gestorId: bruno.id,
    },
  })

  const kidsworld = await prisma.cliente.create({
    data: {
      nome: "Kids World",
      cnpj: "89.012.345/0001-08",
      segmento: "Infantil",
      contato: "Beatriz Nunes",
      email: "contato@kidsworld.com.br",
      telefone: "(71) 99999-0008",
      plataforma: "NUVEMSHOP",
      urlLoja: "https://kidsworld.com.br",
      status: "CHURN",
      feeMensal: 4000,
      modeloCobranca: "FIXO",
      gestorId: bruno.id,
    },
  })

  console.log("Criando campanhas...")

  // ==================== CAMPANHAS ====================
  // TechStore Brasil - 3 campaigns
  await prisma.campanha.create({
    data: {
      nome: "TechStore - Meta Ads Janeiro",
      clienteId: techstore.id,
      plataforma: "META_ADS",
      budgetPlanejado: 8000,
      gastoReal: 7650,
      impressoes: 320000,
      cliques: 9500,
      conversoes: 285,
      receita: 42000,
      mes: "2025-01",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "TechStore - Google Ads Fevereiro",
      clienteId: techstore.id,
      plataforma: "GOOGLE_ADS",
      budgetPlanejado: 10000,
      gastoReal: 9200,
      impressoes: 250000,
      cliques: 12000,
      conversoes: 380,
      receita: 56000,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "TechStore - Meta Ads Marco",
      clienteId: techstore.id,
      plataforma: "META_ADS",
      budgetPlanejado: 12000,
      gastoReal: 11500,
      impressoes: 400000,
      cliques: 14000,
      conversoes: 420,
      receita: 65000,
      mes: "2025-03",
      status: "ATIVA",
    },
  })

  // Moda Bella - 3 campaigns
  await prisma.campanha.create({
    data: {
      nome: "Moda Bella - Meta Ads Janeiro",
      clienteId: modabella.id,
      plataforma: "META_ADS",
      budgetPlanejado: 15000,
      gastoReal: 14200,
      impressoes: 500000,
      cliques: 15000,
      conversoes: 500,
      receita: 80000,
      mes: "2025-01",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Moda Bella - TikTok Fevereiro",
      clienteId: modabella.id,
      plataforma: "TIKTOK_ADS",
      budgetPlanejado: 8000,
      gastoReal: 7800,
      impressoes: 350000,
      cliques: 8000,
      conversoes: 180,
      receita: 25000,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Moda Bella - Google Ads Marco",
      clienteId: modabella.id,
      plataforma: "GOOGLE_ADS",
      budgetPlanejado: 12000,
      gastoReal: 11000,
      impressoes: 280000,
      cliques: 10500,
      conversoes: 350,
      receita: 55000,
      mes: "2025-03",
      status: "ATIVA",
    },
  })

  // Pet Paradise - 2 campaigns
  await prisma.campanha.create({
    data: {
      nome: "Pet Paradise - Meta Ads Janeiro",
      clienteId: petparadise.id,
      plataforma: "META_ADS",
      budgetPlanejado: 4000,
      gastoReal: 3800,
      impressoes: 180000,
      cliques: 5200,
      conversoes: 150,
      receita: 18000,
      mes: "2025-01",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Pet Paradise - Meta Ads Fevereiro",
      clienteId: petparadise.id,
      plataforma: "META_ADS",
      budgetPlanejado: 5000,
      gastoReal: 4900,
      impressoes: 220000,
      cliques: 6500,
      conversoes: 195,
      receita: 22000,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  // Casa & Decor - 2 campaigns
  await prisma.campanha.create({
    data: {
      nome: "Casa & Decor - Google Ads Janeiro",
      clienteId: casadecor.id,
      plataforma: "GOOGLE_ADS",
      budgetPlanejado: 6000,
      gastoReal: 5800,
      impressoes: 150000,
      cliques: 4500,
      conversoes: 120,
      receita: 28000,
      mes: "2025-01",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Casa & Decor - Meta Ads Marco",
      clienteId: casadecor.id,
      plataforma: "META_ADS",
      budgetPlanejado: 7000,
      gastoReal: 6800,
      impressoes: 200000,
      cliques: 5800,
      conversoes: 160,
      receita: 32000,
      mes: "2025-03",
      status: "ATIVA",
    },
  })

  // Fit Nutrition - 2 campaigns (one with bad ROAS)
  await prisma.campanha.create({
    data: {
      nome: "Fit Nutrition - Meta Ads Fevereiro",
      clienteId: fitnutrition.id,
      plataforma: "META_ADS",
      budgetPlanejado: 5000,
      gastoReal: 4800,
      impressoes: 160000,
      cliques: 3800,
      conversoes: 95,
      receita: 12000,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Fit Nutrition - Google Ads Marco",
      clienteId: fitnutrition.id,
      plataforma: "GOOGLE_ADS",
      budgetPlanejado: 6000,
      gastoReal: 5900,
      impressoes: 120000,
      cliques: 2200,
      conversoes: 50,
      receita: 7500,
      mes: "2025-03",
      status: "ATIVA",
    },
  })

  // Sports Zone - 3 campaigns
  await prisma.campanha.create({
    data: {
      nome: "Sports Zone - Meta Ads Janeiro",
      clienteId: sportszone.id,
      plataforma: "META_ADS",
      budgetPlanejado: 7000,
      gastoReal: 6500,
      impressoes: 280000,
      cliques: 8200,
      conversoes: 230,
      receita: 35000,
      mes: "2025-01",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Sports Zone - TikTok Fevereiro",
      clienteId: sportszone.id,
      plataforma: "TIKTOK_ADS",
      budgetPlanejado: 5000,
      gastoReal: 4700,
      impressoes: 300000,
      cliques: 7500,
      conversoes: 160,
      receita: 22000,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  await prisma.campanha.create({
    data: {
      nome: "Sports Zone - Google Ads Marco",
      clienteId: sportszone.id,
      plataforma: "GOOGLE_ADS",
      budgetPlanejado: 8000,
      gastoReal: 7600,
      impressoes: 190000,
      cliques: 6800,
      conversoes: 210,
      receita: 38000,
      mes: "2025-03",
      status: "ATIVA",
    },
  })

  // Casa & Decor - extra campaign with mediocre ROAS
  await prisma.campanha.create({
    data: {
      nome: "Casa & Decor - TikTok Fevereiro",
      clienteId: casadecor.id,
      plataforma: "TIKTOK_ADS",
      budgetPlanejado: 3000,
      gastoReal: 2900,
      impressoes: 180000,
      cliques: 3200,
      conversoes: 65,
      receita: 5800,
      mes: "2025-02",
      status: "FINALIZADA",
    },
  })

  console.log("Criando contas a receber...")

  // ==================== CONTAS A RECEBER ====================
  // TechStore - 3 months
  await prisma.contaReceber.create({
    data: {
      clienteId: techstore.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 8000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-10"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: techstore.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 8000,
      mes: "2025-02",
      status: "PAGO",
      dataPagamento: new Date("2025-02-08"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: techstore.id,
      descricao: "Fee mensal - Marco 2025",
      valor: 8000,
      mes: "2025-03",
      status: "PENDENTE",
    },
  })

  // Moda Bella - 2 months
  await prisma.contaReceber.create({
    data: {
      clienteId: modabella.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 12000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-15"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: modabella.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 12000,
      mes: "2025-02",
      status: "PAGO",
      dataPagamento: new Date("2025-02-12"),
    },
  })

  // Pet Paradise
  await prisma.contaReceber.create({
    data: {
      clienteId: petparadise.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 5000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-20"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: petparadise.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 5000,
      mes: "2025-02",
      status: "PENDENTE",
    },
  })

  // Casa & Decor
  await prisma.contaReceber.create({
    data: {
      clienteId: casadecor.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 7500,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-18"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: casadecor.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 7500,
      mes: "2025-02",
      status: "ATRASADO",
    },
  })

  // Fit Nutrition
  await prisma.contaReceber.create({
    data: {
      clienteId: fitnutrition.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 6000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-12"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: fitnutrition.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 6000,
      mes: "2025-02",
      status: "PAGO",
      dataPagamento: new Date("2025-02-14"),
    },
  })

  // Beauty Lab (PAUSADO - only 1)
  await prisma.contaReceber.create({
    data: {
      clienteId: beautylab.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 10000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-22"),
    },
  })

  // Sports Zone
  await prisma.contaReceber.create({
    data: {
      clienteId: sportszone.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 9000,
      mes: "2025-01",
      status: "PAGO",
      dataPagamento: new Date("2025-01-16"),
    },
  })

  await prisma.contaReceber.create({
    data: {
      clienteId: sportszone.id,
      descricao: "Fee mensal - Fevereiro 2025",
      valor: 9000,
      mes: "2025-02",
      status: "PAGO",
      dataPagamento: new Date("2025-02-10"),
    },
  })

  // Kids World (CHURN - 1 overdue)
  await prisma.contaReceber.create({
    data: {
      clienteId: kidsworld.id,
      descricao: "Fee mensal - Janeiro 2025",
      valor: 4000,
      mes: "2025-01",
      status: "PENDENTE",
    },
  })

  console.log("Criando tarefas...")

  // ==================== TAREFAS ====================
  // A_FAZER (4)
  await prisma.tarefa.create({
    data: {
      titulo: "Criar criativos Black Friday - TechStore",
      descricao: "Desenvolver 5 criativos para campanha de Black Friday incluindo banners, stories e carrossel para Meta Ads.",
      status: "A_FAZER",
      prioridade: "URGENTE",
      clienteId: techstore.id,
      responsavelId: daniela.id,
      prazo: new Date("2025-03-20"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Configurar pixel TikTok - Sports Zone",
      descricao: "Instalar e configurar o pixel do TikTok Ads na loja Shopify da Sports Zone para tracking de conversoes.",
      status: "A_FAZER",
      prioridade: "ALTA",
      clienteId: sportszone.id,
      responsavelId: ana.id,
      prazo: new Date("2025-03-15"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Revisar copys anuncios - Moda Bella",
      descricao: "Revisar e otimizar as copys dos anuncios ativos da Moda Bella para melhorar CTR.",
      status: "A_FAZER",
      prioridade: "MEDIA",
      clienteId: modabella.id,
      responsavelId: eduardo.id,
      prazo: new Date("2025-03-25"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Proposta comercial - novo cliente",
      descricao: "Preparar proposta comercial para potencial cliente do segmento de moda fitness.",
      status: "A_FAZER",
      prioridade: "MEDIA",
      responsavelId: carlos.id,
      prazo: new Date("2025-03-18"),
    },
  })

  // FAZENDO (4)
  await prisma.tarefa.create({
    data: {
      titulo: "Otimizar campanha Google Ads - Moda Bella",
      descricao: "Ajustar lances e negativar palavras-chave com baixo desempenho na campanha de Search da Moda Bella.",
      status: "FAZENDO",
      prioridade: "ALTA",
      clienteId: modabella.id,
      responsavelId: ana.id,
      prazo: new Date("2025-03-12"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Criar landing page promo - Fit Nutrition",
      descricao: "Desenvolver landing page para promocao de lancamento de whey protein com integracao de cupom.",
      status: "FAZENDO",
      prioridade: "URGENTE",
      clienteId: fitnutrition.id,
      responsavelId: daniela.id,
      prazo: new Date("2025-03-05"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Setup campanha remarketing - Casa & Decor",
      descricao: "Configurar campanha de remarketing dinamico no Meta Ads para visitantes que abandonaram carrinho.",
      status: "FAZENDO",
      prioridade: "ALTA",
      clienteId: casadecor.id,
      responsavelId: ana.id,
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Atualizar catalogo produtos - Pet Paradise",
      descricao: "Sincronizar catalogo de produtos no Facebook Commerce Manager com novos itens da loja.",
      status: "FAZENDO",
      prioridade: "BAIXA",
      clienteId: petparadise.id,
      responsavelId: eduardo.id,
      prazo: new Date("2025-03-28"),
    },
  })

  // FEITO (4)
  await prisma.tarefa.create({
    data: {
      titulo: "Relatorio mensal Janeiro - Pet Paradise",
      descricao: "Compilar metricas de performance, ROAS e insights do mes de janeiro para apresentacao ao cliente.",
      status: "FEITO",
      prioridade: "MEDIA",
      clienteId: petparadise.id,
      responsavelId: bruno.id,
      prazo: new Date("2025-02-05"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Migrar campanhas para nova conta - TechStore",
      descricao: "Migrar todas as campanhas ativas do Meta Ads para nova conta Business Manager da TechStore.",
      status: "FEITO",
      prioridade: "ALTA",
      clienteId: techstore.id,
      responsavelId: ana.id,
      prazo: new Date("2025-02-10"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Criar banco de imagens - Moda Bella",
      descricao: "Organizar e catalogar banco de imagens de produtos para uso nas campanhas de moda.",
      status: "FEITO",
      prioridade: "BAIXA",
      clienteId: modabella.id,
      responsavelId: daniela.id,
      prazo: new Date("2025-02-15"),
    },
  })

  await prisma.tarefa.create({
    data: {
      titulo: "Auditoria de tags Google - Sports Zone",
      descricao: "Verificar se todas as tags do Google Ads e Analytics estao disparando corretamente na loja.",
      status: "FEITO",
      prioridade: "BAIXA",
      clienteId: sportszone.id,
      responsavelId: eduardo.id,
      prazo: new Date("2025-02-20"),
    },
  })

  console.log("Seed concluido com sucesso!")
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
