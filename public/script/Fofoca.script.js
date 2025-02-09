const overlay = document.getElementById('overlay');

function timeAgo(date) {

 
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Data inválida';
    }

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
        return seconds === 1 ? '1 s' : `${seconds} s`;
    } else if (minutes < 60) {
        return minutes === 1 ? '1 m' : `${minutes} m`;
    } else if (hours < 24) {
        return hours === 1 ? '1 h' : `${hours} h`;
    } else if (days < 7) {
        return days === 1 ? '1 dia atrás' : `${days} dias atrás`;
    } else if (days < 30) {
        return days < 7 ? `${days} dias atrás` : `${Math.floor(days / 7)} semanas atrás`;
    } else if (months < 12) {
        return months === 1 ? '1 mês atrás' : `${months} meses atrás`;
    } else {
        return years === 1 ? '1 ano atrás' : `${years} anos atrás`;
    }
}

function formatarData(date) {
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const dia = date.getDate();
    const mes = date.toLocaleString('pt-BR', { month: 'long' });
    const ano = date.getFullYear();

    return `${horas}:${minutos} - ${dia} de ${mes} de ${ano}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const cadastra = document.getElementById('buttonCriar');

    const userNav = document.getElementById('user-nav');
    const userModal = document.getElementById('user-modal');

    userNav.addEventListener('click', () => {
        userModal.style.display = 'block'; 
    });
    
    document.addEventListener('click', (event) => {
        const isClickInsideUserNav = userNav.contains(event.target);
        const isClickInsideUserModal = userModal.contains(event.target);

        if (!isClickInsideUserNav && !isClickInsideUserModal) {
            userModal.style.display = 'none'; 
        }
    })


    if (!token) {
        if (cadastra) {
            cadastra.style.display = 'block';
        }
    } else {
        if (cadastra) {
            cadastra.style.display = 'none';
        }
    }

    const perfilLink = document.getElementById('user-modal-content-profile');
    
    perfilLink.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('id');
        
        console.log('Front | Token armazenado:', token);

        if (token && userId) {
            fetch('/verificar', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    console.log('Front | Erro ao verificar o token');
                    throw new Error('Erro ao verificar o token');
                }
                return response.json();
            })
            .then(data => {
                console.log('Front | Token verificado', data);
                
                if (data.message === 'Token verificado com sucesso') {
                    fetch(`/usuario-logado`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao obter usuário logado');
                        }
                        return response.json();
                    })
                    .then(userData => {
                        if (userData._id) {
                            console.log("Front | Redirecionando para o perfil...");
                            window.location.href = `/perfil/${userData._id}`; 
                        } else {
                            console.log('Front | ID de usuário não encontrado');
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao obter usuário logado:', error);
                        alert('Erro ao redirecionar para o perfil');
                    });
                } else {
                    console.log('Front | Token inválido ou expirado');
                }
            })
            .catch(err => {
                console.error('Erro na requisição de verificação', err);
            });
        } else {
            alert('Você não está logado'); 
        }
    });

});

async function fetchFofoca() {
    const path = window.location.pathname;
    const id = path.split('/').pop();

    if (!id || id.trim() === "" || !/^[0-9a-fA-F]{24}$/.test(id)) {
        document.getElementById('fofocaDetails').innerHTML = '<p>ID inválido.</p>';
        return;
    }

    try {
        const response = await fetch(`/fofocas/${id}/api`);
        if (!response.ok) {
            throw new Error('Fofoca não encontrada.');
        }
        const fofoca = await response.json();

        const dataFormatada = formatarData(new Date(fofoca.date));

        document.getElementById('fofocaDetails').innerHTML = `
        <a href="/perfil/${fofoca.usuario._id}"><div class='user-specs'>
        <div id='fofoca-display' class='display'>${fofoca.usuario.displayUser}</div>
        <div id='fofoca-user' class='user'>@${fofoca.usuario.user}</div>
        </div></a>
            <div id="fofoca-description" class='description' >${fofoca.description}</div>
            <div id="fofoca-date" class='date'>${dataFormatada}</div>

        `;

        const loggedUserId = getUserId();
        const editButton = document.getElementById('editFofocaButton');
        const trashButton = document.getElementById('trashButton');

        if (editButton && trashButton) {
            if (loggedUserId === fofoca.usuario._id.toString()) {
                editButton.style.display = 'block';
                trashButton.style.display = 'block';
            } else {
                editButton.style.display = 'none';
                trashButton.style.display = 'none';
            }
        }

        fetchComentarios(id);
    } catch (error) {
        document.getElementById('fofocaDetails').innerHTML = `<p>${error.message}</p>`;
    }
}

document.getElementById('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = window.location.pathname.split('/').pop();
    const text = document.getElementById('commentText').value;
    const usuario = getUserId();

    if (!usuario || typeof usuario !== 'string' || usuario.length !== 24) {
        console.error("ID do usuário inválido:", usuario);
        alert("Você precisa estar logado!");
        return;
    }

    if (!text || text.trim() === '') {
        alert("Comentário não pode ser vazio.");
        return;
    }

    try {
        const response = await fetch(`/fofocas/${id}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario, text: text })
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar comentário.');
        }

        document.getElementById('commentText').value = '';
        fetchComentarios(id);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar comentário.');
    }
});

