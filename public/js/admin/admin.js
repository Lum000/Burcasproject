import { state } from '../state/state.js'

export async function isadmin(){

    const req = await fetch('/dashboard')

    const res = await req.json()

    if(res.error){
        window.location.href = 'login.html'
        return
    }

    if(res.role === 'admin'){
        state.isAdmin = true
    }

    toggleAdmin()
}

export function toggleAdmin(){

    const btn_remover = document.querySelectorAll('.btn_remover')

    const adminpanel = document.querySelectorAll('.adminpanel')

    if(state.isAdmin){

        btn_remover.forEach((item)=>{
            item.style.display = 'block'
        })

        adminpanel.forEach((item)=>{
            item.style.display = 'block'
        })

    }else{

        btn_remover.forEach((item)=>{
            item.style.display = 'none'
        })

        adminpanel.forEach((item)=>{
            item.style.display = 'none'
        })
    }
}