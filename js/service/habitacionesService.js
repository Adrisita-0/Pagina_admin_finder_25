const API_URL= "http://localhost:8080/api"; 

export async function consultarTiposHabitacion() {
    const res = await fetch (`${API_URL}/consultarTiposHabitacion`); 
    return res.json(); 
}

export async function registrarHabitacion(data) {
    await fetch(`${API_URL}/registrarTiposHabtitacion`,{
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data)
    }); 
}

export async function actualizarHabitaciones(id, data) {
    await fetch (`${API_URL}actualizarTiposHabitacion/{id}`, {
        method: "PUT", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data)
    }); 
}

