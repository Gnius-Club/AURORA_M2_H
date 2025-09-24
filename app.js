// A.U.R.O.R.A. Mission 2: Energy Optimization Protocol
// Strategic Resource Management Game

class AuroraGame {
    constructor() {
        // Game configuration
        this.config = {
            gridSize: 15,
            startPosition: { x: 0, y: 14 },
            startEnergy: 100,
            objectives: [
                { type: "muestra", id: "S1", symbol: "S1", x: 4, y: 10 },
                { type: "muestra", id: "S2", symbol: "S2", x: 11, y: 6 },
                { type: "mapeo", id: "M1", symbol: "M1", x: 7, y: 8 },
                { type: "mapeo", id: "M2", symbol: "M2", x: 2, y: 3 },
                { type: "recarga", symbol: "⚡", x: 8, y: 2 },
                { type: "extraccion", symbol: "E", x: 14, y: 0 }
            ],
            hiddenTerrain: [
                { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 },
                { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 },
                { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
                { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
                { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }
            ],
            commands: [
                { id: "avanzar", name: "avanzar(pasos)", hasParam: true, paramType: "number", energyCost: 3 },
                { id: "girar", name: "girar(direccion)", hasParam: true, paramType: "text", energyCost: 1 },
                { id: "recogerMuestra", name: "recogerMuestra(id)", hasParam: true, paramType: "text", energyCost: 5 },
                { id: "mapearTerreno", name: "mapearTerreno(id)", hasParam: true, paramType: "text", energyCost: 4 },
                { id: "recargarEnergia", name: "recargarEnergia()", hasParam: false, energyCost: -40 },
                { id: "enviarReporte", name: "enviarReporte()", hasParam: false, energyCost: 2 }
            ]
        };

        // Game state
        this.gameState = {
            energy: this.config.startEnergy,
            position: { ...this.config.startPosition },
            direction: 'north',
            completedObjectives: new Set(),
            commandSequence: [],
            isExecuting: false,
            missionStartTime: Date.now(),
            mappedTerrain: new Set(),
            timerInterval: null
        };

        // Tutorial state
        this.tutorialState = {
            isActive: false,
            currentStep: 0,
            steps: [
                {
                    title: "Misión Final: Protocolo de Optimización Energética",
                    description: "Ingeniero/a Jefe, la supervivencia de A.U.R.O.R.A. depende de tu eficiencia. Tu misión: completa todos los objetivos antes de que la energía llegue a cero.",
                    highlight: "header"
                },
                {
                    title: "¡ATENCIÓN! Restricción Energética",
                    description: "Esta es tu restricción principal. Cada acción consume energía. Si llega a cero, la misión fracasa. Debes planificar con cuidado extremo.",
                    highlight: "energy-panel"
                },
                {
                    title: "Análisis de Costes Energéticos",
                    description: "Estudia el coste de cada comando. Planificar con eficiencia es la única forma de tener éxito. Memoriza estos valores.",
                    highlight: "cost-analysis"
                },
                {
                    title: "Estación de Recarga Solar",
                    description: "Usa las estaciones de recarga (⚡) para reponer energía, pero recuerda: ¡llegar a ellas también tiene un coste! Planifica tu ruta estratégicamente.",
                    highlight: "tactical-map"
                },
                {
                    title: "Lista de Objetivos Críticos",
                    description: "Debes completar TODAS estas tareas y llegar al punto de extracción. El orden en que lo hagas determinará tu éxito o fracaso.",
                    highlight: "objectives-panel"
                },
                {
                    title: "Interfaz Adaptativa",
                    description: "En dispositivos móviles, el panel de diagnóstico y el secuenciador estarán debajo del mapa para un control total sobre tu estrategia.",
                    highlight: "main-content"
                },
                {
                    title: "¡ENTENDIDO, A PLANIFICAR!",
                    description: "Ahora tienes el control total. Planifica cada movimiento. El destino de A.U.R.O.R.A. está en tus manos.",
                    highlight: "sequencer-panel"
                }
            ]
        };

        // Audio context for sound effects
        this.audioContext = null;
        this.sounds = {};

        // Store pending command for parameter modal
        this.pendingCommand = null;

        // Initialize game
        this.init();
    }

    init() {
        this.initAudio();
        this.initDOM();
        this.createTacticalMap();
        this.createCommandBank();
        this.createObjectivesList();
        this.updateEnergyBar();
        this.startMissionTimer();
        this.setupDragAndDrop();
        this.setupEventListeners();
        
        setTimeout(() => this.startTutorial(), 500);
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    createSounds() {
        if (!this.audioContext) return;
        this.sounds.uiClick = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        this.sounds.commandExec = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        this.sounds.lowPowerAlert = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
        this.sounds.successFanfare = () => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                }, i * 200);
            });
        };
        this.sounds.powerDownFailure = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 2);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 2);
        };
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            try {
                if (this.audioContext?.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.sounds[soundName]();
            } catch (e) {
                console.warn('Sound playback failed:', e);
            }
        }
    }

    initDOM() {
        this.elements = {
            tacticalGrid: document.getElementById('tactical-grid'),
            commandBank: document.getElementById('command-bank'),
            operationSequence: document.getElementById('operation-sequence'),
            energyFill: document.getElementById('energy-fill'),
            energyPercentage: document.getElementById('energy-percentage'),
            objectivesList: document.getElementById('objectives-list'),
            executePlan: document.getElementById('execute-plan'),
            clearSequence: document.getElementById('clear-sequence'),
            missionTimer: document.getElementById('mission-timer'),
            tutorialModal: document.getElementById('tutorial-modal'),
            successModal: document.getElementById('success-modal'),
            failureModal: document.getElementById('failure-modal'),
            parameterModal: document.getElementById('parameter-modal'),
            tutorialTitle: document.getElementById('tutorial-title'),
            tutorialDescription: document.getElementById('tutorial-description'),
            tutorialStep: document.getElementById('tutorial-step'),
            tutorialTotal: document.getElementById('tutorial-total'),
            tutorialPrev: document.getElementById('tutorial-prev'),
            tutorialNext: document.getElementById('tutorial-next'),
            parameterTitle: document.getElementById('parameter-title'),
            parameterLabel: document.getElementById('parameter-label'),
            parameterInput: document.getElementById('parameter-input'),
            parameterHelp: document.getElementById('parameter-help'),
            parameterCancel: document.getElementById('parameter-cancel'),
            parameterConfirm: document.getElementById('parameter-confirm')
        };
    }

    createTacticalMap() {
        const grid = this.elements.tacticalGrid;
        grid.innerHTML = '';
        for (let y = 0; y < this.config.gridSize; y++) {
            for (let x = 0; x < this.config.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                const objective = this.config.objectives.find(obj => obj.x === x && obj.y === y);
                if (objective) {
                    cell.classList.add('has-objective');
                    cell.textContent = objective.symbol;
                }
                const isHidden = this.config.hiddenTerrain.some(terrain => terrain.x === x && terrain.y === y);
                if (isHidden) {
                    cell.classList.add('hidden-terrain');
                    cell.title = 'Terrain must be mapped first';
                }
                if (x === this.gameState.position.x && y === this.gameState.position.y) {
                    cell.classList.add('rover-position');
                    cell.textContent = 'R';
                }
                grid.appendChild(cell);
            }
        }
    }

    createCommandBank() {
        const bank = this.elements.commandBank;
        bank.innerHTML = '';
        this.config.commands.forEach(command => {
            const block = document.createElement('div');
            block.className = 'command-block';
            block.draggable = true;
            block.dataset.commandId = command.id;
            block.textContent = command.name;
            block.addEventListener('dragstart', this.handleDragStart.bind(this));
            block.addEventListener('click', () => this.playSound('uiClick'));
            bank.appendChild(block);
        });
    }

    createObjectivesList() {
        const list = this.elements.objectivesList;
        list.innerHTML = '';
        const missionObjectives = [
            { id: 'collect-s1', text: 'Recolectar Muestra S1' },
            { id: 'collect-s2', text: 'Recolectar Muestra S2' },
            { id: 'map-m1', text: 'Mapear Zona M1' },
            { id: 'map-m2', text: 'Mapear Zona M2' },
            { id: 'reach-extraction', text: 'Llegar al Punto de Extracción' }
        ];
        missionObjectives.forEach(objective => {
            const item = document.createElement('div');
            item.className = 'objective-item';
            item.dataset.objectiveId = objective.id;
            const checkbox = document.createElement('div');
            checkbox.className = 'objective-checkbox';
            const text = document.createElement('span');
            text.textContent = objective.text;
            item.appendChild(checkbox);
            item.appendChild(text);
            list.appendChild(item);
        });
    }

    setupDragAndDrop() {
        const dropZone = this.elements.operationSequence;
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.commandId);
        e.target.classList.add('dragging');
        this.playSound('uiClick');
    }

    handleSequenceDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.target.classList.add('dragging');
        this.playSound('uiClick');
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const data = e.dataTransfer.getData('text/plain');
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        const commandFromBank = this.config.commands.find(cmd => cmd.id === data);
        if (commandFromBank) {
            this.addCommandToSequence(commandFromBank);
        } else {
            const draggedElement = document.querySelector(`[data-id="${data}"]`);
            if (!draggedElement) return;
            const dropZone = this.elements.operationSequence.querySelector('.sequence-commands');
            if (!dropZone) return;
            const afterElement = this.getDragAfterElement(dropZone, e.clientY);
            if (afterElement == null) {
                dropZone.appendChild(draggedElement);
            } else {
                dropZone.insertBefore(draggedElement, afterElement);
            }
            this.updateSequenceArray();
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sequence-command:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addCommandToSequence(command) {
        if (command.hasParam) {
            this.showParameterModal(command);
        } else {
            this.insertCommand(command, null);
        }
    }

    showParameterModal(command) {
        const modal = this.elements.parameterModal;
        const title = this.elements.parameterTitle;
        const label = this.elements.parameterLabel;
        const input = this.elements.parameterInput;
        const help = this.elements.parameterHelp;
        title.textContent = `Configurar: ${command.name}`;
        switch (command.id) {
            case 'avanzar':
                label.textContent = 'Número de pasos:';
                input.placeholder = '1'; input.type = 'number'; input.min = '1'; input.max = '10';
                help.textContent = 'Ingresa cuántos pasos debe avanzar el rover (1-10)';
                break;
            case 'girar':
                label.textContent = 'Dirección:';
                input.placeholder = 'izquierda o derecha'; input.type = 'text';
                help.textContent = 'Escribe "izquierda" o "derecha"';
                break;
            case 'recogerMuestra':
                label.textContent = 'ID de la muestra:';
                input.placeholder = 'S1 o S2'; input.type = 'text';
                help.textContent = 'Especifica qué muestra recoger: S1 o S2';
                break;
            case 'mapearTerreno':
                label.textContent = 'ID de la zona:';
                input.placeholder = 'M1 o M2'; input.type = 'text';
                help.textContent = 'Especifica qué zona mapear: M1 o M2';
                break;
        }
        input.value = '';
        modal.classList.remove('hidden');
        input.focus();
        this.pendingCommand = command;
    }

    insertCommand(command, parameter) {
        const sequenceContainer = this.elements.operationSequence;
        const placeholder = sequenceContainer.querySelector('.drop-zone__placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        let commandsContainer = sequenceContainer.querySelector('.sequence-commands');
        if (!commandsContainer) {
            commandsContainer = document.createElement('div');
            commandsContainer.className = 'sequence-commands';
            sequenceContainer.appendChild(commandsContainer);
        }
        const commandElement = document.createElement('div');
        commandElement.className = 'sequence-command';
        commandElement.draggable = true;
        const uniqueId = `seq-cmd-${Date.now()}-${Math.random()}`;
        commandElement.dataset.id = uniqueId;
        commandElement.addEventListener('dragstart', this.handleSequenceDragStart.bind(this));
        const commandText = document.createElement('span');
        commandText.className = 'command-text';
        commandText.textContent = command.name;
        commandElement.appendChild(commandText);
        if (parameter !== null) {
            const paramElement = document.createElement('span');
            paramElement.className = 'command-parameter';
            paramElement.textContent = parameter;
            commandElement.appendChild(paramElement);
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'command-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Eliminar comando';
        removeBtn.addEventListener('click', () => {
            commandElement.remove();
            this.updateSequenceArray();
            this.playSound('uiClick');
            if (commandsContainer.children.length === 0) {
                const placeholder = document.createElement('div');
                placeholder.className = 'drop-zone__placeholder';
                placeholder.textContent = 'Arrastra comandos aquí para crear tu secuencia';
                sequenceContainer.appendChild(placeholder);
                commandsContainer.remove();
            }
        });
        commandElement.appendChild(removeBtn);
        commandsContainer.appendChild(commandElement);
        this.updateSequenceArray();
        this.playSound('uiClick');
    }

    updateSequenceArray() {
        const commandElements = document.querySelectorAll('.sequence-command');
        const newSequence = [];
        commandElements.forEach(element => {
            const commandText = element.querySelector('.command-text').textContent;
            const command = this.config.commands.find(cmd => cmd.name === commandText);
            const paramElement = element.querySelector('.command-parameter');
            const parameter = paramElement ? paramElement.textContent : null;
            newSequence.push({ command: command, parameter: parameter });
        });
        this.gameState.commandSequence = newSequence;
    }

    setupEventListeners() {
        this.elements.executePlan.addEventListener('click', () => {
            if (!this.gameState.isExecuting && this.gameState.commandSequence.length > 0) {
                this.executeSequence();
            }
        });
        this.elements.clearSequence.addEventListener('click', () => this.clearCommandSequence());
        this.elements.tutorialNext.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.nextTutorialStep(); });
        this.elements.tutorialPrev.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.prevTutorialStep(); });
        this.elements.parameterConfirm.addEventListener('click', () => this.confirmParameter());
        this.elements.parameterCancel.addEventListener('click', () => this.cancelParameter());
        this.elements.parameterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirmParameter();
            else if (e.key === 'Escape') this.cancelParameter();
        });
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        document.getElementById('retry-mission').addEventListener('click', () => this.restartGame());
        
        // CAMBIO: Añadido listener para el nuevo botón
        document.getElementById('download-screenshot').addEventListener('click', () => this.downloadCertificate());

        document.querySelectorAll('.modal__backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    const modal = backdrop.closest('.modal');
                    if (modal.id !== 'tutorial-modal') modal.classList.add('hidden');
                }
            });
        });
        document.querySelectorAll('.btn, .command-block').forEach(element => {
            element.addEventListener('click', () => this.playSound('uiClick'));
        });
        document.addEventListener('keydown', (e) => {
            if (this.tutorialState.isActive && this.elements.tutorialModal && !this.elements.tutorialModal.classList.contains('hidden')) {
                if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); this.nextTutorialStep(); }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prevTutorialStep(); }
            }
        });
    }

    clearCommandSequence() {
        const sequenceContainer = this.elements.operationSequence;
        const commandsContainer = sequenceContainer.querySelector('.sequence-commands');
        if (commandsContainer) {
            commandsContainer.remove();
        }
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-zone__placeholder';
        placeholder.textContent = 'Arrastra comandos aquí para crear tu secuencia';
        sequenceContainer.appendChild(placeholder);
        this.gameState.commandSequence = [];
        this.playSound('uiClick');
    }

    confirmParameter() {
        const input = this.elements.parameterInput;
        const value = input.value.trim();
        if (this.validateParameter(this.pendingCommand, value)) {
            this.insertCommand(this.pendingCommand, value);
            this.elements.parameterModal.classList.add('hidden');
            this.pendingCommand = null;
        } else {
            input.style.borderColor = 'var(--color-terminal-error)';
            setTimeout(() => { input.style.borderColor = ''; }, 1000);
        }
    }

    cancelParameter() {
        this.elements.parameterModal.classList.add('hidden');
        this.pendingCommand = null;
    }

    validateParameter(command, value) {
        switch (command.id) {
            case 'avanzar':
                const steps = parseInt(value);
                return !isNaN(steps) && steps >= 1 && steps <= 10;
            case 'girar': return value.toLowerCase() === 'izquierda' || value.toLowerCase() === 'derecha';
            case 'recogerMuestra': return value.toUpperCase() === 'S1' || value.toUpperCase() === 'S2';
            case 'mapearTerreno': return value.toUpperCase() === 'M1' || value.toUpperCase() === 'M2';
            default: return true;
        }
    }

    async executeSequence() {
        if (this.gameState.isExecuting) return;

        this.gameState.isExecuting = true;
        this.elements.executePlan.disabled = true;
        this.elements.executePlan.textContent = '[ EJECUTANDO... ]';

        this.gameState.energy = this.config.startEnergy;
        this.gameState.position = { ...this.config.startPosition };
        this.gameState.direction = 'north';
        this.gameState.completedObjectives.clear();
        this.gameState.mappedTerrain.clear();
        
        this.updateEnergyBar();
        this.createObjectivesList();
        this.createTacticalMap();
        
        await this.delay(200);

        for (let i = 0; i < this.gameState.commandSequence.length; i++) {
            const { command, parameter } = this.gameState.commandSequence[i];
            const commandElements = document.querySelectorAll('.sequence-command');
            if (commandElements[i]) {
                commandElements[i].classList.add('executing');
                setTimeout(() => commandElements[i].classList.remove('executing'), 500);
            }
            await this.executeCommand(command, parameter);
            if (this.gameState.energy <= 0) {
                this.showFailure(); 
                return;
            }
            await this.delay(300);
        }

        if (this.checkWinCondition()) {
            this.showSuccess();
        } else {
            this.gameState.isExecuting = false;
            this.elements.executePlan.disabled = false;
            this.elements.executePlan.textContent = '[ SIMULAR Y EJECUTAR PLAN ]';
        }
    }

    async executeCommand(command, parameter) {
        this.playSound('commandExec');
        switch (command.id) {
            case 'avanzar':
                const steps = parseInt(parameter);
                for (let i = 0; i < steps; i++) {
                    this.moveRover();
                    this.consumeEnergy(command.energyCost);
                    await this.delay(200);
                    if (this.gameState.energy <= 0) break;
                }
                break;
            case 'girar':
                this.rotateRover(parameter);
                this.consumeEnergy(command.energyCost);
                break;
            case 'recogerMuestra':
                if (this.collectSample(parameter)) this.consumeEnergy(command.energyCost);
                break;
            case 'mapearTerreno':
                if (this.mapTerrain(parameter)) this.consumeEnergy(command.energyCost);
                break;
            case 'recargarEnergia':
                if (this.rechargeEnergy()) {
                    this.gameState.energy = Math.min(100, this.gameState.energy - command.energyCost);
                    this.updateEnergyBar();
                }
                break;
            case 'enviarReporte': this.consumeEnergy(command.energyCost); break;
        }
    }

    moveRover() {
        const { x, y } = this.gameState.position;
        let newX = x, newY = y;
        switch (this.gameState.direction) {
            case 'north': newY = Math.max(0, y - 1); break;
            case 'south': newY = Math.min(this.config.gridSize - 1, y + 1); break;
            case 'east': newX = Math.min(this.config.gridSize - 1, x + 1); break;
            case 'west': newX = Math.max(0, x - 1); break;
        }
        this.gameState.position = { x: newX, y: newY };
        this.updateRoverPosition();
    }

    rotateRover(direction) {
        const directions = ['north', 'east', 'south', 'west'];
        const currentIndex = directions.indexOf(this.gameState.direction);
        if (direction.toLowerCase() === 'derecha') {
            this.gameState.direction = directions[(currentIndex + 1) % 4];
        } else if (direction.toLowerCase() === 'izquierda') {
            this.gameState.direction = directions[(currentIndex + 3) % 4];
        }
    }

    collectSample(sampleId) {
        const sample = this.config.objectives.find(obj => obj.type === 'muestra' && obj.id === sampleId.toUpperCase());
        if (sample && sample.x === this.gameState.position.x && sample.y === this.gameState.position.y) {
            this.gameState.completedObjectives.add(`collect-${sampleId.toLowerCase()}`);
            this.updateObjectivesList();
            
            const cell = document.querySelector(`[data-x="${sample.x}"][data-y="${sample.y}"]`);
            if (cell) {
                cell.textContent = 'R'; 
                cell.classList.remove('has-objective');
            }

            return true;
        }
        return false;
    }

    mapTerrain(zoneId) {
        const zone = this.config.objectives.find(obj => obj.type === 'mapeo' && obj.id === zoneId.toUpperCase());
        if (zone && zone.x === this.gameState.position.x && zone.y === this.gameState.position.y) {
            this.gameState.completedObjectives.add(`map-${zoneId.toLowerCase()}`);
            this.updateObjectivesList();

            const cell = document.querySelector(`[data-x="${zone.x}"][data-y="${zone.y}"]`);
            if (cell) {
                cell.textContent = 'R'; 
                cell.classList.remove('has-objective');
            }

            return true;
        }
        return false;
    }

    rechargeEnergy() {
        const station = this.config.objectives.find(obj => obj.type === 'recarga');
        return (station && station.x === this.gameState.position.x && station.y === this.gameState.position.y);
    }

    consumeEnergy(cost) {
        this.gameState.energy = Math.max(0, this.gameState.energy - cost);
        this.updateEnergyBar();
        if (this.gameState.energy <= 20 && this.gameState.energy > 0) {
            this.playSound('lowPowerAlert');
        }
    }

    updateRoverPosition() {
        document.querySelectorAll('.grid-cell.rover-position').forEach(cell => {
            cell.classList.remove('rover-position');
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const objective = this.config.objectives.find(obj => obj.x === x && obj.y === y);
    
            let isCompleted = false;
            if (objective && objective.id) {
                isCompleted = this.gameState.completedObjectives.has(`collect-${objective.id.toLowerCase()}`) ||
                              this.gameState.completedObjectives.has(`map-${objective.id.toLowerCase()}`);
            }
    
            cell.textContent = (objective && !isCompleted) ? objective.symbol : '';
        });
    
        const currentCell = document.querySelector(`[data-x="${this.gameState.position.x}"][data-y="${this.gameState.position.y}"]`);
        if (currentCell) {
            currentCell.classList.add('rover-position');
            currentCell.textContent = 'R';
        }
    }

    updateEnergyBar() {
        this.elements.energyFill.style.height = `${this.gameState.energy}%`;
        this.elements.energyPercentage.textContent = `${this.gameState.energy}%`;
        this.elements.energyFill.classList.toggle('low', this.gameState.energy <= 20);
    }

    updateObjectivesList() {
        this.gameState.completedObjectives.forEach(objectiveId => {
            const item = document.querySelector(`[data-objective-id="${objectiveId}"]`);
            if (item) {
                item.classList.add('completed');
                item.querySelector('.objective-checkbox').classList.add('checked');
            }
        });
    }

    checkWinCondition() {
        const extractionPoint = this.config.objectives.find(obj => obj.type === 'extraccion');
        const atExtraction = (extractionPoint.x === this.gameState.position.x && extractionPoint.y === this.gameState.position.y);
        const requiredObjectives = ['collect-s1', 'collect-s2', 'map-m1', 'map-m2'];
        const allObjectivesComplete = requiredObjectives.every(obj => this.gameState.completedObjectives.has(obj));
        if (atExtraction && allObjectivesComplete) {
            this.gameState.completedObjectives.add('reach-extraction');
            this.updateObjectivesList();
            return true;
        }
        return false;
    }

    showSuccess() {
        this.playSound('successFanfare');
        
        // CAMBIO: Capturar el tiempo final ANTES de detener el intervalo
        const finalTime = this.elements.missionTimer.textContent;
        clearInterval(this.gameState.timerInterval);
        
        const modal = this.elements.successModal;
        document.getElementById('final-efficiency').textContent = `${this.gameState.energy}%`;
        
        // CAMBIO: Mostrar el tiempo final en el nuevo elemento
        document.getElementById('final-mission-time').textContent = finalTime;
        
        const successText = "Lo has conseguido, Cadete. La secuencia es perfecta. A.U.R.O.R.A. ha ejecutado las órdenes sin fallos, ha recolectado la muestra de hielo y ahora se dirige a la zona segura para transmitir su análisis. Los datos que acaba de enviar cambiarán el futuro de la exploración espacial.\n\nHoy no solo has salvado un rover de mil millones de dólares. Has demostrado tener la mente analítica, la paciencia y la resolución de problemas de un verdadero/a ingeniero/a. Has convertido el caos en orden y el fracaso en un éxito histórico. La Academia y el mundo te dan las gracias. Misión cumplida.";
        this.typeWriter(document.getElementById('success-message'), successText, 30);
        modal.classList.remove('hidden');
        
        this.gameState.isExecuting = false;
        this.elements.executePlan.disabled = false;
        this.elements.executePlan.textContent = '[ SIMULAR Y EJECUTAR PLAN ]';
    }

    showFailure() {
        this.playSound('powerDownFailure');
        
        // CAMBIO: El timer ya NO se detiene al fallar
        // clearInterval(this.gameState.timerInterval);
        
        const modal = this.elements.failureModal;
        modal.querySelector('#failure-message').textContent = "¡La perdimos! La energía se agotó. A.U.R.O.R.A. ha entrado en modo de hibernación de emergencia. Revisa tu ruta y la gestión de la recarga. Un verdadero ingeniero aprende de cada fallo.";
        modal.classList.remove('hidden');
        this.gameState.isExecuting = false;
        this.elements.executePlan.disabled = false;
        this.elements.executePlan.textContent = '[ SIMULAR Y EJECUTAR PLAN ]';
    }

    typeWriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i); i++;
                setTimeout(type, speed);
            }
        };
        type();
    }

    startTutorial() { this.tutorialState.isActive = true; this.tutorialState.currentStep = 0; this.showTutorialStep(); }
    showTutorialStep() {
        const step = this.tutorialState.steps[this.tutorialState.currentStep];
        this.elements.tutorialTitle.textContent = step.title;
        this.elements.tutorialDescription.textContent = step.description;
        this.elements.tutorialStep.textContent = this.tutorialState.currentStep + 1;
        this.elements.tutorialTotal.textContent = this.tutorialState.steps.length;
        this.elements.tutorialPrev.disabled = this.tutorialState.currentStep === 0;
        this.elements.tutorialNext.textContent = this.tutorialState.currentStep === this.tutorialState.steps.length - 1 ? 'COMENZAR' : 'SIGUIENTE';
        this.clearHighlights();
        if (step.highlight) document.getElementById(step.highlight)?.classList.add('tutorial-highlight');
        this.elements.tutorialModal.classList.remove('hidden');
        this.playSound('uiClick');
    }
    nextTutorialStep() {
        this.playSound('uiClick');
        if (this.tutorialState.currentStep < this.tutorialState.steps.length - 1) {
            this.tutorialState.currentStep++;
            this.showTutorialStep();
        } else {
            this.endTutorial();
        }
    }
    prevTutorialStep() {
        this.playSound('uiClick');
        if (this.tutorialState.currentStep > 0) {
            this.tutorialState.currentStep--;
            this.showTutorialStep();
        }
    }
    endTutorial() {
        this.elements.tutorialModal.classList.add('hidden');
        this.clearHighlights();
        this.tutorialState.isActive = false;
        this.playSound('uiClick');
    }
    clearHighlights() { document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight')); }

    startMissionTimer() {
        if (this.gameState.timerInterval) clearInterval(this.gameState.timerInterval);
        this.gameState.missionStartTime = Date.now(); // Asegurarse de que el tiempo de inicio se reinicie
        this.gameState.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.gameState.missionStartTime;
            const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
            const milliseconds = (elapsed % 1000).toString().padStart(3, '0');
            this.elements.missionTimer.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
        }, 79);
    }

    restartGame() {
        if (this.gameState.timerInterval) clearInterval(this.gameState.timerInterval);
        this.gameState = {
            energy: this.config.startEnergy,
            position: { ...this.config.startPosition },
            direction: 'north',
            completedObjectives: new Set(),
            commandSequence: [],
            isExecuting: false,
            missionStartTime: Date.now(),
            mappedTerrain: new Set(),
            timerInterval: null
        };
        this.clearCommandSequence();
        this.updateEnergyBar();
        this.createTacticalMap(); 
        this.createObjectivesList();
        this.startMissionTimer();
        this.elements.executePlan.disabled = false;
        this.elements.executePlan.textContent = '[ SIMULAR Y EJECUTAR PLAN ]';
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        this.playSound('uiClick');
    }

    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    // CAMBIO: Nueva función para manejar la descarga del certificado
    downloadCertificate() {
        const certificateNode = document.getElementById('success-certificate');
        const downloadButton = document.getElementById('download-screenshot');
        
        // Ocultar temporalmente el botón para que no salga en la captura
        downloadButton.style.visibility = 'hidden';

        html2canvas(certificateNode, {
            backgroundColor: 'rgba(10, 25, 35, 1)', // Fondo similar al del juego
            useCORS: true // Para fuentes externas si las hubiera
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'AURORA-Mision-Cumplida.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Volver a mostrar el botón
            downloadButton.style.visibility = 'visible';
        }).catch(err => {
            console.error('Error al generar la captura:', err);
            // Asegurarse de que el botón vuelva a ser visible incluso si hay un error
            downloadButton.style.visibility = 'visible';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auroraGame = new AuroraGame();
});
