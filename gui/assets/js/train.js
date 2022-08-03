/**
 * @file BCI command trainer
 * @author Pierre Clisson <pierre@clisson.com>
 */

'use strict';


/**
 * A BCI command trainer
 */
class Training {

    /**
     * Initialize
     *
     * @param {Object} [io] - a Timeflux IO instance
     * @param {Object} [options]
     * @param {number} [options.blocks_per_session] - number of blocks per session
     * @param {number} [options.instructions_per_block] - number of instructions per block
     * @param {Object} [options.duration]
     * @param {number} [options.duration.prep] - preparation duration before session starts, in ms
     * @param {number} [options.duration.rest] - rest duration between blocks, in ms
     * @param {number} [options.duration.on] - duration of the instruction message, in ms
     * @param {number} [options.duration.off] - blank screen duration after each instruction, in ms
     * @param {string[]} [options.instructions] - list of instructions
     */
    constructor(io, options = {}) {

        // Default options
        let default_options = {
            blocks_per_session: 3,
            instructions_per_block: 10,
            duration: {
                prep: 5000,
                rest: 10000,
                on: 3000,
                off: 2000
            },
            instructions: [
                'Clench your LEFT fist',
                'Clench your RIGHT fist',
                'BLINK once'
            ]
        }

        // Do not merge messages
        if (Array.isArray(options.instructions)) {
            default_options.instructions = [];
        }

        // Merge options
        this.options = merge(default_options, options);
        this.io = io;

        // Get HTML elements handlers
        this.marker = document.getElementById("marker");
        this.message = document.getElementById("message");

        // Infinite scheduler to work around Chrome bug
        this.scheduler = new Scheduler();
    }

    async start() {
        this.scheduler.start();
        this.marker.classList.toggle('hidden');
        await sleep(this.options.duration.prep);
        this.marker.classList.toggle('hidden');
        for (let block = 0; block < this.options.blocks_per_session; block++) {
            this.io.event('block_begins');
            for (let instruction = 0; instruction < this.options.instructions_per_block; instruction++) {
                await this.scheduler.asap(() => {
                    let id = Math.floor(Math.random() * this.options.instructions.length);
                    let message = this.options.instructions[id];
                    this.message.innerHTML = message;
                    this.io.event('instruction_begins', { id: id, message: message });
                });
                await sleep(this.options.duration.on);
                await this.scheduler.asap(() => {
                    this.message.innerHTML = "";
                    this.io.event('instruction_ends');
                });
                await sleep(this.options.duration.off);
            }
            this.io.event('block_ends');
            if (block + 1 < this.options.blocks_per_session) {
                this.marker.classList.toggle('hidden');
                await sleep(this.options.duration.rest);
                this.marker.classList.toggle('hidden');
                await sleep(this.options.duration.off);
            }
        }
        this.scheduler.stop();
    }
}



