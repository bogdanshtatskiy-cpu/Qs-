const Game = {
    // Состояние игры
    state: {
        hero: {
            name: "Безымянный",
            class: "Нет",
            lvl: 1,
            hp: 100, maxHp: 100,
            stats: { strength: 5, agility: 5, intellect: 5, charisma: 5 },
            inventory: [],
            reputation: {}
        },
        story: {
            chapter: "prologue",
            sceneId: "intro_01", // Стартовая точка должна совпадать с первой сценой в файле главы
            history: []
        },
        flags: {}
    },

    // Сюда будут подгружаться сцены из других файлов
    scenes: {},

    // --- ИНИЦИАЛИЗАЦИЯ ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        // Проверяем, существует ли сцена
        if (this.scenes[this.state.story.sceneId]) {
            this.renderScene(this.state.story.sceneId);
        } else {
            console.error("Ошибка: Сцена " + this.state.story.sceneId + " не найдена. Проверьте prologue.js");
            document.getElementById("current-scene").innerText = "Ошибка загрузки сюжета...";
        }
    },

    // --- РЕНДЕР СЦЕНЫ ---
    renderScene: function(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) return;

        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        const log = document.getElementById("story-log");

        // Лог истории
        if (this.state.story.sceneId !== sceneId && output.innerText) {
            const entry = document.createElement("div");
            entry.innerHTML = output.innerHTML;
            entry.style.marginBottom = "20px";
            entry.style.opacity = "0.6";
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        // Действия (получение предметов и т.д.)
        if (scene.actions) {
            scene.actions.forEach(act => this.executeAction(act));
            // Важно: не удаляем actions, чтобы при перезагрузке страницы логика была консистентной, 
            // но в идеале для одноразовых действий нужны флаги. Пока оставим так.
        }

        // Вывод текста
        let formattedText = scene.text.replace(/{name}/g, this.state.hero.name);
        output.innerHTML = formattedText;

        // Генерация кнопок
        choicesDiv.innerHTML = "";

        if (scene.type === "input") {
            this.renderInput(scene, choicesDiv);
        } else {
            this.renderChoices(scene, choicesDiv);
        }
    },

    renderInput: function(scene, container) {
        const input = document.createElement("input");
        input.id = "player-input";
        input.placeholder = "Введите имя...";
        input.style.padding = "10px";
        input.style.width = "70%";
        input.style.marginRight = "10px";

        const btn = document.createElement("button");
        btn.innerText = "Принять";
        btn.onclick = () => {
            const val = input.value.trim();
            if (val) {
                this.state.hero.name = val;
                this.updateUI();
                this.renderScene(scene.next);
            }
        };

        container.appendChild(input);
        container.appendChild(btn);
    },

    renderChoices: function(scene, container) {
        if (!scene.choices) return;
        
        scene.choices.forEach(choice => {
            const btn = document.createElement("button");
            let label = choice.text;
            let allowed = true;

            // Проверка требований
            if (choice.req) {
                const statVal = this.state.hero.stats[choice.req.stat] || 0;
                if (statVal < choice.req.val) {
                    allowed = false;
                    label += ` [Треб: ${choice.req.stat} ${choice.req.val}]`;
                    btn.style.opacity = "0.5";
                } else {
                    label += ` [${choice.req.stat} ✓]`;
                    btn.style.borderColor = "#4f4";
                }
            }

            btn.innerText = label;
            btn.style.width = "100%";
            btn.style.marginBottom = "10px";

            if (!allowed && !choice.fallback) {
                btn.disabled = true;
            } else {
                btn.onclick = () => {
                    if (choice.effect) {
                        this.applyEffect(choice.effect);
                    }
                    const nextScene = (!allowed && choice.fallback) ? choice.fallback : choice.next;
                    this.renderScene(nextScene);
                };
            }
            container.appendChild(btn);
        });
    },

    // --- ЛОГИКА ---
    executeAction: function(act) {
        if (act.type === "addItem") {
            // Простая проверка, чтобы не добавлять предмет бесконечно при обновлении страницы
            // В будущем сделаем систему уникальных ID предметов
            if(!this.state.hero.inventory.includes(act.item)){
                this.state.hero.inventory.push(act.item);
                this.updateUI();
            }
        }
        if (act.type === "rep") {
            if (!this.state.hero.reputation[act.faction]) this.state.hero.reputation[act.faction] = 0;
            this.state.hero.reputation[act.faction] += act.val;
            this.updateUI();
        }
    },

    applyEffect: function(eff) {
        if (eff.stat) {
            this.state.hero.stats[eff.stat] += eff.val;
            this.updateUI();
        }
    },

    updateUI: function() {
        document.getElementById("char-name").innerText = this.state.hero.name;
        document.getElementById("hp-fill").style.width = (this.state.hero.hp / this.state.hero.maxHp * 100) + "%";
        
        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        for (let [k, v] of Object.entries(this.state.hero.stats)) {
            sList.innerHTML += `<li>${k}: ${v}</li>`;
        }

        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        this.state.hero.inventory.forEach(i => iList.innerHTML += `<li>${i}</li>`);
        
        const fList = document.getElementById("factions-list");
        fList.innerHTML = "";
        for (let [k, v] of Object.entries(this.state.hero.reputation)) {
            fList.innerHTML += `<li>${k}: ${v}</li>`;
        }
    },

    saveProgress: function() {
        localStorage.setItem("rpg_save_v3", JSON.stringify(this.state));
    },

    loadProgress: function() {
        const data = localStorage.getItem("rpg_save_v3");
        if (data) this.state = JSON.parse(data);
    },

    resetGame: function() {
        if(confirm("Сбросить весь прогресс?")) {
            localStorage.removeItem("rpg_save_v3");
            location.reload();
        }
    }
};
