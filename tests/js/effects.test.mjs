import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createEffects} from '../../amd/src/effects.js';

test('reset restores original inline values and priorities, excludes editor and widget', () => {
    const dom = new JSDOM('<body><main><p style="font-size: 20px !important; color: red">Text</p>' +
        '<div contenteditable="true"><p>Edit</p></div><span class="icon">icon</span></main>' +
        '<div id="sis-a11y-root"><p>Widget</p></div></body>');
    const doc = dom.window.document;
    const paragraph = doc.querySelector('p');
    const before = paragraph.getAttribute('style');
    const effects = createEffects(doc);
    effects.apply({fontsize: 1.5, bold: true, darkcontrast: true});
    assert.equal(paragraph.style.fontSize, '30px');
    assert.equal(doc.querySelector('[contenteditable] p').getAttribute('style'), null);
    assert.equal(doc.querySelector('#sis-a11y-root p').getAttribute('style'), null);
    effects.apply({fontsize: 2});
    assert.equal(paragraph.style.fontSize, '40px');
    effects.reset();
    assert.equal(paragraph.getAttribute('style'), before);
    assert.equal(doc.querySelector('.icon').getAttribute('style'), null);
    effects.destroy();
});
test('new AJAX content is adjusted once and reset restores styles', async () => {
    const dom = new JSDOM('<body><main><p style="font-size: 16px">First</p></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({fontsize: 2, links: true});
    const p = doc.createElement('p');
    p.style.fontSize = '18px';
    doc.querySelector('main').append(p);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(p.style.fontSize, '36px');
    effects.apply({fontsize: 2});
    assert.equal(p.style.fontSize, '36px');
    effects.destroy();
    assert.equal(p.style.fontSize, '18px');
});
test('AJAX content inside a filtered block is not filtered twice and external style changes survive reset', async () => {
    const dom = new JSDOM('<body><main><p style="color:red">First</p></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({monochrome: true, bold: true});
    const main = doc.querySelector('main');
    assert.equal(main.style.filter, 'grayscale(100%)');
    const img = doc.createElement('img');
    main.append(img);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(img.style.filter, '');
    doc.querySelector('p').style.margin = '5px';
    effects.reset();
    assert.equal(doc.querySelector('p').style.margin, '5px');
    assert.equal(doc.querySelector('p').style.color, 'red');
    assert.equal(main.style.filter, '');
});
test('removed AJAX nodes restore before reinsertion and never compound scale', async () => {
    const dom = new JSDOM('<body><main><p style="font-size: 20px">Reusable</p></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    const p = doc.querySelector('p');
    effects.apply({fontsize: 2});
    p.remove();
    const another = doc.createElement('div');
    doc.querySelector('main').append(another);
    await new Promise(resolve => setTimeout(resolve, 20));
    doc.querySelector('main').append(p);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(p.style.fontSize, '40px');
    effects.destroy();
    assert.equal(p.style.fontSize, '20px');
});
test('highlights preserve native focus outlines and animation pause uses static CSS', () => {
    const dom = new JSDOM('<body><main><a href="#" style="outline:3px solid green">Link</a></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({links: true, animations: true});
    assert.equal(doc.querySelector('a').style.outline, '3px solid green');
    assert.equal(doc.querySelectorAll('style').length, 0);
    assert.ok(doc.documentElement.classList.contains('sis-a11y-animations'));
    effects.reset();
    assert.ok(!doc.documentElement.classList.contains('sis-a11y-animations'));
});
test('direct text in Moodle content divs receives text tools', () => {
    const dom = new JSDOM('<body><main><div class="no-overflow" style="font-size:20px">Description</div></main></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({fontsize: 1.5, bold: true});
    assert.equal(doc.querySelector('.no-overflow').style.fontSize, '30px');
    effects.destroy();
    assert.equal(doc.querySelector('.no-overflow').style.fontSize, '20px');
});
const MOODLE = '<body id="page-login-index"><div class="toast-wrapper fixed-top"></div>' +
    '<div id="page-wrapper"><nav class="navbar fixed-top" style="position:fixed"><a href="#">Home</a></nav>' +
    '<div class="drawer" style="position:fixed"><p>Index</p></div>' +
    '<img class="bg" style="position:fixed" src="x.png">' +
    '<div id="page" style="background-color: rgb(255, 0, 0)"><div id="page-content" style="background-color: rgb(255, 255, 255)">' +
    '<div class="logo"><img src="l.png"></div><div class="intro">Plain words</div>' +
    '<div id="sis-a11y-root" style="position:fixed"><button>Tool</button></div>' +
    '<div class="formbox"><input id="u" style="background-color: rgb(250, 250, 250); color: rgb(1, 2, 3)"><label>Name</label></div>' +
    '</div></div><footer id="page-footer">Footer</footer></div></body>';
const filtered = doc => [...doc.querySelectorAll('*')].filter(el => el.style.filter).map(el => el.id || el.className || el.tagName);

test('filters wrap top-level blocks around fixed UI and the widget, never html, body or their ancestors', () => {
    const dom = new JSDOM(MOODLE);
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({monochrome: true});
    for (const el of ['html', 'body', '#page-wrapper', '#page', '#page-content', '#sis-a11y-root']) {
        assert.equal(doc.querySelector(el).style.filter, '', el);
    }
    assert.equal(doc.querySelector('.navbar').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('.drawer').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('.bg').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('.logo').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('.intro').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('.formbox').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('#page-footer').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('#sis-a11y-root button').getAttribute('style'), null);
    effects.reset();
    assert.deepEqual(filtered(doc), []);
    effects.destroy();
});
test('filter blocks with no fixed UI in a login-like page without main content are covered', () => {
    const dom = new JSDOM('<body><div id="page-wrapper"><div id="page-content"><div class="logo"><img src="a.png"></div>' +
        '<h1>Login</h1></div></div></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({lowsaturation: true});
    assert.equal(doc.querySelector('#page-wrapper').style.filter, 'saturate(50%)');
    assert.equal(doc.querySelector('#page-content').style.filter, '');
    effects.destroy();
});
test('page background colours of descended containers are re-tinted and restored', () => {
    const dom = new JSDOM(MOODLE);
    const doc = dom.window.document;
    doc.body.style.backgroundColor = 'rgb(255, 0, 0)';
    const effects = createEffects(doc);
    effects.apply({monochrome: true});
    assert.equal(doc.body.style.backgroundColor, 'rgb(54, 54, 54)');
    assert.equal(doc.querySelector('#page').style.backgroundColor, 'rgb(54, 54, 54)');
    effects.apply({highsaturation: true});
    assert.notEqual(doc.body.style.backgroundColor, 'rgb(54, 54, 54)');
    effects.reset();
    assert.equal(doc.body.style.backgroundColor, 'rgb(255, 0, 0)');
    assert.equal(doc.querySelector('#page').style.backgroundColor, 'rgb(255, 0, 0)');
    effects.destroy();
});
test('modals added to the body receive the filter while the widget and body stay untouched', async () => {
    const dom = new JSDOM(MOODLE);
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({highcontrast: true});
    const modal = doc.createElement('div');
    modal.className = 'modal';
    modal.style.position = 'fixed';
    modal.innerHTML = '<p>Dialog</p>';
    doc.body.append(modal);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(modal.style.filter, 'contrast(125%)');
    assert.equal(modal.querySelector('p').style.filter, '');
    assert.equal(doc.body.style.filter, '');
    effects.destroy();
    assert.equal(modal.getAttribute('style'), 'position: fixed;');
});
test('sis-a11y nodes (root, guide, structure, aids) are never styled or filtered', () => {
    const dom = new JSDOM('<body><div id="page"><p>Text</p><div id="sis-a11y-structure" style="position:fixed"><h2>Headings</h2></div>' +
        '<div class="sis-a11y-aids"><span>Aid</span></div></div></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({monochrome: true, bold: true, fontsize: 2, guide: true});
    assert.equal(doc.querySelector('#sis-a11y-structure').getAttribute('style'), 'position:fixed');
    assert.equal(doc.querySelector('#sis-a11y-structure h2').getAttribute('style'), null);
    assert.equal(doc.querySelector('.sis-a11y-aids').getAttribute('style'), null);
    assert.equal(doc.querySelector('.sis-a11y-aids span').getAttribute('style'), null);
    assert.equal(doc.querySelector('#page').style.filter, '');
    assert.equal(doc.querySelector('p').style.filter, 'grayscale(100%)');
    assert.ok(!doc.documentElement.matches('[class*="sis-a11y"]:not(html)'));
    effects.destroy();
});
test('contrast tools repaint every opaque surface and the canvas, keep inputs, and restore on reset', () => {
    const dom = new JSDOM(MOODLE);
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({darkcontrast: true});
    assert.equal(doc.body.style.backgroundColor, 'rgb(0, 0, 0)');
    assert.equal(doc.querySelector('#page').style.backgroundColor, 'rgb(0, 0, 0)');
    assert.equal(doc.querySelector('#page-content').style.backgroundColor, 'rgb(0, 0, 0)');
    assert.equal(doc.querySelector('.intro').style.color, 'rgb(255, 255, 255)');
    assert.equal(doc.querySelector('label').style.color, 'rgb(255, 255, 255)');
    assert.equal(doc.querySelector('#u').getAttribute('style'), 'background-color: rgb(250, 250, 250); color: rgb(1, 2, 3)');
    assert.equal(doc.querySelector('#sis-a11y-root').getAttribute('style'), 'position:fixed');
    effects.apply({lightcontrast: true});
    assert.equal(doc.body.style.backgroundColor, 'rgb(255, 255, 255)');
    assert.equal(doc.querySelector('#page').style.backgroundColor, 'rgb(255, 255, 255)');
    assert.equal(doc.querySelector('.intro').style.color, 'rgb(0, 0, 0)');
    effects.reset();
    assert.equal(doc.body.getAttribute('style'), null);
    assert.equal(doc.querySelector('#page').style.backgroundColor, 'rgb(255, 0, 0)');
    assert.equal(doc.querySelector('.intro').getAttribute('style'), null);
    effects.destroy();
});
test('text tools reach any element with its own text and skip icon fonts', () => {
    const dom = new JSDOM('<body><div id="page"><strong style="font-size:10px">Bold</strong><u>Under</u>' +
        '<div class="empty"></div><div class="note">Note <b>x</b></div><i class="fa fa-user">u</i>' +
        '<span style="font-family: FontAwesome">f</span></div></body>');
    const doc = dom.window.document;
    const effects = createEffects(doc);
    effects.apply({fontsize: 2, letterspacing: true, dyslexia: true});
    assert.equal(doc.querySelector('strong').style.fontSize, '20px');
    assert.equal(doc.querySelector('u').style.letterSpacing, '2px');
    assert.equal(doc.querySelector('.note').style.letterSpacing, '2px');
    assert.equal(doc.querySelector('.empty').getAttribute('style'), null);
    assert.equal(doc.querySelector('.fa').getAttribute('style'), null);
    assert.equal(doc.querySelector('span').getAttribute('style'), 'font-family: FontAwesome');
    effects.destroy();
    assert.equal(doc.querySelector('strong').getAttribute('style'), 'font-size:10px');
});
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
const SECTION = '<body><div id="page"><section id="section" style="color: red; font-size: 16px"><p style="font-size: 16px">Plain</p></section></div>' +
    '<div id="sis-a11y-root" style="position:fixed"><button>Tool</button></div></body>';

test('fixed toolbar inserted under a filtered section splits the filter so it keeps its viewport anchor', async () => {
    const dom = new JSDOM(SECTION);
    const doc = dom.window.document;
    const section = doc.querySelector('#section');
    const before = doc.documentElement.outerHTML;
    const effects = createEffects(doc);
    effects.apply({monochrome: true, fontsize: 2, bold: true});
    assert.equal(doc.querySelector('#page').style.filter, 'grayscale(100%)');
    const toolbar = doc.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.style.position = 'fixed';
    toolbar.style.top = '10px';
    toolbar.innerHTML = '<span style="font-size: 16px">Bold</span>';
    section.append(toolbar);
    await settle();
    // No ancestor of the fixed toolbar keeps a filter, so its containing block stays the viewport.
    for (let el = toolbar.parentElement; el; el = el.parentElement) {
        assert.equal(el.style.filter, '', el.id || el.tagName);
    }
    assert.equal(toolbar.style.filter, 'grayscale(100%)');
    assert.equal(toolbar.style.top, '10px');
    assert.equal(toolbar.style.position, 'fixed');
    // Previously covered siblings keep their coverage and nothing is scaled twice.
    assert.equal(doc.querySelector('#section > p').style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('#section > p').style.fontSize, '32px');
    assert.equal(section.style.fontSize, '16px');
    assert.equal(section.style.color, 'red');
    assert.equal(toolbar.querySelector('span').style.fontSize, '32px');
    assert.equal(doc.querySelector('#sis-a11y-root').getAttribute('style'), 'position:fixed');
    assert.equal(doc.querySelector('#sis-a11y-root button').getAttribute('style'), null);
    effects.reset();
    toolbar.remove();
    assert.equal(doc.documentElement.outerHTML, before);
    effects.destroy();
});
test('editors and the widget inserted under a filtered block also split it, and later content is still covered', async () => {
    const dom = new JSDOM(SECTION);
    const doc = dom.window.document;
    const section = doc.querySelector('#section');
    const effects = createEffects(doc);
    effects.apply({highsaturation: true});
    const editor = doc.createElement('div');
    editor.className = 'tox';
    editor.innerHTML = '<p>Editing</p>';
    section.append(editor);
    await settle();
    assert.equal(doc.querySelector('#page').style.filter, '');
    assert.equal(section.style.filter, '');
    assert.equal(editor.style.filter, '');
    assert.equal(doc.querySelector('#section > p').style.filter, 'saturate(200%)');
    const later = doc.createElement('p');
    section.append(later);
    await settle();
    assert.equal(later.style.filter, 'saturate(200%)');
    const nestedWidget = doc.createElement('div');
    nestedWidget.id = 'sis-a11y-structure';
    nestedWidget.style.position = 'fixed';
    doc.querySelector('#page').append(nestedWidget);
    await settle();
    assert.equal(nestedWidget.getAttribute('style'), 'position: fixed;');
    effects.destroy();
    assert.equal(section.getAttribute('style'), 'color: red; font-size: 16px');
    assert.equal(doc.querySelector('#section > p').getAttribute('style'), 'font-size: 16px');
});
test('an inserted fixed element with an existing filter keeps it and a split block restores its own author filter', async () => {
    const dom = new JSDOM('<body><div id="page" style="filter: blur(1px)"><p>Text</p></div></body>');
    const doc = dom.window.document;
    const page = doc.querySelector('#page');
    const effects = createEffects(doc);
    effects.apply({monochrome: true});
    assert.equal(page.style.filter, 'blur(1px) grayscale(100%)');
    const bar = doc.createElement('div');
    bar.style.position = 'fixed';
    page.append(bar);
    await settle();
    assert.equal(page.style.filter, 'blur(1px)');
    assert.equal(bar.style.filter, 'grayscale(100%)');
    assert.equal(doc.querySelector('p').style.filter, 'grayscale(100%)');
    effects.destroy();
    assert.equal(page.getAttribute('style'), 'filter: blur(1px)');
});

test('reading focus has a 60px window, follows the pointer and clamps to the viewport', () => {
    const dom = new JSDOM('<body><p>Content</p><div id="sis-a11y-root"></div></body>');
    const {document: doc} = dom.window;
    const effects = createEffects(doc);
    effects.apply({guide: true});
    const guide = doc.getElementById('sis-a11y-guide');
    assert.equal(doc.documentElement.style.getPropertyValue('--sis-guide-height'), '60px');
    assert.equal(guide.style.top, `${(dom.window.innerHeight - 60) / 2}px`);
    dom.window.dispatchEvent(new dom.window.MouseEvent('pointermove', {clientY: 200}));
    assert.equal(guide.style.top, '170px');
    dom.window.dispatchEvent(new dom.window.MouseEvent('pointermove', {clientY: 0}));
    assert.equal(guide.style.top, '0px');
    dom.window.dispatchEvent(new dom.window.MouseEvent('pointermove', {clientY: 9999}));
    assert.equal(guide.style.top, `${dom.window.innerHeight - 60}px`);
    effects.reset();
    assert.equal(doc.getElementById('sis-a11y-guide'), null);
    assert.equal(doc.documentElement.style.getPropertyValue('--sis-guide-height'), '');
    assert.equal(doc.documentElement.classList.contains('sis-a11y-guide-on'), false);
});

test('reading focus follows keyboard focus and cleans up resize and focus listeners', () => {
    const dom = new JSDOM('<body><a href="#">Content</a></body>');
    const {document: doc} = dom.window;
    const target = doc.querySelector('a');
    target.getBoundingClientRect = () => ({top: 120, height: 20});
    const effects = createEffects(doc);
    effects.apply({guide: true});
    target.focus();
    assert.equal(doc.getElementById('sis-a11y-guide').style.top, '100px');
    Object.defineProperty(dom.window, 'innerHeight', {value: 40, configurable: true});
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.equal(doc.documentElement.style.getPropertyValue('--sis-guide-height'), '40px');
    assert.equal(doc.getElementById('sis-a11y-guide').style.top, '0px');
    effects.destroy();
    target.dispatchEvent(new dom.window.FocusEvent('focusin', {bubbles: true}));
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.equal(doc.documentElement.hasAttribute('style'), false);
});
