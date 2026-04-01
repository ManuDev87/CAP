let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // stores answers
let hasAnswered = {}; // for modo ayuda, tracks if user has clicked already
let timerInterval = null;
let secondsElapsed = 0;
let isReviewMode = false;
let currentMode = 'examen'; // 'examen' | 'ayuda'
let currentTestId = null;
let currentUser = null; // null means not logged in.
const ADMIN_USER = 'root';
// Mock test database (User will add more data)
const availableTests = [
    { id: 'febrero_2023', name: 'Febrero 2023', img: 'img/truck1.jpg' },
    { id: 'marzo_2023', name: 'Marzo 2023', img: 'img/truck2.jpg' },
    { id: 'junio_2023', name: 'Junio 2023', img: 'img/truck3.jpg' },
    { id: 'julio_2023', name: 'Julio 2023', img: 'img/truck4.jpg' },
    { id: 'septiembre_2023', name: 'Septiembre 2023', img: 'img/truck1.jpg' },
    { id: 'noviembre_2023', name: 'Noviembre 2023', img: 'img/truck2.jpg' },
    { id: 'enero_2024', name: 'Enero 2024', img: 'img/truck3.jpg' },
    { id: 'marzo_2024', name: 'Marzo 2024', img: 'img/truck4.jpg' },
    { id: 'mayo_2024', name: 'Mayo 2024', img: 'img/truck1.jpg' },
    { id: 'julio_2024', name: 'Julio 2024', img: 'img/truck2.jpg' },
    { id: 'septiembre_2024', name: 'Septiembre 2024', img: 'img/truck3.jpg' },
    { id: 'noviembre_2024', name: 'Noviembre 2024', img: 'img/truck4.jpg' },
    { id: 'enero_2025', name: 'Enero 2025', img: 'img/truck1.jpg' },
    { id: 'marzo_2025', name: 'Marzo 2025', img: 'img/truck2.jpg' },
    { id: 'mayo_2025', name: 'Mayo 2025', img: 'img/truck3.jpg' },
    { id: 'julio_2025', name: 'Julio 2025', img: 'img/truck4.jpg' },
    { id: 'septiembre_2025', name: 'Septiembre 2025', img: 'img/truck1.jpg' },
    { id: 'noviembre_2025', name: 'Noviembre 2025', img: 'img/truck2.jpg' },
    { id: 'enero_2026', name: 'Enero 2026', img: 'img/truck3.jpg' },
    { id: 'marzo_2026', name: 'Marzo 2026', img: 'img/truck4.jpg' }
];

