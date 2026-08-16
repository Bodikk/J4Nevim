// Dummy data z databáze
let documents = [
    { id: 1, prikaz: "96/2026", stroj: "Pec", kategorie: "Výkresy", nazev: "schema_zapojeni_v2.pdf", datum: "15.08.2026" },
    { id: 2, prikaz: "96/2026", stroj: "Dělička", kategorie: "Manuály", nazev: "manual_obsluha.pdf", datum: "16.08.2026" },
    { id: 3, prikaz: "97/2026", stroj: "Kynárna", kategorie: "Revize", nazev: "revizni_zprava.pdf", datum: "14.08.2026" }
];

let currentRole = "admin";

// Inicializace po načtení
document.addEventListener("DOMContentLoaded", () => {
    renderTable();
    updateDashboardStats();
});

// --- PŘEPÍNÁNÍ POHLEDŮ (Routing) ---
function switchView(viewId, clickedLinkElement) {
    document.getElementById('view-archiv').classList.add('hidden');
    document.getElementById('view-prehled').classList.add('hidden');
    document.getElementById('view-nastaveni').classList.add('hidden');
    document.getElementById('view-dokumenty').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');

    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => link.classList.remove('active'));

    clickedLinkElement.classList.add('active');

    if (viewId === 'view-prehled') {
        updateDashboardStats();
    }
}

// --- RIZENÍ ROLÍ ---
function changeRole() {
    currentRole = document.getElementById("roleSelect").value;
    const btnOpenModal = document.getElementById("btnOpenModal");
    const userDisplay = document.getElementById("currentUserDisplay");

    if (currentRole === "admin") {
        btnOpenModal.classList.remove("hidden");
        userDisplay.innerText = "Bohdan (Admin)";
    } else {
        btnOpenModal.classList.add("hidden");
        userDisplay.innerText = "Běžný uživatel";
    }
    renderTable();
}

