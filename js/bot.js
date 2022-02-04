gameStats.damage = 0;
gameStats.bossDamage = 0;
gameStats.games = 1;
gameStats.wins = 1;
gameStats.time = Date.now();

const GLOBALS = {
    KEYS: { // id + keyCode
        moveUp: [0, 87],
        moveDown: [1, 83],
        moveLeft: [2, 65],
        moveRight: [3, 68],
        fireLeft: [4, 37],
        fireUp: [5, 38],
        fireRight: [6, 39],
        fireDown: [7, 40],
    },
    inputMap: ['hp', 'playerX', 'playerY', 'bossDx', 'bossDy', 'bossD', 'bossAngle',
        'minNearDx', 'minNearDy', 'minNearD', 'minNearAngle',
        'enNearDx', 'enNearDy', 'enNearD', 'enNearAngle',
        'itemDx', 'itemDy', 'itemD', 'itemAngle', 'itemType',
        'min2NearDx', 'min2NearDy', 'min2NearD', 'min2NearAngle',
        'score'
    ],
    itemTypeMap: {
        'Coin': 0,
        'Nickel': 0,
        'Dime': 1,
        'Half Heart': 1,
        'Heart': 2,
        'Soul Heart': 3
    },
    textMap: {
        'ACTIVATE BOT': 'TURN OFF',
        'TURN OFF': 'ACTIVATE BOT'
    },
    colorMap: {
        '': 'green',
        green: ''
    },
    keyMap: {
        false: 'keyup',
        true: 'keydown'
    },
    sortMap: {
        false: 1,
        true: -1
    },
    actionMap: [0, 0, 1, 1, 2, 2, 2, 2],
    boolMap: {
        false: 0,
        true: 1
    },
    funcMap: {
        false: indexOfMax,
        true: indexOfProb
    },
    working: false,
    calc: false,
    busy: false,
}

const diff = (x, y) => x - y;

const dist = (x, y) => Math.sqrt(x ** 2 + y ** 2);

const angle = (x, y) => Math.atan2(x, y);

var _damager = Player.getDamage;
Player.getDamage = function(dmg, enemyx, enemyy) {
    gameStats.damage += dmg;
    return _damager.call(this, dmg, enemyx, enemyy);
};

setInterval(() => {
    if (!Game) return;
    if (!Game.enemies) manageObserver();
}, 1000);

var bossDecoratorSetup = () => {
    if (document.getElementById('testbtn').value === 'Test') return;
    if (!Game.Bosses.length) return;
    if (Game.Bosses[0].modified) return;
    Game.Bosses[0].modified = true;
    var _damager = Game.Bosses[0].getDamage;
    Game.Bosses[0].getDamage = function(dmg) {
        gameStats.bossDamage += dmg;
        const result = _damager.call(this, dmg);
        if (Game.enemies === 0) manageObserver();
        return result;
    };
};

const records = [];

const manageObserver = async () => {
    if (GLOBALS.busy) return;
    GLOBALS.busy = true;
    await (new Promise(r => setTimeout(r, 1000)));
    const btn = document.getElementById('testbtn');
    const rater = document.getElementById('winrate').getElementsByTagName('a')[0];

    if (btn.value === 'Test') {
        btn.click();
        rater.textContent = (100 * Number((gameStats.wins - 1) / gameStats.games).toPrecision(4));
        gameStats.games += 1;
        gameStats.bullet = 0;
        gameStats.hit = 0;
        gameStats.kill = 0;
        gameStats.damage = 0;
        gameStats.bossDamage = 0;
        gameStats.time = Date.now();
    } else {
        bossDecoratorSetup();
        if (Game.enemies) {
            GLOBALS.busy = false;
            return;
        }
        btn.click();
        gameStats.wins += 1;
    }
    GLOBALS.busy = false;

};

const observer = new MutationObserver(manageObserver);
observer.observe(document.getElementById('testbtn'), {
    subtree: true,
    attributes: true,
    childList: false,
    characterData: false
});

const getPriorInputs = () => {
    return {
        hp: Player.hp,
        playerX: Player.x,
        playerY: Player.y,
        bossDx: 1000,
        bossDy: 1000,
        bossD: -1000,
        bossAngle: 0,
        minNearDx: 1000,
        minNearDy: 1000,
        minNearD: -1000,
        minNearAngle: 0,
        enNearDx: 1000,
        enNearDy: 1000,
        enNearD: -1000,
        enNearAngle: 0,
        itemDx: 1000,
        itemDy: 1000,
        itemD: -1000,
        itemAngle: 0,
        itemType: -1,
        min2NearDx: 1000,
        min2NearDy: 1000,
        min2NearD: -1000,
        min2NearAngle: 0,
    };
};

