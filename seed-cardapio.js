const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'lanchonete.db'));

const ID_LOJA = 'burcaslanchonete'; // ← troca pelo seu idLoja

// ── ADICIONAIS DISPONÍVEIS PARA LANCHES ──
const adicionaisLanches = JSON.stringify([
  { nome: 'Hambúrguer',      preco: 9.00 },
  { nome: 'Bacon',           preco: 5.00 },
  { nome: 'Mussarela',       preco: 5.00 },
  { nome: 'Cheddar',         preco: 5.00 },
  { nome: 'Cebola Crispy',   preco: 5.00 },
  { nome: 'Salada',          preco: 3.00 },
  { nome: 'Ovo',             preco: 2.00 },
  { nome: 'Catupiry',        preco: 5.00 },
  { nome: 'Anel de Cebola',  preco: 4.00 },
  { nome: 'Batata',          preco: 4.00 },
  { nome: 'Pimenta Biquinho',preco: 3.00 },
  { nome: 'Cream Cheese',    preco: 5.00 },
]);

// adicionais para bebidas (copo e limão/gelo)
const adicionaisBebidas = JSON.stringify([
  { nome: 'Copo',             preco: 0.00 },
  { nome: 'Copo c/ Limão',    preco: 0.00 },
  { nome: 'Copo c/ Gelo',     preco: 0.00 },
  { nome: 'Copo c/ Limão e Gelo', preco: 0.00 },
]);

// sem adicionais
const semAdicionais = JSON.stringify([]);

// ────────────────────────────────────────
// PRODUTOS
// ────────────────────────────────────────

