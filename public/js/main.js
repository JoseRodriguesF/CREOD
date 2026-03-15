document.addEventListener('DOMContentLoaded', () => {
    const authView = document.getElementById('auth-view');
    const homeView = document.getElementById('home-view');
    const token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('token');

    // Auth Logic
    if (token) {
        localStorage.setItem('token', token);
        // Remove token from URL without refreshing
        window.history.replaceState({}, document.title, "/");
        showHome();
    }

    function showHome() {
        authView.style.display = 'none';
        homeView.style.display = 'block';
        loadNotes();
    }

    // Page Switching
    const navItems = document.querySelectorAll('.nav-item');
    const pages = {
        inicio: document.getElementById('page-inicio'),
        anotacoes: document.getElementById('page-anotacoes')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            Object.keys(pages).forEach(key => {
                pages[key].style.display = key === targetPage ? 'block' : 'none';
            });
        });
    });

    // Tab Switching (Inicio)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) content.classList.add('active');
            });
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });

    // Notes / Chat Logic
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const notesList = document.getElementById('notes-list');

    async function loadNotes() {
        try {
            const res = await fetch('/api/notes', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const notes = await res.json();
            
            notesList.innerHTML = '';
            notes.forEach(renderNote);
            scrollToBottom();
        } catch (err) {
            console.error('Erro ao carregar notas:', err);
        }
    }

    function renderNote(note) {
        const div = document.createElement('div');
        div.className = 'message user animate-fade';
        div.innerHTML = `
            <div>${note.content}</div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 4px; text-align: right;">
                ${new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        `;
        notesList.appendChild(div);
    }

    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = noteInput.value;
        if (!content) return;

        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') 
                },
                body: JSON.stringify({ content })
            });
            const newNote = await res.json();
            renderNote(newNote);
            noteInput.value = '';
            scrollToBottom();
        } catch (err) {
            console.error('Erro ao salvar nota:', err);
        }
    });

    function scrollToBottom() {
        notesList.scrollTop = notesList.scrollHeight;
    }
});