// --- MODÁLNÍ OKNO PRO UPLOAD ---
function openModal() {
    document.getElementById("uploadModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("uploadModal").classList.add("hidden");
    document.getElementById("file-input").value = "";
    document.getElementById("progress-container").classList.add("hidden");
    document.getElementById("progress-bar-fill").style.width = "0%";
}

// --- FAKE UPLOAD S PROGRESS BAREM ---
function fakeUpload() {
    const prikaz = document.getElementById("select-prikaz").value;
    const stroj = document.getElementById("select-stroj").value;
    const kategorie = document.getElementById("select-kategorie").value;
    const fileInput = document.getElementById("file-input");
    const btnUpload = document.getElementById("btn-upload");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar-fill");
    const progressPercent = document.getElementById("progress-percent");

    if (!fileInput.files.length) {
        alert("Nejprve vyberte soubor k nahrání!");
        return;
    }

    const fileName = fileInput.files[0].name;

    btnUpload.disabled = true;
    btnUpload.classList.add("btn-disabled");
    progressContainer.classList.remove("hidden");

    let width = 0;
    const interval = setInterval(() => {
        width += 4;
        progressBar.style.width = width + "%";
        progressPercent.innerText = width + "%";

        if (width >= 100) {
            clearInterval(interval);

            setTimeout(() => {
                documents.push({
                    id: Date.now(),
                    prikaz: prikaz,
                    stroj: stroj,
                    kategorie: kategorie,
                    nazev: fileName,
                    datum: new Date().toLocaleDateString("cs-CZ")
                });

                closeModal();
                renderTable();
                updateDashboardStats();

                btnUpload.disabled = false;
                btnUpload.classList.remove("btn-disabled");
            }, 400);
        }
    }, 50);
}

// --- VYKRESLENÍ TABULKY A VYHLEDÁVÁNÍ ---
function renderTable(filterText = "") {
    const tbody = document.getElementById("documentTableBody");
    tbody.innerHTML = "";

    const filteredDocs = documents.filter(doc =>
        doc.nazev.toLowerCase().includes(filterText.toLowerCase()) ||
        doc.prikaz.toLowerCase().includes(filterText.toLowerCase()) ||
        doc.stroj.toLowerCase().includes(filterText.toLowerCase())
    );

    [...filteredDocs].reverse().forEach(doc => {
        let actionButtons = `<button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;"><i class="fa-solid fa-download"></i></button>`;

        if (currentRole === "admin") {
            actionButtons += ` <button class="btn btn-danger-outline" onclick="deleteDoc(${doc.id})"><i class="fa-solid fa-trash"></i></button>`;
        }

        const row = `
            <tr>
                <td><strong>${doc.prikaz}</strong></td>
                <td><span class="badge badge-gray">${doc.stroj}</span></td>
                <td><span class="badge badge-blue">${doc.kategorie}</span></td>
                <td><i class="fa-regular fa-file-pdf" style="color: #ef4444; margin-right: 8px;"></i> ${doc.nazev}</td>
                <td>${doc.datum}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterTable() {
    const searchInput = document.getElementById("searchInput").value;
    renderTable(searchInput);
}

function deleteDoc(id) {
    if (confirm("Opravdu smazat tento dokument?")) {
        documents = documents.filter(d => d.id !== id);
        renderTable(document.getElementById("searchInput").value);
        updateDashboardStats();
    }
}

function updateDashboardStats() {
    document.getElementById("stat-total-docs").innerText = documents.length;
}


// Paměť pro nedávno otevřené soubory (Max 5)
let recentDocuments = [];

// Rozšíření stávající funkce switchView
const originalSwitchView = switchView;
switchView = function (viewId, clickedLinkElement) {
    originalSwitchView(viewId, clickedLinkElement);
    if (viewId === 'view-dokumenty') {
        renderDokumentyAccordion();
    }
};

// Vykreslení rozbalovacího seznamu podle výrobáků
function renderDokumentyAccordion() {
    const container = document.getElementById("accordion-container");
    container.innerHTML = "";

    // Seskupení dokumentů podle výrobního příkazu
    const grouped = documents.reduce((acc, doc) => {
        if (!acc[doc.prikaz]) acc[doc.prikaz] = [];
        acc[doc.prikaz].push(doc);
        return acc;
    }, {});

    // Vygenerování HTML pro každý výrobák
    for (const [prikaz, docs] of Object.entries(grouped)) {
        let tableRows = docs.map(doc => `
            <tr>
                <td><span class="badge badge-gray">${doc.stroj}</span></td>
                <td><i class="fa-regular fa-file-pdf" style="color: #ef4444;"></i> ${doc.nazev}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="openDocument(${doc.id})">
                        Otevřít
                    </button>
                </td>
            </tr>
        `).join("");

        const accordionHTML = `
            <div class="accordion-item">
                <div class="accordion-header" onclick="toggleAccordion(this)">
                    <span><i class="fa-solid fa-folder" style="color: #fbbf24; margin-right: 10px;"></i> Výrobní příkaz: ${prikaz}</span>
                    <i class="fa-solid fa-chevron-down accordion-icon"></i>
                </div>
                <div class="accordion-content">
                    <table class="modern-table" style="margin: 0; width: 100%;">
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML += accordionHTML;
    }
}

// Otevírání a zavírání Accordionu
function toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.accordion-icon');
    content.classList.toggle('active');
    icon.classList.toggle('rotated');
}

// Simulace otevření dokumentu a přidání do "Nedávných"
function openDocument(docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    // Přidat na začátek pole nedávných (a odstranit duplicitu, pokud tam už je)
    recentDocuments = recentDocuments.filter(d => d.id !== docId);
    recentDocuments.unshift(doc);

    // Udržet jen posledních 5
    if (recentDocuments.length > 5) {
        recentDocuments.pop();
    }

    renderRecentFiles();

    // Falešné upozornění o otevření souboru
    alert(`Otevírám soubor: ${doc.nazev}\n(V budoucnu se zde např. stáhne nebo zobrazí PDF)`);
}

// Vykreslení pravé rolety s nedávnými soubory
function renderRecentFiles() {
    const list = document.getElementById("recent-files-list");
    list.innerHTML = "";

    if (recentDocuments.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 10px;">Zatím jste neotevřeli žádný dokument.</p>`;
        return;
    }

    recentDocuments.forEach(doc => {
        list.innerHTML += `
            <div class="recent-item" onclick="alert('Znovu otevírám: ${doc.nazev}')">
                <i class="fa-regular fa-file-pdf" style="color: #ef4444; font-size: 1.5rem;"></i>
                <div class="recent-info">
                    <strong>${doc.nazev}</strong>
                    <span>VP: ${doc.prikaz} | ${doc.stroj}</span>
                </div>
            </div>
        `;
    });
}