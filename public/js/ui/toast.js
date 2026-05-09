export function showToast(message,color='green'){

    const toast = document.getElementById("toastAdd")

    document.getElementById("toastMessage").innerHTML = message

    document.getElementById("toastMessage").style.color = color

    toast.classList.add("show")

    setTimeout(()=>{
        toast.classList.remove("show")
    },1500)
}