const produtos = [

  // ── LANCHES ──
  {
    nome: 'X-Burguer',
    preco: 21.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer artesanal, hambúrguer bovino, mussarela derretida e cebola caramelizada no ponto certo. Simples e irresistível.',
    extras: adicionaisLanches,
  },
  {
    nome: 'X-Salada Bacon',
    preco: 28.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino suculento, mussarela, cebola roxa, pepino, tomate, alface crocante e bacon defumado em tiras.',
    extras: adicionaisLanches,
  },
  {
    nome: 'X-Salada',
    preco: 25.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino, mussarela, cebola roxa, pepino fatiado, tomate e alface fresca. Leve e saboroso.',
    extras: adicionaisLanches,
  },
  {
    nome: 'X-Bacon',
    preco: 26.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino, cheddar cremoso, cebola caramelizada e bacon crocante. Para quem ama sabor intenso.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Duplo Bacon',
    preco: 31.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, dois hambúrgueres bovinos, cheddar duplo, cebola roxa e bacon em dobro. O favorito dos famintos.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Egg Salada',
    preco: 26.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino, mussarela, ovo estrelado, cebola roxa, pepino, tomate e alface. Completo e nutritivo.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Fondue Burguer',
    preco: 30.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino, cheddar em fondue derretido, mais hambúrguer, bacon crocante e fritas. Uma explosão de sabor.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Catupiry c/ Bacon',
    preco: 27.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino, catupiry original cremoso, bacon defumado, mussarela e cebola roxa. Combinação clássica e irresistível.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Australiano Salada',
    preco: 28.00,
    categoria: 'lanches',
    descricao: 'Pão australiano artesanal, hambúrguer bovino, cheddar, pepino, tomate, alface e cebola caramelizada. Sofisticado e saboroso.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Australiano',
    preco: 26.00,
    categoria: 'lanches',
    descricao: 'Pão australiano artesanal, hambúrguer bovino, cheddar cremoso, pepino fatiado e cebola caramelizada. Sabor marcante em cada mordida.',
    extras: adicionaisLanches,
  },
  {
    nome: 'X-Burcas',
    preco: 37.00,
    categoria: 'lanches',
    descricao: 'O carro-chefe da casa! Pão de hambúrguer, mussarela, cheddar, dois hambúrgueres, bacon, dois ovos, presunto, calabresa, cebola roxa, tomate, pepino e alface. Para os corajosos.',
    extras: adicionaisLanches,
  },
  {
    nome: 'Crispy Cheddar',
    preco: 26.00,
    categoria: 'lanches',
    descricao: 'Pão de hambúrguer, hambúrguer bovino crocante empanado, cheddar derretido, tomate, alface, pepino e cebola crispy. Textura única e sabor incrível.',
    extras: adicionaisLanches,
  },

  // ── PORÇÕES ──
  {
    nome: 'Porquinho',
    preco: 42.00,
    categoria: 'porcoes',
    descricao: 'Porção de porquinho frito, crocante por fora e macio por dentro. Perfeito para compartilhar com a galera.',
    extras: semAdicionais,
  },
  {
    nome: 'Traíra',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Porção de traíra frita, peixe fresco do rio preparado na hora. Acompanha molho especial da casa.',
    extras: semAdicionais,
  },
  {
    nome: 'Tilápia',
    preco: 48.00,
    categoria: 'porcoes',
    descricao: 'Porção generosa de tilápia frita ou grelhada, temperada com ervas e alho. Leve e saborosa.',
    extras: semAdicionais,
  },
  {
    nome: 'Lambari',
    preco: 42.00,
    categoria: 'porcoes',
    descricao: 'Porção de lambari frito crocante, peixinho temperado e frito na hora. Entrada perfeita.',
    extras: semAdicionais,
  },
  {
    nome: 'Costelinha de Pacu',
    preco: 48.00,
    categoria: 'porcoes',
    descricao: 'Costelinha de pacu grelhada ou frita, carne suculenta e bem temperada. Sabor especial do pantanal.',
    extras: semAdicionais,
  },
  {
    nome: 'Dois Amores',
    preco: 48.00,
    categoria: 'porcoes',
    descricao: 'Porção combinada com dois tipos de peixe fritos. Perfeita para quem não consegue escolher só um.',
    extras: semAdicionais,
  },
  {
    nome: 'Surpresinha',
    preco: 48.00,
    categoria: 'porcoes',
    descricao: 'A surpresa do dia — porção especial preparada com o peixe mais fresco disponível. Peça ao garçom.',
    extras: semAdicionais,
  },
  {
    nome: 'Isca de Arraia',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Iscas de arraia empanadas e fritas, crocantes por fora e macias por dentro. Sabor único e especial.',
    extras: semAdicionais,
  },
  {
    nome: 'Isca de Frango',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Iscas de frango empanadas, fritas na hora até ficarem bem crocantes. Acompanha molho da casa.',
    extras: semAdicionais,
  },
  {
    nome: 'Frios',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Porção de frios variados — presunto, mussarela, salame e acompanhamentos. Ótima pedida para a mesa.',
    extras: semAdicionais,
  },
  {
    nome: 'Filé de Frango Acebolado',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Filé de frango grelhado com cebola caramelizada no azeite. Saboroso, suculento e bem temperado.',
    extras: semAdicionais,
  },
  {
    nome: 'Tulipa',
    preco: 41.00,
    categoria: 'porcoes',
    descricao: 'Coxas de frango em formato tulipa, empanadas e fritas até ficarem douradas e crocantes.',
    extras: semAdicionais,
  },
  {
    nome: 'Fritas',
    preco: 30.00,
    categoria: 'porcoes',
    descricao: 'Porção de fritas crocantes temperadas com sal e ervas. Acompanhamento clássico que agrada a todos.',
    extras: semAdicionais,
  },
  {
    nome: 'Fritas c/ Cheddar e Bacon',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Fritas crocantes cobertas com cheddar cremoso derretido e bacon crocante em pedaços. Puro pecado.',
    extras: semAdicionais,
  },
  {
    nome: 'Fritas c/ Catupiry e Bacon',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Fritas crocantes com catupiry original cremoso derretido e bacon defumado. Combinação irresistível.',
    extras: semAdicionais,
  },
  {
    nome: 'Batata Chips da Casa',
    preco: 23.00,
    categoria: 'porcoes',
    descricao: 'Batata chips fatiada fininha e frita na hora, temperada com sal e especiarias da casa. Crocante demais.',
    extras: semAdicionais,
  },
  {
    nome: 'Anel de Cebola',
    preco: 35.00,
    categoria: 'porcoes',
    descricao: 'Anéis de cebola empanados e fritos, crocantes por fora e macios por dentro. Clássico que nunca decepciona.',
    extras: semAdicionais,
  },
  {
    nome: 'Nuggets',
    preco: 28.00,
    categoria: 'porcoes',
    descricao: 'Porção de nuggets de frango crocantes e dourados. Agrada crianças e adultos. Acompanha molho.',
    extras: semAdicionais,
  },
  {
    nome: 'Calabresa Acebolada',
    preco: 38.00,
    categoria: 'porcoes',
    descricao: 'Linguiça calabresa fatiada e grelhada com cebola roxa no azeite. Petisco clássico e saboroso.',
    extras: semAdicionais,
  },
  {
    nome: 'Mandioca ao Bacon',
    preco: 34.00,
    categoria: 'porcoes',
    descricao: 'Mandioca cozida e frita coberta com bacon crocante e manteiga de ervas. Confortante e deliciosa.',
    extras: semAdicionais,
  },
  {
    nome: 'Alcatra c/ Torrada e Fritas',
    preco: 80.00,
    categoria: 'porcoes',
    descricao: 'Porção de alcatra grelhada no ponto, acompanhada de torradas crocantes e fritas douradas. O premium da casa.',
    extras: semAdicionais,
  },
  {
    nome: 'Torresmo',
    preco: 28.00,
    categoria: 'porcoes',
    descricao: 'Torresmo frito na hora, crocante por fora e suculento por dentro. Petisco que não sobra.',
    extras: semAdicionais,
  },
  {
    nome: 'Polenta',
    preco: 26.00,
    categoria: 'porcoes',
    descricao: 'Polenta frita em palitos, crocante por fora e cremosa por dentro. Acompanha molho de tomate caseiro.',
    extras: semAdicionais,
  },
  {
    nome: 'Frango a Passarinho',
    preco: 40.00,
    categoria: 'porcoes',
    descricao: 'Pedaços de frango temperados com alho e sal, fritos até ficarem bem dourados e crocantes.',
    extras: semAdicionais,
  },
  {
    nome: 'Ceviche 400g',
    preco: 35.00,
    categoria: 'porcoes',
    descricao: 'Ceviche fresco de 400g, peixe marinado no limão com cebola roxa, coentro e pimenta. Refrescante e especial.',
    extras: semAdicionais,
  },
  {
    nome: 'Batata Rústica 400g',
    preco: 35.00,
    categoria: 'porcoes',
    descricao: 'Batata rústica em cubos com casca, temperada com ervas, alho e azeite, assada até ficar crocante.',
    extras: semAdicionais,
  },

  // ── MINI SALGADINHOS ──
  {
    nome: 'Coxinha de Costela',
    preco: 32.00,
    categoria: 'porcoes',
    descricao: 'Porção de coxinhas recheadas com costela desfiada temperada. Massa crocante e recheio suculento.',
    extras: semAdicionais,
  },
  {
    nome: 'Bolinho de Carne Seca',
    preco: 32.00,
    categoria: 'porcoes',
    descricao: 'Bolinhos recheados com carne seca desfiada e bem temperada. Crocantes por fora, irresistíveis por dentro.',
    extras: semAdicionais,
  },
  {
    nome: 'Kibe c/ Requeijão',
    preco: 32.00,
    categoria: 'porcoes',
    descricao: 'Kibes fritos recheados com requeijão cremoso. Massa crocante com recheio que derrete na boca.',
    extras: semAdicionais,
  },
  {
    nome: 'Bolinha de Queijo',
    preco: 32.00,
    categoria: 'porcoes',
    descricao: 'Bolinhas de queijo fritas, crocantes por fora com queijo derretido por dentro. Petisco favorito da galera.',
    extras: semAdicionais,
  },

  // ── SOBREMESAS ──
  {
    nome: 'Mini Churros 10 uni.',
    preco: 25.00,
    categoria: 'sobremesas',
    descricao: 'Dez mini churros fritos na hora, polvilhados com açúcar e canela. Acompanha doce de leite para mergulhar.',
    extras: semAdicionais,
  },

  // ── BEBIDAS ──
  {
    nome: 'Caipilé',
    preco: 16.00,
    categoria: 'bebidas',
    descricao: 'Caipirinha de limão preparada na hora com limão fresco, açúcar e cachaça artesanal. Refrescante e equilibrada.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Boa Brahma 600ml',
    preco: 12.00,
    categoria: 'bebidas',
    descricao: 'Cerveja Boa Brahma gelada 600ml. Leve e refrescante, ideal para acompanhar os petiscos.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Refrigerante Lata',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Refrigerante gelado em lata 350ml. Disponível nos sabores: Coca-Cola, Guaraná, Fanta e Sprite.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Cerveja Lata',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Cerveja gelada em lata 350ml. Consulte os rótulos disponíveis com o garçom.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Água',
    preco: 3.50,
    categoria: 'bebidas',
    descricao: 'Água mineral gelada 500ml, com ou sem gás.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Soda Italiana',
    preco: 10.00,
    categoria: 'bebidas',
    descricao: 'Soda italiana artesanal com água com gás e xarope de frutas. Refrescante e sofisticada.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Heineken 600ml',
    preco: 14.00,
    categoria: 'bebidas',
    descricao: 'Heineken long neck 600ml bem gelada. A cerveja premium para os momentos especiais.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Amstel 600ml',
    preco: 13.00,
    categoria: 'bebidas',
    descricao: 'Amstel 600ml gelada, cerveja suave e encorpada. Ótima pedida para a noite.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Coca-Cola 2L',
    preco: 14.00,
    categoria: 'bebidas',
    descricao: 'Coca-Cola 2 litros gelada. Ideal para compartilhar na mesa com os amigos.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Guaraná Kuat 2L',
    preco: 11.00,
    categoria: 'bebidas',
    descricao: 'Guaraná Kuat 2 litros gelado, sabor suave e refrescante de guaraná natural.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Fanta 2L',
    preco: 13.00,
    categoria: 'bebidas',
    descricao: 'Fanta 2 litros gelada, sabor laranja vibrante. Para quem gosta de algo mais docinho.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Sprite 2L',
    preco: 13.00,
    categoria: 'bebidas',
    descricao: 'Sprite 2 litros gelado, sabor limão refrescante com gás. Leve e perfeito para o calor.',
    extras: adicionaisBebidas,
  },

  // ── CHOPPS ──
  {
    nome: 'Chopp Claro 500ml',
    preco: 8.00,
    categoria: 'bebidas',
    descricao: 'Chopp claro tirado na hora, 500ml com colarinho perfeito. Gelado e refrescante.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Chopp Claro 300ml',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Chopp claro tirado na hora, 300ml. Ideal para quem quer só uma cervejinha rápida.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Chopp Vinho 300ml',
    preco: 8.00,
    categoria: 'bebidas',
    descricao: 'Chopp de vinho tinto tirado na hora, 300ml. Sofisticado e com sabor marcante.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Chopp Vinho 500ml',
    preco: 10.00,
    categoria: 'bebidas',
    descricao: 'Chopp de vinho tinto tirado na hora, 500ml. Para apreciar com calma e estilo.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Torre de Chopp Claro',
    preco: 40.00,
    categoria: 'bebidas',
    descricao: 'Torre de chopp claro gelado para a mesa toda. Aproximadamente 3 litros de chopp fresco.',
    extras: semAdicionais,
  },

  // ── SUCOS ──
  {
    nome: 'Suco de Melão Caipira',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de melão caipira, natural e refrescante. Servido gelado.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Maracujá',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de maracujá, azedinho na medida certa. Refrescante e relaxante.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Morango',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de morango, doce e saboroso. Perfeito para quem ama frutas vermelhas.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Abacaxi c/ Hortelã',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de abacaxi com hortelã fresca. Combinação refrescante e aromática.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Abacaxi',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de abacaxi natural, gelado e bem docinho. Tropical e refrescante.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Goiaba',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de goiaba cremoso e saboroso. Sabor característico que agrada a todos.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Caju',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de caju, levemente adstringente e muito refrescante. Sabor nordestino.',
    extras: adicionaisBebidas,
  },
  {
    nome: 'Suco de Laranja c/ Acerola',
    preco: 6.00,
    categoria: 'bebidas',
    descricao: 'Suco de polpa de laranja com acerola, rico em vitamina C. Refrescante e saudável.',
    extras: adicionaisBebidas,
  },
];

// ────────────────────────────────────────
// INSERÇÃO NO BANCO
// ────────────────────────────────────────

const sql = `INSERT INTO produtos (nome, preco, descricao, categoria, img, extras, idLoja)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;

let inseridos = 0;
let erros     = 0;

db.serialize(() => {
  produtos.forEach(p => {
    db.run(sql, [
      p.nome,
      p.preco,
      p.descricao,
      p.categoria,
      null,         // sem imagem por enquanto
      p.extras,
      ID_LOJA
    ], function(err) {
      if (err) {
        console.error(`❌ Erro ao inserir "${p.nome}":`, err.message);
        erros++;
      } else {
        console.log(`✅ Inserido: ${p.nome} (${p.categoria}) — R$ ${p.preco.toFixed(2)}`);
        inseridos++;
      }

      // quando terminar tudo
      if (inseridos + erros === produtos.length) {
        console.log('\n────────────────────────────');
        console.log(`✅ ${inseridos} produtos inseridos com sucesso`);
        if (erros > 0) console.log(`❌ ${erros} erros`);
        console.log('────────────────────────────');
        db.close();
      }
    });
  });
});
