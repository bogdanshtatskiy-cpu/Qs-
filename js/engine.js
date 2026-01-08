const Game = {
    // --- СОСТОЯНИЕ ИГРЫ ---
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
            sceneId: "intro_01", 
            history: [] // Для хранения лога, если понадобится
        },
        flags: {} // Для запоминания выборов
    },

    // Сюда загружаются все главы
    scenes: {},

    // Словарь локализации
    loc: {
        stats: { strength: "Сила", agility: "Ловкость", intellect: "Интеллект", charisma: "Харизма" }
    },

    config: { textSpeed: 25 }, // Скорость текста (мс)
    typingTimer: null,

    // --- ЗАПУСК ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        this.renderScene(this.state.story.sceneId);
    },

    // --- ГЛАВНАЯ ФУНКЦИЯ ОТРИСОВКИ ---
    renderScene: function(sceneId) {
        // 1. ПРОВЕРКА НА КОНЕЦ КОНТЕНТА
        if (!this.scenes[sceneId]) {
            this.renderWIP();
            return;
        }

        const scene = this.scenes[sceneId];
        
        // Очистка таймеров анимации
        if (this.typingTimer) clearTimeout(this.typingTimer);

        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        const log = document.getElementById("story-log");

        // 2. ЛОГИРОВАНИЕ (Перенос старого текста в историю)
        if (output.innerHTML && this.state.story.sceneId !== sceneId) {
            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = output.innerHTML;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        // 3. ВЫПОЛНЕНИЕ ДЕЙСТВИЙ (Лут, урон и т.д.)
        if (scene.actions) {
            scene.actions.forEach(act => this.executeAction(act));
        }

        // 4. ПОДГОТОВКА ТЕКСТА
        let rawText = scene.text.replace(/{name}/g, this.state.hero.name);
        
        // 5. АНИМАЦИЯ ПЕЧАТИ
        output.innerHTML = ""; 
        output.classList.add("typing-cursor");
        choicesDiv.innerHTML = ""; // Скрываем кнопки пока печатает
        choicesDiv.style.opacity = "0";

        this.typeWriter(output, rawText, 0, () => {
            output.classList.remove("typing-cursor");
            choicesDiv.style.opacity = "1";
            
            if (scene.type === "input") {
                this.renderInput(scene, choicesDiv);
            } else {
                this.renderChoices(scene, choicesDiv);
            }
        });
    },

    // Экран "В разработке"
    renderWIP: function() {
        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        
        output.innerHTML = "<span style='color: #888; font-style: italic;'>...На этом месте летописи обрываются. Барды еще слагают продолжение этой истории.</span>";
        choicesDiv.innerHTML = "";
        
        const btn = document.createElement("button");
        btn.innerText = "Ждать продолжения (Сбросить игру)";
        btn.onclick = () => this.resetGame();
        choicesDiv.appendChild(btn);
    },

    // Умная печатная машинка (пропускает HTML теги)
    typeWriter: function(element, text, i, callback) {
        if (i < text.length) {
            // Если встречаем тег <...>, добавляем его целиком сразу
            if (text.charAt(i) === "<") {
                let tag = "";
                while (text.charAt(i) !== ">" && i < text.length) {
                    tag += text.charAt(i);
                    i++;
                }
                tag += ">";
                i++;
                element.innerHTML += tag;
                this.typeWriter(element, text, i, callback);
            } else {
                element.innerHTML += text.charAt(i);
                i++;
                this.typingTimer = setTimeout(() => {
                    this.typeWriter(element, text, i, callback);
                }, this.config.textSpeed);
            }
        } else {
            if (callback) callback();
        }
    },

    renderInput: function(scene, container) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Введите имя...";
        input.style.width = "100%";
        input.style.padding = "10px";
        input.style.marginBottom = "10px";
        input.style.background = "#222";
        input.style.color = "#fff";
        input.style.border = "1px solid #444";
        
        const btn = document.createElement("button");
        btn.innerText = "Принять судьбу";
        
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
        input.focus();
    },

    renderChoices: function(scene, container) {
        if (!scene.choices) return;

        scene.choices.forEach(choice => {
            const btn = document.createElement("button");
            let label = choice.text;
            let allowed = true;

            // Проверка требований
            if (choice.req) {
                const statName = this.loc.stats[choice.req.stat] || choice.req.stat;
                const statVal = this.state.hero.stats[choice.req.stat] || 0;
                
                if (statVal < choice.req.val) {
                    allowed = false;
                    label += ` <span style='color:#c0392b; font-size:0.8em'>[${statName} ${choice.req.val}]</span>`;
                    btn.style.opacity = "0.6";
                } else {
                    label += ` <span style='color:#27ae60; font-size:0.8em'>[${statName} ✓]</span>`;
                    btn.style.borderColor = "#27ae60";
                }
            }

            btn.innerHTML = label;

            if (!allowed && !choice.fallback) {
                btn.disabled = true;
            } else {
                btn.onclick = () => {
                    if (choice.effect) this.applyEffect(choice.effect);
                    // Если требование провалено, идем в fallback, иначе в next
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
            // Чтобы не добавлять дубликаты при перезагрузке, простая проверка
            if (!this.state.hero.inventory.includes(act.item)) {
                this.state.hero.inventory.push(act.item);
                this.updateUI();
            }
        }
        if (act.type === "rep") {
            if (!this.state.hero.reputation[act.faction]) this.state.hero.reputation[act.faction] = 0;
            this.state.hero.reputation[act.faction] += act.val;
            this.updateUI();
        }
        if (act.type === "damage") {
            this.state.hero.hp -= act.val;
            if (this.state.hero.hp < 0) this.state.hero.hp = 0;
            this.updateUI();
        }
        if (act.type === "heal") {
            this.state.hero.hp += act.val;
            if (this.state.hero.hp > this.state.hero.maxHp) this.state.hero.hp = this.state.hero.maxHp;
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
        document.getElementById("char-class").innerText = this.state.hero.class;
        document.getElementById("hp-fill").style.width = (this.state.hero.hp / this.state.hero.maxHp * 100) + "%";

        // Статы
        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        for (let [key, val] of Object.entries(this.state.hero.stats)) {
            const ruName = this.loc.stats[key] || key;
            sList.innerHTML += `<li><span>${ruName}</span> <span>${val}</span></li>`;
        }

        // Инвентарь
        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        if (this.state.hero.inventory.length === 0) {
            iList.innerHTML = "<li style='opacity:0.5; text-align:center'>Пусто</li>";
        } else {
            this.state.hero.inventory.forEach(item => {
                iList.innerHTML += `<li>${item}</li>`;
            });
        }

        // Репутация
        const fList = document.getElementById("factions-list");
        fList.innerHTML = "";
        for (let [key, val] of Object.entries(this.state.hero.reputation)) {
            let color = val > 0 ? "#27ae60" : (val < 0 ? "#c0392b" : "#888");
            fList.innerHTML += `<li style="display:flex; justify-content:space-between;"><span>${key}</span> <span style="color:${color}">${val}</span></li>`;
        }
    },

    saveProgress: function() {
        localStorage.setItem("rpg_core_save", JSON.stringify(this.state));
    },

    loadProgress: function() {
        const data = localStorage.getItem("rpg_core_save");
        if (data) this.state = JSON.parse(data);
    },

    resetGame: function() {
        if (confirm("Вы действительно хотите стереть свою историю и начать заново?")) {
            localStorage.removeItem("rpg_core_save");
            location.reload();
        }
    }
};
