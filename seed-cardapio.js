
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "lanchonete.db")
);

const ID_LOJA = "burcas-lanchonete";

const categorias = [
    "lanches",
    "porcoes",
    "bebidas",
    "sobremesas"
];

// ==================================================
// ADICIONAIS
// ==================================================

const adicionais = [
    { nome: "Hambúrguer", preco: 9.00 },
    { nome: "Bacon", preco: 5.00 },
    { nome: "Mussarela", preco: 5.00 },
    { nome: "Cheddar", preco: 5.00 },
    { nome: "Salada", preco: 3.00 },
    { nome: "Ovo", preco: 3.00 },
    { nome: "Catupiry", preco: 5.00 },
    { nome: "Anel de cebola", preco: 5.00 },
    { nome: "Batata frita", preco: 7.00 },
    { nome: "Cream cheese", preco: 5.00 }
];

// ==================================================
// OPÇÕES DE PÃO
// ==================================================

const opcoesPao = [
    { nome: "Trocar para pão Brioche", preco: 1.00 },
    { nome: "Trocar para pão Australiano", preco: 1.00 },
    { nome: "Trocar para pão de Hambúrguer tradicional", preco: 1.00 }
];

// ==================================================
// FUNÇÃO DE PRODUTO
// ==================================================

function produto(nome, preco, descricao, categoria, extras = []) {
    return {
        nome,
        preco,
        descricao,
        categoria,
        extras
    };
}

// ==================================================
// CARDÁPIO COMPLETO
// ==================================================

const produtos = [

    // ==============================================
    // LANCHES
    // ==============================================

    produto(
        "X-Burguer",
        24,
        "Pão de hambúrguer, hambúrguer, mussarela e cebola caramelizada.",
        "lanches"
    ),

    produto(
        "X-Salada",
        28,
        "Pão de hambúrguer, hambúrguer, mussarela, cebola roxa, pepino, tomate e alface.",
        "lanches"
    ),

    produto(
        "X-Salada Bacon",
        31,
        "Pão de hambúrguer, hambúrguer, mussarela, cebola roxa, pepino, tomate, alface e bacon.",
        "lanches"
    ),

    produto(
        "X-Bacon",
        29,
        "Pão de hambúrguer, hambúrguer, cheddar, cebola caramelizada e bacon.",
        "lanches"
    ),

    produto(
        "Duplo Bacon",
        34,
        "Pão de hambúrguer, 2 hambúrgueres, cheddar, cebola roxa e bacon.",
        "lanches"
    ),

    produto(
        "Egg Salada",
        29,
        "Pão de hambúrguer, hambúrguer, mussarela, ovo, cebola roxa, pepino, tomate e alface.",
        "lanches"
    ),

    produto(
        "Fondue Burguer",
        33,
        "Pão de hambúrguer, cheddar, hambúrguer, bacon e fritas.",
        "lanches"
    ),

    produto(
        "Catupiry com Bacon",
        30,
        "Pão de hambúrguer, hambúrguer, catupiry, bacon, mussarela e cebola roxa.",
        "lanches"
    ),

    produto(
        "Australiano Salada",
        31,
        "Pão australiano, hambúrguer, cheddar, pepino, tomate, alface e cebola caramelizada.",
        "lanches"
    ),

    produto(
        "Australiano",
        29,
        "Pão australiano, hambúrguer, cheddar, pepino e cebola caramelizada.",
        "lanches"
    ),

    produto(
        "X-Burca's",
        40,
        "Pão de hambúrguer, mussarela, cheddar, 2 hambúrgueres, bacon, 2 ovos, presunto, calabresa, cebola roxa, tomate, pepino e alface.",
        "lanches"
    ),

    produto(
        "Crispy Cheddar",
        29,
        "Pão de hambúrguer, hambúrguer, cheddar, tomate, alface, pepino e cebola crispy.",
        "lanches"
    ),

    produto(
        "X-Costela",
        35,
        "Pão de hambúrguer, hambúrguer, mussarela, costela desfiada, cebola roxa e alface.",
        "lanches"
    ),

    // ==============================================
    // PORÇÕES E PETISCOS
    // ==============================================

    produto("Porquinho", 45, "", "porcoes"),
    produto("Traíra", 43, "", "porcoes"),
    produto("Tilápia", 51, "", "porcoes"),
    produto("Lambari", 45, "", "porcoes"),
    produto("Costelinha de Pacu", 51, "", "porcoes"),
    produto("Dois Amores", 51, "", "porcoes"),
    produto("Surpresinha", 51, "", "porcoes"),
    produto("Isca de Arraia", 43, "", "porcoes"),
    produto("Isca de Frango", 43, "", "porcoes"),
    produto("Frios", 43, "", "porcoes"),
    produto("Filé de Frango Acebolado", 43, "", "porcoes"),
    produto("Tulipa", 44, "", "porcoes"),
    produto("Fritas", 33, "", "porcoes"),
    produto("Fritas com Cheddar e Bacon", 43, "", "porcoes"),
    produto("Fritas com Catupiry e Bacon", 43, "", "porcoes"),
    produto("Fritas com Costela e Cream Cheese", 51, "", "porcoes"),
    produto("Fritas com Mussarela e Bacon", 45, "", "porcoes"),
    produto("Batata Chips da Casa", 26, "", "porcoes"),
    produto("Anel de Cebola", 38, "", "porcoes"),
    produto("Calabresa Acebolada", 41, "", "porcoes"),
    produto("Mandioca com Bacon", 37, "", "porcoes"),
    produto("Alcatra com Torrada e Fritas", 85, "", "porcoes"),
    produto("Torresmo", 31, "", "porcoes"),

    // ==============================================
    // MINI SALGADINHOS
    // ==============================================

    produto("Coxinha de Costela", 33, "", "porcoes"),
    produto("Coxinha de Frango", 33, "", "porcoes"),
    produto("Bolinho de Carne Seca", 33, "", "porcoes"),
    produto("Kibe com Requeijão", 33, "", "porcoes"),
    produto("Bolinha de Queijo", 33, "", "porcoes"),

    // ==============================================
    // SOBREMESAS
    // ==============================================

    produto(
        "Mini Churros - 10 unidades",
        28,
        "Porção com 10 mini churros.",
        "sobremesas"
    ),

    // ==============================================
    // BEBIDAS E DRINKS
    // ==============================================

    produto("Caipilé", 17, "", "bebidas"),
    produto("Boa 600ml", 13, "", "bebidas"),
    produto("Brahma 600ml", 13, "", "bebidas"),
    produto("Heineken 600ml", 15, "", "bebidas"),
    produto("Cerveja Lata", 7, "", "bebidas"),
    produto("Refrigerante Lata", 7, "", "bebidas"),
    produto("Água", 4, "", "bebidas"),
    produto("Água com Gás", 4.50, "", "bebidas"),
    produto("Soda Italiana", 12, "", "bebidas"),

    // ==============================================
    // SUCOS
    // ==============================================

    produto(
        "Suco de Polpa",
        7,
        "Suco de polpa. Escolha o sabor.",
        "bebidas",
        [
            { nome: "Melão Caipira", preco: 0 },
            { nome: "Maracujá", preco: 0 },
            { nome: "Goiaba", preco: 0 },
            { nome: "Caju", preco: 0 },
            { nome: "Morango", preco: 0 },
            { nome: "Abacaxi", preco: 0 },
            { nome: "Abacaxi com Hortelã", preco: 0 },
            { nome: "Laranja com Acerola", preco: 0 }
        ]
    ),

    // ==============================================
    // REFRIGERANTES 2 LITROS
    // ==============================================

    produto("Coca-Cola 2L", 15, "", "bebidas"),
    produto("Guaraná 2L", 12, "", "bebidas"),
    produto("Fanta 2L", 14, "", "bebidas"),
    produto("Sprite 2L", 14, "", "bebidas")

];

