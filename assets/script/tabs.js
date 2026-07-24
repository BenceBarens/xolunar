const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = document.querySelectorAll('[role="tabpanel"]');

let currentIndex = 0; 

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        if (index === currentIndex) return; 

        const isMovingRight = index > currentIndex;

        tabs.forEach(t => {
            t.setAttribute('aria-selected', false);
            t.classList.remove('active');
        });
        
        panels.forEach(p => {
            p.setAttribute('hidden', true);
            p.classList.remove('slide-from-right', 'slide-from-left'); 
        });

        tab.setAttribute('aria-selected', true);
        tab.classList.add('active');

        const controls = tab.getAttribute('aria-controls');
        const activePanel = document.getElementById(controls);
        
        activePanel.removeAttribute('hidden');
        
        if (isMovingRight) {
            activePanel.classList.add('slide-from-right');
        } else {
            activePanel.classList.add('slide-from-left');
        }

        currentIndex = index;
    });
});