const testPdfUrls = {
    'febrero_2023': 'https://web.araba.eus/documents/1247685/1249405/PLANTILLA+MERCANCIAS.pdf/2b3142dd-2c5d-73f1-358d-a72acdefeaab?t=1675426465593',
    'marzo_2023': 'https://web.araba.eus/documents/1247685/1248559/PlantillaMercancias.pdf/baf75bf5-c8c3-073f-6431-eed78886082c?t=1680260555891',
    'junio_2023': 'https://web.araba.eus/documents/1247685/1249489/PLANTILLA+MERCANCIAS.pdf/a191e2d8-87f9-2d85-3fae-74125e9d2fb9?t=1685704851002',
    'julio_2023': 'https://web.araba.eus/documents/1247685/1249509/Plantilla+Mercancias.pdf/a59274b8-68a2-6ec4-2919-57163c2a1d58?t=1689335365851',
    'septiembre_2023': 'https://web.araba.eus/documents/1247685/1249519/20230929+Plantilla+Examen+Mercanc%C3%ADas.pdf/1a4394c5-7a90-674a-a53f-2cf599c22af0?t=1695992158931',
    'noviembre_2023': 'https://web.araba.eus/documents/1247685/1249536/20231124+Plantilla+Respuestas+Examen+Mercanc%C3%ADas.pdf/49f865b0-09c3-d3f5-1d86-640f2cec32e9?t=1701076611807',
    'enero_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/examen_merc_se_cap1_2024.pdf',
    'marzo_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_se_cap2_2024.pdf',
    'mayo_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen-a_mer_se_cap3_2024.pdf',
    'julio_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_se_cap4_2024_modelo%20A.pdf',
    'septiembre_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_merc-modeloA_se_cap5_2024.pdf',
    'noviembre_2024': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer-A_se_cap6_2024.pdf',
    'enero_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_merc-modeloA_se_cap5_2025_0.pdf',
    'marzo_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_cr_mer_se_mod-a_cap2_2025.pdf',
    'mayo_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_A_se_cap3_2025.pdf',
    'julio_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_se_cap4_modeloA.pdf',
    'septiembre_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_se_cap5_2025_opci%C3%B3n%20A.pdf',
    'noviembre_2025': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf',
    'enero_2026': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf',
    'marzo_2026': 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/Examen%20con%20respuestas%20mercanc%C3%ADas%20A_0.pdf'
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const backofficeScreen = document.getElementById('backoffice-screen');
const btnLogoutAdmin = document.getElementById('btn-logout-admin');
const addUserForm = document.getElementById('add-user-form');
const usersListUl = document.getElementById('users-list');
const addUserMsg = document.getElementById('add-user-msg');

const testSelectionScreen = document.getElementById('test-selection-screen');
const testGrid = document.getElementById('test-grid');
const currentUserNameSpan = document.getElementById('current-user-name');
const btnLogoutUser = document.getElementById('btn-logout-user');
const btnUserMenu = document.getElementById('btn-user-menu');
const userDropdown = document.getElementById('user-dropdown');

const setPasswordScreen = document.getElementById('set-password-screen');
const setPasswordForm = document.getElementById('set-password-form');
const newPwdInput = document.getElementById('new-pwd-input');
const newPwdConfirm = document.getElementById('new-pwd-confirm');
const setPwdError = document.getElementById('set-pwd-error');
const setPwdName = document.getElementById('set-pwd-name');
const newUserNoPwd = document.getElementById('new-user-no-pwd');

let tempUserForPwd = null;
let tempUserNameForPwd = null;

const startScreen = document.getElementById('start-screen');
const selectedTestLabel = document.getElementById('selected-test-label');
const btnChangeTest = document.getElementById('btn-change-test');

const appContent = document.getElementById('app-content');
const btnModeExamen = document.getElementById('btn-mode-examen');
const btnModeAyuda = document.getElementById('btn-mode-ayuda');

const qNumberEl = document.getElementById('q-number');
const qTextEl = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentPgEl = document.getElementById('current-page');
const totalPgEl = document.getElementById('total-pages');
const finishBtn = document.getElementById('finish-btn');
const timeDisplay = document.getElementById('time-display');
const resultModal = document.getElementById('result-modal');

const scoreCorrectEl = document.getElementById('score-correct');
const scoreTotalEl = document.getElementById('score-total');
const statusPassEl = document.getElementById('status-pass');
const statusFailEl = document.getElementById('status-fail');
const reviewBtn = document.getElementById('review-btn');
const restartBtn = document.getElementById('restart-btn');
const timerContainer = document.getElementById('timer-container');

// New Modals
const confirmModal = document.getElementById('confirm-modal');
const unansweredWarning = document.getElementById('unanswered-warning');
const confirmFinishBtn = document.getElementById('confirm-finish-btn');
const cancelFinishBtn = document.getElementById('cancel-finish-btn');

const pauseModal = document.getElementById('pause-modal');
const pauseTestBtn = document.getElementById('pause-test-btn');
const endTestBtn = document.getElementById('end-test-btn');

// New Elements
const backMenuBtn = document.getElementById('back-menu-btn');
const paginationGrid = document.getElementById('pagination-grid');
const togglePanelBtn = document.getElementById('toggle-panel-btn');
const panelContent = document.getElementById('panel-content');
const toggleIcon = document.getElementById('toggle-icon');
const panelLegend = document.getElementById('panel-legend');
const mainTestTitle = document.getElementById('main-test-title');
const btnOpenPdf = document.getElementById('btn-open-pdf');

// Save result modal
const saveResultModal = document.getElementById('save-result-modal');
const saveResultPreview = document.getElementById('save-result-preview');
const saveResultYesBtn = document.getElementById('save-result-yes-btn');
const saveResultNoBtn = document.getElementById('save-result-no-btn');

// Stats screen
const btnStats = document.getElementById('btn-stats');
const statsScreen = document.getElementById('stats-screen');
const btnCloseStats = document.getElementById('btn-close-stats');
const chartTestSelect = document.getElementById('chart-test-select');

let allScoreRecords = [];

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: "AIzaSyDkp_dWIG6WdZ_hPLBT--Uo2fVi85ulK7U",
    authDomain: "grupo-cap.firebaseapp.com",
    projectId: "grupo-cap",
    storageBucket: "grupo-cap.firebasestorage.app",
    messagingSenderId: "1079029475525",
    appId: "1:1079029475525:web:d615b4b8b7cbff929528ac"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

async function init() {
    // Check local session cache for fast UX
    currentUser = localStorage.getItem('cap_current_user');
    
    if (currentUser) {
        if (currentUser === 'root') {
            showBackoffice();
        } else {
            const currentUserName = localStorage.getItem('cap_current_user_name');
            if (currentUserName) currentUserNameSpan.textContent = currentUserName;
            showTestSelection();
        }
    } else {
        showLogin();
    }

    // Login & Backoffice Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (btnLogoutAdmin) btnLogoutAdmin.addEventListener('click', handleLogout);
    if (btnLogoutUser) {
        btnLogoutUser.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    if (btnUserMenu && userDropdown) {
        btnUserMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.classList.contains('hidden') && !e.target.closest('.user-menu-container')) {
                userDropdown.classList.add('hidden');
            }
        });
    }
    if (addUserForm) addUserForm.addEventListener('submit', handleAddUser);
    
    if (newUserNoPwd) {
        newUserNoPwd.addEventListener('change', (e) => {
            const pwdInput = document.getElementById('new-user-password');
            if (pwdInput) {
                pwdInput.disabled = e.target.checked;
                if (e.target.checked) pwdInput.value = '';
            }
        });
    }
    if (setPasswordForm) setPasswordForm.addEventListener('submit', handleSetPassword);

    // Start screen logic
    btnModeExamen.addEventListener('click', () => startApp('examen'));
    btnModeAyuda.addEventListener('click', () => startApp('ayuda'));
    btnChangeTest.addEventListener('click', showTestSelection);

    if (btnOpenPdf) {
        btnOpenPdf.addEventListener('click', () => {
            if (currentTestId && testPdfUrls[currentTestId]) {
                window.open(testPdfUrls[currentTestId], '_blank');
            } else {
                alert('El PDF original de este examen aún no está disponible.');
            }
        });
    }

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });

    finishBtn.addEventListener('click', tryFinishTest);
    reviewBtn.addEventListener('click', enterReviewMode);
    restartBtn.addEventListener('click', showTestSelection);
    backMenuBtn.addEventListener('click', showStartScreen);

    if (btnStats) {
        btnStats.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown && userDropdown.classList.add('hidden');
            showStatsScreen();
        });
    }
    if (btnCloseStats) btnCloseStats.addEventListener('click', () => {
        statsScreen && statsScreen.classList.add('hidden');
        showTestSelection();
    });
    if (chartTestSelect) chartTestSelect.addEventListener('change', () => {
        renderStatsChart(allScoreRecords, chartTestSelect.value);
    });

    const btnSeedData = document.getElementById('btn-seed-data');
    const btnClearData = document.getElementById('btn-clear-data');
    if (btnSeedData) btnSeedData.addEventListener('click', seedTestData);
    if (btnClearData) btnClearData.addEventListener('click', () => {
        if (confirm("¿Seguro que quieres borrar los datos?")) {
            clearTestData();
        }
    });

    if (confirmFinishBtn) confirmFinishBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        pauseModal.classList.remove('hidden');
    });

    if (cancelFinishBtn) cancelFinishBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    if (pauseTestBtn) pauseTestBtn.addEventListener('click', async () => {
        pauseModal.classList.add('hidden');
        await saveTestState();
        showTestSelection();
    });

    if (endTestBtn) endTestBtn.addEventListener('click', async () => {
        pauseModal.classList.add('hidden');
        await clearTestState();
        await saveResultStats();  // save automatically, no modal
        showResults();
    });

    togglePanelBtn.addEventListener('click', () => {
        const icon = togglePanelBtn.querySelector('i');
        const textSpan = togglePanelBtn.querySelector('.btn-text');

        if (panelContent.classList.contains('collapsed')) {
            panelContent.classList.remove('collapsed');
            if (window.innerWidth > 768) panelLegend.style.display = 'flex';
            icon.className = 'fas fa-chevron-down';
            textSpan.textContent = ' Ocultar panel';
        } else {
            panelContent.classList.add('collapsed');
            panelLegend.style.display = 'none';
            icon.className = 'fas fa-chevron-up';
            textSpan.textContent = ' Mostrar panel';
        }
    });

    // Mobile: start with panel collapsed
    if (window.innerWidth <= 768) {
        panelContent.classList.add('collapsed');
        panelLegend.style.display = 'none';
        const icon = togglePanelBtn.querySelector('i');
        const textSpan = togglePanelBtn.querySelector('.btn-text');
        if (icon) icon.className = 'fas fa-chevron-up';
        if (textSpan) textSpan.textContent = ' Mostrar panel';
    }
}

