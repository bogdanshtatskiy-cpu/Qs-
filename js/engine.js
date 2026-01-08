const Game = {
    // --- СОСТОЯНИЕ ---
    state: {
        hero: {
            name: "Безымянный",
            class: "Бродяга",
            lvl: 1,
            exp: 0,
            maxExp: 100, // Нужно опыта для уровня
            hp: 100, maxHp: 100,
            stats: { strength: 5, agility: 5, intellect: 5, charisma: 5 },
            inventory: [],
            reputation: {}
        },
        story: { chapter: "prologue", sceneId: "intro_01", history: [] },
        flags: {}
    },
    scenes: {},
    loc: { stats: { strength: "Сила", agility: "Ловкость", intellect: "Интеллект", charisma: "Харизма" } },
    config: { textSpeed: 20 },

    // --- СИСТЕМА UI ---
    ui: {
        openModal: function(id) {
            Game.updateUI(); // Обновить данные перед открытием
            document.getElementById('modal-overlay').classList.remove('hidden');
            document.getElementById(id).classList.remove('hidden');
        },
        closeAllModals: function() {
            document.getElementById('modal-overlay').classList.add('hidden');
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        },
        showToast: function(msg) {
            const container = document.getElementById('toast-container');
            const el = document.createElement('div');
            el.className = 'toast';
            el.innerText = msg;
            container.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 500);
            }, 3000);
        }
    },

    // --- ЗАПУСК ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        this.renderScene(this.state.story.sceneId);
    },

    // --- ДВИЖОК СЦЕН ---
    renderScene: function(sceneId) {
        if (!this.scenes[sceneId]) { this.renderWIP(); return; }
        const scene = this.scenes[sceneId];
        
        // Лог
        const output = document.getElementById("current-scene");
        const log = document.getElementById("story-log");
        if (output.innerHTML && this.state.story.sceneId !== sceneId) {
            const entry = document.createElement("div");
            entry.innerHTML = output.innerHTML;
            entry.style.marginBottom = "15px";
            log.appendChild(entry);
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        if (scene.actions) scene.actions.forEach(act => this.executeAction(act));

        // Печать текста
        let rawText = scene.text.replace(/{name}/g, this.state.hero.name);
        output.innerHTML = ""; 
        output.classList.add("typing-cursor");
        document.getElementById("choices-container").innerHTML = "";

        this.typeWriter(output, rawText, 0, () => {
            output.classList.remove("typing-cursor");
            if (scene.type === "input") this.renderInput(scene);
            else this.renderChoices(scene);
        });
    },

    typeWriter: function(element, text, i, callback) {
        if (i < text.length) {
            if (text.charAt(i) === "<") {
                let tag = "";
                while (text.charAt(i) !== ">" && i < text.length) tag += text.charAt(i++);
                tag += ">"; i++;
                element.innerHTML += tag;
                this.typeWriter(element, text, i, callback);
            } else {
                element.innerHTML += text.charAt(i++);
                setTimeout(() => this.typeWriter(element, text, i, callback), this.config.textSpeed);
            }
        } else if (callback) callback();
    },

    renderChoices: function(scene) {
        const container = document.getElementById("choices-container");
        if (!scene.choices) return;

        scene.choices.forEach(choice => {
            const btn = document.createElement("button");
            let label = choice.text;
            let allowed = true;

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
            if (!allowed && !choice.fallback) btn.disabled = true;
            else btn.onclick = () => {
                if (choice.effect) this.applyEffect(choice.effect);
                this.renderScene((!allowed && choice.fallback) ? choice.fallback : choice.next);
            };
            container.appendChild(btn);
        });
    },

    renderInput: function(scene) {
        const container = document.getElementById("choices-container");
        const input = document.createElement("input");
        input.placeholder = "Введите имя...";
        input.style.padding = "15px"; input.style.width="100%"; input.style.background="#333"; input.style.color="#fff";
        
        const btn = document.createElement("button");
        btn.innerText = "Подтвердить";
        btn.onclick = () => {
            if (input.value.trim()) {
                this.state.hero.name = input.value.trim();
                this.updateUI();
                this.renderScene(scene.next);
            }
        };
        container.appendChild(input); container.appendChild(btn);
    },

    renderWIP: function() {
        document.getElementById("current-scene").innerHTML = "<i>Летописи пока молчат... (Конец текущего контента)</i>";
        const btn = document.createElement("button");
        btn.innerText = "Перезагрузить";
        btn.onclick = () => this.resetGame();
        document.getElementById("choices-container").appendChild(btn);
    },

    // --- ЛОГИКА ---
    executeAction: function(act) {
        if (act.type === "addItem" && !this.state.hero.inventory.includes(act.item)) {
            this.state.hero.inventory.push(act.item);
            this.ui.showToast(`Получено: ${act.item}`);
        }
        if (act.type === "rep") {
            if (!this.state.hero.reputation[act.faction]) this.state.hero.reputation[act.faction] = 0;
            this.state.hero.reputation[act.faction] += act.val;
            const sign = act.val > 0 ? "+" : "";
            this.ui.showToast(`Репутация (${act.faction}): ${sign}${act.val}`);
        }
        if (act.type === "damage") {
            this.state.hero.hp = Math.max(0, this.state.hero.hp - act.val);
            this.ui.showToast(`Получен урон: ${act.val}`);
        }
        if (act.type === "xp") { // Новая механика опыта
            this.gainExp(act.val);
        }
        this.updateUI();
    },

    gainExp: function(amount) {
        this.state.hero.exp += amount;
        this.ui.showToast(`Опыт: +${amount}`);
        if (this.state.hero.exp >= this.state.hero.maxExp) {
            this.state.hero.lvl++;
            this.state.hero.exp -= this.state.hero.maxExp;
            this.state.hero.maxExp = Math.floor(this.state.hero.maxExp * 1.5);
            this.state.hero.maxHp += 10;
            this.state.hero.hp = this.state.hero.maxHp;
            this.ui.showToast(`🎉 НОВЫЙ УРОВЕНЬ: ${this.state.hero.lvl}!`);
            alert("Вы получили новый уровень! Характеристики повышены.");
            // Тут можно добавить логику очков навыков
            this.state.hero.stats.strength++; // Пока просто апаем все понемногу
            this.state.hero.stats.agility++;
        }
    },

    applyEffect: function(eff) {
        if (eff.stat) {
            this.state.hero.stats[eff.stat] += eff.val;
            this.ui.showToast(`${this.loc.stats[eff.stat]} ${eff.val > 0 ? '+' : ''}${eff.val}`);
        }
        this.updateUI();
    },

    updateUI: function() {
        const h = this.state.hero;
        document.getElementById("char-name").innerText = h.name;
        document.getElementById("char-lvl").innerText = h.lvl;
        document.getElementById("modal-class").innerText = h.class;
        
        // Бары
        document.getElementById("hp-fill").style.width = (h.hp / h.maxHp * 100) + "%";
        document.getElementById("exp-fill").style.width = (h.exp / h.maxExp * 100) + "%";

        // Статы (В модальном окне)
        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        for (let [key, val] of Object.entries(h.stats)) {
            const ruName = this.loc.stats[key] || key;
            sList.innerHTML += `<li><span>${ruName}</span> <b>${val}</b></li>`;
        }

        // Инвентарь (В модальном окне)
        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        if (h.inventory.length === 0) iList.innerHTML = "<li style='opacity:0.5; text-align:center'>Пусто</li>";
        else h.inventory.forEach(i => iList.innerHTML += `<li>${i}</li>`);

        // Репутация
        const fList = document.getElementById("factions-list");
        fList.innerHTML = "";
        for (let [k, v] of Object.entries(h.reputation)) {
            let color = v > 0 ? "#27ae60" : "#c0392b";
            fList.innerHTML += `<li style="display:flex; justify-content:space-between; padding:5px 0;"><span>${k}</span> <span style="color:${color}">${v}</span></li>`;
        }
    },

    saveProgress: function() { localStorage.setItem("rpg_save_v4", JSON.stringify(this.state)); },
    loadProgress: function() { 
        const data = localStorage.getItem("rpg_save_v4"); 
        if (data) this.state = JSON.parse(data); 
    },
    resetGame: function() {
        if (confirm("Начать заново?")) { localStorage.removeItem("rpg_save_v4"); location.reload(); }
    }
};
