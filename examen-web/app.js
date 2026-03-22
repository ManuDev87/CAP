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
    { id: 'enero_2024', name: 'Enero 2024', img: 'truck1.jpg' },
    { id: 'marzo_2024', name: 'Marzo 2024', img: 'truck2.jpg' },
    { id: 'mayo_2024', name: 'Mayo 2024', img: 'truck3.jpg' },
    { id: 'julio_2024', name: 'Julio 2024', img: 'truck4.jpg' },
    { id: 'septiembre_2024', name: 'Septiembre 2024', img: 'truck1.jpg' },
    { id: 'noviembre_2024', name: 'Noviembre 2024', img: 'truck2.jpg' },
    { id: 'enero_2025', name: 'Enero 2025', img: 'truck3.jpg' },
    { id: 'marzo_2025', name: 'Marzo 2025', img: 'truck4.jpg' },
    { id: 'mayo_2025', name: 'Mayo 2025', img: 'truck1.jpg' },
    { id: 'julio_2025', name: 'Julio 2025', img: 'truck2.jpg' },
    { id: 'septiembre_2025', name: 'Septiembre 2025', img: 'truck3.jpg' },
    { id: 'noviembre_2025', name: 'Noviembre 2025', img: 'truck4.jpg' },
    { id: 'enero_2026', name: 'Enero 2026', img: 'truck1.jpg' },
    { id: 'marzo_2026', name: 'Marzo 2026', img: 'truck2.jpg' }
];

const testPdfUrls = {
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
    restartBtn.addEventListener('click', showStartScreen);
    backMenuBtn.addEventListener('click', showStartScreen);

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

        let pauseHtml = '';
        let labelAddon = '';
        const pausedMode = pausedTests.get(test.id);
        
        if (pausedMode) {
            pauseHtml = `
            <div class="paused-indicator">
                <div class="paused-bar"></div>
                <div class="paused-bar"></div>
            </div>`;
        }

        card.innerHTML = `
            ${pauseHtml}
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

    if (id === 'enero_2024') {
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
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="user-item-info">
                    <span class="user-item-name">${data.name}</span>
                    <span class="user-item-login">Usuario: ${user}</span>
                </div>
                <button class="delete-user-btn" onclick="deleteUser('${user}')">Eliminar <i class="fas fa-trash"></i></button>
            `;
            usersListUl.appendChild(li);
        });
    } catch(err) {
        usersListUl.innerHTML = '<li>Error al cargar alumnos.</li>';
        console.error(err);
    }
}

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

// Start
init();
