const Game = {
    // --- СОСТОЯНИЕ ИГРЫ ---
    state: {
        hero: {
            name: "Безымянный",
            class: "Бродяга",
            lvl: 1, exp: 0, maxExp: 100,
            hp: 100, maxHp: 100,
            stats: { strength: 5, agility: 5, intellect: 5, charisma: 5 },
            inventory: [],
            reputation: {}
        },
        story: { chapter: "prologue", sceneId: "intro_01" },
        flags: {}
    },
    scenes: {},
    loc: { stats: { strength: "Сила", agility: "Ловкость", intellect: "Интеллект", charisma: "Харизма" } },
    config: { textSpeed: 15 }, 
    typingTimer: null,

    // --- UI СИСТЕМА ---
    ui: {
        openModal: function(id) {
            Game.updateUI();
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
            setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 3000);
        },
        scrollToBottom: function() {
            const main = document.querySelector('.main-content');
            main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
        
        if (this.typingTimer) clearTimeout(this.typingTimer);

        const output = document.getElementById("current-scene");
        const log = document.getElementById("story-log");
        const choicesDiv = document.getElementById("choices-container");

        // Логирование старого текста
        if (output.innerHTML && this.state.story.sceneId !== sceneId) {
            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = output.innerHTML;
            entry.style.marginBottom = "20px";
            entry.style.opacity = "0.7";
            entry.style.borderBottom = "1px solid #333";
            entry.style.paddingBottom = "15px";
            log.appendChild(entry);
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        if (scene.actions) scene.actions.forEach(act => this.executeAction(act));

        // Подготовка текста
        let rawText = scene.text.replace(/{name}/g, this.state.hero.name);
        output.innerHTML = ""; 
        output.classList.add("typing-cursor");
        choicesDiv.innerHTML = "";
        choicesDiv.style.opacity = "0";

        this.ui.scrollToBottom();

        this.typeWriter(output, rawText, 0, () => {
            output.classList.remove("typing-cursor");
            choicesDiv.style.opacity = "1";
            if (scene.type === "input") this.renderInput(scene);
            else this.renderChoices(scene);
            setTimeout(() => this.ui.scrollToBottom(), 100); 
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
                if (i % 50 === 0) this.ui.scrollToBottom(); 
                this.typingTimer = setTimeout(() => this.typeWriter(element, text, i, callback), this.config.textSpeed);
            }
        } else if (callback) callback();
    },

    renderChoices: function(scene) {
        const container = document.getElementById("choices-container");
        container.innerHTML = "";
        
        if (!scene.choices) return;

        scene.choices.forEach(choice => {
            const btn = document.createElement("button");
            let label = choice.text;
            let allowed = true;

            if (choice.req) {
                const statName = this.loc.stats[choice.req.stat] || choice.req.stat;
                const statVal = this.state.hero.stats[choice.req.stat] || 0;
                
                // Проверка предметов (если ключ 'item') или статов
                if (choice.req.item) {
                     if (!this.state.hero.inventory.includes(choice.req.item)) {
                        allowed = false;
                        label += ` <span style='color:#c0392b; font-size:0.8em'>[Нужен: ${choice.req.item}]</span>`;
                        btn.style.opacity = "0.6";
                     }
                } else if (statVal < choice.req.val) {
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
                    
                    let nextTarget = (!allowed && choice.fallback) ? choice.fallback : choice.next;
                    
                    // ЛОГИКА СЛУЧАЙНОСТИ
                    // Если next - это массив ["win", "lose"], выбираем случайно
                    if (Array.isArray(nextTarget)) {
                        const randIndex = Math.floor(Math.random() * nextTarget.length);
                        nextTarget = nextTarget[randIndex];
                    }

                    this.renderScene(nextTarget);
                };
            }
            container.appendChild(btn);
        });
    },

    renderInput: function(scene) {
        const container = document.getElementById("choices-container");
        const input = document.createElement("input");
        input.placeholder = "Введите имя...";
        input.style.padding = "15px"; input.style.width="100%"; input.style.marginBottom="10px";
        input.style.background="#333"; input.style.color="#fff"; input.style.border="1px solid #555";
        
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
        const output = document.getElementById("current-scene");
        document.getElementById("choices-container").innerHTML = "";
        output.innerHTML = "<div style='text-align:center; padding:30px; color:#888; border:1px dashed #444;'>📜<br>Здесь обрываются известные летописи.<br>История продолжится в следующих обновлениях.</div>";
        
        const btn = document.createElement("button");
        btn.innerText = "⟳ Начать сначала";
        btn.className = "danger-btn";
        btn.style.marginTop = "20px";
        btn.onclick = () => this.resetGame();
        document.getElementById("choices-container").appendChild(btn);
        this.ui.scrollToBottom();
    },

    executeAction: function(act) {
        if (act.type === "addItem" && !this.state.hero.inventory.includes(act.item)) {
            this.state.hero.inventory.push(act.item);
            this.ui.showToast(`🎒 Получено: ${act.item}`);
        }
        if (act.type === "removeItem") {
            const idx = this.state.hero.inventory.indexOf(act.item);
            if (idx > -1) {
                this.state.hero.inventory.splice(idx, 1);
                this.ui.showToast(`🗑 Отдано: ${act.item}`);
            }
        }
        if (act.type === "rep") {
            if (!this.state.hero.reputation[act.faction]) this.state.hero.reputation[act.faction] = 0;
            this.state.hero.reputation[act.faction] += act.val;
            this.ui.showToast(`Репутация (${act.faction}): ${act.val > 0 ? '+' : ''}${act.val}`);
        }
        if (act.type === "damage") {
            this.state.hero.hp = Math.max(0, this.state.hero.hp - act.val);
            this.ui.showToast(`💔 Урон: -${act.val}`);
        }
        if (act.type === "heal") {
            this.state.hero.hp = Math.min(this.state.hero.maxHp, this.state.hero.hp + act.val);
            this.ui.showToast(`💚 Лечение: +${act.val}`);
        }
        if (act.type === "xp") this.gainExp(act.val);
        this.updateUI();
    },

    gainExp: function(amount) {
        this.state.hero.exp += amount;
        this.ui.showToast(`✨ Опыт: +${amount}`);
        if (this.state.hero.exp >= this.state.hero.maxExp) {
            this.state.hero.lvl++;
            this.state.hero.exp -= this.state.hero.maxExp;
            this.state.hero.maxExp = Math.floor(this.state.hero.maxExp * 1.5);
            this.state.hero.maxHp += 15;
            this.state.hero.hp = this.state.hero.maxHp;
            this.state.hero.stats.strength++;
            this.state.hero.stats.agility++;
            this.state.hero.stats.intellect++;
            alert(`🎉 НОВЫЙ УРОВЕНЬ: ${this.state.hero.lvl}!\nВсе характеристики +1\nHP восстановлено.`);
        }
    },

    applyEffect: function(eff) {
        if (eff.stat) {
            this.state.hero.stats[eff.stat] += eff.val;
            this.ui.showToast(`${this.loc.stats[eff.stat]} ${eff.val > 0 ? '+' : ''}${eff.val}`);
        }
        if (eff.gold) { 
             // Если захотим добавить валюту как стат, можно тут
        }
        this.updateUI();
    },

    updateUI: function() {
        const h = this.state.hero;
        document.getElementById("char-name").innerText = h.name;
        document.getElementById("char-lvl").innerText = h.lvl;
        document.getElementById("modal-class").innerText = h.class;
        document.getElementById("hp-fill").style.width = (h.hp / h.maxHp * 100) + "%";
        document.getElementById("exp-fill").style.width = (h.exp / h.maxExp * 100) + "%";

        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        for (let [key, val] of Object.entries(h.stats)) {
            const ruName = this.loc.stats[key] || key;
            sList.innerHTML += `<li><span>${ruName}</span> <b>${val}</b></li>`;
        }

        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        if (h.inventory.length === 0) iList.innerHTML = "<li style='opacity:0.5; text-align:center'>Пусто</li>";
        else h.inventory.forEach(i => iList.innerHTML += `<li>${i}</li>`);

        const fList = document.getElementById("factions-list");
        fList.innerHTML = "";
        for (let [k, v] of Object.entries(h.reputation)) {
            let color = v > 0 ? "#27ae60" : "#c0392b";
            fList.innerHTML += `<li style="display:flex; justify-content:space-between; padding:5px 0;"><span>${k}</span> <span style="color:${color}">${v}</span></li>`;
        }
    },

    saveProgress: function() { localStorage.setItem("rpg_save_v4", JSON.stringify(this.state)); },
    loadProgress: function() { const d = localStorage.getItem("rpg_save_v4"); if (d) this.state = JSON.parse(d); },
    resetGame: function() { if (confirm("Точно сбросить?")) { localStorage.removeItem("rpg_save_v4"); location.reload(); } }
};