async function fetchComentarios(id) {
    try {
        const response = await fetch(`/fofocas/${id}/comentarios`);
        if (!response.ok) {
            throw new Error('Erro ao buscar comentários.');
        }
        const comentarios = await response.json();

        const comentariosList = document.getElementById('comentariosList');
        comentariosList.innerHTML = '';

        if (comentarios.length === 0) {
            comentariosList.innerHTML = '<p>Não há comentários ainda.</p>';
            return;
        }

        comentarios.forEach(comentario => {
            const usuario = comentario.usuario 
                ? `${comentario.usuario.displayUser} - @${comentario.usuario.user}` 
                : 'Usuário desconhecido';
            const dataFormatada = timeAgo(new Date(comentario.date));
            const texto = comentario.text || 'Sem conteúdo';

            comentariosList.innerHTML += `
                <div class="comentario-item">   
                <a href="/perfil/${comentario.usuario._id}"><div id='comentarios-user-specs' class='user-specs'>
                        <div id='comentarios-display' class='display'>${comentario.usuario.displayUser}</div>
                        <div id='comentarios-user' class='user'>@${comentario.usuario.user}</div>
                    </div></a>
                    
                
                        <div id='comentarios-description' class='description'>${texto}</div>
                        <div id='comentarios-data' class='date'>${dataFormatada}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro:", error);
    }
}

function getUserId() {
    const token = localStorage.getItem('token');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usuarioDiv = document.getElementById('mostraUsuario');
    const userDisplay = document.getElementById('nav-display');
    const userUser = document.getElementById('nav-user')

    if (token) {
        fetch('/usuario-logado', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao obter usuário logado.');
            }
            return response.json();
        })
        .then(data => {
            if (data.displayUser && data.usuario) {
                userDisplay.textContent = `${data.displayUser}`;
                userUser.textContent = `@${data.usuario}`
                document.getElementById('user-icon').style.display = 'block';
            } else {
                document.getElementById('user-icon').style.display = 'none';
                usuarioDiv.textContent = '';
            }
        })
        .catch(error => {
            console.error('Erro ao obter usuário logado:', error);
        });
    } else {
        usuarioDiv.textContent = '';
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            fetch('/logout', { 
                method: 'POST', 
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
            })
            .then(response => {
                if (response.ok) {
                    localStorage.removeItem('token');
                    window.location.href = '/login'; 
                }
            })
            .catch(error => {
                console.error('Erro ao deslogar:', error);
            });
        });
    } else {
        console.log('Botão de logout não encontrado.');
    }
});

fetchFofoca();

let currentFofocaId;

document.getElementById('editFofocaButton').addEventListener('click', () => {
    overlay.style.display = 'block';
    overlay.style.animation = 'escurecerFundo 0.5s forwards';

    const fofocaDescription = document.getElementById('fofoca-description').innerText;
    document.getElementById('editDescription').value = fofocaDescription;
    currentFofocaId = window.location.pathname.split('/').pop();
    document.getElementById('editModal').style.display = 'block';
});

document.getElementById('closeEditButton').addEventListener('click', function() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('saveEditButton').addEventListener('click', async () => {
    const newDescription = document.getElementById('editDescription').value;

    try {
        const response = await fetch(`/fofocas/${currentFofocaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDescription })
        });

        if (!response.ok) {
            throw new Error('Erro ao editar fofoca.');
        }

        fetchFofoca();
        document.getElementById('editModal').style.display = 'none';
        overlay.style.display = 'none';
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao editar.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const commentButton = document.getElementById('openCommentModalButton');

    if (!token) {
        if (commentButton) {
            commentButton.style.display = 'none';
        }
    } else {
        if (commentButton) {
            commentButton.style.display = 'block';
        }
    }
});

document.getElementById('openCommentModalButton').addEventListener('click', () => {
    document.getElementById('commentModal').style.display = 'block';
    overlay.style.display = 'block';
    overlay.style.animation = 'escurecerFundo 0.5s forwards';
});

document.getElementById('closeCommentButton').addEventListener('click', function() {
    document.getElementById('commentModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('saveCommentButton').addEventListener('click', async () => {
    const text = document.getElementById('commentTextModal').value;
    const usuario = getUserId();
    const id = window.location.pathname.split('/').pop();

    if (!usuario || typeof usuario !== 'string' || usuario.length !== 24) {
        console.error("ID do usuário inválido:", usuario);
        alert("Você precisa estar logado!");
        return;
    }

    if (!text || text.trim() === '') {
        alert("Comentário não pode ser vazio.");
        return;
    }

    try {
        const response = await fetch(`/fofocas/${id}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario, text: text })
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar comentário.');
        }

        document.getElementById('commentTextModal').value = '';
        fetchComentarios(id);
        document.getElementById('commentModal').style.display = 'none';
        overlay.style.display = 'none';
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar comentário.');
    }
});


document.getElementById('trashButton').addEventListener('click', () => {
    const modal = document.getElementById('trashModal');
    modal.style.display = 'block';
    overlay.style.display = 'block';
    overlay.style.animation = 'escurecerFundo 0.5s forwards';
});

// Cancelar exclusão
document.getElementById('closeTrashButton').addEventListener('click', function() {
    document.getElementById('trashModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});

// Confirmar exclusão
document.getElementById('apagarButton').addEventListener('click', async () => {
    const id = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/fofocas/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar fofoca');
        }

        window.location.href = '/fofocas';
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao deletar fofoca.');
    }
});