const getInputs = () => {
    const time = Date.now() - gameStats.time;

    const input = getPriorInputs();

    input.score = 20 * gameStats.bossDamage + 10 * gameStats.kill + 5 * gameStats.hit - 2 * gameStats.bullet - 5 * gameStats.damage - time / 100;

    if (!Game) return input;

    const comparator = (a, b) => {
        const aDist = Math.abs(a.x - input.playerX) + Math.abs(a.y - input.playerY);
        const bDist = Math.abs(b.x - input.playerX) + Math.abs(b.y - input.playerY);
        return GLOBALS.sortMap[aDist < bDist]; // ? -1 : ((bDist < aDist) ? 1 : 0)
    };

    const getStats = (x, y) => {
        const dX = diff(input.playerX, x);
        const dY = diff(input.playerY, y);
        const dE = dist(dX, dY);
        const aXY = angle(dY, dX);
        return [dX, dY, dE, aXY];
    };

    if (Game.Minions.length) {
        const nearestMinion = Game.Minions.sort(comparator);
        [input.minNearDx, input.minNearDy, input.minNearD, input.minNearAngle] = getStats(nearestMinion[0].x, nearestMinion[0].y);
        if (nearestMinion.length > 1) {
            [input.min2NearDx, input.min2NearDy, input.min2NearD, input.min2NearAngle] = getStats(nearestMinion[1].x, nearestMinion[1].y);
        }
    }
    if (Game.Bosses.length) {
        const boss = Game.Bosses.sort(comparator)[0];
        [input.bossDx, input.bossDy, input.bossD, input.bossAngle] = getStats(boss.x, boss.y);
    }
    if (Game.enemyBullets.length) {
        const nearestProjectile = Game.enemyBullets.sort(comparator)[0];
        [input.enNearDx, input.enNearDy, input.enNearD, input.enNearAngle] = getStats(nearestProjectile.x, nearestProjectile.y);
    }
    if (Game.Items.length) {
        const item = Game.Items.sort(comparator)[0];
        [input.itemDx, input.itemDy, input.itemD, input.itemAngle] = getStats(item.x, item.y);
        input.itemType = GLOBALS.itemTypeMap[item.type];
    }
    return input;
};

const convertToArr = (inputs) => {
    const inputArr = [];
    for (let i = 0; i < GLOBALS.inputMap.length; i++) {
        inputArr.push(inputs[GLOBALS.inputMap[i]]);
    }
    return inputArr;
}

setInterval(() => {
    // from keybind.js
    if (document.getElementById('testbtn').value === 'Test' && !GLOBALS.busy) return;
    const inputs = convertToArr(getInputs());
    const keys = [keyW, keyA, keyS, keyD, keyLeft, keyUp, keyRight, keyDown].map(e => GLOBALS.boolMap[e]);
    records.push(inputs.concat(keys));
}, 100);

const getAction = async (inputs) => {
    const actions = forwardNN(convertToArr(inputs));
    let moveAction1 = GLOBALS.funcMap[Math.random() < 0.8](actions.slice(0, 3));
    if (moveAction1 === 2) moveAction1 = -1; // vertical
    let moveAction2 = 2 + GLOBALS.funcMap[Math.random() < 0.8](actions.slice(3, 6));
    if (moveAction2 === 4) moveAction2 = -1; // horizontal
    let fireAction = 4 + GLOBALS.funcMap[Math.random() < 0.2](actions.slice(6, 11));
    if (fireAction === 8) fireAction = -1;
    return [moveAction1, moveAction2, fireAction]; //KEYS[action];
}

const activate = () => {
    GLOBALS.working = !GLOBALS.working;
};

document.addEventListener(
    "keydown",
    (e) => {
        if (e.keyCode === 9) {
            e.preventDefault();
            document.getElementById('editorlink').getElementsByTagName('a')[0].click();
        }
        if (e.keyCode === 192) {
            e.preventDefault();
            saveRecords(records);
        }
    },
    false
);

document.getElementById('editorlink').getElementsByTagName('a')[0].addEventListener('click', function() {
    activate();
    this.style.backgroundColor = GLOBALS.colorMap[this.style.backgroundColor];
    this.textContent = GLOBALS.textMap[this.textContent];
});

setInterval(async () => {
    if (!GLOBALS.working || GLOBALS.calc) return;
    GLOBALS.calc = true;
    const actions = await getAction(getInputs());
    for (let k in GLOBALS.KEYS) {
        const value = GLOBALS.KEYS[k];
        const keyAction = GLOBALS.keyMap[actions[GLOBALS.actionMap[value[0]]] === value[0]];
        const keyEv = new KeyboardEvent(keyAction, {
            'keyCode': value[1],
            'which': value[1]
        });
        window.dispatchEvent(keyEv);
    };
    GLOBALS.calc = false;
}, 25);

const blobs = [];
const saveRecords = (records) => {
    if (blobs.length) {
        window.URL.revokeObjectURL(blobs[0][0]);
        blobs[0][1].remove();
    };
    const blobURI = window.URL.createObjectURL(new Blob([JSON.stringify(records.map(e => e.map(v => Number(v.toPrecision(3)))))], {
        type: 'application/json'
    }));
    const atag = document.createElement('a');
    blobs[0] = [blobURI, atag];
    atag.download = `isaac_dataset_${Math.floor(records.length/1000)}k.json`;
    atag.href = blobURI;
    atag.click();
}
