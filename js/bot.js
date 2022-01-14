gameStats.damage = 0;
gameStats.bossDamage = 0;
gameStats.games = 1;
gameStats.wins = 1;
gameStats.time = Date.now();

// auto select boss
var selectionInterval = setTimeout(() => {
    if (document.getElementById('editor')) {
        assign('X1', 2, 3);
        clearInterval(selectionInterval);
    }
}, 50);

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

let busy = false;
const manageObserver = async () => {
    if (busy) return;
    busy = true;
    await (new Promise(r => setTimeout(r, 1000)));
    const btn = document.getElementById('testbtn');
    const rater = document.getElementById('winrate').getElementsByTagName('a')[0];

    if (btn.value === 'Test') {
        //if (!(Game.Minions)&&!(Game.Bosses)) return;
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
            busy = false;
            return;
        }
        btn.click();
        gameStats.wins += 1;
        //enemiesDecoratorSetup();
    }
    busy = false;

};

const observer = new MutationObserver(manageObserver);
observer.observe(document.getElementById('testbtn'), {
    subtree: true,
    attributes: true,
    childList: false,
    characterData: false
});

const getInputs = () => {
    let input = {
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
        enNearAngle: 0
    };
    const sortMap = {
        false: 1,
        true: -1
    };
    if (Game.Minions.length) {
        const nearestMinion = Game.Minions.sort((a, b) => {
            const aDist = Math.abs(a.x - input.playerX) + Math.abs(a.y - input.playerY);
            const bDist = Math.abs(b.x - input.playerX) + Math.abs(b.y - input.playerY);
            return sortMap[aDist < bDist]; // ? -1 : ((bDist < aDist) ? 1 : 0)
        })[0];
        input.minNearDx = input.playerX - nearestMinion.x;
        input.minNearDy = input.playerY - nearestMinion.y;
        input.minNearD = Math.sqrt(input.minNearDx ** 2 + input.minNearDy ** 2);
        input.minNearAngle = Math.atan2(input.minNearDy, input.minNearDx); //Math.atan(input.minNearDy/input.minNearDx);
    }
    if (Game.Bosses.length) {
        const boss = Game.Bosses.sort((a, b) => {
            const aDist = Math.abs(a.x - input.playerX) + Math.abs(a.y - input.playerY);
            const bDist = Math.abs(b.x - input.playerX) + Math.abs(b.y - input.playerY);
            return sortMap[aDist < bDist]; //(aDist<bDist) ? -1 : ((bDist < aDist) ? 1 : 0)
        })[0];
        input.bossDx = input.playerX - boss.x;
        input.bossDy = input.playerY - boss.y;
        input.bossD = Math.sqrt(input.bossDx ** 2 + input.bossDy ** 2);
        input.bossAngle = Math.atan2(input.bossDy, input.bossDx);
    }
    if (Game.enemyBullets.length) {
        const nearestProjectile = Game.enemyBullets.sort((a, b) => {
            const aDist = Math.abs(a.x - input.playerX) + Math.abs(a.y - input.playerY);
            const bDist = Math.abs(b.x - input.playerX) + Math.abs(b.y - input.playerY);
            return sortMap[aDist < bDist]; //(aDist<bDist) ? -1 : ((bDist < aDist) ? 1 : 0)
        })[0];
        input.enNearDx = input.playerX - nearestProjectile.x;
        input.enNearDy = input.playerY - nearestProjectile.y;
        input.enNearD = Math.sqrt(input.enNearDx ** 2 + input.enNearDy ** 2);
        input.enNearAngle = Math.atan2(input.enNearDy, input.enNearDx);
    }
    const time = Date.now() - gameStats.time;
    const score = 20 * gameStats.bossDamage + 10 * gameStats.kill + 5 * gameStats.hit - 1 * gameStats.bullet - 5 * gameStats.damage - time / 100;
    input.score = score;
    return input;
};


const KEYS = { // id + keyCode
    moveUp: [0, 87],
    moveDown: [1, 83],
    moveLeft: [2, 65],
    moveRight: [3, 68],
    fireLeft: [4, 37],
    fireUp: [5, 38],
    fireRight: [6, 39],
    fireDown: [7, 40],
};

const convertToArr = (inputs) => {
    const inputMap = ['hp', 'playerX', 'playerY', 'bossDx', 'bossDy', 'bossD', 'bossAngle', 'minNearDx', 'minNearDy', 'minNearD', 'minNearAngle', 'enNearDx', 'enNearDy', 'enNearD', 'enNearAngle', 'score'];
    const inputArr = [];
    for (let i = 0; i < inputMap.length; i++) {
        inputArr.push(inputs[inputMap[i]]);
    }
    return inputArr;
}

setInterval(() => {
    // from keybind.js
    if (document.getElementById('testbtn').value === 'Test') return;
    const inputs = convertToArr(getInputs());
    const boolMap = {
        false: 0,
        true: 1
    };
    const keys = [keyW, keyA, keyS, keyD, keyLeft, keyUp, keyRight, keyDown].map(e => boolMap[e]);
    records.push(inputs.concat(keys));
}, 100);

const getAction = async (inputs) => {
    //const actions = [];
    //for (let k in KEYS) {
    //	actions.push(k);
    //}
    //const action = actions[Math.floor(Math.random()*actions.length)];
    const actions = forwardNN(convertToArr(inputs));
    const funcMap = {
        false: indexOfMax,
        true: indexOfProb
    };
    //console.log(actions);
    let moveAction1 = funcMap[Math.random() < 0.8](actions.slice(0, 3));
    if (moveAction1 === 2) moveAction1 = -1; // vertical
    let moveAction2 = 2 + funcMap[Math.random() < 0.8](actions.slice(3, 6));
    if (moveAction2 === 4) moveAction2 = -1; // horizontal
    let fireAction = 4 + funcMap[Math.random() < 0.2](actions.slice(6, 11));
    if (fireAction === 8) fireAction = -1;
    return [moveAction1, moveAction2, fireAction]; //KEYS[action];
}

let working = false;

const activate = () => {
    working = !working;
};

document.addEventListener(
    "keydown",
    (e) => {
        if (e.keyCode === 9) {
            e.preventDefault();
            activate();
        }
    },
    false
);

document.getElementById('editorlink').getElementsByTagName('a')[0].addEventListener('click', function() {
    activate();
    const textMap = {
        'ACTIVATE BOT': 'TURN OFF',
        'TURN OFF': 'ACTIVATE BOT'
    };
    const colorMap = {
        '': 'green',
        green: ''
    };
    this.style.backgroundColor = colorMap[this.style.backgroundColor];
    this.textContent = textMap[this.textContent];
});

setInterval(async () => {
    if (!working) return;
    const actions = await getAction(getInputs());
    //console.log(actions);
    const keyMap = {
        false: 'keyup',
        true: 'keydown'
    };
    const boolMap = [0, 0, 1, 1, 2, 2, 2, 2];
    for (let k in KEYS) {
        const value = KEYS[k];
        const keyAction = keyMap[actions[boolMap[value[0]]] === value[0]];
        const keyEv = new KeyboardEvent(keyAction, {
            'keyCode': value[1],
            'which': value[1]
        });
        window.dispatchEvent(keyEv);
    };
}, 100);


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
