export const urlParams = new URLSearchParams(window.location.search);

export const mesaNumero = urlParams.get('mesa');

export let totalGeral = 0;

export function setTotal(valor){
    totalGeral = valor;
}