async function renderTestSelection() {
    testGrid.innerHTML = '';
    
    const pausedTests = new Map();
    const resultStats = await loadAllResultStats();

    if (currentUser && currentUser !== 'root') {
        try {
            const snapshot = await db.collection('paused_tests').where('user', '==', currentUser).get();
            snapshot.forEach(doc => {
                pausedTests.set(doc.data().testId, doc.data().mode);
            });
        } catch(err) {
            console.error("Error cargando tests pausados", err);
        }
    }

    availableTests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';

        const pausedMode = pausedTests.get(test.id);
        const stats = resultStats.get(test.id);

        let pauseHtml = '';
        if (pausedMode) {
            pauseHtml = `
            <div class="paused-indicator">
                <div class="paused-bar"></div>
                <div class="paused-bar"></div>
            </div>`;
        }

        let statsHtml = '';
        if (stats && (stats.passes > 0 || stats.fails > 0)) {
            statsHtml = `<div class="result-stats-indicator">`;
            if (stats.passes > 0) {
                statsHtml += `
                    <div class="stat-badge stat-pass">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" fill="white"/>
                            <path d="M7 13l3.5 3.5L17 9" stroke="#0A8442" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>x${stats.passes}</span>
                    </div>`;
            }
            if (stats.fails > 0) {
                statsHtml += `
                    <div class="stat-badge stat-fail">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" fill="white"/>
                            <line x1="7" y1="7" x2="17" y2="17" stroke="#cc0000" stroke-width="2.5" stroke-linecap="round"/>
                            <line x1="17" y1="7" x2="7" y2="17" stroke="#cc0000" stroke-width="2.5" stroke-linecap="round"/>
                        </svg>
                        <span>x${stats.fails}</span>
                    </div>`;
            }
            statsHtml += `</div>`;
        }

        card.innerHTML = `
            ${pauseHtml}
            ${statsHtml}
            <img src="${test.img}" alt="${test.name}">
            <div class="test-card-label">${test.name}</div>
        `;
        card.addEventListener('click', () => selectTest(test.id, test.name, pausedMode));
        testGrid.appendChild(card);
    });

    // Añadir tarjeta para Plantilla CAP PDF en el último hueco
    const plantillaCard = document.createElement('div');
    plantillaCard.className = 'test-card plantilla-card';
    plantillaCard.style.backgroundColor = '#ffffff';
    plantillaCard.style.border = '2px dashed #0A8442';
    plantillaCard.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; padding-bottom: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 50px; height: 50px; fill: #cc0000; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));">
                <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"/>
            </svg>
        </div>
        <div class="test-card-label" style="justify-content:center; background: rgba(255, 255, 255, 0.95); width: 100%;">Plantilla CAP</div>
    `;
    plantillaCard.addEventListener('click', () => {
        window.open('Plantilla_Cap.pdf', '_blank');
    });
    testGrid.appendChild(plantillaCard);
}

function selectTest(id, name, pausedMode = null) {
    currentTestId = id;
    selectedTestLabel.innerText = name;
    mainTestTitle.innerText = `${name} - CAP Mercancías`;

    if (id === 'febrero_2023') {
        if (typeof examData_febrero_2023 !== 'undefined') questions = examData_febrero_2023;
        else return alert("Base de datos no encontrada para Febrero 2023.");
    } else if (id === 'marzo_2023') {
        if (typeof examData_marzo_2023 !== 'undefined') questions = examData_marzo_2023;
        else return alert("Base de datos no encontrada para Marzo 2023.");
    } else if (id === 'junio_2023') {
        if (typeof examData_junio_2023 !== 'undefined') questions = examData_junio_2023;
        else return alert("Base de datos no encontrada para Junio 2023.");
    } else if (id === 'julio_2023') {
        if (typeof examData_julio_2023 !== 'undefined') questions = examData_julio_2023;
        else return alert("Base de datos no encontrada para Julio 2023.");
    } else if (id === 'septiembre_2023') {
        if (typeof examData_septiembre_2023 !== 'undefined') questions = examData_septiembre_2023;
        else return alert("Base de datos no encontrada para Septiembre 2023.");
    } else if (id === 'noviembre_2023') {
        if (typeof examData_noviembre_2023 !== 'undefined') questions = examData_noviembre_2023;
        else return alert("Base de datos no encontrada para Noviembre 2023.");
    } else if (id === 'enero_2024') {
        if (typeof examData_enero_2024 !== 'undefined') questions = examData_enero_2024;
        else return alert("Base de datos no encontrada para Enero 2024.");
    } else if (id === 'marzo_2024') {
        if (typeof examData_marzo_2024 !== 'undefined') questions = examData_marzo_2024;
        else return alert("Base de datos no encontrada para Marzo 2024.");
    } else if (id === 'mayo_2024') {
        if (typeof examData_mayo_2024 !== 'undefined') questions = examData_mayo_2024;
        else return alert("Base de datos no encontrada para Mayo 2024.");
    } else if (id === 'julio_2024') {
        if (typeof examData_julio_2024 !== 'undefined') questions = examData_julio_2024;
        else return alert("Base de datos no encontrada para Julio 2024.");
    } else if (id === 'septiembre_2024') {
        if (typeof examData_septiembre_2024 !== 'undefined') questions = examData_septiembre_2024;
        else return alert("Base de datos no encontrada para Septiembre 2024.");
    } else if (id === 'noviembre_2024') {
        if (typeof examData_noviembre_2024 !== 'undefined') questions = examData_noviembre_2024;
        else return alert("Base de datos no encontrada para Noviembre 2024.");
    } else if (id === 'enero_2025') {
        if (typeof examData_enero_2025 !== 'undefined') questions = examData_enero_2025;
        else return alert("Base de datos no encontrada para Enero 2025.");
    } else if (id === 'marzo_2025') {
        if (typeof examData_marzo_2025 !== 'undefined') questions = examData_marzo_2025;
        else return alert("Base de datos no encontrada para Marzo 2025.");
    } else if (id === 'mayo_2025') {
        if (typeof examData_mayo_2025 !== 'undefined') questions = examData_mayo_2025;
        else return alert("Base de datos no encontrada para Mayo 2025.");
    } else if (id === 'julio_2025') {
        if (typeof examData_julio_2025 !== 'undefined') questions = examData_julio_2025;
        else return alert("Base de datos no encontrada para Julio 2025.");
    } else if (id === 'septiembre_2025') {
        if (typeof examData_septiembre_2025 !== 'undefined') questions = examData_septiembre_2025;
        else return alert("Base de datos no encontrada para Septiembre 2025.");
    } else if (id === 'noviembre_2025') {
        if (typeof examData_noviembre_2025 !== 'undefined') questions = examData_noviembre_2025;
        else return alert("Base de datos no encontrada para Noviembre 2025.");
    } else if (id === 'enero_2026') {
        if (typeof examData_enero_2026 !== 'undefined') questions = examData_enero_2026;
        else return alert("Base de datos no encontrada para Enero 2026.");
    } else if (id === 'marzo_2026') {
        if (typeof examData_marzo_2026 !== 'undefined') questions = examData_marzo_2026;
        else return alert("Base de datos no encontrada para Marzo 2026.");
    } else {
        alert("Ese test aún no está disponible. ¡Dile a tu asistente que lo añada!");
        return;
    }

    if (pausedMode) {
        startApp(pausedMode);
    } else {
        testSelectionScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }
}

function showTestSelection() {
    hideAllScreens();
    testSelectionScreen.classList.remove('hidden');
    renderTestSelection();
}

async function startApp(mode) {
    currentMode = mode;

    const savedState = await loadTestState(currentTestId, mode);

    if (savedState) {
        userAnswers = savedState.userAnswers || {};
        hasAnswered = savedState.hasAnswered || {};
        secondsElapsed = savedState.secondsElapsed || 0;
        currentQuestionIndex = savedState.currentQuestionIndex || 0;
    } else {
        clearTestState();
        userAnswers = {};
        hasAnswered = {};
        secondsElapsed = 0;
        currentQuestionIndex = 0;
    }

    isReviewMode = false;
    totalPgEl.innerText = questions.length;

    // UI Updates
    hideAllScreens();
    appContent.classList.remove('hidden');
    finishBtn.style.display = 'flex';
    backMenuBtn.classList.add('hidden');

    // Config mode classes
    optionsContainer.className = 'options-container mode-' + currentMode;

    updateTimeDisplay();
    startTimer();
    renderPaginationGrid();
    renderQuestion();
}

function showStartScreen() {
    stopTimer();
    hideAllScreens();
    startScreen.classList.remove('hidden');
}

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimeDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function updateTimeDisplay() {
    const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const secs = (secondsElapsed % 60).toString().padStart(2, '0');
    timeDisplay.innerText = `${mins}:${secs}`;
}

function renderPaginationGrid() {
    paginationGrid.innerHTML = '';
    questions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'grid-item st-unanswered';
        item.innerText = idx + 1;
        item.dataset.index = idx;

        item.addEventListener('click', () => {
            currentQuestionIndex = idx;
            renderQuestion();
        });

        paginationGrid.appendChild(item);
    });
    updateGridStates();
}

function updateGridStates() {
    const items = paginationGrid.querySelectorAll('.grid-item');
    items.forEach((item, idx) => {
        item.className = 'grid-item'; // Reset classes
        item.style.border = ''; // Reset border to fix color bleeding

        // Highlight current
        if (idx === currentQuestionIndex) {
            item.classList.add('st-current');
        }

        const answered = userAnswers[idx];
        const isCorrect = answered === questions[idx].correct;

        if (isReviewMode) {
            if (answered) {
                if (isCorrect) item.classList.add('st-correct');
                else item.classList.add('st-wrong');
            } else {
                item.classList.add('st-unanswered'); // Grey for unanswered in review
            }
        } else if (currentMode === 'ayuda') {
            if (hasAnswered[idx]) {
                if (isCorrect) item.classList.add('st-correct');
                else item.classList.add('st-wrong');
            } else {
                item.classList.add('st-unanswered');
            }
        } else {
            // Modo examen
            if (answered) {
                item.classList.add('st-answered');
            } else {
                item.classList.add('st-unanswered');
            }
        }
    });
}

function renderQuestion() {
    updateGridStates();
    const q = questions[currentQuestionIndex];
    qNumberEl.innerText = `${currentQuestionIndex + 1}.`;
    qTextEl.innerText = q.question;
    currentPgEl.innerText = currentQuestionIndex + 1;

    // Buttons state
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === questions.length - 1;

    optionsContainer.innerHTML = '';

    const questionAnsweredInAyuda = currentMode === 'ayuda' && hasAnswered[currentQuestionIndex];

    q.options.forEach(opt => {
        const optionRow = document.createElement('div');
        optionRow.className = 'option-row';

        const letterDiv = document.createElement('div');
        letterDiv.className = 'option-letter';
        letterDiv.innerText = opt.id.toUpperCase();

        const textDiv = document.createElement('div');
        textDiv.className = 'option-text';
        textDiv.innerText = opt.text;

        optionRow.appendChild(letterDiv);
        optionRow.appendChild(textDiv);
        optionRow.dataset.id = opt.id;

        // Visual rules dependent on mode
        if (isReviewMode) {
            optionRow.classList.add('disabled');
            if (opt.id === q.correct) {
                optionRow.classList.add('correct');
            } else if (userAnswers[currentQuestionIndex] === opt.id) {
                optionRow.classList.add('wrong');
            }
        }
        else if (currentMode === 'ayuda') {
            if (questionAnsweredInAyuda) {
                optionRow.classList.add('disabled');
                if (opt.id === q.correct) {
                    optionRow.classList.add('correct');
                } else if (userAnswers[currentQuestionIndex] === opt.id) {
                    optionRow.classList.add('wrong');
                }
            } else {
                optionRow.addEventListener('click', () => selectAyudaOption(opt.id, optionRow));
            }
        }
        else {
            // Examen
            if (userAnswers[currentQuestionIndex] === opt.id) {
                optionRow.classList.add('selected');
            }
            optionRow.addEventListener('click', () => selectExamenOption(opt.id, optionRow));
        }

        optionsContainer.appendChild(optionRow);
    });
}

function selectExamenOption(optId, rowElement) {
    userAnswers[currentQuestionIndex] = optId;
    document.querySelectorAll('.option-row').forEach(row => row.classList.remove('selected'));
    rowElement.classList.add('selected');
    updateGridStates();
}

function selectAyudaOption(optId, rowElement) {
    if (hasAnswered[currentQuestionIndex]) return;

    userAnswers[currentQuestionIndex] = optId;
    hasAnswered[currentQuestionIndex] = true;

    const q = questions[currentQuestionIndex];

    document.querySelectorAll('.option-row').forEach(row => {
        row.classList.add('disabled');
        if (row.dataset.id === q.correct) {
            row.classList.add('correct');
        } else if (row.dataset.id === optId) {
            row.classList.add('wrong');
        }
    });

    updateGridStates();
}

function calculateScore() {
    // Sistema de puntuación CAP oficial:
    // Sólo cuentan las 100 primeras preguntas
    // Correcta: +1 | Incorrecta: -0.5 | Sin contestar: 0
    const SCORED_QUESTIONS = 100;

    let correct = 0;
    let wrong = 0;
    let blank = 0;
    let bonusCorrect = 0; // Preguntas 101-103

    questions.forEach((q, index) => {
        const answered = userAnswers[index];
        const isCorrect = answered === q.correct;

        if (index < SCORED_QUESTIONS) {
            // Preguntas puntuables (1-100)
            if (!answered) {
                blank++;
            } else if (isCorrect) {
                correct++;
            } else {
                wrong++;
            }
        } else {
            // Preguntas 101-103: solo contamos aciertos como bonus informativo
            if (isCorrect) bonusCorrect++;
        }
    });

    const finalScore = correct - (wrong * 0.5);

    return { correct, wrong, blank, bonusCorrect, finalScore };
}


async function saveResultStats() {
    if (!currentUser || currentUser === 'root' || !currentTestId) return;
    const { finalScore } = calculateScore();
    const PASS_THRESHOLD = 50;
    const passed = finalScore >= PASS_THRESHOLD;
    const testObj = availableTests.find(t => t.id === currentTestId);
    const testName = testObj ? testObj.name : currentTestId;

    try {
        // Update pass/fail counters
        const docId = `${currentUser}_${currentTestId}`;
        const docRef = db.collection('test_results').doc(docId);
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            await docRef.update({
                passes: passed ? (data.passes || 0) + 1 : (data.passes || 0),
                fails: !passed ? (data.fails || 0) + 1 : (data.fails || 0)
            });
        } else {
            await docRef.set({
                user: currentUser,
                testId: currentTestId,
                passes: passed ? 1 : 0,
                fails: !passed ? 1 : 0
            });
        }
        // Save individual score record for stats
        await db.collection('score_records').add({
            user: currentUser,
            testId: currentTestId,
            testName: testName,
            score: finalScore,
            passed: passed,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch(err) {
        console.error('Error guardando resultado', err);
    }
}

async function loadScoreRecords() {
    if (!currentUser || currentUser === 'root') return [];
    const records = [];
    try {
        // No orderBy to avoid requiring a Firestore composite index — sort client-side
        const snap = await db.collection('score_records')
            .where('user', '==', currentUser)
            .get();
        snap.forEach(doc => {
            const d = doc.data();
            records.push({
                testId: d.testId,
                testName: d.testName || d.testId,
                score: d.score,
                passed: d.passed,
                timestamp: d.timestamp ? d.timestamp.toDate() : new Date(0)
            });
        });
        // Sort chronologically client-side
        records.sort((a, b) => a.timestamp - b.timestamp);
    } catch(err) {
        console.error('Error cargando registros de puntuación', err);
    }
    return records;
}

async function loadAllResultStats() {
    if (!currentUser || currentUser === 'root') return new Map();
    const statsMap = new Map();
    try {
        const snapshot = await db.collection('test_results').where('user', '==', currentUser).get();
        snapshot.forEach(doc => {
            const d = doc.data();
            statsMap.set(d.testId, { passes: d.passes || 0, fails: d.fails || 0 });
        });
    } catch(err) {
        console.error('Error cargando resultados', err);
    }
    return statsMap;
}

function showResults() {
    stopTimer();
    const { correct, wrong, blank, bonusCorrect, finalScore } = calculateScore();

    // Rellenar tabla de puntuación
    document.getElementById('score-pts-correct').innerText = correct;
    document.getElementById('score-pts-wrong').innerText = (-wrong * 0.5).toFixed(1);
    document.getElementById('score-final').innerText = finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1);
    document.getElementById('score-bonus').innerText = bonusCorrect;

    // Umbral de aprobado CAP: 50 puntos sobre 100
    const PASS_THRESHOLD = 50;
    const finalRow = document.querySelector('.score-row-total');

    if (finalScore >= PASS_THRESHOLD) {
        statusPassEl.classList.remove('hidden');
        statusFailEl.classList.add('hidden');
        if (finalRow) finalRow.classList.remove('fail');
    } else {
        statusPassEl.classList.add('hidden');
        statusFailEl.classList.remove('hidden');
        if (finalRow) finalRow.classList.add('fail');
    }

    resultModal.classList.remove('hidden');
}

function enterReviewMode() {
    resultModal.classList.add('hidden');
    isReviewMode = true;
    finishBtn.style.display = 'none';
    backMenuBtn.classList.remove('hidden');
    optionsContainer.className = 'options-container'; // remove mode-examen hover effects
    currentQuestionIndex = 0;
    renderQuestion();
}

// --- Screen Transitions ---
function hideAllScreens() {
    loginScreen.classList.add('hidden');
    if (setPasswordScreen) setPasswordScreen.classList.add('hidden');
    backofficeScreen.classList.add('hidden');
    testSelectionScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    appContent.classList.add('hidden');
    resultModal.classList.add('hidden');
    confirmModal.classList.add('hidden');
    pauseModal.classList.add('hidden');
    if (saveResultModal) saveResultModal.classList.add('hidden');
    if (statsScreen) statsScreen.classList.add('hidden');
}

async function showStatsScreen() {
    hideAllScreens();
    if (!statsScreen) return;
    statsScreen.classList.remove('hidden');

    // Check if this user has permission to see the seed data button
    const btnSeedData = document.getElementById('btn-seed-data');
    const btnClearData = document.getElementById('btn-clear-data');
    try {
        const userDoc = await db.collection('users').doc(currentUser).get();
        const canSeeSeed = userDoc.exists && userDoc.data().showSeedBtn === true;
        if (btnSeedData) btnSeedData.style.display = canSeeSeed ? '' : 'none';
        if (btnClearData) btnClearData.style.display = canSeeSeed ? '' : 'none';
    } catch(err) {
        if (btnSeedData) btnSeedData.style.display = 'none';
        if (btnClearData) btnClearData.style.display = 'none';
    }

    // Load data
    allScoreRecords = await loadScoreRecords();

    renderStatsRanking(allScoreRecords);

    // Populate test filter dropdown
    if (chartTestSelect) {
        chartTestSelect.innerHTML = '<option value="all">Todos los exámenes</option>';
        const testsSeen = new Set();
        allScoreRecords.forEach(r => {
            if (!testsSeen.has(r.testId)) {
                testsSeen.add(r.testId);
                const opt = document.createElement('option');
                opt.value = r.testId;
                opt.textContent = r.testName;
                chartTestSelect.appendChild(opt);
            }
        });
    }

    renderStatsChart(allScoreRecords, 'all');
}

function renderStatsRanking(records) {
    const rankList = document.getElementById('stats-ranking-list');
    if (!rankList) return;

    if (records.length === 0) {
        rankList.innerHTML = '<li class="ranking-empty">Aún no has completado ningún examen.<br>Finaliza un test y guarda el resultado para ver tu ranking.</li>';
        return;
    }

    // Best score per test
    const bestByTest = new Map();
    records.forEach(r => {
        const existing = bestByTest.get(r.testId);
        if (!existing || r.score > existing.score) {
            bestByTest.set(r.testId, { testName: r.testName, score: r.score, passed: r.score >= 50 });
        }
    });

    // Sort by best score descending
    const sorted = Array.from(bestByTest.values()).sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];

    rankList.innerHTML = sorted.map((item, i) => {
        const medal = medals[i] || `${i + 1}º`;
        const scoreStr = item.score % 1 === 0 ? item.score : item.score.toFixed(1);
        const passClass = item.passed ? 'rank-pass' : 'rank-fail';
        const statusIcon = item.passed
            ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0A8442"/><path d="M7 13l3.5 3.5L17 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#cc0000"/><line x1="7" y1="7" x2="17" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="17" y1="7" x2="7" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';
        const attempts = records.filter(r => r.testId === (Array.from(bestByTest.keys())[i])).length;
        return `<li class="ranking-item ${passClass}">
            <span class="rank-medal">${medal}</span>
            <div class="rank-info">
                <span class="rank-name">${item.testName}</span>
                <span class="rank-attempts">${attempts} intento${attempts !== 1 ? 's' : ''}</span>
            </div>
            <div class="rank-score-wrap">
                <span class="rank-status-icon">${statusIcon}</span>
                <span class="rank-score">${scoreStr}<small>/100</small></span>
            </div>
        </li>`;
    }).join('');
}

function renderStatsChart(records, filterTestId) {
    const canvas = document.getElementById('stats-chart');
    const noData = document.getElementById('chart-no-data');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let filtered = filterTestId === 'all' ? [...records] : records.filter(r => r.testId === filterTestId);

    if (filtered.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (noData) noData.classList.remove('hidden');
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    if (noData) noData.classList.add('hidden');

    // --- Canvas sizing: grow with data points so labels never overlap ---
    const wrapper = canvas.parentElement;
    const containerW = wrapper.clientWidth - 20 || 600;
    const PAD_L = 54, PAD_R = 24, PAD_T = 24, PAD_B = 58;
    const MIN_PX_PER_POINT = 72;  // minimum pixels between each data point
    const minDataW = filtered.length <= 1 ? 0 : (filtered.length - 1) * MIN_PX_PER_POINT;
    const W = Math.max(containerW, minDataW + PAD_L + PAD_R);
    const H = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const cW = W - PAD_L - PAD_R;
    const cH = H - PAD_T - PAD_B;

    const xPos = i => PAD_L + (filtered.length <= 1 ? cW / 2 : (i / (filtered.length - 1)) * cW);
    const yPos = s => PAD_T + cH - Math.max(0, Math.min(1, s / 100)) * cH;
    const y50 = yPos(50);

    ctx.clearRect(0, 0, W, H);

    // --- Background ---
    // Light green tint above 50
    ctx.fillStyle = 'rgba(10,132,66,0.04)';
    ctx.fillRect(PAD_L, PAD_T, cW, y50 - PAD_T);
    // Light red tint below 50
    ctx.fillStyle = 'rgba(204,0,0,0.04)';
    ctx.fillRect(PAD_L, y50, cW, H - PAD_B - y50);

    // --- Grid lines ---
    for (let y = 0; y <= 100; y += 10) {
        if (y === 50) continue;
        const yp = yPos(y);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(PAD_L, yp); ctx.lineTo(W - PAD_R, yp); ctx.stroke();
    }
    ctx.setLineDash([]);

    // --- Y axis labels ---
    ctx.font = '11px Roboto, sans-serif';
    ctx.textAlign = 'right';
    for (let y = 0; y <= 100; y += 10) {
        const yp = yPos(y);
        if (y === 50) continue;
        ctx.fillStyle = '#ccc';
        ctx.fillText(y, PAD_L - 8, yp + 4);
    }

    // --- Axes ---
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(PAD_L, PAD_T); ctx.lineTo(PAD_L, H - PAD_B); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD_L, H - PAD_B); ctx.lineTo(W - PAD_R, H - PAD_B); ctx.stroke();

    // --- Threshold line at 50 (prominent amber/brown) ---
    ctx.strokeStyle = '#c47a3a';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(PAD_L, y50); ctx.lineTo(W - PAD_R, y50); ctx.stroke();
    // Label for 50 line
    ctx.fillStyle = '#c47a3a';
    ctx.font = 'bold 11px Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('50', PAD_L - 8, y50 + 4);

    if (filtered.length < 2) {
        // Single point
        const x = xPos(0), y = yPos(filtered[0].score);
        const color = filtered[0].score >= 50 ? '#0A8442' : '#cc0000';
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        canvas._points = [{ x, y, record: filtered[0], index: 0 }];
    } else {
        // Build smooth bezier path (Catmull-Rom -> bezier)
        const pts = filtered.map((r, i) => ({ x: xPos(i), y: yPos(r.score) }));

        function buildSmoothPath(ctx, pts) {
            const tension = 0.35;
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[Math.max(0, i - 1)];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[Math.min(pts.length - 1, i + 2)];
                const cp1x = p1.x + (p2.x - p0.x) * tension;
                const cp1y = p1.y + (p2.y - p0.y) * tension;
                const cp2x = p2.x - (p3.x - p1.x) * tension;
                const cp2y = p2.y - (p3.y - p1.y) * tension;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            }
        }

        // Draw GREEN segment (above 50) using clip to upper half
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD_L - 2, PAD_T, cW + 4, y50 - PAD_T);
        ctx.clip();
        ctx.beginPath();
        buildSmoothPath(ctx, pts);
        ctx.strokeStyle = '#0A8442';
        ctx.lineWidth = 2.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        // Area fill green
        ctx.lineTo(pts[pts.length - 1].x, y50);
        ctx.lineTo(pts[0].x, y50);
        ctx.closePath();
        ctx.fillStyle = 'rgba(10,132,66,0.12)';
        ctx.fill();
        ctx.restore();

        // Draw RED segment (below 50) using clip to lower half
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD_L - 2, y50, cW + 4, H - PAD_B - y50 + 2);
        ctx.clip();
        ctx.beginPath();
        buildSmoothPath(ctx, pts);
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 2.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        // Area fill red
        ctx.lineTo(pts[pts.length - 1].x, y50);
        ctx.lineTo(pts[0].x, y50);
        ctx.closePath();
        ctx.fillStyle = 'rgba(204,0,0,0.09)';
        ctx.fill();
        ctx.restore();

        // Draw dots at data points
        canvas._points = filtered.map((r, i) => {
            const x = pts[i].x, y = pts[i].y;
            const color = r.score >= 50 ? '#0A8442' : '#cc0000';
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
            return { x, y, record: r, index: i };
        });
    }

    // --- X axis labels ---
    ctx.font = '10px Roboto, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    filtered.forEach((r, i) => {
        const x = xPos(i);
        const parts = r.testName ? r.testName.split(' ') : ['?', '?'];
        const abbr = (parts[0] || '').substring(0, 3) + ' ' + (parts[1] || '').slice(-2);
        ctx.fillText(abbr, x, H - PAD_B + 16);
        ctx.fillText(`#${i + 1}`, x, H - PAD_B + 28);
    });

    // --- Hover interactivity ---
    const tooltip = document.getElementById('chart-tooltip');
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let found = null, minDist = 22;
        (canvas._points || []).forEach(p => {
            const d = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
            if (d < minDist) { minDist = d; found = p; }
        });
        if (found && tooltip) {
            const scoreStr = found.record.score % 1 === 0 ? found.record.score : found.record.score.toFixed(1);
            tooltip.innerHTML = `<strong>${found.record.testName}</strong><br>
                <span style="color:${found.record.score >= 50 ? '#0A8442' : '#cc0000'}; font-weight:700;">${scoreStr} pts</span>
                &nbsp;${found.record.passed ? '✅ Aprobado' : '❌ Suspenso'}`;
            const tipX = found.x + 14 > W - 120 ? found.x - 130 : found.x + 14;
            tooltip.style.left = tipX + 'px';
            tooltip.style.top = (found.y - 44) + 'px';
            tooltip.classList.remove('hidden');
            canvas.style.cursor = 'crosshair';
        } else {
            if (tooltip) tooltip.classList.add('hidden');
            canvas.style.cursor = 'default';
        }
    };
    canvas.onmouseleave = () => { if (tooltip) tooltip.classList.add('hidden'); };
}



