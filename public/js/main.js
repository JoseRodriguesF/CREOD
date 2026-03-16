document.addEventListener('DOMContentLoaded', async () => {
    const authView = document.getElementById('auth-view');
    const homeView = document.getElementById('home-view');
    const token = new URLSearchParams(window.location.search).get('token') || localStorage.getItem('token');

    // Auth Logic
    if (token) {
        localStorage.setItem('token', token);
        window.history.replaceState({}, document.title, "/");
        showHome();
    }

    function showHome() {
        authView.style.display = 'none';
        homeView.style.display = 'block';
        loadNotes();
        initMapLoader();
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
            if (targetTab === 'mapa') {
                // Resize map if loaded
                if (window.map) google.maps.event.trigger(window.map, "resize");
            }
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });

    // --- Google Maps Integration ---
    async function initMapLoader() {
        try {
            const configRes = await fetch('/api/config');
            const { googleMapsApiKey } = await configRes.json();

            if (!googleMapsApiKey || googleMapsApiKey === "undefined") {
                document.getElementById('map').innerHTML = "<p style='padding:20px; text-align:center;'>Configure GOOGLE_MAPS_API_KEY no .env</p>";
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } catch (err) {
            console.error("Erro ao carregar mapa:", err);
        }
    }

    window.initMap = function() {
        const destination = "Av. Rubens Montanaro Borba n°477";
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        
        const mapOptions = {
            zoom: 15,
            center: { lat: -23.5505, lng: -46.6333 }, // São Paulo default
            styles: [ // Dark Mode Style
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
            ]
        };

        const map = new google.maps.Map(document.getElementById("map"), mapOptions);
        window.map = map;
        directionsRenderer.setMap(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                directionsService.route({
                    origin: pos,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (response, status) => {
                    if (status === "OK") {
                        directionsRenderer.setDirections(response);
                    } else {
                        console.error("Directions request failed due to " + status);
                    }
                });
            }, () => {
                // Geolocation failed, just show destination
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: destination }, (results, status) => {
                    if (status === "OK") {
                        map.setCenter(results[0].geometry.location);
                        new google.maps.Marker({ map, position: results[0].geometry.location });
                    }
                });
            });
        }
    };

    // --- Notepad Logic (CRUD) ---
    const noteModal = document.getElementById('note-modal');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    const editNoteId = document.getElementById('edit-note-id');
    const notesGrid = document.getElementById('notes-grid');
    const modalTitleText = document.getElementById('modal-title-text');

    document.getElementById('add-note-btn').addEventListener('click', () => {
        openModal();
    });

    document.getElementById('cancel-note-btn').addEventListener('click', () => {
        closeModal();
    });

    document.getElementById('save-note-btn').addEventListener('click', saveNote);

    function openModal(note = null) {
        if (note) {
            modalTitleText.innerText = "Editar Anotação";
            editNoteId.value = note._id;
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
        } else {
            modalTitleText.innerText = "Nova Anotação";
            editNoteId.value = "";
            noteTitleInput.value = "";
            noteContentInput.value = "";
        }
        noteModal.style.display = 'flex';
    }

    function closeModal() {
        noteModal.style.display = 'none';
    }

    async function loadNotes() {
        try {
            const res = await fetch('/api/notes', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const notes = await res.json();
            notesGrid.innerHTML = '';
            notes.forEach(renderNote);
        } catch (err) {
            console.error('Erro ao carregar notas:', err);
        }
    }

    function renderNote(note) {
        const card = document.createElement('div');
        card.className = 'note-card animate-fade';
        card.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-content">${note.content}</div>
            <div class="note-actions">
                <button class="action-btn edit-btn"><i class="fas fa-edit"></i> Editar</button>
                <button class="action-btn delete delete-btn"><i class="fas fa-trash"></i> Excluir</button>
            </div>
        `;

        card.querySelector('.edit-btn').addEventListener('click', () => openModal(note));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteNote(note._id));

        notesGrid.appendChild(card);
    }

    async function saveNote() {
        const title = noteTitleInput.value;
        const content = noteContentInput.value;
        const id = editNoteId.value;

        if (!title || !content) return alert("Preencha título e conteúdo");

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/notes/${id}` : '/api/notes';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') 
                },
                body: JSON.stringify({ title, content })
            });

            if (res.ok) {
                closeModal();
                loadNotes();
            }
        } catch (err) {
            console.error('Erro ao salvar nota:', err);
        }
    }

    async function deleteNote(id) {
        if (!confirm("Deseja realmente excluir esta anotação?")) return;
        try {
            const res = await fetch(`/api/notes/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            if (res.ok) loadNotes();
        } catch (err) {
            console.error('Erro ao excluir nota:', err);
        }
    }
});
