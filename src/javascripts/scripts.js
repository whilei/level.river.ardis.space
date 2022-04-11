// Load jQuery from NPM
import $ from 'jquery';

window.jQuery = $;
window.$ = $;

console.log('hello from console world');

$('h1').first().html('heeeelloooo worlllddd');