function showLogin() {
    hideAllScreens();
    loginScreen.classList.remove('hidden');
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    loginError.classList.add('hidden');
    if (setPwdError) setPwdError.classList.add('hidden');
    if (newPwdInput) newPwdInput.value = '';
    if (newPwdConfirm) newPwdConfirm.value = '';
}

function showBackoffice() {
    hideAllScreens();
    backofficeScreen.classList.remove('hidden');
    renderUsersList();
}

// --- Auth Logic (Firebase Firestore) ---
async function handleLogin(e) {
    e.preventDefault();
    const user = loginUsernameInput.value.trim().toLowerCase();
    const pass = loginPasswordInput.value.trim();

    if (user === 'root' && pass === '1234') {
        currentUser = 'root';
        localStorage.setItem('cap_current_user', 'root');
        loginError.classList.add('hidden');
        showBackoffice();
        return;
    }

    try {
        const docRef = await db.collection('users').doc(user).get();
        if (docRef.exists) {
            const userData = docRef.data();
            
            // Check if user needs to set password initially
            if (!userData.password || userData.password === "") {
                tempUserForPwd = user;
                tempUserNameForPwd = userData.name;
                setPwdName.textContent = userData.name;
                hideAllScreens();
                setPasswordScreen.classList.remove('hidden');
                return;
            }

            if (userData.password === pass) {
                currentUser = user;
                localStorage.setItem('cap_current_user', user);
                localStorage.setItem('cap_current_user_name', userData.name);
                loginError.classList.add('hidden');
                currentUserNameSpan.textContent = userData.name;
                showTestSelection();
            } else {
                loginError.textContent = "Credenciales incorrectas";
                loginError.classList.remove('hidden');
            }
        } else {
            loginError.textContent = "Alumno no encontrado";
            loginError.classList.remove('hidden');
        }
    } catch(err) {
        console.error("Login err", err);
        loginError.textContent = "Error de conexión";
        loginError.classList.remove('hidden');
    }
}

