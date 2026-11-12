function toggle(id) {
  document.getElementById(id).classList.toggle('open');
}

document.getElementById('yr').textContent = new Date().getFullYear();

// Easter egg: clicking the chip logo shows the page through a thermal camera.
// Brightness is mapped onto an "ironbow" palette, inverted so the light background reads cold and text reads hot.
// The thermal layer only covers the band above #thermal-hot's height, so animating that height
// sweeps the view in from the top, with a bright scan line (#thermal-line) riding the edge.
document.body.insertAdjacentHTML('beforeend', `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="thermal" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" result="gray" type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>
      <feComponentTransfer id="thermal-hot" in="gray" result="hot" x="0" y="0" width="100000" height="0">
        <feFuncR type="table" tableValues="1 1 1 .9 .6 .3 .1 0"/>
        <feFuncG type="table" tableValues="1 .9 .6 .2 0 0 0 0"/>
        <feFuncB type="table" tableValues="1 .2 0 .1 .6 .5 .35 .05"/>
      </feComponentTransfer>
      <feFlood id="thermal-line" result="line" flood-color="#fff6c8" flood-opacity=".9" x="0" y="0" width="100000" height="0"/>
      <feMerge>
        <feMergeNode in="SourceGraphic"/>
        <feMergeNode in="hot"/>
        <feMergeNode in="line"/>
      </feMerge>
    </filter>
  </svg>`);

const logo = document.querySelector('.logo-btn');
const hot = document.getElementById('thermal-hot');
const line = document.getElementById('thermal-line');
const FULL = 100000; // px; taller than any page
let frame;

function setThermal(on, animate) {
  cancelAnimationFrame(frame);
  logo.setAttribute('aria-pressed', on);
  try { sessionStorage.setItem('thermal', on ? '1' : ''); } catch (e) {}
  document.body.classList.add('thermal');

  const dur = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 700 : 0;
  const top = scrollY, h = innerHeight, start = performance.now();
  const step = now => {
    const t = dur ? Math.min(1, (now - start) / dur) : 1;
    const e = t < .5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2; // ease in-out
    const edge = top + h * (on ? e : 1 - e);
    hot.setAttribute('height', edge);
    line.setAttribute('y', edge - 1);
    line.setAttribute('height', t < 1 ? 2 : 0);
    if (t < 1) frame = requestAnimationFrame(step);
    else if (on) hot.setAttribute('height', FULL);
    else document.body.classList.remove('thermal');
  };
  frame = requestAnimationFrame(step);
}

logo.addEventListener('click', () => setThermal(logo.getAttribute('aria-pressed') !== 'true', true));
try { if (sessionStorage.getItem('thermal')) setThermal(true, false); } catch (e) {}
