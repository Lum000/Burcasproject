export async function mostrarSkeleton(quantidade = 3){

    const divPedidos = document.querySelector('.pedidos')

    if (!divPedidos) return

    divPedidos.innerHTML = '<h2>Pedidos</h2>'

    const listaItens = document.createElement('div')

    listaItens.className = 'lista-itens-scroll'

    divPedidos.appendChild(listaItens)

    for (let i = 0; i < quantidade; i++) {

        await new Promise(r => setTimeout(r, 100))

        const div = document.createElement('div')

        div.className = 'skeleton'

        div.innerHTML = `
            <div class="skeleton-img"></div>
        `

        listaItens.appendChild(div)
    }
}

export function esconderSkeleton(){

    const divPedidos = document.querySelector('.pedidos');

    divPedidos.innerHTML = '<h2>Pedidos</h2>';

}