// ==================================================
// APLICAR EXTRAS NOS LANCHES
// ==================================================

for (const item of produtos) {
    if (item.categoria === "lanches") {
        item.extras = [
            ...adicionais,
            ...opcoesPao
        ];
    }
}

// ==================================================
// SQLITE - PROMISES
// ==================================================

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (erro) {
            if (erro) return reject(erro);
            resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (erro, resultado) => {
            if (erro) return reject(erro);
            resolve(resultado);
        });
    });
}

// ==================================================
// CADASTRAR CARDÁPIO
// ==================================================

async function inserirCardapio() {

    let inseridos = 0;
    let atualizados = 0;

    try {

        await dbRun("BEGIN TRANSACTION");

        // Confere se a tabela existe
        const tabela = await dbGet(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name = 'produtos'
        `);

        if (!tabela) {
            throw new Error("A tabela produtos não existe no banco.");
        }

        for (const item of produtos) {

            if (!categorias.includes(item.categoria)) {
                throw new Error(
                    `Categoria inválida no produto: ${item.nome}`
                );
            }

            const existente = await dbGet(
                `SELECT id
                 FROM produtos
                 WHERE LOWER(nome) = LOWER(?)
                 AND LOWER(idLoja) = LOWER(?)
                 LIMIT 1`,
                [item.nome, ID_LOJA]
            );

            const extrasJSON = JSON.stringify(item.extras);

            if (existente) {

                await dbRun(
                    `UPDATE produtos
                     SET nome = ?,
                         preco = ?,
                         descricao = ?,
                         categoria = ?,
                         extras = ?
                     WHERE id = ?`,
                    [
                        item.nome,
                        item.preco,
                        item.descricao,
                        item.categoria,
                        extrasJSON,
                        existente.id
                    ]
                );

                atualizados++;

            } else {

                await dbRun(
                    `INSERT INTO produtos
                    (
                        nome,
                        preco,
                        descricao,
                        categoria,
                        img,
                        extras,
                        idLoja
                    )
                    VALUES (?, ?, ?, ?, NULL, ?, ?)`,
                    [
                        item.nome,
                        item.preco,
                        item.descricao,
                        item.categoria,
                        extrasJSON,
                        ID_LOJA
                    ]
                );

                inseridos++;
            }
        }

        await dbRun("COMMIT");

        console.log("\n==================================");
        console.log("CARDÁPIO CADASTRADO COM SUCESSO!");
        console.log("==================================");
        console.log("Produtos novos:", inseridos);
        console.log("Produtos atualizados:", atualizados);
        console.log("Total:", produtos.length);
        console.log("Categorias:", categorias.join(", "));
        console.log("Loja:", ID_LOJA);
        console.log("==================================\n");

    } catch (erro) {

        await dbRun("ROLLBACK").catch(() => {});

        console.error("\nERRO AO CADASTRAR CARDÁPIO:");
        console.error(erro.message);

    } finally {

        db.close();

    }
}

// ==================================================
// EXECUTAR
// ==================================================

inserirCardapio();
