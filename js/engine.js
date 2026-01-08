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
            sceneId: "intro_01", 
            history: []
        },
        flags: {}
    },

    scenes: {},

    // Словарь для перевода
    loc: {
        stats: {
            strength: "Сила",
            agility: "Ловкость",
            intellect: "Интеллект",
            charisma: "Харизма"
        }
    },

    // --- ИНИЦИАЛИЗАЦИЯ ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        if (this.scenes[this.state.story.sceneId]) {
            this.renderScene(this.state.story.sceneId);
        } else {
            document.getElementById("current-scene").innerText = "Ошибка: сцена не найдена.";
        }
    },

    // --- РЕНДЕР СЦЕНЫ ---
    renderScene: function(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) return;

        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        const log = document.getElementById("story-log");

        // Логирование (только на ПК, на мобильном можно скрыть старое, если мешает, но пока оставим)
        if (this.state.story.sceneId !== sceneId && output.innerText) {
            const entry = document.createElement("div");
            entry.innerHTML = output.innerHTML;
            entry.style.marginBottom = "15px";
            entry.style.opacity = "0.7";
            entry.style.borderBottom = "1px solid #333";
            entry.style.paddingBottom = "10px";
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        if (scene.actions) {
            scene.actions.forEach(act => this.executeAction(act));
        }

        let formattedText = scene.text.replace(/{name}/g, this.state.hero.name);
        output.innerHTML = formattedText;

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
        
        const btn = document.createElement("button");
        btn.innerText = "Принять";
        // На мобилках кнопка ввода должна быть удобной
        btn.style.width = "auto"; 
        btn.style.display = "inline-block";
        
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

            if (choice.req) {
                // Перевод названия стата для кнопки
                const statNameRu = this.loc.stats[choice.req.stat] || choice.req.stat;
                const statVal = this.state.hero.stats[choice.req.stat] || 0;
                
                if (statVal < choice.req.val) {
                    allowed = false;
                    label += ` [Треб: ${statNameRu} ${choice.req.val}]`;
                    btn.style.opacity = "0.6";
                    btn.style.border = "1px solid #522";
                } else {
                    label += ` [${statNameRu} ✓]`;
                    btn.style.borderColor = "#27ae60";
                }
            }

            btn.innerText = label;

            if (!allowed && !choice.fallback) {
                btn.disabled = true;
            } else {
                btn.onclick = () => {
                    if (choice.effect) this.applyEffect(choice.effect);
                    const nextScene = (!allowed && choice.fallback) ? choice.fallback : choice.next;
                    this.renderScene(nextScene);
                };
            }
            container.appendChild(btn);
        });
    },

    executeAction: function(act) {
        if (act.type === "addItem") {
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
        document.getElementById("char-class").innerText = this.state.hero.class;
        document.getElementById("hp-fill").style.width = (this.state.hero.hp / this.state.hero.maxHp * 100) + "%";
        
        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        
        // Перебор статов с переводом на русский
        for (let [key, val] of Object.entries(this.state.hero.stats)) {
            const ruName = this.loc.stats[key] || key;
            // Компактный вид для списка: "Сила: 5"
            let li = document.createElement("li");
            li.innerHTML = `<b>${ruName}</b>: ${val}`;
            sList.appendChild(li);
        }

        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        if(this.state.hero.inventory.length === 0) {
             iList.innerHTML = "<li style='opacity:0.5'>Пусто</li>";
        } else {
             this.state.hero.inventory.forEach(i => iList.innerHTML += `<li>${i}</li>`);
        }
        
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
