// renderKatex function borrowed from online tutorial (TODO: add link)
function renderKatex() {
        let macros = {
            // blackboard bolds
            "\\Q" : "\\mathbb{Q}",
            "\\C" : "\\mathbb{C}",
            "\\F" : "\\mathbb{F}",

            // mathcals 
            "\\HH" : "\\mathcal{H}",
            "\\OO" : "\\mathcal{O}",

            // Lie groups and reps 
            "\\SL" : "\\mathrm{SL}",
            "\\SU" : "\\mathrm{SU}",
            "\\SO" : "\\mathrm{SO}",
            "\\Sym" : "\\mathrm{Sym}",

            // complex numbers
            "\\zbar" : "\\overline{z}",
            "\\abs": "\\left|#1\\right|",
            "\\i" : "\\mathbf{i}",
            "\\j" : "\\mathbf{j}",
            "\\k" : "\\mathbf{k}",

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
