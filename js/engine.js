const Game = {
    state: {
        hero: {
            name: "",
            classId: null,
            lvl: 1,
            hp: 100,
            maxHp: 100,
            sanity: 0, // Безумие (0-100)
            stats: { strength: 0, agility: 0, intellect: 0, charisma: 0 },
            inventory: [],
            equipment: {}
        },
        story: {
            chapter: 1,
            sceneId: "start_chapter_1",
            deaths: 0
        },
        flags: {}
    },

    scenes: {}, // Сюда загрузится глава 1

    init: function() {
        if(localStorage.getItem("ashes_save")) {
            this.loadProgress();
            document.getElementById("start-modal").style.display = "none";
            this.renderScene(this.state.story.sceneId);
        } else {
            this.initCreationUI();
        }
        UI.update();
    },

    // --- СОЗДАНИЕ ПЕРСОНАЖА ---
    classes: {
        "stray": { name: "Бродяга", stats: { strength: 3, agility: 5, intellect: 2, charisma: 3 }, desc: "Мастер выживания. Знает, как резать глотки и кошельки." },
        "tech": { name: "Техно-сталкер", stats: { strength: 2, agility: 3, intellect: 6, charisma: 2 }, desc: "Понимает язык старых машин. Слабак в драке, бог в технике." },
        "psycho": { name: "Мясник", stats: { strength: 7, agility: 2, intellect: 1, charisma: 1 }, desc: "Гора мышц. Бьет больно, думает редко. Любит кровь." },
        "noble": { name: "Изгнанник", stats: { strength: 3, agility: 3, intellect: 4, charisma: 6 }, desc: "Язык подвешен. Может заболтать даже труп." }
    },
    
    selectedClass: null,

    initCreationUI: function() {
        const container = document.getElementById("class-buttons");
        for(let id in this.classes) {
            let btn = document.createElement("button");
            btn.className = "class-btn";
            btn.innerHTML = `<b>${this.classes[id].name}</b><br><small>${this.classes[id].desc}</small>`;
            btn.onclick = () => {
                this.selectedClass = id;
                document.querySelectorAll(".class-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                this.checkStartReady();
            }
            container.appendChild(btn);
        }
        
        document.getElementById("input-name").addEventListener("input", () => this.checkStartReady());
    },

    checkStartReady: function() {
        const name = document.getElementById("input-name").value.trim();
        document.getElementById("start-btn").disabled = !(name.length > 0 && this.selectedClass);
    },

    startGame: function() {
        const name = document.getElementById("input-name").value.trim();
        this.state.hero.name = name;
        this.state.hero.classId = this.selectedClass;
        this.state.hero.stats = {...this.classes[this.selectedClass].stats};
        
        document.getElementById("start-modal").style.display = "none";
        this.renderScene("start_chapter_1");
        UI.update();
    },

    // --- ЛОГИКА СЦЕН ---
    renderScene: function(sceneId) {
        // Проверка смерти
        if (sceneId === "death") {
            this.handleDeath();
            return;
        }

        const scene = this.scenes[sceneId];
        if(!scene) { console.error("Сцена не найдена:", sceneId); return; }

        // Замена переменных в тексте (Имя)
        let text = scene.text.replace(/{name}/g, this.state.hero.name);
        
        // Лог
        const log = document.getElementById("story-log");
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.innerHTML = document.getElementById("current-scene").innerHTML;
        if(entry.innerHTML) log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        // Действия (награды, урон)
        if(scene.onEnter) scene.onEnter(this.state);

        // Вывод текста (печатание)
        const output = document.getElementById("current-scene");
        output.innerHTML = "";
        let i = 0;
        const speed = 15;
        
        function typeWriter() {
            if (i < text.length) {
                output.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            } else {
                UI.renderChoices(scene.choices);
            }
        }
        typeWriter();

        this.state.story.sceneId = sceneId;
        this.saveProgress();
        UI.update();
    },

    handleDeath: function() {
        this.state.story.deaths++;
        this.state.hero.maxHp = Math.max(10, this.state.hero.maxHp - 10); // Штраф
        this.state.hero.hp = this.state.hero.maxHp;
        this.state.hero.sanity += 15; // Штраф к психике
        
        const output = document.getElementById("current-scene");
        output.innerHTML = `<span style="color:var(--blood)">ТЬМА ПОГЛОТИЛА ТЕБЯ...</span><br><br>
        Но Метка на твоей руке вспыхивает адским огнем. Ты чувствуешь, как твоя душа рвется назад в тело.
        Ты теряешь часть себя, но возвращаешься к последнему костру.`;
        
        UI.renderChoices([{ 
            text: "Восстать из мертвых (Продолжить)", 
            next: "bonfire_respawn" // Точка возрождения
        }]);
    },

    // --- СИСТЕМА ---
    saveProgress: function() { localStorage.setItem("ashes_save", JSON.stringify(this.state)); },
    loadProgress: function() { this.state = JSON.parse(localStorage.getItem("ashes_save")); },
    resetGame: function() { localStorage.removeItem("ashes_save"); location.reload(); }
};

const UI = {
    update: function() {
        const h = Game.state.hero;
        document.getElementById("char-name").innerText = h.name;
        document.getElementById("char-class").innerText = Game.classes[h.classId]?.name || "Никто";
        document.getElementById("hp-val").innerText = `${h.hp}/${h.maxHp}`;
        document.getElementById("hp-fill").style.width = (h.hp / h.maxHp * 100) + "%";
        
        const statsList = document.getElementById("stats-list");
        statsList.innerHTML = `
            <li>Сила: ${h.stats.strength}</li>
            <li>Ловкость: ${h.stats.agility}</li>
            <li>Интеллект: ${h.stats.intellect}</li>
            <li>Харизма: ${h.stats.charisma}</li>
        `;

        const invList = document.getElementById("inventory-list");
        invList.innerHTML = h.inventory.length ? h.inventory.map(i => `<li>${i}</li>`).join('') : '<li class="empty-msg">Пусто</li>';
    },

    renderChoices: function(choices) {
        const container = document.getElementById("choices-container");
        container.innerHTML = "";
        choices.forEach(c => {
            const btn = document.createElement("button");
            
            // Проверки требований
            if (c.req) {
                const val = Game.state.hero.stats[c.req.stat] || 0;
                if (val < c.req.val) {
                    btn.disabled = true;
                    btn.innerHTML = `${c.text} <span style="color:#555">[Надо: ${c.req.stat} ${c.req.val}]</span>`;
                    container.appendChild(btn);
                    return;
                }
            }

            btn.innerText = c.text;
            btn.onclick = () => {
                // Если есть влияние на статы при выборе
                if(c.effect) c.effect(Game.state);
                Game.renderScene(c.next);
            };
            container.appendChild(btn);
        });
    },

    switchTab: function(tabName) {
        document.querySelectorAll('.sidebar, .main-content').forEach(el => el.classList.remove('active-panel'));
        document.querySelectorAll('.mobile-nav button').forEach(el => el.classList.remove('active-tab'));
        
        if(tabName === 'story') document.getElementById('tab-story').classList.add('active-panel');
        if(tabName === 'hero') document.getElementById('tab-hero').classList.add('active-panel');
        if(tabName === 'inv') document.getElementById('tab-inv').classList.add('active-panel');
        
        // Находим кнопку и подсвечиваем (упрощено)
        event.target.classList.add('active-tab');
    }
};

// Старт первого таба для мобильных
document.getElementById('tab-story').classList.add('active-panel');