async function handleSetPassword(e) {
    e.preventDefault();
    const p1 = newPwdInput.value.trim();
    const p2 = newPwdConfirm.value.trim();
    
    if (p1 !== p2) {
        setPwdError.textContent = "Las contraseñas no coinciden";
        setPwdError.classList.remove('hidden');
        return;
    }
    if (!tempUserForPwd) return;

    try {
        await db.collection('users').doc(tempUserForPwd).update({ password: p1 });
        setPwdError.classList.add('hidden');
        
        currentUser = tempUserForPwd;
        localStorage.setItem('cap_current_user', tempUserForPwd);
        localStorage.setItem('cap_current_user_name', tempUserNameForPwd);
        
        currentUserNameSpan.textContent = tempUserNameForPwd;
        showTestSelection();
    } catch(err) {
        console.error("Set password error", err);
        setPwdError.textContent = "Error al guardar contraseña";
        setPwdError.classList.remove('hidden');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('cap_current_user');
    localStorage.removeItem('cap_current_user_name');
    showLogin();
}

async function handleAddUser(e) {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value.trim();
    const user = document.getElementById('new-user-username').value.trim().toLowerCase();
    const pwdInput = document.getElementById('new-user-password');
    let pass = pwdInput.value.trim();
    const noPwd = newUserNoPwd ? newUserNoPwd.checked : false;

    if (!name || !user) return;
    if (!noPwd && !pass) return;
    
    if (noPwd) {
        pass = "";
    }

    try {
        const docRef = await db.collection('users').doc(user).get();
        if (docRef.exists) {
            alert('Ese nombre de usuario ya existe.');
            return;
        }

        await db.collection('users').doc(user).set({ name, password: pass, role: 'student' });

        addUserForm.reset();
        if (newUserNoPwd) {
            newUserNoPwd.checked = false;
            pwdInput.disabled = false;
        }
        addUserMsg.classList.remove('hidden');
        setTimeout(() => addUserMsg.classList.add('hidden'), 3000);
        renderUsersList();
    } catch(err) {
        alert("Error al conectar: " + err.message);
    }
}

async function renderUsersList() {
    usersListUl.innerHTML = '<li>Cargando alumnos...</li>';
    try {
        const snapshot = await db.collection('users').get();
        usersListUl.innerHTML = '';
        if (snapshot.empty) {
            usersListUl.innerHTML = '<li>No hay alumnos registrados.</li>';
            return;
        }
        
        snapshot.forEach(doc => {
            const user = doc.id;
            const data = doc.data();
            if (user === 'root') return;

            const showSeed = data.showSeedBtn === true;
            const cbId = `seed-cb-${user}`;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="user-item-info">
                    <span class="user-item-name">${data.name}</span>
                    <span class="user-item-login">Usuario: ${user}</span>
                </div>
                <div class="user-item-actions">
                    <label class="seed-toggle" title="Mostrar botón 'Datos de prueba' a este alumno">
                        <input type="checkbox" id="${cbId}" ${showSeed ? 'checked' : ''}
                            onchange="toggleSeedBtn('${user}', this.checked)">
                        <span class="seed-toggle-label">Datos prueba</span>
                    </label>
                    <button class="delete-user-btn" onclick="deleteUser('${user}')">Eliminar <i class="fas fa-trash"></i></button>
                </div>
            `;
            usersListUl.appendChild(li);
        });
    } catch(err) {
        usersListUl.innerHTML = '<li>Error al cargar alumnos.</li>';
        console.error(err);
    }
}

window.toggleSeedBtn = async function(user, enabled) {
    try {
        await db.collection('users').doc(user).update({ showSeedBtn: enabled });
    } catch(err) {
        alert('Error al actualizar permiso: ' + err.message);
    }
};

async function deleteUser(user) {
    if (confirm(`¿Seguro que quieres borrar al usuario ${user}?`)) {
        try {
            await db.collection('users').doc(user).delete();
            renderUsersList();
        } catch(err) {
            alert("Error al borrar: " + err.message);
        }
    }
}

// --- Pausing Logic (Firestore) ---
function tryFinishTest() {
    let answeredCount = Object.keys(userAnswers).length;
    let totalQs = questions.length;
    let unanswered = totalQs - answeredCount;

    if (unanswered > 0) {
        unansweredWarning.textContent = `Aún quedan ${unanswered} preguntas sin contestar.`;
        unansweredWarning.style.color = '#cc0000';
    } else {
        unansweredWarning.textContent = `Has contestado todas las preguntas.`;
        unansweredWarning.style.color = '#0A8442';
    }

    confirmModal.classList.remove('hidden');
}

async function saveTestState() {
    if (!currentUser || currentUser === 'root' || !currentTestId || !currentMode) return;
    const docId = `${currentUser}_${currentTestId}_${currentMode}`;
    
    // Convert object states to JSON string to save in Firestore easily without hitting nested limits
    const state = {
        user: currentUser,
        testId: currentTestId,
        mode: currentMode,
        currentQuestionIndex,
        userAnswers: JSON.stringify(userAnswers),
        hasAnswered: JSON.stringify(hasAnswered),
        secondsElapsed
    };
    
    try {
        await db.collection('paused_tests').doc(docId).set(state);
    } catch(err) {
        console.error("Error saving state", err);
    }
}

async function loadTestState(testId, mode) {
    if (!currentUser || currentUser === 'root') return null;
    const docId = `${currentUser}_${testId}_${mode}`;
    
    try {
        const doc = await db.collection('paused_tests').doc(docId).get();
        if (doc.exists) {
            const data = doc.data();
            data.userAnswers = JSON.parse(data.userAnswers || '{}');
            data.hasAnswered = JSON.parse(data.hasAnswered || '{}');
            return data;
        }
    } catch(err) {
        console.error("Error loading state", err);
    }
    return null;
}

async function clearTestState() {
    if (!currentUser || currentUser === 'root' || !currentTestId || !currentMode) return;
    const docId = `${currentUser}_${currentTestId}_${currentMode}`;
    try {
        await db.collection('paused_tests').doc(docId).delete();
    } catch(err) {
        console.error("Error clearing state", err);
    }
}

// --- TEST DATA SEEDING (remove when done testing) ---
async function seedTestData() {
    if (!currentUser || currentUser === 'root') return alert('Inicia sesión como alumno primero.');
    const btn = document.getElementById('btn-seed-data');
    if (btn) { btn.disabled = true; btn.textContent = 'Insertando...'; }

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const mockRecords = [
        // Enero 2024 — 2 intentos (suspenso → aprobado)
        { testId: 'enero_2024', testName: 'Enero 2024', score: 33, passed: false, date: new Date(now - 60 * day) },
        { testId: 'enero_2024', testName: 'Enero 2024', score: 54, passed: true,  date: new Date(now - 50 * day) },
        // Marzo 2024 — 2 intentos (ambos suspensos)
        { testId: 'marzo_2024', testName: 'Marzo 2024', score: 22, passed: false, date: new Date(now - 48 * day) },
        { testId: 'marzo_2024', testName: 'Marzo 2024', score: 40, passed: false, date: new Date(now - 40 * day) },
        // Mayo 2024 — 3 intentos (mejora progresiva)
        { testId: 'mayo_2024', testName: 'Mayo 2024', score: 44, passed: false, date: new Date(now - 38 * day) },
        { testId: 'mayo_2024', testName: 'Mayo 2024', score: 55, passed: true,  date: new Date(now - 30 * day) },
        { testId: 'mayo_2024', testName: 'Mayo 2024', score: 67, passed: true,  date: new Date(now - 22 * day) },
        // Julio 2024 — 1 intento excelente
        { testId: 'julio_2024', testName: 'Julio 2024', score: 88, passed: true, date: new Date(now - 20 * day) },
        // Septiembre 2024 — 1 intento suspenso
        { testId: 'septiembre_2024', testName: 'Septiembre 2024', score: 31, passed: false, date: new Date(now - 18 * day) },
        // Noviembre 2024 — 2 intentos aprobados
        { testId: 'noviembre_2024', testName: 'Noviembre 2024', score: 65, passed: true, date: new Date(now - 15 * day) },
        { testId: 'noviembre_2024', testName: 'Noviembre 2024', score: 72, passed: true, date: new Date(now - 10 * day) },
        // Enero 2025 — 1 intento rozando el suspenso
        { testId: 'enero_2025', testName: 'Enero 2025', score: 48, passed: false, date: new Date(now - 8 * day) },
        // Marzo 2025 — 2 intentos (suspenso → aprobado justo)
        { testId: 'marzo_2025', testName: 'Marzo 2025', score: 43, passed: false, date: new Date(now - 6 * day) },
        { testId: 'marzo_2025', testName: 'Marzo 2025', score: 51, passed: true,  date: new Date(now - 3 * day) },
        // Mayo 2025 — 1 intento muy alto
        { testId: 'mayo_2025', testName: 'Mayo 2025', score: 79, passed: true,  date: new Date(now - 1 * day) },
    ];

    try {
        const batch = db.batch();
        // Also update test_results counters
        const counters = {};
        mockRecords.forEach(r => {
            const ref = db.collection('score_records').doc();
            batch.set(ref, {
                user: currentUser,
                testId: r.testId,
                testName: r.testName,
                score: r.score,
                passed: r.passed,
                timestamp: firebase.firestore.Timestamp.fromDate(r.date)
            });
            if (!counters[r.testId]) counters[r.testId] = { passes: 0, fails: 0 };
            r.passed ? counters[r.testId].passes++ : counters[r.testId].fails++;
        });
        await batch.commit();

        // Update test_results
        for (const [testId, counts] of Object.entries(counters)) {
            const docId = `${currentUser}_${testId}`;
            const docRef = db.collection('test_results').doc(docId);
            const existing = await docRef.get();
            if (existing.exists) {
                await docRef.update({ passes: (existing.data().passes || 0) + counts.passes, fails: (existing.data().fails || 0) + counts.fails });
            } else {
                await docRef.set({ user: currentUser, testId, passes: counts.passes, fails: counts.fails });
            }
        }

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-flask"></i> Datos de prueba'; }
        // Refresh stats
        await showStatsScreen();
    } catch(err) {
        console.error('Error seeding data', err);
        alert('Error: ' + err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-flask"></i> Datos de prueba'; }
    }
}

async function clearTestData() {
    if (!currentUser || currentUser === 'root') return;
    if (!confirm('¿Eliminar TODOS los datos de estadísticas de tu cuenta?')) return;
    const btn = document.getElementById('btn-clear-data');
    if (btn) { btn.disabled = true; btn.textContent = 'Borrando...'; }

    try {
        // Delete score_records
        const snap = await db.collection('score_records').where('user', '==', currentUser).get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Delete test_results
        const snap2 = await db.collection('test_results').where('user', '==', currentUser).get();
        const batch2 = db.batch();
        snap2.forEach(doc => batch2.delete(doc.ref));
        await batch2.commit();

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash"></i> Borrar datos'; }
        await showStatsScreen();
    } catch(err) {
        console.error('Error clearing data', err);
        alert('Error: ' + err.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash"></i> Borrar datos'; }
    }
}

// Start
init();
