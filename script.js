// --- КОНФИГУРАЦИЯ И СОСТОЯНИЕ ---
const Game = {
    state: {
        hero: {
            name: "Странник",
            class: null,
            lvl: 1,
            hp: 100,
            maxHp: 100,
            stats: { strength: 1, agility: 1, intellect: 1, charisma: 1 },
            inventory: [],
            equipment: { weapon: null, armor: null }
        },
        story: {
            chapter: 0,
            sceneId: "start",
            history: [] // Для лога
        },
        flags: {} // Глобальные переменные (убил_стражника: true и т.д.)
    },

    // База данных сцен (в будущем будем подгружать из файлов)
    scenes: {
        "start": {
            text: "Твои глаза открываются. Вокруг темно и сыро. Пахнет плесенью и старой кровью. Ты лежишь на холодном каменном полу тюремной камеры. Голова раскалывается.",
            choices: [
                { text: "Осмотреться", next: "look_cell" },
                { text: "Ощупать себя (Проверка Интеллекта)", req: { stat: "intellect", val: 2 }, next: "check_self_success", fallback: "check_self_fail" },
                { text: "Закричать", next: "scream" }
            ]
        },
        "look_cell": {
            text: "Камера пуста. Лишь гнилая солома в углу и ржавая ложка у двери. Дверь выглядит хлипкой, но заперта.",
            actions: [ { type: "addItem", item: "Ржавая ложка" } ], // Пример получения предмета
            choices: [
                { text: "Подобрать ложку", next: "get_spoon" },
                { text: "Попробовать выбить дверь (Сила)", req: { stat: "strength", val: 3 }, next: "break_door", fallback: "break_door_fail" }
            ]
        },
        "get_spoon": {
            text: "Ты берешь ложку. Она острая. Может сойти за оружие в крайнем случае.",
            choices: [
                { text: "Вернуться к двери", next: "door_interaction" }
            ]
        },
        "door_interaction": {
            text: "Ты стоишь у двери. Слышны шаги стражника.",
            choices: [
                { text: "Притвориться мертвым", next: "fake_death" },
                { text: "Спрятаться в тени", next: "hide_shadow" }
            ]
        },
        // ... (Сюда мы будем добавлять тысячи строк сюжета) ...
        "coming_soon": {
            text: "Это конец демо-версии. Выберите сюжет, чтобы продолжить разработку.",
            choices: [
                { text: "Сбросить прогресс", action: "reset" }
            ]
        }
    },

    // --- ИНИЦИАЛИЗАЦИЯ ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        this.renderScene(this.state.story.sceneId);
    },

    // --- ДВИЖОК СЦЕН ---
    renderScene: function(sceneId) {
        const scene = this.scenes[sceneId] || this.scenes["coming_soon"];
        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        const log = document.getElementById("story-log");

        // 1. Сохраняем прошлый текст в лог (если это не старт)
        if (output.innerHTML !== "") {
            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = output.innerHTML;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        // 2. Выполняем действия сцены (если есть)
        if (scene.actions) {
            scene.actions.forEach(act => this.executeAction(act));
        }

        // 3. Анимация печати текста
        output.innerHTML = "";
        let i = 0;
        const speed = 20; // скорость печати
        
        function typeWriter() {
            if (i < scene.text.length) {
                output.innerHTML += scene.text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            } else {
                Game.renderChoices(scene.choices);
            }
        }
        typeWriter();

        this.state.story.sceneId = sceneId;
        this.saveProgress();
    },

    renderChoices: function(choices) {
        const container = document.getElementById("choices-container");
        container.innerHTML = "";

        choices.forEach(choice => {
            const btn = document.createElement("button");
            
            // Логика требований (статы, предметы)
            let allowed = true;
            let label = choice.text;

            if (choice.req) {
                const statVal = this.state.hero.stats[choice.req.stat] || 0;
                if (statVal < choice.req.val) {
                    allowed = false;
                    label += ` <span class="req-fail">[Требуется ${choice.req.stat} ${choice.req.val}]</span>`;
                } else {
                    label += ` <span class="req-met">[${choice.req.stat} ✓]</span>`;
                }
            }

            btn.innerHTML = label;
            
            if (choice.action === "reset") {
                btn.onclick = () => this.resetGame();
            } else if (!allowed && choice.fallback) {
                // Если требование не выполнено, ведем на ветку провала
                btn.onclick = () => this.renderScene(choice.fallback);
            } else if (!allowed) {
                btn.disabled = true;
            } else {
                btn.onclick = () => this.renderScene(choice.next);
            }

            container.appendChild(btn);
        });
    },

    // --- СИСТЕМНЫЕ ФУНКЦИИ ---
    executeAction: function(action) {
        if (action.type === "addItem") {
            this.state.hero.inventory.push(action.item);
            alert(`Получено: ${action.item}`);
            this.updateUI();
        }
        // Тут можно добавить damage, heal, reputation и т.д.
    },

    updateUI: function() {
        document.getElementById("char-name").innerText = this.state.hero.name;
        document.getElementById("char-lvl").innerText = this.state.hero.lvl;
        document.getElementById("hp-fill").style.width = (this.state.hero.hp / this.state.hero.maxHp * 100) + "%";
        
        // Статы
        const sList = document.getElementById("stats-list");
        sList.innerHTML = "";
        for (let [key, val] of Object.entries(this.state.hero.stats)) {
            let li = document.createElement("li");
            li.innerText = `${key}: ${val}`;
            sList.appendChild(li);
        }

        // Инвентарь
        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        if (this.state.hero.inventory.length === 0) {
            iList.innerHTML = '<li class="empty-msg">Пусто</li>';
        } else {
            this.state.hero.inventory.forEach(item => {
                let li = document.createElement("li");
                li.innerText = item;
                iList.appendChild(li);
            });
        }
    },

    saveProgress: function() {
        localStorage.setItem("rpg_save", JSON.stringify(this.state));
    },

    loadProgress: function() {
        const data = localStorage.getItem("rpg_save");
        if (data) {
            this.state = JSON.parse(data);
        }
    },

    resetGame: function() {
        localStorage.removeItem("rpg_save");
        location.reload();
    }
};

// Запуск
window.onload = () => Game.init();
