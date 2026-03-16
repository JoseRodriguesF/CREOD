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

    // Sub-tab Switching (Cronograma)
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubTab = btn.getAttribute('data-subtab');
            subTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            subTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `schedule-${targetSubTab}`) content.classList.add('active');
            });
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
        const directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: "#ffffff",
                strokeWeight: 5
            }
        });
        const openMapsBtn = document.getElementById('open-maps-btn');
        
        // Default Google Maps URL for the destination
        openMapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

        const mapOptions = {
            zoom: 15,
            center: { lat: -23.4751, lng: -46.6669 }, // Approximate position for the address
            disableDefaultUI: true,
            zoomControl: true,
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

                // Update button with specific origin
                openMapsBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${encodeURIComponent(destination)}`;

                directionsService.route({
                    origin: pos,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                }, (response, status) => {
                    if (status === "OK") {
                        directionsRenderer.setDirections(response);
                        const leg = response.routes[0].legs[0];
                        
                        // Origin Marker
                        new google.maps.Marker({
                            position: leg.start_location,
                            map: map,
                            label: { text: "VOCÊ", color: "white", fontWeight: "bold" },
                            title: "Sua Localização"
                        });

                        // Destination Marker
                        new google.maps.Marker({
                            position: leg.end_location,
                            map: map,
                            label: { text: "CREOD", color: "white", fontWeight: "bold" },
                            title: "CREOD"
                        });
                    } else {
                        console.error("Directions request failed due to " + status);
                    }
                });
            }, () => {
                handleLocationError(map, destination);
            });
        } else {
            handleLocationError(map, destination);
        }
    };

    function handleLocationError(map, destination) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: destination }, (results, status) => {
            if (status === "OK") {
                map.setCenter(results[0].geometry.location);
                new google.maps.Marker({ 
                    map, 
                    position: results[0].geometry.location,
                    label: { text: "CREOD", color: "white", fontWeight: "bold" },
                    animation: google.maps.Animation.DROP
                });
            }
        });
    }

    // --- Notepad Logic (CRUD) ---
    const noteModal = document.getElementById('note-modal');
    const dialogModal = document.getElementById('dialog-modal');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogOkBtn = document.getElementById('dialog-ok-btn');
    const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
    const dialogIcon = document.getElementById('dialog-icon');

    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    const editNoteId = document.getElementById('edit-note-id');
    const notesGrid = document.getElementById('notes-grid');
    const modalTitleText = document.getElementById('modal-title-text');

    function showDialog(title, message, type = 'alert') {
        return new Promise((resolve) => {
            dialogTitle.innerText = title;
            dialogMessage.innerText = message;
            dialogModal.style.display = 'flex';
            dialogModal.classList.add('dialog-active');
            
            if (type === 'confirm') {
                dialogCancelBtn.style.display = 'block';
                dialogIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
            } else {
                dialogCancelBtn.style.display = 'none';
                dialogIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            }

            const cleanup = (val) => {
                dialogModal.style.display = 'none';
                dialogModal.classList.remove('dialog-active');
                dialogOkBtn.removeEventListener('click', okHandler);
                dialogCancelBtn.removeEventListener('click', cancelHandler);
                resolve(val);
            };

            const okHandler = () => cleanup(true);
            const cancelHandler = () => cleanup(false);

            dialogOkBtn.addEventListener('click', okHandler);
            dialogCancelBtn.addEventListener('click', cancelHandler);
        });
    }

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
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-content-preview">${note.content}</div>
            <div class="note-actions">
                <button class="action-btn delete delete-btn"><i class="fas fa-trash"></i> Excluir</button>
            </div>
        `;

        // Click on the entire card to edit
        card.addEventListener('click', (e) => {
            // If the user clicked the delete button or its icon, don't open the modal
            if (e.target.closest('.delete-btn')) return;
            openModal(note);
        });

        // Delete button listener
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event from bubbling to card click
            deleteNote(note._id);
        });

        notesGrid.appendChild(card);
    }

    async function saveNote() {
        const title = noteTitleInput.value;
        const content = noteContentInput.value;
        const id = editNoteId.value;

        if (!title || !content) return showDialog("Atenção", "Preencha o título e o conteúdo da anotação.");

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
        const confirmed = await showDialog("Excluir", "Deseja realmente excluir esta anotação?", "confirm");
        if (!confirmed) return;
        
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
