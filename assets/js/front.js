/* global WPSCB_FRONT */
document.addEventListener( 'DOMContentLoaded', function() {
    if ( 'undefined' === typeof WPSCB_FRONT ) {
        return;
    }
    let wpscb_contacts = WPSCB_FRONT.contacts || [];
    const wpscb_settings = WPSCB_FRONT.settings || {};
    const wpscb_advanced = WPSCB_FRONT.advanced || {};
    const wpscb_i18n = WPSCB_FRONT.i18n || {};
    const wpscb_isPreview = WPSCB_FRONT.isPreview || false;


    const wpscb_root = document.getElementById('wpscb-widget-root');

    if ( ! wpscb_isPreview && ! wpscb_settings.enabled ) {
        return;
    }

    // In preview mode, show sample contacts if none exist
    if ( wpscb_isPreview && ! wpscb_contacts.length ) {
        wpscb_contacts = [
            {
                network: 'whatsapp',
                name: 'WhatsApp Support',
                value: '1234567890',
                availability: { mon: [ { start: '09:00', end: '17:00' } ], tue: [ { start: '09:00', end: '17:00' } ], wed: [ { start: '09:00', end: '17:00' } ], thu: [ { start: '09:00', end: '17:00' } ], fri: [ { start: '09:00', end: '17:00' } ], sat: [], sun: [] }
            },
            {
                network: 'telegram',
                name: 'Telegram Chat',
                value: 'yourusername',
                availability: {mon: [{start:'00:00', end:'23:59'}], tue: [{start:'00:00', end:'23:59'}], wed: [{start:'00:00', end:'23:59'}], thu: [{start:'00:00', end:'23:59'}], fri: [{start:'00:00', end:'23:59'}], sat: [{start:'00:00', end:'23:59'}], sun: [{start:'00:00', end:'23:59'}]}
            }
        ];
    }

    if ( ! wpscb_root || ! wpscb_contacts.length ) {
        return;
    }

    let wpscb_isOpen = false;

    function wpscb_getWordPressTime() {
        const timezone = WPSCB_FRONT.timezone || {};
        const offsetHours = timezone.offset || 0;
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wpTime = new Date(utc + (offsetHours * 3600000));
        return wpTime;
    }

    function wpscb_isContactAvailable( availability ) {
        // If no availability set, contact is always available
        if ( ! availability || 'object' !== typeof availability ) {
            return true;
        }

        // Check if availability object is empty
        if(Object.keys(availability).length === 0) {
            return true;
        }

        const wpNow = wpscb_getWordPressTime();
        const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
        const currentDay = dayNames[wpNow.getDay()];
        const currentHour = wpNow.getHours();
        const currentMinute = wpNow.getMinutes();
        const currentMinutes = currentHour * 60 + currentMinute;



        // Backward compatibility: old shape had availability.days + availability.hours
        if(Array.isArray(availability.days) && availability.hours){
            if(!availability.days.includes(currentDay)) {
                return false;
            }
            const startTime = availability.hours.start || '00:00';
            const endTime = availability.hours.end || '23:59';
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;

            if(start > end) {
                // Overnight slot
                return currentMinutes >= start || currentMinutes <= end;
            } else {
                // Normal slot
                return currentMinutes >= start && currentMinutes <= end;
            }
        }

        // New schema: availability[day] => array of ranges
        const slots = availability[currentDay];

        if(!Array.isArray(slots) || !slots.length) {
            return false;
        }

        for(let i = 0; i < slots.length; i++){
            const slot = slots[i];
            if(!slot || !slot.start || !slot.end) continue;

            const startTime = slot.start;
            const endTime = slot.end;
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;

            if(start > end) {
                // Overnight slot (crosses midnight)
                if(currentMinutes >= start || currentMinutes <= end) {
                    return true;
                }
            } else {
                // Normal slot (same day)
                if(currentMinutes >= start && currentMinutes <= end) {
                    return true;
                }
            }
        }

        return false;
    }

    const wpscb_chatIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';


    function wpscb_getNetworkIcon(network){
        const svg = {
            whatsapp: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.66 15.06L2 22l4.94-1.3A10 10 0 1 0 12 2Z"/><path fill="#fff" d="M9.5 7.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3-.2.3-.8.7-.8 1.8s.8 2.1 1 2.2c.1.1 1.6 2.6 4 3.5 2 .8 2.4.7 2.8.6.4-.1 1.4-.6 1.6-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3s-1.4-.7-1.6-.7-.4-.1-.6.2c-.2.3-.7.8-.8.9-.1.1-.3.1-.5 0s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5s.3-.3.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.5-1.3-.7-1.7Z"/></svg>',
            messenger: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#0084FF" d="M12 2C6.48 2 2 6.02 2 10.98c0 2.75 1.34 5.2 3.5 6.86V22l3.2-1.76c1.03.29 2.13.45 3.3.45 5.52 0 10-4.02 10-8.98S17.52 2 12 2Z"/><path fill="#fff" d="m6.8 14.2 4-2.5 2.1 2.5 4.3-5.2-4 2.5-2.1-2.5-4.3 5.2Z"/></svg>',
            telegram: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#229ED9" d="M21.5 3.6 2.6 11.4c-1 .4-.9 1.8.2 2l4.7 1.4 1.8 5.4c.3.9 1.5 1 .9-.1l2.4-4 5.2 3.8c.8.6 1.8.1 2-.9l3.2-14.8c.2-1-1-1.8-2-1.2Z"/></svg>',
            instagram_dm: '<svg viewBox="0 0 24 24" width="18" height="18"><radialGradient id="ig" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="#f58529"/><stop offset="50%" stop-color="#dd2a7b"/><stop offset="100%" stop-color="#8134af"/></radialGradient><path fill="url(#ig)" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"/><path fill="#fff" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>',
            viber: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#7360F2" d="M4 4c-1.1 1.4-1.7 3.2-1.7 5 0 5.5 4.7 9.9 10.5 9.9 1.7 0 3.3-.4 4.7-1.1l2.5 1.1-.7-2.8c1.1-1.4 1.7-3.1 1.7-4.9C20.9 5.7 16.2 1.3 10.4 1.3 8.5 1.3 6.8 1.8 5.3 2.6L4 4Z"/><path fill="#fff" d="M7.5 7c0 6.2 5 11.2 11.2 11.2M7.5 7c3.7 0 6.7 3 6.7 6.7M11 8.5c1.9 0 3.4 1.5 3.4 3.4" stroke="#fff" stroke-width="1.5"/></svg>',
            line: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#00C300" d="M12 2C6.5 2 2 5.7 2 10c0 3 2.1 5.7 5.3 7.1L7 22l4.4-2c.9.1 1.2.1 1.6.1 5.5 0 10-3.6 10-8.1S17.5 2 12 2Z"/></svg>',
            wechat: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10" cy="10" r="6" fill="#1AAD19"/><circle cx="17" cy="14" r="5" fill="#24c32a"/></svg>',
            twitter_dm: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#1DA1F2" d="M12 2C6.48 2 2 6.2 2 11c0 3.9 3 7.3 7.1 8.6.4.1.6-.1.7-.4l.2-1c.1-.4.3-.9.4-1.2.1-.3 0-.5-.4-.6-3.3-.7-4.6-2.5-4.9-3.9-.2-.5 0-.6.5-.5 1.3.3 2.1.4 2.5.3.2-.1.3-.2.2-.5-.1-.3-.3-.6-.5-.9-.9-1.3-1.4-3.3-.5-4.5.9-1.3 3.2-1.5 4.5-.3 1.1 1 1.5 2.7 1 4.1-.5 1.5-.1 2.2.9 2.9.8.5 1.7 1.1 2.5 2 .2.3.5.3.7.3.2-.1.3-.2.4-.4.3-.7.8-2.1.8-2.3.1-.3.2-.5.5-.4.3.1.7.3 1 .5.3.3.5.4.8.2.3-.2.5-.5.3-.9-.4-.7-.9-1.2-1.4-1.5-.4-.3-.3-.5-.2-.8.5-1.2.5-2.8-.4-4-.9-1.3-2.3-2-4-2.1H13c-.4 0-.8 0-1.2.1-.2.1-.4 0-.5-.2-.4-.5-1-1.2-1.5-1.6-.2-.2-.5-.2-.7-.2Z"/></svg>',
            discord: '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="5" width="18" height="12" rx="6" fill="#5865F2"/><circle cx="9" cy="11" r="1.6" fill="#fff"/><circle cx="15" cy="11" r="1.6" fill="#fff"/></svg>',
            signal: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="#3A76F0"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-dasharray="4 3"/></svg>',
        //    skype: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#00AFF0"/><path fill="#fff" d="M8 12c0 2 2 3.5 4.5 3.5 1.8 0 3.5-.7 3.5-2 0-1.4-1.3-1.8-2.9-2.1-1.2-.2-2.5-.4-2.5-1.1 0-.6.9-.9 1.8-.9 1 0 1.9.3 2.5.7l.7-1.3c-.8-.5-1.9-.8-3.1-.8C10 8 8 9 8 10.5c0 1.5 1.4 2 3 2.3 1.2.2 2.4.4 2.4 1 0 .6-.8 1-1.9 1-1 0-2-.4-2.6-.9L8 12Z"/></svg>',
            snapchat: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#FFFC00" d="M12 2c-2.8 0-5 2.2-5 5v2.5c0 1-.8 1.8-1.8 1.8H5c.2.7.9 1.2 1.6 1.3 1.2.3 1.5.8 1.5 1.2 0 .6-.8 1-2 .9-1 0-1.6.6-1.6 1.3 0 .7 1.3 1.3 3.1 1.5.5.1.9.4 1.1.9C9.1 20.8 10.4 22 12 22s2.9-1.2 3.3-3.3c.1-.5.5-.8 1-.9 1.8-.2 3.1-.8 3.1-1.5s-.6-1.3-1.6-1.3c-1.2 0-2-.3-2-.9 0-.4.3-1 1.5-1.2.8-.2 1.5-.7 1.6-1.3h-.2c-1 0-1.8-.8-1.8-1.8V7c0-2.8-2.2-5-5-5Z"/></svg>',
            kakaotalk: '<svg viewBox="0 0 24 24" width="18" height="18"><ellipse cx="12" cy="11" rx="9" ry="7" fill="#FFE812"/><path d="M12 18l-3 3 1-3H12Z" fill="#6e4b00"/></svg>',
            linkedin_msg: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" fill="#0A66C2" rx="4"/><path fill="#fff" d="M7 17V9h2v8H7Zm1-9.5c-.7 0-1.2-.5-1.2-1.2S7.3 5 8 5s1.2.5 1.2 1.2S8.7 7.5 8 7.5ZM18 17h-2v-4c0-1-.8-1.8-1.8-1.8S12.4 12 12.4 13v4h-2V9h2v1c.4-.6 1.2-1.1 2.2-1.1 1.9 0 3.4 1.5 3.4 3.4V17Z"/></svg>',
            threads: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#000"/><path fill="#fff" d="M7 14c1.5 1.2 3.3 2 5 2 4 0 5-3 5-4.5S15.5 7 12 7C9 7 7 9 7 11h2c0-1.3 1.5-2 3-2 2.3 0 3 .9 3 2 0 1.6-1 2.5-3 2.5-1.1 0-2.2-.5-3-1.2V14Z"/></svg>',
            pinterest_msg: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#E60023"/><path fill="#fff" d="M12.3 7C9.9 7 8 8.7 8 10.9c0 1 .5 1.8 1.6 2 .2 0 .4 0 .5-.2.1-.1.3-.5.3-.6 0-.1 0-.1-.1-.3-.1-.2-.2-.5-.2-.8 0-1.9 1.4-3.2 3.3-3.2 1.8 0 2.8 1.1 2.8 2.6 0 2.1-1 3.9-2.6 3.9-.8 0-1.4-.6-1.2-1.4.2-.9.6-1.8.6-2.4 0-.6-.3-1.1-1-1.1-.8 0-1.5.9-1.5 2.1 0 .8.3 1.3.3 1.3l-1.2 5c-.4 1.6-.1 3.5 0 3.7h.1c.1-.2 1.3-1.6 1.7-3.1l.7-2.5c.3.6 1.2 1.1 2.1 1.1 2.7 0 4.5-2.4 4.5-5.7C18.7 8.8 16.9 7 14 7h-1.7Z"/></svg>',
            reddit_chat: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#FF4500"/><circle cx="8.5" cy="12" r="1.5" fill="#fff"/><circle cx="15.5" cy="12" r="1.5" fill="#fff"/><path fill="#fff" d="M7.5 14c.9 1 2.6 1.7 4.5 1.7S15.6 15 16.5 14c.3-.3-.1-.8-.5-.6-.8.4-2 1-3.5 1s-2.7-.6-3.5-1c-.4-.2-.8.3-.5.6Z"/></svg>',
            youtube_chat: '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="6" width="18" height="12" rx="3" fill="#FF0000"/><path fill="#fff" d="M10 9.5v5l5-2.5-5-2.5Z"/></svg>',
            slack: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4A154B" d="M3 10a2 2 0 1 1 4 0v1H5a2 2 0 0 1-2-2Zm4 0V8a2 2 0 1 1 4 0v2H7Zm0 4H5a2 2 0 1 0 2 2v-2Zm4 0v2a2 2 0 1 0 2-2h-2Zm6-3a2 2 0 1 1 0-4h2a2 2 0 1 1 0 4h-2Zm0 2h2a2 2 0 1 1-2 2v-2Zm-4-6h2a2 2 0 1 1-2-2v2Zm0 6h2v2a2 2 0 1 1-2-2Z"/></svg>',
            teams: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" rx="5" fill="#464EB8"/><path fill="#fff" d="M6 8h12v2h-5v8H11v-8H6V8Z"/></svg>',
            VK: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4C75A3" d="M12 2C6.48 2 2 6.2 2 11c0 4.8 3.9 8.7 8.8 8.9v3.1l3.2-1.7c.9.1 1.8.2 2.7.2 5.5 0 10-3.6 10-8.1S17.5 2 12 2Z"/></svg>',
            eitaa: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" rx="3" fill="#E37600"/><path d="M6.1 21.5c-.8-.3-1.5-1-1.9-1.8-.2-.7-.2-1.5-.1-6.8.1-5.7.1-5.4.3-6.3.1-.5.5-1.3.8-1.7 1-1.5 2.5-2.4 4.3-2.8.4-.1.9-.1 5.7-.1 5.9 0 5.7 0 6.7.3 1.7.5 3.1 1.5 4.1 2.9.3.9.3 1 .3 3.4v2.1l-.4.3c-.5.4-1.2 1-2.2 2-1.1 1.2-2.3 2.3-2.8 2.7-1.2 1-2.4 1.6-3.5 1.8-.6.1-1.6.1-2.2-.1-.5-.1-.5-.2-.7.4-.2.5-.3 1-.3 1.5v.4l-.1 0c-1.1-.2-2.3-1.2-2.7-2.4-.1-.5-.2-.9-.2-1.2v-.3l-.3-.3c-.6-.6-1-1.2-1.1-2-.2-1.1.3-2.4 1.4-3.5 1.2-1.2 3-2.2 4.7-2.5.6-.1 1.7-.2 2.3-.1 1.1.2 2 .7 2.5 1.5.2.3.2.3.2.5 0 .2-.1.4-.2.5-.4.6-1.7 1.3-3.2 1.6-2.5.6-4.1-.1-3.8-1.7 0-.2.1-.3.1-.3 0 0-.3.1-.5.3-.5.3-.9.9-1 1.5-.1.1-.1.4 0 .6 0 .3.1.4.2.7.1.2.3.4.4.5l.2.2-.1.1c-.2.3-.6.8-.6 1.1-.2.5-.2.8-.1 1.7.1.4.4 1 .7 1.4.2.3.8.7.8.7 0 0 .1-.1.1-.1 0-.2.2-.9.3-1.3.4-1 1.3-1.9 2.7-2.6.2-.1.9-.4 1.5-.7 1.3-.6 2-.9 2.4-1.2 1.1-.8 1.8-2 2-3.4.1-.5.1-1.5 0-2.1-.3-2.3-2.1-3.9-4.6-4.1-2.8-.3-6.3 1.8-8.5 5.1-1.1 1.6-1.8 3.4-2.1 5.1-.1.7-.2 2 0 2.6.2 1.6.8 2.9 1.8 3.9.6.7 1.2 1.1 1.8 1.2 2.3 1.1 4.8 1.1 7 .1.9-.4 1.9-1.1 2.9-2.1.9-1 1.6-1.8 3.4-4.2.9-1.3 1.8-2.2 2.1-2.5l.1-.1v2.9c0 2.8 0 2.9-.1 3.4-.6 2.5-2.4 4.4-4.9 4.9l-.4.1h-5.5c-4.5.1-5.6 0-5.9-.1z" fill="#FFF"/></svg>',
            soroush: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" rx="3" fill="#0099CC"/><path d="M5.97 23.94c-.41-.07-.82-.23-1.33-.46-.9-.52-1.58-1.45-1.8-2.47-.09-.4-.1-.9-.08-4.02.02-3.33.01-3.22.16-3.77.08-.27.3-.75.46-.99.5-.75 1.12-1.33 1.8-1.68.22-.1.52-.15 3.38-.15 3.49 0 3.37 0 3.94.18 1.05.24 1.97.82 2.41 1.67.18.52.19.6.21 1.98l.01 1.24-.22.15c-.31.21-.72.59-1.29 1.2-.66.7-1.32 1.35-1.66 1.62-.73.59-1.4.92-2.08 1.04-.35.06-.94.04-1.28-.05-.31-.08-.29-.09-.41.26-.11.23-.18.49-.18.86l-.02.23-.08-.02c-.68-.13-1.35-.72-1.61-1.39-.06-.18-.14-.41-.14-.68l-.01-.19-.17-.16c-.36-.33-.59-.73-.67-1.15-.12-.67.19-1.42.86-2.1.71-.72 1.75-1.28 2.77-1.5.37-.08 1.02-.1 1.34-.04.64.11 1.15.43 1.48.91.1.15.11.17.1.31 0 .11-.05.21-.1.28-.26.36-1.03.75-1.86.94-1.47.33-2.4-.08-2.25-.98.01-.09.02-.17.02-.17-.02-.02-.16.06-.32.17-.27.19-.5.55-.59.9-.02.09-.03.23-.02.36.01.18.03.25.11.41.05.1.15.25.23.33l.13.14-.05.07c-.09.13-.21.34-.38.68-.11.28-.11.46-.06 1.01.06.26.23.61.41.82.13.16.44.43.49.43.01 0 .02-.03.02-.06 0-.13.1-.54.18-.74.24-.59.75-1.09 1.57-1.53.14-.07.53-.26.88-.42.76-.35 1.17-.57 1.4-.73.66-.46 1.06-1.15 1.19-2.02.05-.32.05-.91 0-1.23-.21-1.36-1.22-2.29-2.69-2.44-1.63-.17-3.71 1.09-4.99 2.86-.62.94-1.04 1.99-1.22 3.04-.07.41-.09 1.16-.05 1.53.11.95.46 1.72 1.06 2.32.23.22.48.4.64.52 1.32.63 2.78.64 4.07.04.56-.26 1.1-.67 1.69-1.26.57-.57.95-1.05 2.01-2.49.58-.79 1.04-1.32 1.27-1.45l.08-.05-.01 1.72c-.01 1.67-.01 1.73-.07 1.99-.33 1.49-1.42 2.59-2.9 2.93l-.26.06-3.22.01c-2.64 0-3.26-.01-3.46-.03z" fill="#FFF"/></svg>'
        };
        return svg[network] || '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
    }

    function wpscb_buildURL(network, value, message){
        const msg = message ? encodeURIComponent(message) : '';
        const urlMap = {
            whatsapp: (v, m) => 'https://wa.me/' + v.replace(/[^0-9]/g,'') + (m ? '?text=' + m : ''),
            messenger: (v, m) => 'https://m.me/' + v + (m ? '?text=' + m : ''),
            telegram: (v, m) => 'https://t.me/' + v.replace('@','') + (m ? '?start=' + m : ''),
            eitaa: (v, m) => 'https://eitaa.com/joinchat/' + v.replace('@','') + (m ? '?text=' + m : ''),
            soroush: (v, m) => 'https://soroush.app/contact/' + v.replace('@','') + (m ? '?message=' + m : ''),
            instagram_dm: (v, m) => 'https://www.instagram.com/direct/t/' + v + (m ? '/?text=' + m : ''),
            viber: (v, m) => 'viber://chat?number=' + encodeURIComponent(v) + (m ? '&text=' + m : ''),
            line: (v, m) => 'https://line.me/R/msg/text/' + (m ? '?' + m : ''),
            wechat: (v, m) => 'weixin://contacts/profile/' + v + (m ? '?text=' + m : ''),
            twitter_dm: (v, m) => 'https://twitter.com/messages/compose?recipient_id=' + v + (m ? '&text=' + m : ''),
            discord: (v, m) => 'https://discord.gg/' + v,
            signal: (v, m) => 'sgnl://chat?number=' + v.replace(/[^0-9]/g,'') + (m ? '&text=' + m : ''),
         //   skype: (v, m) => 'skype:' + v + '?chat' + (m ? '&topic=' + m : ''),
            snapchat: (v, m) => 'https://www.snapchat.com/add/' + v,
            kakaotalk: (v, m) => 'kakaotalk://openchat?chatId=' + v + (m ? '&text=' + m : ''),
            linkedin_msg: (v, m) => 'https://www.linkedin.com/messaging/compose/?recipient=' + v + (m ? '&message=' + m : ''),
            threads: (v, m) => 'https://www.threads.net/' + v + (m ? '?text=' + m : ''),
            pinterest_msg: (v, m) => 'https://www.pinterest.com/messages/compose/?recipient=' + v + (m ? '&message=' + m : ''),
            reddit_chat: (v, m) => 'https://www.reddit.com/message/compose/?to=' + v + (m ? '&subject=' + m : ''),
            youtube_chat: (v, m) => 'https://www.youtube.com/' + v + '/messages',
            slack: (v, m) => 'https://' + v + '.slack.com' + (m ? '?message=' + m : ''),
            teams: (v, m) => 'https://teams.microsoft.com/l/chat/0/0?users=' + encodeURIComponent(v) + (m ? '&message=' + m : ''),
            VK: (v, m) => 'https://vk.com/' + v + (m ? '?message=' + m : '')

        };
        return urlMap[network] ? urlMap[network](value, msg) : '#';
    }

    function wpscb_esc(str){
        // Handle null, undefined, numbers, booleans safely
        if(str === null || str === undefined) return '';
        if(typeof str === 'number' || typeof str === 'boolean') return String(str);

        // Convert to string safely and handle objects
        let safeStr;
        try {
            safeStr = String(str);
        } catch(e) {
            return '';
        }

        // Comprehensive HTML entity encoding including single quotes and forward slash
        return safeStr.replace(/[&<>"'\/\x00-\x1f\x7f-\x9f]/g, function(c){
            const entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',  // More secure than &apos; which is not supported in HTML4
                '/': '&#x2F;',  // Prevent closing tags injection
                '\x00': '',     // Remove null characters
                '\x0A': '&#x0A;', // Line feed
                '\x0D': '&#x0D;'  // Carriage return
            };

            // Handle control characters (0x00-0x1f) and extended ASCII (0x7f-0x9f)
            const code = c.charCodeAt(0);
            if(code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
                if(entityMap[c]) return entityMap[c];
                return '&#x' + code.toString(16).toUpperCase().padStart(2, '0') + ';';
            }

            return entityMap[c] || c;
        });
    }

    function wpscb_applyAdvancedStyles(){
        // Remove existing dynamic styles
        const existingStyle = document.getElementById('wpscb-dynamic-styles');
        if(existingStyle) existingStyle.remove();

        const style = document.createElement('style');
        style.id = 'wpscb-dynamic-styles';
        let css = '#wpscb-widget-root{';
        css += '--wpscb-button-size:'+(wpscb_advanced.button_size||56)+'px;';
        css += '--wpscb-button-icon-size:'+(wpscb_advanced.button_icon_size||24)+'px;';
        css += '--wpscb-button-color:'+(wpscb_advanced.button_color||'#6610f2')+';';
        css += '--wpscb-button-text-color:'+(wpscb_advanced.button_text_color||'#ffffff')+';';
        css += '--wpscb-popup-width:'+(wpscb_advanced.popup_width||340)+'px;';
        css += '--wpscb-popup-bg:'+(wpscb_advanced.popup_bg_color||'#ffffff')+';';
        css += '--wpscb-popup-header-start:'+(wpscb_advanced.popup_header_color||'#6610f2')+';';
        css += '--wpscb-popup-header-end:'+(wpscb_advanced.popup_header_color_end||'#d63384')+';';
        css += '--wpscb-popup-text:'+(wpscb_advanced.popup_text_color||'#212529')+';';
        css += '--wpscb-popup-label:'+(wpscb_advanced.popup_label_color||'#6c757d')+';';
        css += '--wpscb-popup-header-text:'+(wpscb_advanced.popup_label_color||'#ffffff')+';';
        css += '--wpscb-contact-bg:'+(wpscb_advanced.contact_bg_color||'#f8f9fa')+';';
        css += '--wpscb-contact-hover:'+(wpscb_advanced.contact_hover_color||'#e2e8f0')+';';
        css += '}';

        // Auto Dark Mode (8 PM - 7 AM based on WordPress timezone)
        if(wpscb_advanced.auto_dark_mode){
            const wpNow = wpscb_getWordPressTime();
            const hour = wpNow.getHours();
            const isDarkTime = hour >= 20 || hour < 7; // 8 PM to 7 AM
            if(isDarkTime){
                css += '#wpscb-widget-root{';
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
        if(wpscb_advanced.hide_mobile){
            css += '@media (max-width:480px){#wpscb-widget-root{display:none!important;}}';
        }

        // Hide copyright - handled in HTML rendering, no CSS needed

        // Responsive scale
        if(wpscb_advanced.responsive_scale){
            css += '@media (max-width:480px){#wpscb-widget-root{--wpscb-button-size:'+(Math.max(40,(wpscb_advanced.button_size||56)*0.8))+'px;--wpscb-popup-width:calc(100vw - 40px);}}';
        }

        style.textContent = css;
        document.head.appendChild(style);


    }

    function wpscb_render(){

        // Option to disable availability filtering (for testing)
        const disableAvailabilityCheck = false; // Set to true to show all contacts

        const available = disableAvailabilityCheck ?
            wpscb_contacts :
            wpscb_contacts.filter(c => wpscb_isContactAvailable(c.availability));

        // Clear existing content
        wpscb_root.innerHTML = '';

        // Create main widget container (same structure as Live Preview)
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'wpscb-widget-root ' + (wpscb_settings.position === 'left' ? 'wpscb-left' : 'wpscb-right');

        const fab = document.createElement('button');
        fab.className = 'wpscb-fab';
        fab.setAttribute('aria-label', wpscb_i18n.chat || 'Chat');

        // Button mode: icon, text, or image
        const mode = wpscb_advanced.button_mode || 'icon';
        if(mode === 'text'){
            const iconSize = wpscb_advanced.button_icon_size || 24;
            fab.textContent = wpscb_advanced.button_text || wpscb_i18n.chat || 'Chat';
            fab.style.fontSize = 'var(--wpscb-button-icon-size)';
            fab.style.padding = iconSize + 'px 20px';
            fab.style.width = 'auto';
        } else if(mode === 'image' && wpscb_advanced.button_image_url){
            fab.innerHTML = '<img src="'+wpscb_esc(wpscb_advanced.button_image_url)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" />';
            fab.style.backgroundColor = 'transparent';
            fab.style.boxShadow = 'none';
        } else {
            fab.innerHTML = wpscb_chatIcon;
        }

        fab.onclick = wpscb_togglePopup;
        console.log(wpscb_advanced);
        const popup = document.createElement('div');
        popup.className = 'wpscb-popup';
        popup.style.display = 'none';
        popup.innerHTML = `
            <div class="wpscb-popup-header">
                <span>${wpscb_esc(wpscb_advanced.popup_title || wpscb_i18n.chat || 'Chat')}</span>
                <button class="wpscb-popup-close" aria-label="Close">✕</button>
            </div>
            <div class="wpscb-popup-body">
                ${available.map(c => {
                    console.log(c);
                    const url = wpscb_buildURL(c.network, c.value, c.message);

                    // Use photo if available, otherwise network icon
                    const avatar = c.photo_url ?
                        `<img src="${wpscb_esc(c.photo_url)}" alt="" class="wpscb-contact-avatar" />` :
                        `<span class="wpscb-contact-avatar-icon">${wpscb_getNetworkIcon(c.network)}</span>`;

                    // Show availability info if available (based on WordPress timezone)
                    let avail = '';
                    if(c.availability){
                        const wpNow = wpscb_getWordPressTime();
                        const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
                        const currentDay = dayNames[wpNow.getDay()];
                        const todaySlots = c.availability[currentDay] || [];
                        if(todaySlots.length > 0){
                            const firstSlot = todaySlots[0];
                            const lastSlot = todaySlots[todaySlots.length - 1];
                            avail = '<div class="wpscb-contact-time" style="color:var(--wpscb-popup-label);">'+firstSlot.start+' - '+lastSlot.end+'</div>';
                        }
                    }

                    return `<a href="${wpscb_esc(url)}" target="_blank" rel="noopener" class="wpscb-contact-item">
                        ${avatar}
                        <div class="wpscb-contact-info">
                            <div class="wpscb-contact-name">${wpscb_esc(c.name || c.network)}</div>
                            ${avail}
                        </div>
                    </a>`;
                }).join('')}
            </div>
            ${!wpscb_advanced.hide_copyright ? `
                <div class="wpscb-popup-footer">
                    <div style="font-size:11px;color:var(--wpscb-popup-label);">${WPSCB_FRONT.i18n.poweredBy}</div>
                </div>
            ` : ''}
        `;

        // Add elements to widget container (same structure as Live Preview)
        widgetContainer.appendChild(fab);
        widgetContainer.appendChild(popup);

        // Add widget container to wpscb_root
        wpscb_root.appendChild(widgetContainer);

        popup.querySelector('.wpscb-popup-close').onclick = wpscb_closePopup;
        document.addEventListener('click', (e) => {
            if(wpscb_isOpen && !popup.contains(e.target) && !fab.contains(e.target)){
                wpscb_closePopup();
            }
        });
    }

    function wpscb_togglePopup(){
        const popup = wpscb_root.querySelector('.wpscb-popup');
        if(!popup) return;
        wpscb_isOpen = !wpscb_isOpen;
        popup.style.display = wpscb_isOpen ? 'flex' : 'none';
    }

    function wpscb_closePopup(){
        const popup = wpscb_root.querySelector('.wpscb-popup');
        if(popup){ popup.style.display = 'none'; wpscb_isOpen = false; }
    }

    // Apply advanced settings as CSS variables first
    wpscb_applyAdvancedStyles();
    wpscb_render();
});
