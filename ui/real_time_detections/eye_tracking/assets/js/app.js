'use strict';

let io = new IO();
io.on('connect', function () {
    console.log('Connected');
});