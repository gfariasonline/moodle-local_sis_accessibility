import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createAids} from '../../amd/src/aids.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const setup = html => {
    const dom = new JSDOM('<body>' + html + '<div id="sis-a11y-root"></div></body>', {url: 'https://example.test/moodle'});
    const {window: win} = dom;
    const doc = win.document;
    const aids = createAids(doc, {root: doc.getElementById('sis-a11y-root')});
    return {dom, win, doc, aids};
};
const fire = (win, target, type) => target.dispatchEvent(new win.Event(type, {bubbles: true}));

test('hideimages hides img, picture and CSS background images without touching layout, widget or icons', async () => {
    const {doc, aids} = setup('<main><img id="a" src="a.png" width="40" height="30"><picture><source srcset="b.png">' +
        '<img id="b" src="b.png"></picture><div id="bg" style="background-image:url(c.png);width:50px">Texto</div>' +
        '<div id="grad" style="background-image:linear-gradient(red,blue)">G</div><img id="icon" class="icon" src="i.png">' +
        '<div contenteditable="true"><img id="ed" src="e.png"></div></main>' +
        '<div id="sis-a11y-root"><img id="w" src="w.png"></div>');
    const attr = id => doc.getElementById(id).getAttribute('data-sis-a11y-image');
    const styleBefore = doc.getElementById('a').getAttribute('style');
    aids.apply({hideimages: true});
    assert.ok(doc.documentElement.classList.contains('sis-a11y-hideimages'));
    assert.equal(attr('a'), 'img');
    assert.equal(attr('b'), 'img');
    assert.equal(attr('bg'), 'bg');
    assert.equal(attr('grad'), null, 'gradients are not image content');
    assert.equal(attr('icon'), null);
    assert.equal(attr('ed'), null);
    assert.equal(attr('w'), null);
    assert.equal(doc.getElementById('a').getAttribute('style'), styleBefore, 'no inline style/layout change');
    assert.equal(doc.getElementById('a').getAttribute('width'), '40');
    assert.equal(doc.getElementById('bg').getAttribute('style'), 'background-image:url(c.png);width:50px');
    assert.equal(doc.querySelectorAll('style').length, 0);
    const added = doc.createElement('img');
    added.id = 'ajax';
    doc.querySelector('main').append(added);
    await wait(20);
    assert.equal(attr('ajax'), 'img', 'AJAX-inserted images are hidden too');
    aids.apply({hideimages: false});
    assert.equal(doc.querySelectorAll('[data-sis-a11y-image]').length, 0);
    assert.ok(!doc.documentElement.classList.contains('sis-a11y-hideimages'));
    const later = doc.createElement('img');
    doc.querySelector('main').append(later);
    await wait(20);
    assert.equal(later.getAttribute('data-sis-a11y-image'), null, 'observer disconnected after reset');
    aids.destroy();
});

test('image tooltips show alt on hover and keyboard focus, are non-interactive and leave title alone', async () => {
    const {win, doc, aids} = setup('<main><img id="i" alt="Mapa do campus" title="Titulo original" src="m.png">' +
        '<a id="l" href="#"><img alt="Logotipo" src="l.png"></a><img id="deco" alt="" src="d.png"></main>');
    aids.apply({imagetooltips: true});
    const tip = () => doc.querySelector('.sis-a11y-image-tip');
    assert.equal(tip(), null);
    fire(win, doc.getElementById('i'), 'pointerover');
    assert.equal(tip().textContent, 'Mapa do campus');
    assert.equal(tip().getAttribute('role'), 'tooltip');
    assert.equal(tip().style.pointerEvents, 'none');
    assert.equal(doc.getElementById('i').getAttribute('title'), 'Titulo original');
    assert.equal(doc.getElementById('i').getAttribute('alt'), 'Mapa do campus');
    fire(win, doc.getElementById('i'), 'pointerout');
    assert.equal(tip(), null);
    doc.getElementById('l').focus();
    assert.equal(tip().textContent, 'Logotipo', 'keyboard focus on a linked image shows its alt');
    doc.getElementById('l').blur();
    assert.equal(tip(), null);
    fire(win, doc.getElementById('deco'), 'pointerover');
    assert.equal(tip(), null, 'decorative images show nothing');
    fire(win, doc.getElementById('i'), 'pointerover');
    doc.dispatchEvent(new win.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert.equal(tip(), null, 'Escape dismisses');
    fire(win, doc.getElementById('i'), 'pointerover');
    aids.apply({});
    assert.equal(tip(), null);
    fire(win, doc.getElementById('i'), 'pointerover');
    doc.getElementById('l').focus();
    assert.equal(tip(), null, 'listeners removed');
    aids.destroy();
});

test('obsolete tools are ignored without accessing speech APIs or creating removed UI', () => {
    const {win, doc, aids} = setup('<main><p>Conteudo</p></main>');
    for (const key of ['speechSynthesis', 'SpeechSynthesisUtterance']) {
        Object.defineProperty(win, key, {get() { throw new Error('Removed speech API must not be accessed'); }});
    }
    assert.deepEqual(Object.keys(aids).sort(), ['apply', 'destroy', 'reset']);
    aids.apply({superfocus: true, screenreader: true, pagestructure: true, pdfreader: true, bold: true});
    assert.equal(doc.documentElement.className, '');
    assert.equal(doc.getElementById('sis-a11y-root').childElementCount, 0);
    assert.equal(doc.querySelectorAll('#sis-a11y-aids,.sis-a11y-structure').length, 0);
    aids.reset();
    aids.destroy();
});

test('reset and destroy clear image changes and disconnect listeners and observers', async () => {
    for (const exit of ['reset', 'destroy']) {
        const {win, doc, aids} = setup('<main><img id="image" alt="Imagem" src="a.png"></main>');
        const image = doc.getElementById('image');
        aids.apply({hideimages: true, imagetooltips: true});
        aids.apply({hideimages: true, imagetooltips: true});
        fire(win, image, 'pointerover');
        assert.equal(doc.querySelectorAll('.sis-a11y-image-tip').length, 1, 'repeated apply is idempotent');
        assert.equal(image.getAttribute('data-sis-a11y-image'), 'img');
        aids[exit]();
        aids[exit]();
        assert.equal(doc.documentElement.className, '');
        assert.equal(doc.querySelector('[data-sis-a11y-image],.sis-a11y-image-tip'), null);
        fire(win, image, 'pointerover');
        const added = doc.createElement('img');
        doc.querySelector('main').append(added);
        await wait(20);
        assert.equal(added.getAttribute('data-sis-a11y-image'), null);
        assert.equal(doc.querySelector('.sis-a11y-image-tip'), null);
        aids.destroy();
    }
});

test('image descriptions exclude widget content, editor images and Moodle icons', () => {
    const {win, doc, aids} = setup('<main><img id="icon" class="icon" alt="Icone" src="i.png">' +
        '<div contenteditable="true"><img id="editor" alt="Privado" src="e.png"></div></main>');
    const widgetImage = doc.createElement('img');
    widgetImage.alt = 'Widget';
    doc.getElementById('sis-a11y-root').append(widgetImage);
    aids.apply({imagetooltips: true});
    for (const image of [doc.getElementById('icon'), doc.getElementById('editor'), widgetImage]) {
        fire(win, image, 'pointerover');
        assert.equal(doc.querySelector('.sis-a11y-image-tip'), null);
    }
    aids.destroy();
});
