'use strict';

const app = location.pathname.split('/')[1];
const button = document.getElementById('start');
const message = document.getElementById('message');
const main = document.getElementById('wrapper');

let training = null;
let grid = null;

let blink = {
    min_delay: 50,
    max_delay: 500,
    last_event: 0,
    status: 0,
    timeout: null
};

(async () => {

    let settings = await load_settings();
    settings = settings[app];

    let io = new IO();
    io.on('connect', () => io.event('session_begins', settings));
    window.onbeforeunload = () => io.event('session_ends');
    io.subscribe('model');
    io.on('model', on_message);

    button.addEventListener('click', async () => {
        button.classList.toggle('hidden');
        training = new Training(io, settings.training);
        io.event('training_begins', training.options);
        await training.start();
        io.event('training_ends');
        message.innerHTML = '<em>Please wait</em>';
    });

    window.addEventListener('keydown', (event) => {
        if (['0', '1', '2'].includes(event.key)) {
            on_prediction(parseInt(event.key));
        }
        const commands = {
            ArrowRight: 'right',
            ArrowLeft: 'left',
            w: 'flip',
            x: 'select',
            c: 'toggle'
        }
        const command = commands[event.key];
        if (command) grid._update(command);
    })

    function on_message(data, meta) {
        for (let row of Object.values(data)) {
            switch (row.label) {
                case 'ready':
                    message.innerHTML = '';
                    main.classList.toggle('hidden');
                    grid = new Grid(io, settings.grid);
                    io.event('grid_begins', grid.options);
                    break;
                case 'predict':
                    on_prediction(row.data.target);
                    break;
            }
        }
    }

    function on_prediction(prediction) {
        switch(prediction) {
            case 0:
                if (blink.timeout) clearTimeout(blink.timeout);
                blink.status = 0;
                grid._update('left');
                break;
            case 1:
                if (blink.timeout) clearTimeout(blink.timeout);
                blink.status = 0;
                grid._update('right');
                break;
            case 2:
                let now = performance.now();
                if (now < (blink.last_event + blink.min_delay)) return;
                blink.last_event = now;
                if (blink.timeout) clearTimeout(blink.timeout);
                blink.status++;
                if (blink.status == 3) {
                    blink.status = 0;
                    grid._update('toggle');
                } else {
                    blink.timeout = setTimeout(() => {
                        if (blink.status == 1) {
                            grid._update('flip');
                        }
                        else if (blink.status == 2) {
                            grid._update('select');
                        }
                        blink.status = 0;
                    }, blink.max_delay)
                }
                break;
        }
    }

})()


/**
 * Set a CSS variable
 *
 * @param {string} variable name
 * @param {string|number} value
 */
function set_css_var(name, value) {
    document.documentElement.style.setProperty(name, value);
}

/**
 * Get a CSS variable
 *
 * @param {string} variable name
 */
function get_css_var(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/**
 * Text to speech synthesis
 *
 * @param {string} text
 */
function speak(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}
