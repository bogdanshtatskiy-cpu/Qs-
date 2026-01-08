// --- ГЛОБАЛЬНЫЙ ЛОР И КОНФИГ ---
const Game = {
    state: {
        hero: {
            name: "Безымянный",
            class: "Нет",
            lvl: 1,
            hp: 100,
            maxHp: 100,
            exp: 0,
            stats: { strength: 5, agility: 5, intellect: 5, charisma: 5 },
            inventory: [],
            reputation: { "Империя": 0, "Мятежники": 0 }
        },
        story: {
            chapter: "prologue",
            sceneId: "intro_01",
            history: []
        },
        flags: {} 
    },

    // --- БАЗА ДАННЫХ СЦЕН (ГЛАВА 0: ПРОЛОГ) ---
    scenes: {
        // Сцена ввода имени
        "intro_01": {
            text: "Мир Этерии стар. Гораздо старше, чем говорят летописи Жрецов Солнца.\n\nПеред тем как ваша судьба переплетется с историей этого мира, назовите себя.",
            type: "input", // Специальный тип сцены
            next: "intro_lore"
        },
        "intro_lore": {
            text: "Добро пожаловать, {name}.\n\nВы находитесь в году 482-м от Падения Небес. Империя Асферат трещит по швам. На севере проснулись вулканы, спавшие тысячу лет. На юге шепчутся о возвращении 'Бледного Короля'.\n\nНо ваша история начинается не во дворце и не на поле брани.\n\nОна начинается в сыром подвале долговой тюрьмы города Ривергард.",
            choices: [
                { text: "Открыть глаза", next: "prison_wakeup" }
            ]
        },
        "prison_wakeup": {
            text: "Голова гудит, словно по ней ударили молотом кузнеца. Вы лежите на гнилой соломе. Вокруг темно, лишь слабый луч лунного света пробивается сквозь узкую решетку под потолком.\n\nЗа стеной слышны капли воды: кап... кап... кап... Этот звук сводит с ума.\nПочему вы здесь? Память возвращается осколками.",
            choices: [
                { text: "Вспомнить: Меня подставили (Интеллект +1)", next: "origin_smart", effect: {stat: "intellect", val: 1} },
                { text: "Вспомнить: Я убил человека в пьяной драке (Сила +1)", next: "origin_strong", effect: {stat: "strength", val: 1} },
                { text: "Вспомнить: Я украл хлеб для сестры (Ловкость +1)", next: "origin_fast", effect: {stat: "agility", val: 1} }
            ]
        },
        "origin_smart": {
            text: "Точно... Вы были писарем у местного барона. Вы нашли документы, которые не должны были видеть. О хищениях золота, выделенного на починку городской стены.\nВас схватили ночью, мешок на голову — и вот вы здесь. Они думают, вы ничего не знаете. Или ждут момента, чтобы убрать свидетеля.",
            choices: [{ text: "Осмотреться", next: "cell_inspect" }]
        },
        "origin_strong": {
            text: "В таверне 'Хромой Дракон' сержант стражи оскорбил вашу честь. Вы не стерпели. Ваш кулак оказался тяжелее, чем его челюсть. Теперь вам грозит виселица или каторга на рудниках 'Глубокая Глотка'.",
            choices: [{ text: "Осмотреться", next: "cell_inspect" }]
        },
        "origin_fast": {
            text: "Голод — плохой советчик. Зима была суровой, и цены на зерно взлетели. Вы стащили всего одну буханку с прилавка толстяка Гюнтера. Но вас поймали патрульные. В Ривергарде за воровство отрубают руку. Вам страшно.",
            choices: [{ text: "Осмотреться", next: "cell_inspect" }]
        },
        "cell_inspect": {
            text: "Камера три на три шага. Стены сложены из 'серого камня' — породы, которую добывают только в шахтах гномов далеко на востоке. Странно видеть такой дорогой камень в обычной тюрьме.\n\nВ углу лежит скелет, закованный в кандалы. На его пальце что-то блестит.",
            choices: [
                { text: "Обыскать скелет", next: "search_skeleton" },
                { text: "Подойти к двери и послушать", next: "listen_door" },
                { text: "Попытаться расшатать решетку (Требуется Сила 6)", req: {stat: "strength", val: 6}, next: "break_bars", fallback: "break_bars_fail" }
            ]
        },
        "search_skeleton": {
            text: "Вы осторожно подходите к костям. Судя по истлевшим лохмотьям, этот бедолага здесь лет пятьдесят. \nВы снимаете с костяного пальца кольцо. Оно грубое, железное, с выгравированным символом: расколотый щит.",
            actions: [{type: "addItem", item: "Кольцо 'Расколотый щит'"}],
            choices: [
                { text: "Надеть кольцо", next: "wear_ring" },
                { text: "Спрятать в карман", next: "hide_ring" }
            ]
        },
        "listen_door": {
            text: "За дверью тишина. Но вдруг вы слышите шаги. Тяжелые, металлические. Это не обычная стража. Лязг доспехов слишком ритмичный. \nГолос: '...приказ Лорда-Протектора. Зачистить нижний уровень. Никто не должен выйти'.",
            choices: [
                { text: "Отойти от двери", next: "retreat_door" }
            ]
        },
        "wear_ring": {
            text: "Как только холодное железо касается кожи, вы чувствуете легкое покалывание. В голове проносится шепот: *'Клятва... не... забыта...'*.\n\n(Ваша репутация с Мятежниками повысилась)",
            actions: [{type: "rep", faction: "Мятежники", val: 5}],
            choices: [
                 { text: "Что это было?", next: "listen_door" }
            ]
        },
        "hide_ring": {
             text: "Вы прячете кольцо. Лучше не светить им. Интуиция подсказывает, что за этот символ могут убить на месте.",
             choices: [
                 { text: "Вернуться к двери", next: "listen_door" }
            ]
        },
        "retreat_door": {
            text: "Шаги останавливаются прямо у вашей двери. Скрежет ключа в замке...",
            choices: [
                { text: "Приготовиться к бою", next: "prepare_fight" },
                { text: "Забиться в угол", next: "hide_corner" }
            ]
        },
        // ЗАГЛУШКА ДЛЯ ДАЛЬНЕЙШЕЙ РАЗРАБОТКИ
        "prepare_fight": { text: "Дверь распахивается... (Конец демо-части Пролога. Попроси AI сгенерировать продолжение Главы 1)", choices: []},
        "hide_corner": { text: "Дверь распахивается... (Конец демо-части Пролога. Попроси AI сгенерировать продолжение Главы 1)", choices: []},
        "break_bars_fail": { text: "Решетка даже не шелохнулась. Нужна нечеловеческая сила.", choices: [{text: "Назад", next: "cell_inspect"}]}
    },

    // --- ИНИЦИАЛИЗАЦИЯ ---
    init: function() {
        this.loadProgress();
        this.updateUI();
        this.renderScene(this.state.story.sceneId);
    },

    // --- РЕНДЕР СЦЕНЫ ---
    renderScene: function(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) {
            console.error("Сцена не найдена: " + sceneId);
            return;
        }

        const output = document.getElementById("current-scene");
        const choicesDiv = document.getElementById("choices-container");
        const log = document.getElementById("story-log");
        const inputContainer = document.getElementById("choices-container"); // Используем тот же контейнер

        // 1. Логирование прошлого текста
        if (this.state.story.sceneId !== sceneId && output.innerText) {
            const entry = document.createElement("div");
            entry.innerHTML = output.innerHTML;
            entry.style.marginBottom = "15px";
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }

        this.state.story.sceneId = sceneId;
        this.saveProgress();

        // 2. Обработка действий (предметы, статы)
        if (scene.actions) {
            scene.actions.forEach(act => this.executeAction(act));
            scene.actions = null; // Чтобы не срабатывало повторно при перезагрузке
        }

        // 3. Вывод текста (с заменой {name})
        let formattedText = scene.text.replace(/{name}/g, this.state.hero.name);
        output.innerHTML = formattedText;

        // 4. Отрисовка выбора или ввода
        choicesDiv.innerHTML = "";

        if (scene.type === "input") {
            // Создаем поле ввода
            const wrap = document.createElement("div");
            wrap.className = "input-container";
            
            const input = document.createElement("input");
            input.id = "player-input";
            input.placeholder = "Введите имя героя...";
            
            const btn = document.createElement("button");
            btn.innerText = "Принять";
            btn.onclick = () => {
                if(input.value.trim() !== "") {
                    this.state.hero.name = input.value.trim();
                    this.updateUI();
                    this.renderScene(scene.next);
                }
            };

            wrap.appendChild(input);
            wrap.appendChild(btn);
            choicesDiv.appendChild(wrap);
            input.focus();

        } else {
            // Обычные кнопки выбора
            scene.choices.forEach(choice => {
                const btn = document.createElement("button");
                
                let label = choice.text;
                let allowed = true;

                // Проверка требований
                if (choice.req) {
                    const statVal = this.state.hero.stats[choice.req.stat] || 0;
                    if (statVal < choice.req.val) {
                        allowed = false;
                        label += ` [Нужно: ${choice.req.stat} ${choice.req.val}]`;
                        btn.style.color = "#777";
                    } else {
                         label += ` [${choice.req.stat} ✓]`;
                         btn.style.color = "#8f8";
                    }
                }

                btn.innerText = label;

                if (!allowed && choice.fallback) {
                    btn.onclick = () => {
                        this.renderScene(choice.fallback);
                    };
                } else if (!allowed) {
                    btn.disabled = true;
                } else {
                    btn.onclick = () => {
                        // Если есть эффект выбора (например +1 к силе сразу)
                        if (choice.effect) {
                            this.state.hero.stats[choice.effect.stat] += choice.effect.val;
                            this.updateUI();
                        }
                        this.renderScene(choice.next);
                    };
                }
                choicesDiv.appendChild(btn);
            });
        }
    },

    // --- СИСТЕМНЫЕ ФУНКЦИИ ---
    executeAction: function(action) {
        if (action.type === "addItem") {
            this.state.hero.inventory.push(action.item);
            this.updateUI();
        }
        if (action.type === "rep") {
            if (!this.state.hero.reputation[action.faction]) this.state.hero.reputation[action.faction] = 0;
            this.state.hero.reputation[action.faction] += action.val;
            this.updateUI();
        }
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
            li.innerHTML = `<b>${key.toUpperCase()}</b>: ${val}`;
            li.style.marginBottom = "5px";
            sList.appendChild(li);
        }

        // Инвентарь
        const iList = document.getElementById("inventory-list");
        iList.innerHTML = "";
        this.state.hero.inventory.forEach(item => {
            let li = document.createElement("li");
            li.innerText = item;
            iList.appendChild(li);
        });

        // Репутация
         const rList = document.getElementById("factions-list");
         rList.innerHTML = "";
         for (let [key, val] of Object.entries(this.state.hero.reputation)) {
             let li = document.createElement("li");
             li.innerText = `${key}: ${val}`;
             rList.appendChild(li);
         }
    },

    saveProgress: function() {
        localStorage.setItem("rpg_save_v2", JSON.stringify(this.state));
    },

    loadProgress: function() {
        const data = localStorage.getItem("rpg_save_v2");
        if (data) {
            this.state = JSON.parse(data);
        }
    },

    resetGame: function() {
        if(confirm("Точно удалить сохранение?")) {
            localStorage.removeItem("rpg_save_v2");
            location.reload();
        }
    }
};

window.onload = () => Game.init();
