// renderKatex function borrowed from online tutorial (TODO: add link)
function renderKatex() {
        let macros = {
            // blackboard bolds
            "\\Q" : "\\mathbb{Q}",
            "\\C" : "\\mathbb{C}",
            "\\F" : "\\mathbb{F}",
            "\\Hq" : "\\mathbb{H}",

            // mathcals 
            "\\HH" : "\\mathcal{H}",
            "\\OO" : "\\mathcal{O}",

            // Lie groups and reps 
            "\\SL" : "\\mathrm{SL}",
            "\\PSL" : "\\mathrm{PSL}",
            "\\GL" : "\\mathrm{GL}",
            "\\SU" : "\\mathrm{SU}",
            "\\SO" : "\\mathrm{SO}",
            "\\Sym" : "\\mathrm{Sym}",

            // complex numbers
            "\\zbar" : "\\overline{z}",
            "\\abs": "\\left|#1\\right|",
            "\\i" : "\\mathbf{i}",
            "\\j" : "\\mathbf{j}",
            "\\k" : "\\mathbf{k}",
            "\\rbar" : "\\overline{r}",
            "\\sbar" : "\\overline{s}",

            // recreating some stuff from mathtools 
            "\\bsmallmatrix": "\\left[\\begin{smallmatrix}#1\\end{smallmatrix}\\right]"
        }
        if (customElements) {
            class KatexInline extends HTMLElement {
                constructor() {
                    super();
                    katex.render(this.innerText, this, {throwOnError: false, displayMode: false, macros: macros, output: "html"});
                }
            }
            customElements.define("katex-inline", KatexInline)

            class KatexBlock extends HTMLElement {
                constructor() {
                    super();
                    katex.render(this.innerText, this, {throwOnError: false, displayMode: true, macros: macros, output: "html"});
                }
            }
            customElements.define("katex-block", KatexBlock)
        } else {
            document.querySelectorAll("katex-inline").forEach(
                (el) => {
                    katex.render(el.innerText, el, {throwOnError: false, displayMode: false, macros: macros, output: "html"});
                }
            )
            document.querySelectorAll("katex-block").forEach(
                (el) => {
                    katex.render(el.innerText, el, {throwOnError: false, displayMode: true, macros: macros, output: "html"});
                }
            )
        }

        // equations are fitted once now, again once KaTeX's fonts have arrived
        // (until then they are measured in a stand-in font), and whenever the
        // window changes size
        fitEquations(document);
        document.fonts.ready.then(() => fitEquations(document));
        window.addEventListener('resize', () => fitEquations(document));
    }

// Equations that are too wide for the post they sit in are scaled down to fit,
// by turning down their font size: KaTeX sizes everything in ems, so the whole
// equation shrinks with it. A displayed equation has to fit on a single line,
// whereas an inline one can be broken between its pieces (KaTeX's .base spans),
// so only its widest piece has to fit.
function fitEquations(root) {
    const equations = Array.from(root.querySelectorAll('katex-block, katex-inline'));
    const scales = equations.map(() => 1);

    equations.forEach((el) => { el.style.fontSize = ''; });

    // very small fonts don't shrink quite in proportion (the browser rounds
    // them, and won't go below a pixel or so), so after shrinking we measure
    // again and shrink a bit more if need be. every equation is measured before
    // any is resized, so that the browser only lays the page out once a round.
    for (let round = 0; round < 4; round++) {
        const widths = equations.map(equationWidths);
        let changed = false;

        equations.forEach((el, i) => {
            const [needed, available] = widths[i];

            // available is 0 inside a closed note. those get fitted when opened
            if (available > 0 && needed > available) {
                scales[i] = scales[i] * available / needed;
                el.style.fontSize = (100 * scales[i]) + '%';
                changed = true;
            }
        });

        if (!changed) {
            break;
        }
    }

    // a displayed equation that still doesn't fit is as small as the browser
    // will draw it, so it is left to scroll sideways instead (see style.css)
    const displays = equations.map((el) => el.querySelector('.katex-display')).filter((d) => d);
    const tooWide = displays.map((d) => d.scrollWidth > d.clientWidth);
    displays.forEach((d, i) => { d.classList.toggle('too-wide', tooWide[i]); });
}

// returns the width an equation needs at full size, and the width it has
function equationWidths(el) {
    const display = el.querySelector('.katex-display');
    if (display) {
        return [display.scrollWidth, display.clientWidth];
    }

    const pieces = Array.from(el.querySelectorAll('.katex-html > .base'));
    const needed = Math.max(0, ...pieces.map((piece) => piece.getBoundingClientRect().width));

    // an inline equation has the width of the paragraph, list item or note it sits in
    let block = el.parentElement;
    while (getComputedStyle(block).display === 'inline') {
        block = block.parentElement;
    }
    const style = getComputedStyle(block);
    const available = block.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

    return [needed, available];
}

// Note functionality, borrowed from lewismcombes.github.io. A note is a pair of
// sibling elements, <noteButton> followed by <innerNote>, which the markdown
// extension builds out of ?[label](note text).
// The ⊞/⊟ icon lives in a span of its own, so that toggling it can't clobber a
// label containing emphasis or a formula.
function closeNote(button, innerNote) {
    innerNote = innerNote || button.parentElement;
    const noteButton = innerNote.previousElementSibling;

    innerNote.style.display = 'none';
    noteButton.querySelector('.note-icon').textContent = '⊞';
}

function toggleNote(button) {
    const innerNote = button.nextElementSibling;

    if (innerNote.style.display === 'none' || innerNote.style.display === '') {
        innerNote.style.display = 'block';
        button.querySelector('.note-icon').textContent = '⊟';

        // equations in a closed note can't be measured, so they are fitted now
        fitEquations(innerNote);

        // Add close button if it doesn't exist
        if (!innerNote.querySelector(':scope > .close-button')) {
            const closeButton = document.createElement('span');
            closeButton.className = 'close-button';
            closeButton.textContent = '⊟';
            closeButton.onclick = function() { closeNote(this); };
            innerNote.appendChild(closeButton);
        }
    } else {
        closeNote(button, innerNote);
    }
}

// Initialize notes on page load
document.addEventListener('DOMContentLoaded', function() {
    const noteButtons = document.querySelectorAll('noteButton');
    noteButtons.forEach(function(button) {
        // Add the ⊞ icon
        const icon = document.createElement('span');
        icon.className = 'note-icon';
        icon.textContent = '⊞';
        button.appendChild(document.createTextNode(' '));
        button.appendChild(icon);

        // Add click event listener
        button.addEventListener('click', function() {
            toggleNote(this);
        });
    });
});
