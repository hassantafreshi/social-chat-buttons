/* global WPSCB_FRONT */
(function(){
    if(typeof WPSCB_FRONT === 'undefined') return;
    let contacts = WPSCB_FRONT.contacts || [];
    const settings = WPSCB_FRONT.settings || {};
    const advanced = WPSCB_FRONT.advanced || {};
    const i18n = WPSCB_FRONT.i18n || {};
    const isPreview = WPSCB_FRONT.isPreview || false;
    const root = document.getElementById('wpscb-widget-root');

    // Debug advanced settings
    console.log('WPSCB_FRONT Full Object:', WPSCB_FRONT);
    console.log('WPSCB Frontend Advanced Settings:', advanced);
    console.log('Advanced Settings Keys:', Object.keys(advanced));

    // In preview mode, show sample contacts if none exist
    if(isPreview && !contacts.length){
        contacts = [
            {
                network: 'whatsapp',
                name: 'WhatsApp Support',
                value: '1234567890',
                availability: {mon: [{start:'09:00', end:'17:00'}], tue: [{start:'09:00', end:'17:00'}], wed: [{start:'09:00', end:'17:00'}], thu: [{start:'09:00', end:'17:00'}], fri: [{start:'09:00', end:'17:00'}], sat: [], sun: []}
            },
            {
                network: 'telegram',
                name: 'Telegram Chat',
                value: 'yourusername',
                availability: {mon: [{start:'00:00', end:'23:59'}], tue: [{start:'00:00', end:'23:59'}], wed: [{start:'00:00', end:'23:59'}], thu: [{start:'00:00', end:'23:59'}], fri: [{start:'00:00', end:'23:59'}], sat: [{start:'00:00', end:'23:59'}], sun: [{start:'00:00', end:'23:59'}]}
            }
        ];
    }

    if(!root || !contacts.length) return;

    let isOpen = false;

    function getWordPressTime(){
        const timezone = WPSCB_FRONT.timezone || {};
        const offsetHours = timezone.offset || 0;
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wpTime = new Date(utc + (offsetHours * 3600000));
        return wpTime;
    }

    function isContactAvailable(availability){
        if(!availability) return true;
        const wpNow = getWordPressTime();
        const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
        const currentDay = dayNames[wpNow.getDay()];
        const currentMinutes = wpNow.getHours()*60 + wpNow.getMinutes();
        // Backward compatibility: old shape had availability.days + availability.hours
        if(Array.isArray(availability.days) && availability.hours){
            if(!availability.days.includes(currentDay)) return false;
            const [sh,sm] = (availability.hours.start||'00:00').split(':').map(Number);
            const [eh,em] = (availability.hours.end||'23:59').split(':').map(Number);
            const start = sh*60+sm; const end = eh*60+em;
            return currentMinutes >= start && currentMinutes <= end;
        }
        // New schema: availability[day] => array of ranges
        const slots = availability[currentDay];
        if(!Array.isArray(slots) || !slots.length) return false;
        for(let i=0;i<slots.length;i++){
            const slot = slots[i];
            const [sh,sm] = (slot.start||'00:00').split(':').map(Number);
            const [eh,em] = (slot.end||'23:59').split(':').map(Number);
            const start = sh*60+sm; const end = eh*60+em;
            if(currentMinutes >= start && currentMinutes <= end){
                return true;
            }
        }
        return false;
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

    function applyAdvancedStyles(){
        // Remove existing dynamic styles
        const existingStyle = document.getElementById('wpscb-dynamic-styles');
        if(existingStyle) existingStyle.remove();

        const style = document.createElement('style');
        style.id = 'wpscb-dynamic-styles';
        let css = ':root{';
        css += '--wpscb-button-size:'+(advanced.button_size||56)+'px;';
        css += '--wpscb-button-icon-size:'+(advanced.button_icon_size||24)+'px;';
        css += '--wpscb-button-color:'+(advanced.button_color||'#6610f2')+';';
        css += '--wpscb-button-text-color:'+(advanced.button_text_color||'#ffffff')+';';
        css += '--wpscb-popup-width:'+(advanced.popup_width||340)+'px;';
        css += '--wpscb-popup-bg:'+(advanced.popup_bg_color||'#ffffff')+';';
        css += '--wpscb-popup-header-start:'+(advanced.popup_header_color||'#6610f2')+';';
        css += '--wpscb-popup-header-end:'+(advanced.popup_header_color_end||'#d63384')+';';
        css += '--wpscb-popup-text:'+(advanced.popup_text_color||'#212529')+';';
        css += '--wpscb-popup-label:'+(advanced.popup_label_color||'#6c757d')+';';
        css += '--wpscb-popup-header-text:'+(advanced.popup_label_color||'#ffffff')+';';
        css += '--wpscb-contact-bg:'+(advanced.contact_bg_color||'#f8f9fa')+';';
        css += '--wpscb-contact-hover:'+(advanced.contact_hover_color||'#e2e8f0')+';';
        css += '}';

        // Auto Dark Mode (8 PM - 7 AM based on WordPress timezone)
        if(advanced.auto_dark_mode){
            const wpNow = getWordPressTime();
            const hour = wpNow.getHours();
            const isDarkTime = hour >= 20 || hour < 7; // 8 PM to 7 AM
            if(isDarkTime){
                css += '.wpscb-widget-root{';
                css += '--wpscb-popup-bg:#1e293b;';
                css += '--wpscb-popup-text:#f1f5f9;';
                css += '--wpscb-popup-label:#94a3b8;';
                css += '--wpscb-popup-header-text:#f1f5f9;';
                css += '--wpscb-contact-bg:#2d3748;';
                css += '--wpscb-contact-hover:#4a5568;';
                css += '}';
            }
        }

        // Hide on mobile
        if(advanced.hide_mobile){
            css += '@media (max-width:480px){#wpscb-widget-root{display:none!important;}}';
        }

        // Hide copyright
        if(advanced.hide_copyright){
            css += '.wpscb-popup-footer{display:none!important;}';
        }

        // Responsive scale
        if(advanced.responsive_scale){
            css += '@media (max-width:480px){:root{--wpscb-button-size:'+(Math.max(40,(advanced.button_size||56)*0.8))+'px;--wpscb-popup-width:calc(100vw - 40px);}}';
        }

        style.textContent = css;
        document.head.appendChild(style);

        // Debug CSS variables
        console.log('WPSCB Frontend CSS Applied:', css);
        console.log('Advanced settings values:', {
            popup_bg_color: advanced.popup_bg_color,
            popup_text_color: advanced.popup_text_color,
            popup_label_color: advanced.popup_label_color,
            auto_dark_mode: advanced.auto_dark_mode,
            contact_bg_color: advanced.contact_bg_color,
            contact_hover_color: advanced.contact_hover_color
        });
    }

    function render(){
        console.log('WPSCB Frontend render() function called');
        const available = contacts.filter(c => isContactAvailable(c.availability));

        // Clear existing content
        root.innerHTML = '';

        // Create main widget container (same structure as Live Preview)
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'wpscb-widget-root ' + (settings.position === 'left' ? 'wpscb-left' : 'wpscb-right');

        const fab = document.createElement('button');
        fab.className = 'wpscb-fab';
        fab.setAttribute('aria-label', i18n.chat || 'Chat');

        // Button mode: icon, text, or image
        const mode = advanced.button_mode || 'icon';
        if(mode === 'text'){
            fab.textContent = advanced.button_text || i18n.chat || 'Chat';
            fab.style.fontSize = 'var(--wpscb-button-icon-size)';
            fab.style.padding = '0 20px';
            fab.style.width = 'auto';
        } else if(mode === 'image' && advanced.button_image_url){
            fab.innerHTML = '<img src="'+esc(advanced.button_image_url)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" />';
        } else {
            fab.innerHTML = chatIcon;
        }

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

                    // Use photo if available, otherwise network icon
                    const avatar = c.photo_url ?
                        `<img src="${esc(c.photo_url)}" alt="" class="wpscb-contact-avatar" />` :
                        `<span class="wpscb-contact-avatar-icon">${getNetworkIcon(c.network)}</span>`;

                    // Show availability info if available (based on WordPress timezone)
                    let avail = '';
                    if(c.availability){
                        const wpNow = getWordPressTime();
                        const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
                        const currentDay = dayNames[wpNow.getDay()];
                        const todaySlots = c.availability[currentDay] || [];
                        if(todaySlots.length > 0){
                            const firstSlot = todaySlots[0];
                            const lastSlot = todaySlots[todaySlots.length - 1];
                            avail = '<div class="wpscb-contact-time" style="color:var(--wpscb-popup-label);">'+firstSlot.start+' - '+lastSlot.end+'</div>';
                        }
                    }

                    return `<a href="${esc(url)}" target="_blank" rel="noopener" class="wpscb-contact-item">
                        ${avatar}
                        <div class="wpscb-contact-info">
                            <div class="wpscb-contact-name">${esc(c.name || c.network)}</div>
                            ${avail}
                        </div>
                    </a>`;
                }).join('')}
            </div>
            ${advanced.hide_copyright ? '' : `
                <div class="wpscb-popup-footer">
                    <div style="font-size:11px;color:var(--wpscb-popup-label);">Developed by WP Chat Button</div>
                </div>
            `}
        `;

        // Add elements to widget container (same structure as Live Preview)
        widgetContainer.appendChild(fab);
        widgetContainer.appendChild(popup);

        // Add widget container to root
        root.appendChild(widgetContainer);

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

    // Apply advanced settings as CSS variables first
    console.log('About to apply advanced styles and render...');
    applyAdvancedStyles();

    console.log('About to render widget...');
    render();
})();
