/* global WPSCB_FRONT */
(function(){
    if(typeof WPSCB_FRONT === 'undefined') return;
    const contacts = WPSCB_FRONT.contacts || [];
    const settings = WPSCB_FRONT.settings || {};
    const i18n = WPSCB_FRONT.i18n || {};
    const root = document.getElementById('wpscb-widget-root');
    if(!root || !contacts.length) return;

    let isOpen = false;

    function isContactAvailable(availability){
        if(!availability) return true;
        const now = new Date();
        const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.getHours()*60 + now.getMinutes();
        const days = availability.days || [];
        const hours = availability.hours || {start:'00:00',end:'23:59'};
        if(!days.includes(currentDay)) return false;
        const [sh,sm] = hours.start.split(':').map(Number);
        const [eh,em] = hours.end.split(':').map(Number);
        const start = sh*60+sm;
        const end = eh*60+em;
        return currentTime >= start && currentTime <= end;
    }

    const chatIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

    const networkIcons = {
        whatsapp: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.66 15.06L2 22l4.94-1.3A10 10 0 1 0 12 2Z"/><path fill="#fff" d="M9.5 7.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3-.2.3-.8.7-.8 1.8s.8 2.1 1 2.2c.1.1 1.6 2.6 4 3.5 2 .8 2.4.7 2.8.6.4-.1 1.4-.6 1.6-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3s-1.4-.7-1.6-.7-.4-.1-.6.2c-.2.3-.7.8-.8.9-.1.1-.3.1-.5 0s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5s.3-.3.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.5-1.3-.7-1.7Z"/></svg>',
        messenger: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#0084FF" d="M12 2C6.48 2 2 6.02 2 10.98c0 2.75 1.34 5.2 3.5 6.86V22l3.2-1.76c1.03.29 2.13.45 3.3.45 5.52 0 10-4.02 10-8.98S17.52 2 12 2Z"/><path fill="#fff" d="m6.8 14.2 4-2.5 2.1 2.5 4.3-5.2-4 2.5-2.1-2.5-4.3 5.2Z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#229ED9" d="M21.5 3.6 2.6 11.4c-1 .4-.9 1.8.2 2l4.7 1.4 1.8 5.4c.3.9 1.5 1 .9-.1l2.4-4 5.2 3.8c.8.6 1.8.1 2-.9l3.2-14.8c.2-1-1-1.8-2-1.2Z"/></svg>'
    };

    function getNetworkIcon(network){
        return networkIcons[network] || '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
    }

    function buildURL(network, value){
        const urlMap = {
            whatsapp: (v) => 'https://wa.me/' + v.replace(/[^0-9]/g,''),
            messenger: (v) => 'https://m.me/' + v,
            telegram: (v) => 'https://t.me/' + v.replace('@','')
        };
        return urlMap[network] ? urlMap[network](value) : '#';
    }

    function esc(str){ return (str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

    function render(){
        const available = contacts.filter(c => isContactAvailable(c.availability));
        const fab = document.createElement('button');
        fab.className = 'wpscb-fab';
        fab.setAttribute('aria-label', i18n.chat || 'Chat');
        fab.innerHTML = chatIcon;
        fab.onclick = togglePopup;

        const popup = document.createElement('div');
        popup.className = 'wpscb-popup';
        popup.style.display = 'none';
        popup.innerHTML = `
            <div class="wpscb-popup-header">
                <span>${esc(i18n.chat || 'Chat')}</span>
                <button class="wpscb-popup-close" aria-label="Close">✕</button>
            </div>
            <div class="wpscb-popup-body">
                ${available.map(c => {
                    const url = buildURL(c.network, c.value);
                    const photo = c.photo_url ? '<img src="'+esc(c.photo_url)+'" alt="" class="wpscb-contact-avatar" />' : '<span class="wpscb-contact-avatar-icon">'+getNetworkIcon(c.network)+'</span>';
                    const avail = c.availability && c.availability.days && c.availability.days.length < 7 ? 
                        '<div class="wpscb-contact-time">'+c.availability.hours.start+' - '+c.availability.hours.end+'</div>' : '';
                    return `<a href="${esc(url)}" target="_blank" rel="noopener" class="wpscb-contact-item">
                        ${photo}
                        <div class="wpscb-contact-info">
                            <div class="wpscb-contact-name">${esc(c.name || c.network)}</div>
                            ${avail}
                        </div>
                        ${getNetworkIcon(c.network)}
                    </a>`;
                }).join('')}
            </div>
            <div class="wpscb-popup-footer">
                <div style="font-size:11px;color:#64748b;">${esc(i18n.poweredBy||'')}</div>
                <div style="font-size:11px;color:#64748b;">${esc(i18n.sponsoredBy||'')}</div>
            </div>
        `;

        root.appendChild(fab);
        root.appendChild(popup);

        popup.querySelector('.wpscb-popup-close').onclick = closePopup;
        document.addEventListener('click', (e) => {
            if(isOpen && !popup.contains(e.target) && !fab.contains(e.target)){
                closePopup();
            }
        });
    }

    function togglePopup(){
        const popup = root.querySelector('.wpscb-popup');
        if(!popup) return;
        isOpen = !isOpen;
        popup.style.display = isOpen ? 'flex' : 'none';
    }

    function closePopup(){
        const popup = root.querySelector('.wpscb-popup');
        if(popup){ popup.style.display = 'none'; isOpen = false; }
    }

    render();
})();
