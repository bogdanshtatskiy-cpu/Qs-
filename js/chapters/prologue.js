// Мы расширяем объект сцен глобального движка
Object.assign(Game.scenes, {
    
    "intro_01": {
        text: "Мир Этерии. Год 482-й от Падения Небес.\n\nПеред тем как твоя судьба переплетется с историей этого мира, назови себя.",
        type: "input",
        next: "intro_lore"
    },

    "intro_lore": {
        text: "Добро пожаловать, {name}.\nИстория начинается в сыром подвале долговой тюрьмы города Ривергард. Ты не помнишь, как здесь оказался.",
        choices: [
            { text: "Открыть глаза", next: "prison_wakeup" }
        ]
    },

    "prison_wakeup": {
        text: "Голова раскалывается. Вокруг темно и пахнет плесенью. Ты лежишь на соломе. Почему ты здесь?",
        choices: [
            { text: "Меня подставили (Интеллект +1)", next: "origin_smart", effect: {stat: "intellect", val: 1} },
            { text: "Драка в таверне (Сила +1)", next: "origin_strong", effect: {stat: "strength", val: 1} },
            { text: "Я вор (Ловкость +1)", next: "origin_fast", effect: {stat: "agility", val: 1} }
        ]
    },

    "origin_smart": {
        text: "Ты был писарем. Ты нашел документы о хищениях золота бароном. Тебя убрали, чтобы ты молчал.",
        choices: [{ text: "Осмотреться", next: "cell_inspect" }]
    },
    "origin_strong": {
        text: "Сержант стражи оскорбил тебя. Ты сломал ему нос. Теперь ты здесь.",
        choices: [{ text: "Осмотреться", next: "cell_inspect" }]
    },
    "origin_fast": {
        text: "Голод заставил тебя украсть хлеб. Но тебя поймали.",
        choices: [{ text: "Осмотреться", next: "cell_inspect" }]
    },

    "cell_inspect": {
        text: "Камера из странного серого камня. В углу лежит скелет в кандалах.",
        choices: [
            { text: "Обыскать скелет", next: "search_skeleton" },
            { text: "Послушать у двери", next: "listen_door" }
        ]
    },

    "search_skeleton": {
        text: "На пальце скелета кольцо с гербом расколотого щита.",
        actions: [{type: "addItem", item: "Кольцо 'Расколотый щит'"}],
        choices: [
            { text: "Взять кольцо", next: "listen_door" }
        ]
    },

    "listen_door": {
        text: "Ты слышишь шаги тяжелых латных сапог. Кто-то идет к твоей двери. \n\n(Это конец файла prologue.js. Мы создадим следующий файл для главы 1, когда ты скажешь).",
        choices: [] // Тупик пока не напишем продолжение
    }

});
