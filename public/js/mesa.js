import { mostrarSkeleton } from '../ui/skeleton.js'


async function openAdd() {
    document.getElementById("productAlert").style.display = "flex"
    document.body.style.overflow = "hidden";
    showCategory("lanches")
}
function closeAlert(){
    document.getElementById("productAlert").style.display = "none"
    document.body.style.overflow = "auto";
}

verifyMesa()