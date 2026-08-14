/* global jQuery, WPSCB */
( function( $ ) {
    const wpscb_state = {
        contacts: (WPSCB.contacts || []).map(c => wpscb_normalizeContact(c)),
        networks: WPSCB.networks || {},
        settings: WPSCB.settings || {},
        modalOpen: false,
        modal: null,
        editIndex: null
    };

    function wpscb_normalizeContact( c ) {
        const defSlots = () => [ { start: '00:00', end: '23:59' } ];
        // Backward compatibility: convert old schema {days:[], hours:{}} to per-day slots
        let availability = c.availability;
        const dayKeys = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ];
        if ( ! availability ) {
            availability = {};
            dayKeys.forEach( d => availability[ d ] = defSlots() );
        } else if ( Array.isArray( availability.days ) && availability.hours ) {
            const hours = availability.hours || { start: '00:00', end: '23:59' };
            const days = availability.days || [];
            const obj = {};
            dayKeys.forEach( d => { obj[ d ] = days.includes( d ) ? [ { start: hours.start, end: hours.end } ] : []; } );
            availability = obj;
        } else {
            // Ensure shape: object with day arrays
            dayKeys.forEach( d => {
                if ( ! Array.isArray( availability[ d ] ) ) {
                    availability[ d ] = [];
                }
                // sanitize times
                availability[ d ] = availability[ d ].map( r => ( { start: ( r && r.start ) || '00:00', end: ( r && r.end ) || '23:59' } ) );
            });
        }
        return {
            network: c.network || '',
            value: c.value || '',
            name: c.name || '',
            photo: c.photo || 0,
            photo_url: c.photo_url || '',
            message: c.message || '',
            availability
        };
    }

    function wpscb_render() {
        const $app = $( '#wpscb-app' );
        if ( ! $app.length ) {
            return;
        }
        let html = '';
        html += '<div class="wpscb-header">';
        html += '<button type="button" class="wpscb-btn" id="wpscb-add">'+WPSCB.i18n.addContact+'</button>';
        html += '</div>';
        if(wpscb_state.contacts.length){
            html += '<div class="wpscb-table-wrapper"><table class="wpscb-table"><thead><tr>'+
                '<th>'+wpscb_escapeHtml(WPSCB.i18n.tableHeaderName)+'</th>'+
                '<th>'+wpscb_escapeHtml(WPSCB.i18n.tableHeaderValue)+'</th>'+
                '<th>'+wpscb_escapeHtml(WPSCB.i18n.tableHeaderNetwork)+'</th>'+
                '<th>'+wpscb_escapeHtml(WPSCB.i18n.tableHeaderPhoto)+'</th>'+
                '<th>'+wpscb_escapeHtml(WPSCB.i18n.tableHeaderActions)+'</th>'+
            '</tr></thead><tbody>';
            wpscb_state.contacts.forEach((c,i)=>{
                html += '<tr data-index="'+i+'">';
                html += '<td>'+wpscb_escapeHtml(c.name || '-')+'</td>';
                html += '<td>'+wpscb_escapeHtml(c.value)+'</td>';
                html += '<td><span class="wpscb-network-tag">'+wpscb_networkIconSvg(c.network)+wpscb_escapeHtml(wpscb_capitalize(c.network))+'</span></td>';
                html += '<td>'+wpscb_renderPhotoCell(c)+'</td>';
                html += '<td><div class="wpscb-actions"><button type="button" class="wpscb-btn secondary wpscb-edit" aria-label="Edit">✎</button><button type="button" class="wpscb-btn danger wpscb-delete" aria-label="Delete">🗑</button></div></td>';
                html += '</tr>';
            });
            html += '</tbody></table></div>';
        } else {
            html += '<div class="wpscb-empty">'+wpscb_escapeHtml(WPSCB.i18n.emptyMessage)+'</div>';
        }
        $app.html(html);
    }

    function wpscb_renderPhotoCell(photo){
        const c = typeof photo === 'object' ? photo : null;
        const id = c ? (c.photo||0) : (photo||0);
        const url = c ? c.photo_url : '';
        if((id && parseInt(id,10) > 0) || url){
            const src = url || wpscb_getAttachmentUrl(id);
            return '<img class="wpscb-avatar" src="'+wpscb_escapeHtml(src)+'" alt="" />';
        }
        const net = c ? c.network : '';
        return '<span class="wpscb-avatar wpscb-avatar-icon" aria-hidden="true">'+wpscb_networkIconSvg(net)+'</span>';
    }

    function wpscb_getAttachmentUrl(id){
        // We'll resolve via AJAX on demand if not localized; fallback to WP generic.
        return WPSCB.mediaBase ? (WPSCB.mediaBase + id) : (WPSCB.uploadsBase ? (WPSCB.uploadsBase + '/' + id) : '');
    }

        function wpscb_openModal(editIndex){
        if(wpscb_state.modalOpen) return;
        wpscb_state.modalOpen = true;
                wpscb_state.editIndex = (typeof editIndex === 'number') ? editIndex : null;
                const editing = wpscb_state.editIndex !== null;
                const existing = editing ? wpscb_state.contacts[wpscb_state.editIndex] : wpscb_normalizeContact({ network:'whatsapp', value:'', name:'', photo:0, message:'', availability:null });
                    const dropdown = wpscb_buildNetworkDropdown(existing.network);
                const titleText = editing ? WPSCB.i18n.editContact : WPSCB.i18n.addContact;
                const markup = `
        <div class="wpscb-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wpscb-modal-title" aria-describedby="wpscb-modal-desc">
          <div class="wpscb-modal">
                        <header>
                            <span id="wpscb-modal-title">${titleText}</span>
                        </header>
            <div class="body">
                <div class="notice notice-error wpscb-alert" id="wpscb-top-alert" style="display:none"><p></p></div>
                <p id="wpscb-modal-desc" style="margin-top:0;color:#475569;font-size:13px">${WPSCB.i18n.selectNetwork} ${WPSCB.i18n.searchPlaceholder}</p>
                            <div class="wpscb-field">
                                <label>${WPSCB.i18n.name}</label>
                                <input type="text" id="wpscb-name" value="${existing.name}" />
                            </div>
              <div class="wpscb-field">
                     <label>${WPSCB.i18n.network}</label>
                     ${dropdown}
              </div>
                            <div class="wpscb-field">
                                <label id="wpscb-value-label"></label>
                                                                <input type="text" id="wpscb-value" value="${existing.value}" />
                            </div>
                                                        <div class="wpscb-field">
                                                                <label>${WPSCB.i18n.message}</label>
                                                                <input type="text" id="wpscb-message" value="${existing.message || WPSCB.i18n.defaultMessage}" />
                                                        </div>
                            <div class="wpscb-field">
                                <label>${WPSCB.i18n.photo}</label>
                                <div><button type="button" class="wpscb-btn secondary" id="wpscb-pick-media">${WPSCB.i18n.chooseUpload}</button></div>
                                                <div class="wpscb-media-preview" id="wpscb-media-preview">${(existing.photo_url||existing.photo)?('<img src="'+wpscb_escapeHtml(existing.photo_url||wpscb_getAttachmentUrl(existing.photo))+'" alt="" /><button type="button" class="wpscb-media-remove" id="wpscb-remove-media">'+WPSCB.i18n.remove+'</button>'):('<span style="font-size:12px;color:#64748b">'+WPSCB.i18n.noImageSelected+'</span>')}</div>
                                <input type="hidden" id="wpscb-photo" value="${existing.photo}" />
                            </div>
                            <div class="wpscb-field">
                                <button type="button" class="wpscb-btn outline wpscb-accordion-toggle" id="wpscb-availability-toggle">
                                    <span>${WPSCB.i18n.availability}</span>
                                    <span class="wpscb-accordion-arrow">▾</span>
                                </button>
                                <div class="wpscb-availability-panel" id="wpscb-availability-panel" style="display:none;margin-top:12px;">
                                    ${['mon','tue','wed','thu','fri','sat','sun'].map(d => {
                                        const slots = existing.availability[d] || [];
                                        return `
                                        <div class="wpscb-day-row" data-day="${d}">
                                            <div class="wpscb-day-header">
                                                <span class="wpscb-day-label">${wpscb_escapeHtml(WPSCB.i18n['day_'+d])}</span>
                                                <div class="wpscb-day-actions">
                                                    <button type="button" class="button button-small wpscb-add-slot" data-day="${d}">${wpscb_escapeHtml(WPSCB.i18n.addTimeRange)}</button>
                                                    <button type="button" class="button button-link-delete wpscb-clear-day" data-day="${d}">${wpscb_escapeHtml(WPSCB.i18n.clearDay)}</button>
                                                </div>
                                            </div>
                                            <div class="wpscb-slots" data-day="${d}">
                                                ${slots.length ? slots.map((r,i)=>wpscb_slotRowTpl(d,i,r.start,r.end)).join('') : ''}
                                            </div>
                                        </div>`;
                                    }).join('')}
                                    <div class="wpscb-copyall-row">
                                        <button type="button" class="button wpscb-copy-to-all" id="wpscb-copy-to-all">${wpscb_escapeHtml(WPSCB.i18n.copyToAll)}</button>
                                    </div>
                                </div>
                            </div>
              <div class="wpscb-field" id="wpscb-error" style="display:none;color:#dc2626;font-size:13px"></div>
            </div>
            <footer>
                            <button type="button" class="wpscb-btn" id="wpscb-save">${wpscb_escapeHtml(editing ? WPSCB.i18n.update : WPSCB.i18n.save)}</button>
              <button type="button" class="wpscb-btn secondary" id="wpscb-cancel">${wpscb_escapeHtml(WPSCB.i18n.cancel)}</button>
            </footer>
          </div>
        </div>`;
        wpscb_state.modal = $(markup).appendTo('body');
        wpscb_updateValueLabel();
        wpscb_state.modal.on('change','#wpscb-network', wpscb_updateValueLabel);
        wpscb_initNetworkDropdown(existing.network);
        wpscb_state.modal.on('click','#wpscb-cancel', wpscb_closeModal);
                wpscb_state.modal.on('click','#wpscb-save', wpscb_saveContact);
                wpscb_state.modal.on('click','#wpscb-pick-media', wpscb_openMediaFrame);
                wpscb_state.modal.on('click','#wpscb-remove-media', function(){ $('#wpscb-photo').val('0'); $('#wpscb-media-preview').html('<span style="font-size:12px;color:#64748b">'+wpscb_escapeHtml(WPSCB.i18n.noImageSelected)+'</span>'); });
        // Accordion toggle
        wpscb_state.modal.on('click','#wpscb-availability-toggle', function(){
            const $panel = $('#wpscb-availability-panel');
            const $arrow = $(this).find('.wpscb-accordion-arrow');
            $panel.slideToggle(200);
            $arrow.toggleClass('open');
        });
        // Add slot handler
        wpscb_state.modal.on('click','.wpscb-add-slot', function(){
            const day = $(this).data('day');
            const $slotsWrap = $('.wpscb-slots[data-day="'+day+'"]');
            const index = $slotsWrap.children('.wpscb-slot-row').length;
            const rowHtml = wpscb_slotRowTpl(day,index,'09:00','17:00');
            $slotsWrap.append(rowHtml);
        });
        // Remove slot
        wpscb_state.modal.on('click','.wpscb-remove-slot', function(){
            $(this).closest('.wpscb-slot-row').remove();
            // reindex
            $('.wpscb-slots').each(function(){
                $(this).children('.wpscb-slot-row').each(function(i){
                    $(this).attr('data-index', i);
                });
            });
        });
        // Clear day slots
        wpscb_state.modal.on('click','.wpscb-clear-day', function(){
            const day = $(this).data('day');
            $('.wpscb-slots[data-day="'+day+'"]').empty();
        });
        // Copy first non-empty day to all empty days
        wpscb_state.modal.on('click','#wpscb-copy-to-all', function(){
            let sourceSlots = null;
            $('.wpscb-slots').each(function(){
                const rows = $(this).children('.wpscb-slot-row');
                if(rows.length && !sourceSlots){
                    sourceSlots = rows.map(function(){
                        return {
                            start: $(this).find('.wpscb-slot-start').val(),
                            end: $(this).find('.wpscb-slot-end').val()
                        };
                    }).get();
                }
            });
            if(!sourceSlots) return;
            $('.wpscb-slots').each(function(){
                const rows = $(this).children('.wpscb-slot-row');
                if(!rows.length){
                    const day = $(this).data('day');
                    sourceSlots.forEach((r,i)=>{
                        $(this).append(wpscb_slotRowTpl(day,i,r.start,r.end));
                    });
                }
            });
        });
        // Focus first input for accessibility
        setTimeout(function(){ $('#wpscb-name').trigger('focus'); }, 0);
        // Close on Escape
        $(document).on('keydown.wpscb-modal', function(e){ if(e.key === 'Escape'){ wpscb_closeModal(); } });
    }

    function wpscb_updateValueLabel(){
        const network = $('#wpscb-network').val();
        const data = wpscb_state.networks[network];
        if(!data) return;
        const map = {
            phone: WPSCB.i18n.phone,
            username: WPSCB.i18n.username,
            email: WPSCB.i18n.labelEmail,
            id: WPSCB.i18n.labelID,
            code: WPSCB.i18n.labelCode,
            url: WPSCB.i18n.labelURL
        };
        const label = map[data.type] || WPSCB.i18n.labelValue;
        $('#wpscb-value-label').text(label);
        $('#wpscb-value').attr('placeholder', label);
    }

    function wpscb_buildNetworkDropdown(selected){
        return '<div class="wpscb-select-wrapper"><div class="wpscb-md-select" tabindex="0" id="wpscb-select-trigger"><span class="current-label">'+wpscb_networkIconSvg(selected)+'<span>'+wpscb_escapeHtml(wpscb_networkLabel(selected))+'</span></span><span class="dropdown-arrow">▾</span></div><input type="hidden" id="wpscb-network" value="'+wpscb_escapeHtml(selected)+'" /><div class="wpscb-dropdown" style="display:none" id="wpscb-dropdown"><input type="text" placeholder="'+wpscb_escapeHtml(WPSCB.i18n.searchPlaceholder)+'" class="wpscb-dropdown-search" id="wpscb-search" />'+buildNetworkItems(selected)+'</div></div>';
    }
    function buildNetworkItems(selected){
        const items = Object.keys(wpscb_state.networks).map(key=>{
            const data = wpscb_state.networks[key];
            const active = key===selected ? ' style="background:#e0f2fe"' : '';
            return '<div class="wpscb-dropdown-item" data-value="'+key+'">'+wpscb_networkIconSvg(key)+'<span>'+wpscb_escapeHtml(data.label)+'</span></div>';
        });
        return items.join('');
    }
    function wpscb_initNetworkDropdown(selected){
        const $wrap = $('.wpscb-select-wrapper');
        const $trigger = $('#wpscb-select-trigger');
        const $dropdown = $('#wpscb-dropdown');
        const $search = $('#wpscb-search');

        $trigger.on('click keydown', function(e){
            if(e.type==='keydown' && e.key!=='Enter' && e.key!==' ') return;
            e.preventDefault();
            const isVisible = $dropdown.is(':visible');
            $dropdown.toggle();
            $trigger.toggleClass('open', !isVisible);
            if(!isVisible){
                $search[0].focus();
            }
        });

        $(document).on('click.wpscb-dropdown', function(e){
            if(!$(e.target).closest('.wpscb-select-wrapper').length){
                $dropdown.hide();
                $trigger.removeClass('open');
            }
        });

        $dropdown.on('click','.wpscb-dropdown-item', function(){
            const val = $(this).data('value');
            $('#wpscb-network').val(val).trigger('change');
            $('.current-label').html(wpscb_networkIconSvg(val)+'<span>'+wpscb_escapeHtml(wpscb_networkLabel(val))+'</span>');
            $dropdown.hide();
            $trigger.removeClass('open');
        });

        $search.on('input', function(){
            const q = $(this).val().toLowerCase();
            $dropdown.find('.wpscb-dropdown-item').each(function(){
                const txt = $(this).text().toLowerCase();
                $(this).toggle(txt.indexOf(q)>=0);
            });
            if(!$dropdown.find('.wpscb-dropdown-item:visible').length){
                if(!$dropdown.find('.wpscb-dropdown-empty').length){
                    $dropdown.append('<div class="wpscb-dropdown-empty">'+wpscb_escapeHtml(WPSCB.i18n.noResults)+'</div>');
                }
            } else { $dropdown.find('.wpscb-dropdown-empty').remove(); }
        });

        $search.on('keydown', function(e){
            if(e.key === 'Escape'){
                $dropdown.hide();
                $trigger.removeClass('open').focus();
            }
        });
    }
    function wpscb_networkLabel(key){
        const d = wpscb_state.networks[key];
        return d ? d.label : WPSCB.i18n.selectNetwork;
    }
    function wpscb_networkIconSvg(key){
        // Brand-style (approximate) inline SVG icons (non-official) sized 18x18
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
          //  skype: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#00AFF0"/><path fill="#fff" d="M8 12c0 2 2 3.5 4.5 3.5 1.8 0 3.5-.7 3.5-2 0-1.4-1.3-1.8-2.9-2.1-1.2-.2-2.5-.4-2.5-1.1 0-.6.9-.9 1.8-.9 1 0 1.9.3 2.5.7l.7-1.3c-.8-.5-1.9-.8-3.1-.8C10 8 8 9 8 10.5c0 1.5 1.4 2 3 2.3 1.2.2 2.4.4 2.4 1 0 .6-.8 1-1.9 1-1 0-2-.4-2.6-.9L8 12Z"/></svg>',
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
        return svg[key] || '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
    }

    function wpscb_closeModal(){
        if(!wpscb_state.modalOpen) return;
        $(document).off('click.wpscb-dropdown');
        $(document).off('keydown.wpscb-modal');
        wpscb_state.modal.remove();
        wpscb_state.modalOpen = false;
        wpscb_state.editIndex = null;
    }

    function wpscb_saveContact(){
        const network = $('#wpscb-network').val();
        const value = $('#wpscb-value').val().trim();
    const name = $('#wpscb-name').val().trim();
    const message = $('#wpscb-message').val() ? $('#wpscb-message').val().trim() : '';
        const photo = $('#wpscb-photo').val();
        const data = wpscb_state.networks[network];
        if(!data){ return; }
        const pattern = new RegExp(data.pattern.slice(1, -1));
        if(!value || (data.pattern && !pattern.test(value))){
            $('#wpscb-error').text(WPSCB.i18n.invalidFormat).show();
            return;
        }
        // Basic per-field validation UX (show inline messages)
        $('#wpscb-error').hide();
        $('.wpscb-field-error').hide();
        let hasError = false;
        if(!network){
            wpscb_fieldError('#wpscb-network', WPSCB.i18n.selectNetworkFirst); hasError = true;
        }
        if(!value){
            wpscb_fieldError('#wpscb-value', WPSCB.i18n.valueRequired); hasError = true;
        }
        if(!name){
            wpscb_fieldError('#wpscb-name', WPSCB.i18n.fieldRequired); hasError = true;
        }
        if(hasError){ return; }
        // Collect availability (new multi-slot schema)
        const availability = {};
        ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => {
            availability[d] = [];
            $('.wpscb-slots[data-day="'+d+'"] .wpscb-slot-row').each(function(){
                const start = $(this).find('.wpscb-slot-start').val() || '00:00';
                const end = $(this).find('.wpscb-slot-end').val() || '23:59';
                if(start && end){
                    availability[d].push({start, end});
                }
            });
        });
        const payload = { action: wpscb_state.editIndex!==null ? 'wpscb_update_contact' : 'wpscb_save_contact', nonce: WPSCB.nonce, network, value, name, message, photo, availability: JSON.stringify(availability), index: wpscb_state.editIndex };
        $.post(WPSCB.ajaxUrl, payload, function(resp){
            if(!resp.success){
                $('#wpscb-error').text(resp.data.message || WPSCB.i18n.errorSaving).show();
                return;
            }
            wpscb_state.contacts = (resp.data.contacts || []).map(wpscb_normalizeContact);
            wpscb_closeModal();
            // Inject a WP-style success notice on panel
            const noticeMsg = wpscb_state.editIndex!==null ? WPSCB.i18n.updatedContact : WPSCB.i18n.savedContact;
            const $panel = $('#wpscb-app');
            if($panel.length){
                $('<div class="notice notice-success is-dismissible wpscb-alert"><p>'+wpscb_escapeHtml(noticeMsg)+'</p></div>').insertBefore($panel).delay(4000).fadeOut();
            }
            wpscb_render();
        });
    }

    function wpscb_deleteContact(index){
        // Show MD3-style confirmation modal instead of native confirm
        const contact = wpscb_state.contacts[index];
        if(!contact) return;
        const contactName = contact.name || contact.value || WPSCB.i18n.selectNetwork;
        const markup = `
        <div class="wpscb-modal-backdrop wpscb-delete-modal" role="dialog" aria-modal="true" aria-labelledby="wpscb-delete-title">
          <div class="wpscb-modal">
            <header>
              <span id="wpscb-delete-title">${wpscb_escapeHtml(WPSCB.i18n.deleteContactTitle)}</span>
            </header>
            <div class="body">
              <p style="margin:0;font-size:14px;color:#475569">${wpscb_escapeHtml(WPSCB.i18n.deleteContactMessage)}</p>
              <p style="margin-top:12px;font-weight:500;font-size:14px;color:#1e293b">${wpscb_escapeHtml(contactName)}</p>
            </div>
            <footer>
              <button type="button" class="wpscb-btn danger" id="wpscb-confirm-delete">${wpscb_escapeHtml(WPSCB.i18n.deleteBtn)}</button>
              <button type="button" class="wpscb-btn secondary" id="wpscb-cancel-delete">${wpscb_escapeHtml(WPSCB.i18n.cancel)}</button>
            </footer>
          </div>
        </div>`;
        const $deleteModal = $(markup).appendTo('body');
        $deleteModal.on('click','#wpscb-confirm-delete', function(){
            $deleteModal.remove();
            $(document).off('keydown.wpscb-delete-modal');
            $.post(WPSCB.ajaxUrl, { action: 'wpscb_delete_contact', nonce: WPSCB.nonce, index }, function(resp){
                if(resp.success){
                    wpscb_state.contacts = (resp.data.contacts || []).map(wpscb_normalizeContact);
                    const $panel = $('#wpscb-app');
                    if($panel.length){
                        $('<div class="notice notice-success is-dismissible wpscb-alert"><p>'+wpscb_escapeHtml(WPSCB.i18n.deletedContact)+'</p></div>').insertBefore($panel).delay(4000).fadeOut();
                    }
                    wpscb_render();
                } else {
                    alert(resp.data.message || WPSCB.i18n.errorDeleting);
                }
            });
        });
        $deleteModal.on('click','#wpscb-cancel-delete', function(){
            $deleteModal.remove();
            $(document).off('keydown.wpscb-delete-modal');
        });
        $(document).on('keydown.wpscb-delete-modal', function(e){
            if(e.key === 'Escape'){
                $deleteModal.remove();
                $(document).off('keydown.wpscb-delete-modal');
            }
        });
    }

    function wpscb_bindEvents(){
        $('#wpscb-app').on('click','#wpscb-add', function(){ wpscb_openModal(); });
        $('#wpscb-app').on('click','.wpscb-delete', function(){
            const idx = $(this).closest('tr').data('index');
            wpscb_deleteContact(idx);
        });
        $('#wpscb-app').on('click','.wpscb-edit', function(){
            const idx = $(this).closest('tr').data('index');
            wpscb_openModal(idx);
        });
        $('#wpscb-settings-form').on('submit', function(e){
            e.preventDefault();
            const enabled = $(this).find('input[name="enabled"]').is(':checked') ? 1 : 0;
            const position = $(this).find('select[name="position"]').val();
            $.post(WPSCB.ajaxUrl, { action: 'wpscb_save_settings', nonce: WPSCB.nonce, enabled, position }, function(resp){
                if(resp.success){
                    $('<div class="updated notice is-dismissible wpscb-notice"><p>'+wpscb_escapeHtml(WPSCB.i18n.settingsSaved)+'</p></div>').insertAfter('#wpscb-settings-form h1').delay(3000).fadeOut();
                } else {
                    alert(resp.data.message || WPSCB.i18n.errorSavingSettings);
                }
            });
        });
    }

    function wpscb_fieldError(selector, message){
        const $input = $(selector);
        if(!$input.length) return;
        let $wrap = $input.closest('.wpscb-field');
        if(!$wrap.length) return;
        let $err = $wrap.find('.wpscb-field-error');
        if(!$err.length){
            $err = $('<div class="wpscb-field-error" role="alert"></div>').appendTo($wrap);
        }
        $err.text(message).show();
        $input.attr('aria-invalid','true');
    }

    // WP Media frame integration (top-level)
    let mediaFrame = null;
    function wpscb_openMediaFrame(){
        const wpMedia = window.wp && window.wp.media;
        if(!wpMedia){
            alert(WPSCB.i18n.mediaUnavailable);
            return;
        }
        if(mediaFrame){ mediaFrame.open(); return; }
        mediaFrame = wpMedia({ title:'Select Image', button:{ text:'Use Image' }, multiple:false });
        mediaFrame.on('select', function(){
            const attachment = mediaFrame.state().get('selection').first().toJSON();
            $('#wpscb-photo').val(attachment.id);
            $('#wpscb-media-preview').html('<img src="'+wpscb_escapeHtml(attachment.url)+'" alt="" /><button type="button" class="wpscb-media-remove" id="wpscb-remove-media">'+wpscb_escapeHtml(WPSCB.i18n.remove)+'</button>');
        });
        mediaFrame.open();
    }

    function wpscb_escapeHtml(str){
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
    function wpscb_capitalize(str){ return str.charAt(0).toUpperCase() + str.slice(1); }

    // Template for a time range row
    function wpscb_slotRowTpl(day, index, start, end){
        start = start || '09:00';
        end = end || '17:00';
        return '<div class="wpscb-slot-row" data-day="'+day+'" data-index="'+index+'">'
            + '<span class="wpscb-slot-label">'+wpscb_escapeHtml(WPSCB.i18n.from)+'</span>'
            + '<input type="time" class="wpscb-slot-start" value="'+wpscb_escapeHtml(start)+'" />'
            + '<span class="wpscb-slot-sep">—</span>'
            + '<span class="wpscb-slot-label">'+wpscb_escapeHtml(WPSCB.i18n.to)+'</span>'
            + '<input type="time" class="wpscb-slot-end" value="'+wpscb_escapeHtml(end)+'" />'
            + '<button type="button" class="button button-small button-link-delete wpscb-remove-slot" aria-label="Remove">×</button>'
            + '</div>';
    }

    $(document).ready(function(){
        wpscb_render();
        wpscb_bindEvents();

        // Initialize settings page if present
        if ( $( '.wpscb-settings-page' ).length ) {
            wpscb_initSettingsPage();
        }
         // Add powered by text to footer
        const footerLeft = document.getElementById('footer-thankyou');
        if (footerLeft && WPSCB.i18n && WPSCB.i18n.poweredBy) {
            footerLeft.innerHTML += WPSCB.i18n.poweredBy;
        }
    });

    // Settings page auto-save and preview
    function wpscb_initSettingsPage() {
        const $page = $('.wpscb-settings-page');
        // console.log('Settings page found:', $page.length);
        if(!$page.length) return;

        let saveTimeout;
        const $indicator = $('.wpscb-settings-save-indicator');
        const $livePreview = $('#wpscb-live-preview');
        let hideCopyrightDialogOpen = false;
        let hideCopyrightConfirmed = false;
        // console.log('Live preview element found:', $livePreview.length);

        // Debounced auto-save
        function wpscb_autoSave(){
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function(){
                wpscb_saveAllSettings();
            }, 800);
        }

        function wpscb_saveAllSettings(){
            // Gather basic settings
            const basicData = {
                action: 'wpscb_save_settings',
                nonce: WPSCB.nonce,
                enabled: $page.find('input[name="enabled"]').is(':checked') ? 1 : 0,
                position: $page.find('select[name="position"]').val()
            };
            // Gather advanced settings
            const advData = {
                action: 'wpscb_save_advanced_settings',
                nonce: WPSCB.nonce,
                display_mode: $page.find('input[name="display_mode"]:checked').val(),
                button_mode: $page.find('input[name="button_mode"]:checked').val(),
                button_text: $page.find('input[name="button_text"]').val(),
                button_image: $page.find('input[name="button_image"]').val(),
                button_size: $page.find('input[name="button_size"]').val(),
                button_icon_size: $page.find('input[name="button_icon_size"]').val(),
                button_border_radius: $page.find('input[name="button_border_radius"]').val(),
                button_color: $page.find('input[name="button_color"]').val(),
                button_text_color: $page.find('input[name="button_text_color"]').val(),
                button_icon_svg: $page.find('input[name="button_icon_svg"]').val(),
                popup_width: $page.find('input[name="popup_width"]').val(),
                popup_title: $page.find('input[name="popup_title"]').val(),
                popup_bg_color: $page.find('input[name="popup_bg_color"]').val(),
                popup_header_color: $page.find('input[name="popup_header_color"]').val(),
                popup_header_color_end: $page.find('input[name="popup_header_color_end"]').val(),
                popup_text_color: $page.find('input[name="popup_text_color"]').val(),
                popup_label_color: $page.find('input[name="popup_label_color"]').val(),
                contact_bg_color: $page.find('input[name="contact_bg_color"]').val(),
                contact_hover_color: $page.find('input[name="contact_hover_color"]').val(),
                auto_dark_mode: $page.find('input[name="auto_dark_mode"]').is(':checked') ? 1 : 0,
                hide_mobile: $page.find('input[name="hide_mobile"]').is(':checked') ? 1 : 0,
                hide_copyright: $page.find('input[name="hide_copyright"]').is(':checked') ? 1 : 0,
                responsive_scale: $page.find('input[name="responsive_scale"]').is(':checked') ? 1 : 0,
                display_scope: $page.find('select[name="display_scope"]').val(),
                display_page_ids: $page.find('input[name="display_page_ids[]"]:checked').map(function(){ return this.value; }).get(),
                display_category_ids: $page.find('input[name="display_category_ids[]"]:checked').map(function(){ return this.value; }).get()
            };

            // Debug copyright setting
            // Save basic first, then advanced
            $.post( WPSCB.ajaxUrl, basicData, function( res1 ) {
                $.post( WPSCB.ajaxUrl, advData, function( res2 ) {
                    if ( res2.success ) {
                        wpscb_showSaveIndicator();
                        wpscb_updatePreview();
                    }
                } );
            } ).fail( function( xhr, status, error ) {
                console.error( 'Basic settings save failed:', error, xhr.responseText );
            } );
        }

        function wpscb_showSaveIndicator() {
            $indicator.fadeIn( 200 ).delay( 1500 ).fadeOut( 300 );
        }

        function wpscb_updatePreview() {
            if ( $livePreview.length ) {
                wpscb_renderLivePreview();
            }
        }

        // Live Preview Renderer
        function wpscb_renderLivePreview() {
            // Quick test to ensure preview element works
            if ( ! $livePreview.length ) {
                return;
            }

            // Get current settings from form
            const enabled = $page.find('input[name="enabled"]').is(':checked');
            const position = $page.find('select[name="position"]').val() || 'right';
            const displayMode = $page.find('input[name="display_mode"]:checked').val() || 'popup';
            const buttonMode = $page.find('input[name="button_mode"]:checked').val() || 'icon';
            const buttonText = $page.find('input[name="button_text"]').val() || 'Chat';
            const buttonSize = parseInt($page.find('input[name="button_size"]').val()) || 56;
            const buttonIconSize = parseInt($page.find('input[name="button_icon_size"]').val()) || 24;
            const buttonBorderRadius = parseInt($page.find('input[name="button_border_radius"]').val());
            const buttonColor = $page.find('input[name="button_color"]').val() || '#6610f2';
            const buttonTextColor = $page.find('input[name="button_text_color"]').val() || '#ffffff';
            const popupWidth = parseInt($page.find('input[name="popup_width"]').val()) || 340;
            const popupTitle = $page.find('input[name="popup_title"]').val() || 'Chat';
            const popupBgColor = $page.find('input[name="popup_bg_color"]').val() || '#ffffff';
            const headerColorStart = $page.find('input[name="popup_header_color"]').val() || '#6610f2';
            const headerColorEnd = $page.find('input[name="popup_header_color_end"]').val() || '#d63384';
            const textColor = $page.find('input[name="popup_text_color"]').val() || '#212529';
            const labelColor = $page.find('input[name="popup_label_color"]').val() || '#6c757d';
            const contactBgColor = $page.find('input[name="contact_bg_color"]').val() || '#f8f9fa';
            const contactHoverColor = $page.find('input[name="contact_hover_color"]').val() || '#e2e8f0';
            const autoDarkMode = $page.find('input[name="auto_dark_mode"]').is(':checked');
            const hideMobile = $page.find('input[name="hide_mobile"]').is(':checked');
            const hideCopyright = $page.find('input[name="hide_copyright"]').is(':checked');
            const responsiveScale = $page.find('input[name="responsive_scale"]').is(':checked');

            // Always show preview, even if disabled (with message)
            if ( ! enabled ) {
                $livePreview.html('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ffffff;font-size:16px;text-align:center;"><div><div style="font-size:48px;margin-bottom:16px;">💬</div><div>Widget is disabled</div><div style="font-size:12px;opacity:0.8;margin-top:8px;">Enable widget to see preview</div></div></div>');
                return;
            }

            // Auto Dark Mode check (8 PM - 7 AM based on WordPress timezone)
            function wpscb_getWordPressTime(){
                const timezone = WPSCB.timezone || {};
                const offsetHours = timezone.offset || 0;
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const wpTime = new Date(utc + (offsetHours * 3600000));
                return wpTime;
            }

            const wpNow = wpscb_getWordPressTime();
            const hour = wpNow.getHours();
            const isDarkTime = hour >= 20 || hour < 7;

            // Apply dark colors if Auto Dark Mode is enabled and it's dark time
            let finalPopupBg = popupBgColor;
            let finalTextColor = textColor;
            let finalLabelColor = labelColor;
            let finalContactBg = contactBgColor;
            let finalContactHover = contactHoverColor;

            if(autoDarkMode && isDarkTime){
                finalPopupBg = '#1e293b';
                finalTextColor = '#f1f5f9';
                finalLabelColor = '#94a3b8';
                finalContactBg = '#2d3748';
                finalContactHover = '#4a5568';
            }

            const cssVars = `
                --wpscb-button-size: ${buttonSize}px;
                --wpscb-button-icon-size: ${buttonIconSize}px;
                --wpscb-button-border-radius: ${isNaN(buttonBorderRadius) ? 16 : buttonBorderRadius}px;
                --wpscb-button-color: ${buttonColor};
                --wpscb-button-text-color: ${buttonTextColor};
                --wpscb-popup-width: ${popupWidth}px;
                --wpscb-popup-bg: ${finalPopupBg};
                --wpscb-popup-header-start: ${headerColorStart};
                --wpscb-popup-header-end: ${headerColorEnd};
                --wpscb-popup-text: ${finalTextColor};
                --wpscb-popup-label: ${finalLabelColor};
                --wpscb-popup-header-text: ${finalLabelColor};
                --wpscb-contact-bg: ${finalContactBg};
                --wpscb-contact-hover: ${finalContactHover};
            `;

            // Use saved contacts, fallback to sample if empty
            const savedContacts = (WPSCB.contacts && WPSCB.contacts.length) ? WPSCB.contacts : [
                { network: 'whatsapp', name: 'WhatsApp Support', value: '1234567890' },
                { network: 'telegram', name: 'Telegram Chat', value: 'yourusername' },
                { network: 'messenger', name: 'Facebook Chat', value: 'yourpage' }
            ];

            // Network icons (matching front.js)
            const networkIcons = {
                whatsapp: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.66 15.06L2 22l4.94-1.3A10 10 0 1 0 12 2Z"/><path fill="#fff" d="M9.5 7.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3-.2.3-.8.7-.8 1.8s.8 2.1 1 2.2c.1.1 1.6 2.6 4 3.5 2 .8 2.4.7 2.8.6.4-.1 1.4-.6 1.6-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3s-1.4-.7-1.6-.7-.4-.1-.6.2c-.2.3-.7.8-.8.9-.1.1-.3.1-.5 0s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5s.3-.3.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.5-1.3-.7-1.7Z"/></svg>',
                telegram: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#229ED9" d="M21.5 3.6 2.6 11.4c-1 .4-.9 1.8.2 2l4.7 1.4 1.8 5.4c.3.9 1.5 1 .9-.1l2.4-4 5.2 3.8c.8.6 1.8.1 2-.9l3.2-14.8c.2-1-1-1.8-2-1.2Z"/></svg>',
                messenger: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#0084FF" d="M12 2C6.48 2 2 6.02 2 10.98c0 2.75 1.34 5.2 3.5 6.86V22l3.2-1.76c1.03.29 2.13.45 3.3.45 5.52 0 10-4.02 10-8.98S17.52 2 12 2Z"/><path fill="#fff" d="m6.8 14.2 4-2.5 2.1 2.5 4.3-5.2-4 2.5-2.1-2.5-4.3 5.2Z"/></svg>',
                instagram_dm: '<svg viewBox="0 0 24 24" width="20" height="20"><radialGradient id="ig" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="#f58529"/><stop offset="50%" stop-color="#dd2a7b"/><stop offset="100%" stop-color="#8134af"/></radialGradient><path fill="url(#ig)" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"/><path fill="#fff" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>',
                viber: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#7360F2" d="M4 4c-1.1 1.4-1.7 3.2-1.7 5 0 5.5 4.7 9.9 10.5 9.9 1.7 0 3.3-.4 4.7-1.1l2.5 1.1-.7-2.8c1.1-1.4 1.7-3.1 1.7-4.9C20.9 5.7 16.2 1.3 10.4 1.3 8.5 1.3 6.8 1.8 5.3 2.6L4 4Z"/><path fill="#fff" d="M7.5 7c0 6.2 5 11.2 11.2 11.2M7.5 7c3.7 0 6.7 3 6.7 6.7M11 8.5c1.9 0 3.4 1.5 3.4 3.4" stroke="#fff" stroke-width="1.5"/></svg>',
                line: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#00C300" d="M12 2C6.5 2 2 5.7 2 10c0 3 2.1 5.7 5.3 7.1L7 22l4.4-2c.9.1 1.2.1 1.6.1 5.5 0 10-3.6 10-8.1S17.5 2 12 2Z"/></svg>',
                wechat: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="10" cy="10" r="6" fill="#1AAD19"/><circle cx="17" cy="14" r="5" fill="#24c32a"/></svg>',
                twitter_dm: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#1DA1F2" d="M12 2C6.48 2 2 6.2 2 11c0 3.9 3 7.3 7.1 8.6.4.1.6-.1.7-.4l.2-1c.1-.4.3-.9.4-1.2.1-.3 0-.5-.4-.6-3.3-.7-4.6-2.5-4.9-3.9-.2-.5 0-.6.5-.5 1.3.3 2.1.4 2.5.3.2-.1.3-.2.2-.5-.1-.3-.3-.6-.5-.9-.9-1.3-1.4-3.3-.5-4.5.9-1.3 3.2-1.5 4.5-.3 1.1 1 1.5 2.7 1 4.1-.5 1.5-.1 2.2.9 2.9.8.5 1.7 1.1 2.5 2 .2.3.5.3.7.3.2-.1.3-.2.4-.4.3-.7.8-2.1.8-2.3.1-.3.2-.5.5-.4.3.1.7.3 1 .5.3.3.5.4.8.2.3-.2.5-.5.3-.9-.4-.7-.9-1.2-1.4-1.5-.4-.3-.3-.5-.2-.8.5-1.2.5-2.8-.4-4-.9-1.3-2.3-2-4-2.1H13c-.4 0-.8 0-1.2.1-.2.1-.4 0-.5-.2-.4-.5-1-1.2-1.5-1.6-.2-.2-.5-.2-.7-.2Z"/></svg>',
                discord: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="5" width="18" height="12" rx="6" fill="#5865F2"/><circle cx="9" cy="11" r="1.6" fill="#fff"/><circle cx="15" cy="11" r="1.6" fill="#fff"/></svg>',
                signal: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8" fill="#3A76F0"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-dasharray="4 3"/></svg>',
                snapchat: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#FFFC00" d="M12 2c-2.8 0-5 2.2-5 5v2.5c0 1-.8 1.8-1.8 1.8H5c.2.7.9 1.2 1.6 1.3 1.2.3 1.5.8 1.5 1.2 0 .6-.8 1-2 .9-1 0-1.6.6-1.6 1.3 0 .7 1.3 1.3 3.1 1.5.5.1.9.4 1.1.9C9.1 20.8 10.4 22 12 22s2.9-1.2 3.3-3.3c.1-.5.5-.8 1-.9 1.8-.2 3.1-.8 3.1-1.5s-.6-1.3-1.6-1.3c-1.2 0-2-.3-2-.9 0-.4.3-1 1.5-1.2.8-.2 1.5-.7 1.6-1.3h-.2c-1 0-1.8-.8-1.8-1.8V7c0-2.8-2.2-5-5-5Z"/></svg>',
                kakaotalk: '<svg viewBox="0 0 24 24" width="20" height="20"><ellipse cx="12" cy="11" rx="9" ry="7" fill="#FFE812"/><path d="M12 18l-3 3 1-3H12Z" fill="#6e4b00"/></svg>',
                linkedin_msg: '<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" fill="#0A66C2" rx="4"/><path fill="#fff" d="M7 17V9h2v8H7Zm1-9.5c-.7 0-1.2-.5-1.2-1.2S7.3 5 8 5s1.2.5 1.2 1.2S8.7 7.5 8 7.5ZM18 17h-2v-4c0-1-.8-1.8-1.8-1.8S12.4 12 12.4 13v4h-2V9h2v1c.4-.6 1.2-1.1 2.2-1.1 1.9 0 3.4 1.5 3.4 3.4V17Z"/></svg>',
                threads: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#000"/><path fill="#fff" d="M7 14c1.5 1.2 3.3 2 5 2 4 0 5-3 5-4.5S15.5 7 12 7C9 7 7 9 7 11h2c0-1.3 1.5-2 3-2 2.3 0 3 .9 3 2 0 1.6-1 2.5-3 2.5-1.1 0-2.2-.5-3-1.2V14Z"/></svg>',
                pinterest_msg: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#E60023"/><path fill="#fff" d="M12.3 7C9.9 7 8 8.7 8 10.9c0 1 .5 1.8 1.6 2 .2 0 .4 0 .5-.2.1-.1.3-.5.3-.6 0-.1 0-.1-.1-.3-.1-.2-.2-.5-.2-.8 0-1.9 1.4-3.2 3.3-3.2 1.8 0 2.8 1.1 2.8 2.6 0 2.1-1 3.9-2.6 3.9-.8 0-1.4-.6-1.2-1.4.2-.9.6-1.8.6-2.4 0-.6-.3-1.1-1-1.1-.8 0-1.5.9-1.5 2.1 0 .8.3 1.3.3 1.3l-1.2 5c-.4 1.6-.1 3.5 0 3.7h.1c.1-.2 1.3-1.6 1.7-3.1l.7-2.5c.3.6 1.2 1.1 2.1 1.1 2.7 0 4.5-2.4 4.5-5.7C18.7 8.8 16.9 7 14 7h-1.7Z"/></svg>',
                reddit_chat: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#FF4500"/><circle cx="8.5" cy="12" r="1.5" fill="#fff"/><circle cx="15.5" cy="12" r="1.5" fill="#fff"/><path fill="#fff" d="M7.5 14c.9 1 2.6 1.7 4.5 1.7S15.6 15 16.5 14c.3-.3-.1-.8-.5-.6-.8.4-2 1-3.5 1s-2.7-.6-3.5-1c-.4-.2-.8.3-.5.6Z"/></svg>',
                youtube_chat: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="6" width="18" height="12" rx="3" fill="#FF0000"/><path fill="#fff" d="M10 9.5v5l5-2.5-5-2.5Z"/></svg>',
                slack: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4A154B" d="M3 10a2 2 0 1 1 4 0v1H5a2 2 0 0 1-2-2Zm4 0V8a2 2 0 1 1 4 0v2H7Zm0 4H5a2 2 0 1 0 2 2v-2Zm4 0v2a2 2 0 1 0 2-2h-2Zm6-3a2 2 0 1 1 0-4h2a2 2 0 1 1 0 4h-2Zm0 2h2a2 2 0 1 1-2 2v-2Zm-4-6h2a2 2 0 1 1-2-2v2Zm0 6h2v2a2 2 0 1 1-2-2Z"/></svg>',
                teams: '<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="5" fill="#464EB8"/><path fill="#fff" d="M6 8h12v2h-5v8H11v-8H6V8Z"/></svg>',
                VK: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4C75A3" d="M12 2C6.48 2 2 6.2 2 11c0 4.8 3.9 8.7 8.8 8.9v3.1l3.2-1.7c.9.1 1.8.2 2.7.2 5.5 0 10-3.6 10-8.1S17.5 2 12 2Z"/></svg>',
                eitaa: '<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="3" fill="#E37600"/><path d="M6.1 21.5c-.8-.3-1.5-1-1.9-1.8-.2-.7-.2-1.5-.1-6.8.1-5.7.1-5.4.3-6.3.1-.5.5-1.3.8-1.7 1-1.5 2.5-2.4 4.3-2.8.4-.1.9-.1 5.7-.1 5.9 0 5.7 0 6.7.3 1.7.5 3.1 1.5 4.1 2.9.3.9.3 1 .3 3.4v2.1l-.4.3c-.5.4-1.2 1-2.2 2-1.1 1.2-2.3 2.3-2.8 2.7-1.2 1-2.4 1.6-3.5 1.8-.6.1-1.6.1-2.2-.1-.5-.1-.5-.2-.7.4-.2.5-.3 1-.3 1.5v.4l-.1 0c-1.1-.2-2.3-1.2-2.7-2.4-.1-.5-.2-.9-.2-1.2v-.3l-.3-.3c-.6-.6-1-1.2-1.1-2-.2-1.1.3-2.4 1.4-3.5 1.2-1.2 3-2.2 4.7-2.5.6-.1 1.7-.2 2.3-.1 1.1.2 2 .7 2.5 1.5.2.3.2.3.2.5 0 .2-.1.4-.2.5-.4.6-1.7 1.3-3.2 1.6-2.5.6-4.1-.1-3.8-1.7 0-.2.1-.3.1-.3 0 0-.3.1-.5.3-.5.3-.9.9-1 1.5-.1.1-.1.4 0 .6 0 .3.1.4.2.7.1.2.3.4.4.5l.2.2-.1.1c-.2.3-.6.8-.6 1.1-.2.5-.2.8-.1 1.7.1.4.4 1 .7 1.4.2.3.8.7.8.7 0 0 .1-.1.1-.1 0-.2.2-.9.3-1.3.4-1 1.3-1.9 2.7-2.6.2-.1.9-.4 1.5-.7 1.3-.6 2-.9 2.4-1.2 1.1-.8 1.8-2 2-3.4.1-.5.1-1.5 0-2.1-.3-2.3-2.1-3.9-4.6-4.1-2.8-.3-6.3 1.8-8.5 5.1-1.1 1.6-1.8 3.4-2.1 5.1-.1.7-.2 2 0 2.6.2 1.6.8 2.9 1.8 3.9.6.7 1.2 1.1 1.8 1.2 2.3 1.1 4.8 1.1 7 .1.9-.4 1.9-1.1 2.9-2.1.9-1 1.6-1.8 3.4-4.2.9-1.3 1.8-2.2 2.1-2.5l.1-.1v2.9c0 2.8 0 2.9-.1 3.4-.6 2.5-2.4 4.4-4.9 4.9l-.4.1h-5.5c-4.5.1-5.6 0-5.9-.1z" fill="#FFF"/></svg>',
                soroush: '<svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="3" fill="#0099CC"/><path d="M5.97 23.94c-.41-.07-.82-.23-1.33-.46-.9-.52-1.58-1.45-1.8-2.47-.09-.4-.1-.9-.08-4.02.02-3.33.01-3.22.16-3.77.08-.27.3-.75.46-.99.5-.75 1.12-1.33 1.8-1.68.22-.1.52-.15 3.38-.15 3.49 0 3.37 0 3.94.18 1.05.24 1.97.82 2.41 1.67.18.52.19.6.21 1.98l.01 1.24-.22.15c-.31.21-.72.59-1.29 1.2-.66.7-1.32 1.35-1.66 1.62-.73.59-1.4.92-2.08 1.04-.35.06-.94.04-1.28-.05-.31-.08-.29-.09-.41.26-.11.23-.18.49-.18.86l-.02.23-.08-.02c-.68-.13-1.35-.72-1.61-1.39-.06-.18-.14-.41-.14-.68l-.01-.19-.17-.16c-.36-.33-.59-.73-.67-1.15-.12-.67.19-1.42.86-2.1.71-.72 1.75-1.28 2.77-1.5.37-.08 1.02-.1 1.34-.04.64.11 1.15.43 1.48.91.1.15.11.17.1.31 0 .11-.05.21-.1.28-.26.36-1.03.75-1.86.94-1.47.33-2.4-.08-2.25-.98.01-.09.02-.17.02-.17-.02-.02-.16.06-.32.17-.27.19-.5.55-.59.9-.02.09-.03.23-.02.36.01.18.03.25.11.41.05.1.15.25.23.33l.13.14-.05.07c-.09.13-.21.34-.38.68-.11.28-.11.46-.06 1.01.06.26.23.61.41.82.13.16.44.43.49.43.01 0 .02-.03.02-.06 0-.13.1-.54.18-.74.24-.59.75-1.09 1.57-1.53.14-.07.53-.26.88-.42.76-.35 1.17-.57 1.4-.73.66-.46 1.06-1.15 1.19-2.02.05-.32.05-.91 0-1.23-.21-1.36-1.22-2.29-2.69-2.44-1.63-.17-3.71 1.09-4.99 2.86-.62.94-1.04 1.99-1.22 3.04-.07.41-.09 1.16-.05 1.53.11.95.46 1.72 1.06 2.32.23.22.48.4.64.52 1.32.63 2.78.64 4.07.04.56-.26 1.1-.67 1.69-1.26.57-.57.95-1.05 2.01-2.49.58-.79 1.04-1.32 1.27-1.45l.08-.05-.01 1.72c-.01 1.67-.01 1.73-.07 1.99-.33 1.49-1.42 2.59-2.9 2.93l-.26.06-3.22.01c-2.64 0-3.26-.01-3.46-.03z" fill="#FFF"/></svg>'
            };

            const chatIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

            // Button content based on mode
            let buttonContent = chatIcon;
            let fabExtraStyle = '';
            if(buttonMode === 'text'){
                buttonContent = buttonText || 'Chat';
            } else if(buttonMode === 'image'){
                const $imgPreview = $page.find('.wpscb-image-preview[data-for="button_image"] img');
                const imgUrl = $imgPreview.length ? $imgPreview.attr('src') : (WPSCB.advanced && WPSCB.advanced.button_image_url ? WPSCB.advanced.button_image_url : '');
                if(imgUrl){
                    buttonContent = '<img src="'+wpscb_escapeHtml(imgUrl)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" />';
                    fabExtraStyle = 'background:transparent;box-shadow:none;';
                }
            } else {
                // Icon mode — use custom SVG if set
                const customSvg = $page.find('input[name="button_icon_svg"]').val();
                if(customSvg){
                    buttonContent = customSvg;
                }
            }

            // Generate contacts HTML (exact same structure as frontend)
            const defaultIcon = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
            const contactsHtml = savedContacts.map(contact => {
                const icon = networkIcons[contact.network] || defaultIcon;
                const hasPhoto = contact.photo_url || false;
                const avatarHtml = hasPhoto
                    ? '<img src="' + wpscb_escapeHtml(contact.photo_url) + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">'
                    : '<span class="wpscb-contact-avatar-icon">' + icon + '</span>';
                const displayName = wpscb_escapeHtml(contact.name || contact.network || 'Contact');
                return `
                    <a href="#" class="wpscb-contact-item" onclick="return false;">
                        ${avatarHtml}
                        <div class="wpscb-contact-info">
                            <div class="wpscb-contact-name">${displayName}</div>
                        </div>
                    </a>
                `;
            }).join('');

            // Copyright footer
            const copyrightHtml = hideCopyright ? '' : `
                <div class="wpscb-popup-footer">
                    <div style="font-size:11px;color:var(--wpscb-popup-label);">Developed by Social Chat Buttons</div>
                </div>
            `;

            // Use exact frontend CSS and HTML structure
            const widgetHtml = `
                <style>
                    /* Frontend CSS Variables */
                    #wpscb-live-preview {
                        ${cssVars}
                    }

                    /* Frontend Widget Styles (from front.css) */
                    .wpscb-fab {
                        width:var(--wpscb-button-size); height:var(--wpscb-button-size); border-radius:var(--wpscb-button-border-radius);
                        background:var(--wpscb-button-color); color:var(--wpscb-button-text-color); border:none; cursor:pointer;
                        box-shadow:0 6px 16px rgba(102,16,242,.4), 0 2px 6px rgba(0,0,0,.15);
                        display:flex; align-items:center; justify-content:center; transition:transform .2s, box-shadow .2s;
                        font-weight:600; overflow:hidden;
                        position: absolute;
                        ${position === 'left' ? 'left: 20px;' : 'right: 20px;'}
                        bottom: 20px;
                        z-index: 1000;
                    }
                    .wpscb-fab svg { width:var(--wpscb-button-icon-size) !important; height:var(--wpscb-button-icon-size) !important; }
                    .wpscb-fab:hover { transform:scale(1.05); box-shadow:0 8px 20px rgba(102,16,242,.5), 0 4px 8px rgba(0,0,0,.2); }

                    .wpscb-popup {
                        position:absolute; bottom:calc(var(--wpscb-button-size) + 34px); ${position === 'left' ? 'left: 20px;' : 'right: 20px;'} width:var(--wpscb-popup-width); max-height:480px;
                        background:var(--wpscb-popup-bg); border-radius:20px; box-shadow:0 12px 40px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.1);
                        display:none; flex-direction:column; overflow:hidden; z-index: 1001;
                    }
                    .wpscb-popup.show { display: flex !important; }

                    .wpscb-popup-header {
                        padding:16px 20px; background:linear-gradient(135deg, var(--wpscb-popup-header-start), var(--wpscb-popup-header-end));
                        color:var(--wpscb-popup-header-text); display:flex; align-items:center; justify-content:space-between; font-weight:600; font-size:16px;
                    }
                    .wpscb-popup-close { background:none; border:none; color:var(--wpscb-popup-header-text); font-size:20px; cursor:pointer; padding:0; }

                    .wpscb-popup-body {
                        flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;
                    }

                    .wpscb-contact-item {
                        display:flex; align-items:center; gap:12px; padding:12px; background:var(--wpscb-contact-bg); border-radius:12px;
                        text-decoration:none; color:var(--wpscb-popup-text); transition:background .15s, transform .15s;
                    }
                    .wpscb-contact-item:hover { background:var(--wpscb-contact-hover); transform:translateY(-2px); }

                    .wpscb-contact-avatar-icon {
                        width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#e2e8f0; flex-shrink:0;
                    }

                    .wpscb-contact-info { flex:1; }
                    .wpscb-contact-name { font-weight:500; font-size:14px; color:var(--wpscb-popup-text); }

                    .wpscb-popup-footer {
                        padding:12px 20px; border-top:1px solid #e2e8f0; background:#f8f9fa; text-align:center;
                    }

                    /* Direct Icons mode */
                    .wpscb-direct-icons {
                        position:absolute;
                        ${position === 'left' ? 'left: 20px;' : 'right: 20px;'}
                        bottom:calc(var(--wpscb-button-size) + 28px);
                        display:flex; flex-direction:column-reverse; gap:10px;
                        z-index:1001;
                    }
                    .wpscb-direct-icons.wpscb-direct-hidden .wpscb-direct-icon { opacity:0; transform:scale(0.3); pointer-events:none; }
                    .wpscb-direct-icon {
                        position:relative;
                        width:var(--wpscb-button-size); height:var(--wpscb-button-size); border-radius:50%; display:flex; align-items:center; justify-content:center;
                        background:transparent;
                        text-decoration:none; transition:transform .25s cubic-bezier(.4,0,.2,1), opacity .25s cubic-bezier(.4,0,.2,1);
                        opacity:1; transform:scale(1); cursor:pointer;
                    }
                    .wpscb-direct-icon:hover { transform:scale(1.15); }
                    .wpscb-direct-icon svg { width:var(--wpscb-button-size) !important; height:var(--wpscb-button-size) !important; }

                    /* Tooltip */
                    .wpscb-direct-icon::after {
                        content:attr(data-tooltip);
                        position:absolute; top:50%; transform:translateY(-50%);
                        background:var(--wpscb-button-color); color:var(--wpscb-button-text-color);
                        font-size:12px; font-weight:500; white-space:nowrap;
                        padding:6px 12px; border-radius:8px;
                        pointer-events:none; opacity:0;
                        transition:opacity .2s, transform .2s;
                        box-shadow:0 2px 8px rgba(0,0,0,.15);
                        z-index:2;
                        ${position === 'left' ? 'left:calc(100% + 10px); right:auto;' : 'right:calc(100% + 10px); left:auto;'}
                    }
                    .wpscb-direct-icon:hover::after { opacity:1; }
                </style>
                <div class="wpscb-widget-wpscb_root ${position === 'left' ? 'wpscb-left' : 'wpscb-right'}">
                    <button class="wpscb-fab" onclick="wpscb_togglePreviewPopup()" aria-label="Chat" style="${fabExtraStyle}">${buttonContent}</button>
                    ${displayMode === 'direct' ? `
                    <div class="wpscb-direct-icons wpscb-direct-hidden" id="wpscb-preview-direct">
                        ${savedContacts.map(contact => {
                            const icon = networkIcons[contact.network] || '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
                            return '<a href="#" class="wpscb-direct-icon" onclick="return false;" data-tooltip="'+wpscb_escapeHtml(contact.name || contact.network)+'">' + icon + '</a>';
                        }).join('')}
                    </div>
                    ` : `
                    <div class="wpscb-popup" id="wpscb-preview-popup" style="display:none;">
                        <div class="wpscb-popup-header">
                            <span>${popupTitle}</span>
                            <button class="wpscb-popup-close" onclick="wpscb_togglePreviewPopup()">✕</button>
                        </div>
                        <div class="wpscb-popup-body">
                            ${contactsHtml}
                        </div>
                        ${copyrightHtml}
                    </div>
                    `}
                </div>
                <script>
                    window.wpscb_togglePreviewPopup = function(){
                        ${displayMode === 'direct' ? `
                        const direct = document.getElementById('wpscb-preview-direct');
                        if(direct) direct.classList.toggle('wpscb-direct-hidden');
                        ` : `
                        const popup = document.getElementById('wpscb-preview-popup');
                        if(popup) popup.classList.toggle('show');
                        `}
                    };
                </script>
            `;

            $livePreview.html( widgetHtml );
        }

        // Conditional visibility for button_mode
        function wpscb_updateConditionals() {
            const mode = $page.find( 'input[name="button_mode"]:checked' ).val();
            $page.find( '.wpscb-conditional' ).removeClass( 'show' );
            $page.find( '.wpscb-conditional[data-show-if="button_mode=' + mode + '"]' ).addClass( 'show' );

            // Display mode conditionals
            const dMode = $page.find( 'input[name="display_mode"]:checked' ).val() || 'popup';
            $page.find( '.wpscb-display-conditional' ).each( function() {
                const showIf = $( this ).data( 'show-if-display' );
                if ( showIf === dMode ) {
                    $( this ).slideDown( 200 );
                } else {
                    $( this ).slideUp( 200 );
                }
            } );

            // Display scope conditionals (page/category picker rows)
            const scope = $page.find( 'select[name="display_scope"]' ).val() || 'all';
            $page.find( '.wpscb-display-scope-conditional' ).each( function() {
                const showIf = $( this ).data( 'show-if-scope' );
                if ( showIf === scope ) {
                    $( this ).slideDown( 200 );
                } else {
                    $( this ).slideUp( 200 );
                }
            } );
        }

        // Show/hide the "nothing selected yet" hint under each page/category picker
        function wpscb_updatePickerHints() {
            $page.find( '.wpscb-picker-list' ).each( function() {
                const hasChecked = $( this ).find( 'input[type="checkbox"]:checked' ).length > 0;
                $( this ).siblings( '.wpscb-picker-hint' ).toggle( ! hasChecked );
            } );
        }

        // Range value display
        $page.on( 'input', '.wpscb-range', function() {
            $( this ).next( '.wpscb-range-value' ).text( $( this ).val() );
            wpscb_autoSave();
        } );

        // All inputs trigger auto-save
        $page.on( 'change input', 'input, select', function() {
            wpscb_autoSave();
        } );

        function wpscb_openHideCopyrightDialog( $input ) {
            hideCopyrightDialogOpen = true;
            const closeDialog = function() {
                $dialog.remove();
                $( document ).off( 'keydown.wpscb-hide-copyright' );
                hideCopyrightDialogOpen = false;
                hideCopyrightConfirmed = true;
                WPSCB.advanced = WPSCB.advanced || {};
                WPSCB.advanced.hide_copyright = 1;
                $input.prop( 'checked', true ).trigger( 'change' );
            };
            const markup = `
                <div class="wpscb-modal-backdrop wpscb-support-modal" role="dialog" aria-modal="true" aria-labelledby="wpscb-support-title" aria-describedby="wpscb-support-message">
                    <div class="wpscb-modal">
                        <header><span id="wpscb-support-title">${wpscb_escapeHtml( WPSCB.i18n.hideCopyrightTitle )}</span></header>
                        <div class="body">
                            <div class="wpscb-support-icon" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                            <p id="wpscb-support-message">${wpscb_escapeHtml( WPSCB.i18n.hideCopyrightMessage )}</p>
                        </div>
                        <footer>
                            <a class="wpscb-btn wpscb-support-rate" href="${wpscb_escapeHtml( WPSCB.i18n.hideCopyrightReviewUrl )}" target="_blank" rel="noopener noreferrer">${wpscb_escapeHtml( WPSCB.i18n.hideCopyrightRate )}</a>
                            <button type="button" class="wpscb-support-skip" id="wpscb-hide-copyright-confirm">${wpscb_escapeHtml( WPSCB.i18n.hideCopyrightContinue )}</button>
                        </footer>
                    </div>
                </div>`;
            const $dialog = $( markup ).appendTo( 'body' );

            $dialog.on( 'click', '#wpscb-hide-copyright-confirm', closeDialog );
            $dialog.on( 'click', '.wpscb-support-rate', closeDialog );
            $dialog.on( 'click', function( event ) {
                if ( $( event.target ).is( '.wpscb-support-modal' ) ) {
                    closeDialog();
                }
            } );
            $( document ).on( 'keydown.wpscb-hide-copyright', function( event ) {
                if ( event.key === 'Escape' ) {
                    closeDialog();
                }
            } );
        }

        // Catch all activation methods, including keyboard and assistive technology.
        // An unconfirmed attempt is reverted until the support dialog is closed.
        $page.on( 'change', 'input[name="hide_copyright"]', function() {
            const $input = $( this );
            if ( ! $input.is( ':checked' ) ) {
                return;
            }
            if ( hideCopyrightConfirmed ) {
                hideCopyrightConfirmed = false;
                return;
            }
            $input.prop( 'checked', false );
            if ( ! hideCopyrightDialogOpen ) {
                wpscb_openHideCopyrightDialog( $input );
            }
        } );

        // Handle switch clicks specifically (for hidden checkboxes)
        $page.on( 'click', '.wpscb-switch', function( e ) {
            const $input = $( this ).find( 'input[type="checkbox"]' );
            if ( ! $input.length ) {
                return;
            }

            // Let the native checkbox change event control this protected setting.
            if ( $input.attr( 'name' ) === 'hide_copyright' ) {
                return;
            }

            e.preventDefault();
            // Toggle the remaining hidden-checkbox switches.
            $input.prop( 'checked', ! $input.prop( 'checked' ) ).trigger( 'change' );
        } );

        // Radio/select change triggers conditional visibility
        $page.on( 'change', 'input[name="button_mode"], input[name="display_mode"], select[name="display_scope"]', function() {
            wpscb_updateConditionals();
            wpscb_autoSave();
        } );

        // Page/category picker: live search filter
        $page.on( 'input', '.wpscb-picker-search', function() {
            const term = $( this ).val().toLowerCase().trim();
            const target = $( this ).data( 'target' );
            $page.find( '.wpscb-picker-list[data-picker="' + target + '"] .wpscb-picker-item' ).each( function() {
                $( this ).toggle( $( this ).text().toLowerCase().indexOf( term ) !== -1 );
            } );
        } );

        // Page/category picker: toggle the empty-selection hint as boxes are (un)checked
        $page.on( 'change', '.wpscb-picker-list input[type="checkbox"]', wpscb_updatePickerHints );

        // Media library for button image
        $page.on('click', '.wpscb-upload-btn', function(e){
            e.preventDefault();
            const target = $(this).data('target');
            const $input = $page.find('input[name="'+target+'"]');
            const $preview = $page.find('.wpscb-image-preview[data-for="'+target+'"]');

            if(typeof wp === 'undefined' || !wp.media){
                alert(WPSCB.i18n.mediaUnavailable || 'Media library unavailable.');
                return;
            }
            const frame = wp.media({
                title: 'Select Button Image',
                button: { text: 'Use this image' },
                multiple: false
            });
            frame.on('select', function(){
                const attachment = frame.state().get('selection').first().toJSON();
                $input.val(attachment.id);
                $preview.html('<img src="'+wpscb_escapeHtml(attachment.url)+'" alt="">');
                wpscb_autoSave();
            });
            frame.open();
        });

        // Initialize field values from server data
        function wpscb_initializeFieldValues() {
            if (WPSCB.advanced) {
                // Set checkbox values
                if (typeof WPSCB.advanced.hide_copyright !== 'undefined') {
                    $page.find('input[name="hide_copyright"]').prop('checked', WPSCB.advanced.hide_copyright == 1);
                }
                if (typeof WPSCB.advanced.hide_mobile !== 'undefined') {
                    $page.find('input[name="hide_mobile"]').prop('checked', WPSCB.advanced.hide_mobile == 1);
                }
                if (typeof WPSCB.advanced.auto_dark_mode !== 'undefined') {
                    $page.find('input[name="auto_dark_mode"]').prop('checked', WPSCB.advanced.auto_dark_mode == 1);
                }
                if (typeof WPSCB.advanced.responsive_scale !== 'undefined') {
                    $page.find('input[name="responsive_scale"]').prop('checked', WPSCB.advanced.responsive_scale == 1);
                }

            }
        }

        // Initialize field values
        wpscb_initializeFieldValues();

        // Initialize conditionals
        wpscb_updateConditionals();
        wpscb_updatePickerHints();

        // Initialize live preview
        if ( $livePreview.length ) {
            // Test content first
            $livePreview.html('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#000;font-size:16px;">🚀 Live Preview Loading...</div>');
            setTimeout(function(){
                wpscb_updatePreview();
            }, 100);
        }

        // ──── Icon Picker ────
        const wpscb_defaultChatIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

        // WordPress Dashicons as SVG (popular subset)
        const wpscb_dashicons = [
            { name:'admin-site', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M9 0C4.03 0 0 4.03 0 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm7.96 9.57c-.16-.36-.6-.87-1.66-1.35 0 0-.26-.13-.71-.31.4-1.5.25-2.69-.39-3.08-.6-.37-1.51-.09-2.48.67-.05-.1-.1-.19-.16-.29C9.87 2.09 7.87 1.01 6.65 1.7c-1.1.62-1.35 2.36-.72 4.48-.82.1-1.5.27-1.97.45C2.05 7.4 1.03 8.42 1.03 9c0 .65 1.17 1.76 3.33 2.54.09.92.33 1.77.69 2.53-1.27 1.62-1.54 2.89-.93 3.39.65.54 2.05.16 3.58-1.01.61.42 1.3.72 2.04.88-.03.92.15 1.71.56 2.16.52.58 1.48.41 2.55-.43.4-.31.79-.72 1.14-1.2.35.06.71.09 1.08.09 2.89 0 5.24-1.59 5.24-3.55 0-1.06-.65-2.02-1.71-2.72.1-.46.17-.94.17-1.44 0-.11 0-.22-.01-.33z"/></svg>' },
            { name:'admin-comments', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M5 2h9q2 0 2 2v7q0 2-2 2h-2l-5 4v-4H5q-2 0-2-2V4q0-2 2-2z"/></svg>' },
            { name:'admin-users', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 9.25c-2.27 0-2.73-3.44-2.73-3.44C7 4.02 7.82 2 9.97 2c2.16 0 2.98 2.02 2.71 3.81 0 0-.41 3.44-2.68 3.44zm0 2.57L12.72 10c2.39 0 4.52 2.33 4.52 4.53v2.49s-3.65 1.13-7.24 1.13c-3.65 0-7.24-1.13-7.24-1.13v-2.49c0-2.25 1.94-4.48 4.47-4.53z"/></svg>' },
            { name:'email', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M19 14.5v-9q0-.62-.38-1.06L10 10 1.38 4.44Q1 4.88 1 5.5v9q0 .62.44 1.06.44.44 1.06.44h15q.62 0 1.06-.44Q19 15.12 19 14.5zm-1.2-10.12Q17.38 4 16.5 4h-13q-.88 0-1.3.38L10 9z"/></svg>' },
            { name:'phone', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M12.06 6l-.21-.2c-.52-.54-1.14-.87-1.56-.38l-.26.24c-.31.28-.41 1.1.38 2.06.7.87 1.33 1.09 1.75.76l.26-.24c.47-.42.16-1.07-.37-1.61-.01.01-.01.01 0 0zM6.74 11.87c-.58.53-.58 1.26 0 1.93l.18.19c.54.53 1.16.81 1.55.37l.27-.25c.29-.26.42-1-.45-2.06-.79-.96-1.4-1.23-1.78-.43zM15.89 3.05c-1.75-1.75-3.7-2.83-4.36-2.41l-1.18 1.07c-.68.62-.32 1.88.78 3.2.14.17.3.34.47.52l.2.19q.15.16.32.32c1.27 1.15 2.59 1.6 3.3.95l1.17-1.08c.48-.62-1-2.64-2.7-2.76zM4.11 16.95q2.63 2.63 2.7 2.76l1.18-1.07c.68-.62.32-1.88-.78-3.2-.14-.17-.3-.34-.47-.52l-.2-.19q-.15-.16-.32-.32c-1.27-1.15-2.59-1.6-3.3-.95L1.75 14.54c-.48.62 1 2.64 2.36 2.41z"/></svg>' },
            { name:'heart', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 17.12c-.24 0-.47-.08-.66-.23C8.89 16.53 1 10.53 1 6.6 1 3.5 3.3 2 5.47 2c1.5 0 3.02.74 4.14 2A6.27 6.27 0 0 1 14.38 2c2.28 0 4.62 1.5 4.62 4.6 0 3.93-7.66 9.81-8.34 10.29-.19.15-.42.23-.66.23z"/></svg>' },
            { name:'star-filled', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 1l3 6 7 .58-5.27 4.64L16.18 19 10 15.47 3.82 19l1.45-6.78L0 7.58 7 7z"/></svg>' },
            { name:'info', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1 4c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm0 3H9v5h2V9z"/></svg>' },
            { name:'megaphone', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M18.15 5.94c.46 1.62.38 3.22-.02 4.48-.42 1.31-1.22 2.36-2.12 2.8l-3.98 1.9c.14.43.18.98.03 1.59-.28 1.07-1.07 2.1-2.31 2.1-.57 0-1.04-.25-1.29-.64-.27-.42-.28-1.01-.01-1.73l.24-.6-3.4 1.62c-.43.2-.63-.12-.63-.32V8.2c0-.2.09-.49.63-.65l7.38-2.48c.08-.02.17-.03.26-.03.9 0 2.38.98 3.17 1.9h.01l2.04-2z"/></svg>' },
            { name:'shield', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 2s3 2 7 2c0 6-3 12-7 14C6 16 3 10 3 4c4 0 7-2 7-2z"/></svg>' },
            { name:'location', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 2C6.69 2 4 4.69 4 8c0 2.02 1.17 3.71 2.53 5.22C7.73 14.56 9.12 15.88 10 17c.88-1.12 2.27-2.44 3.47-3.78C14.83 11.71 16 10.02 16 8c0-3.31-2.69-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>' },
            { name:'cart', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M6 13h9c.55 0 1 .45 1 1s-.45 1-1 1H5.5c-.28 0-.5-.22-.5-.5V3H3c-.55 0-1-.45-1-1s.45-1 1-1h2.5c.28 0 .5.22.5.5V5h11.17c.46 0 .83.37.83.83 0 .06-.01.12-.02.18l-1.5 6c-.09.37-.43.63-.82.63H6v.5c0 .28.22.5.5.5H15m-8 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>' },
            { name:'visibility', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>' },
            { name:'admin-home', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M16 8.5l1.53 1.53-1.06 1.06L10 4.62l-6.47 6.47-1.06-1.06L10 2.55l4 4V4h2v4.5zM4 12l6-6 6 6v6H4v-6z"/></svg>' },
            { name:'admin-tools', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M16.68 9.77c-1.34 1.34-3.3 1.67-4.95.99l-5.41 6.52c-.99.99-2.59.99-3.58 0s-.99-2.59 0-3.58l6.52-5.41c-.68-1.65-.35-3.61.99-4.95 1.28-1.28 3.12-1.62 4.72-1.02l-2.8 2.8 1.96 1.96 2.8-2.8c.6 1.6.26 3.44-1.02 4.72z"/></svg>' },
            { name:'format-chat', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M11 6h-.82C9.07 6 8 7.2 8 8.16V10l-3 3v-3H3c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2zm6-2h-6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2v3l3-3h1c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>' },
            { name:'groups', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M8.03 4.46c-2.15 0-2.59 3.26-2.59 3.26-.14 1.44.68 2.37 1.73 2.63C5.43 11.12 4 12.78 4 14.85v1.35h8.05v-1.35c0-2.07-1.02-3.73-2.75-4.5 1.05-.26 1.87-1.19 1.73-2.63 0 0-.44-3.26-3-3.26zM14.69 4.69C13.64 4.72 12.82 5.5 12.58 7c.06.58-.03 1.09-.22 1.52.91.37 1.63 1.18 1.63 2.15v1.54h3.22v-1.15c0-1.76-.87-3.18-2.36-3.83.9-.22 1.6-1.01 1.48-2.24 0 0-.37-2.78-2.56-2.78-.21 0-.4.06-.57.14.35.52.55 1.2.55 1.95 0 .13-.03.24-.06.39z"/></svg>' },
            { name:'share', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M14.5 12c-1.3 0-2.4.8-2.8 2H6.3c-.5-1.2-1.6-2-2.8-2-1.7 0-3 1.3-3 3s1.3 3 3 3c1.3 0 2.4-.8 2.8-2h5.4c.5 1.2 1.6 2 2.8 2 1.7 0 3-1.3 3-3s-1.3-3-3-3zM3.5 5c1.3 0 2.4.8 2.8 2h5.4c.5-1.2 1.6-2 2.8-2 1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.3 0-2.4-.8-2.8-2H6.3c-.5 1.2-1.6 2-2.8 2-1.7 0-3-1.3-3-3s1.3-3 3-3z"/></svg>' },
            { name:'thumbs-up', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M13 1l-7 8H1v8h5.3l1.42 1.42c.27.27.64.42 1.02.42h5.76c.8 0 1.5-.52 1.73-1.28l1.63-5.48C18.17 11.24 17.5 10 16.37 10H12l.89-3.56c.15-.6-.04-1.23-.49-1.64L11.5 4z"/></svg>' },
            { name:'calendar', svg:'<svg viewBox="0 0 20 20" width="24" height="24" fill="currentColor"><path d="M15 4h3v14H2V4h3V3c0-.41.15-.76.44-1.06.3-.3.65-.44 1.06-.44s.76.15 1.06.44c.3.3.44.65.44 1.06v1h4V3c0-.41.15-.76.44-1.06.3-.3.65-.44 1.06-.44s.76.15 1.06.44c.3.3.44.65.44 1.06v1zm-2 4v2h2V8h-2zm-4 0v2h2V8H9zm-4 0v2h2V8H5zm8 4v2h2v-2h-2zm-4 0v2h2v-2H9zm-4 0v2h2v-2H5z"/></svg>' },
        ];

        // Bootstrap Icons as SVG (popular subset)
        const wpscb_bootstrapIcons = [
            { name:'chat-dots', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.272.362a22 22 0 0 0 .693-.125Z"/></svg>' },
            { name:'chat-fill', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.272.362a22 22 0 0 0 .693-.125l.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15"/></svg>' },
            { name:'chat-heart', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path fill-rule="evenodd" d="M2.965 12.695a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2m-.8 3.108.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.272.362a22 22 0 0 0 .693-.125M8 5.993c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/></svg>' },
            { name:'chat-left-text', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6m0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/></svg>' },
            { name:'chat-square-dots', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/></svg>' },
            { name:'telephone', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z"/></svg>' },
            { name:'headset', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5"/></svg>' },
            { name:'envelope', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/></svg>' },
            { name:'bell', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/></svg>' },
            { name:'send', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/></svg>' },
            { name:'hand-thumbs-up', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a10 10 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733q.086.18.138.363c.077.27.113.567.113.856s-.036.586-.113.856c-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.2 3.2 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16H8c-.605 0-1.07-.081-1.466-.218a4.8 4.8 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"/></svg>' },
            { name:'people', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>' },
            { name:'globe', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7.02 7.02 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49a7 7 0 0 0 .656 2.5zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.02 7.02 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/></svg>' },
            { name:'lightning', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641z"/></svg>' },
            { name:'gear', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.658.06a1 1 0 0 1 1.725 0l.166.565a1.873 1.873 0 0 0 2.693 1.115l.517-.281a1 1 0 0 1 .862 1.225l-.14.483a1.873 1.873 0 0 0 1.116 2.692l.564.167a1 1 0 0 1 0 1.725l-.564.166a1.873 1.873 0 0 0-1.116 2.693l.281.517a1 1 0 0 1-1.225.862l-.483-.14a1.873 1.873 0 0 0-2.692 1.116l-.167.564a1 1 0 0 1-1.725 0l-.166-.564a1.873 1.873 0 0 0-2.693-1.116l-.517.281a1 1 0 0 1-.862-1.225l.14-.483a1.873 1.873 0 0 0-1.116-2.692L1.28 8.39a1 1 0 0 1 0-1.725l.564-.167A1.873 1.873 0 0 0 2.96 3.806l-.281-.517a1 1 0 0 1 1.225-.862l.483.14a1.873 1.873 0 0 0 2.692-1.116z"/></svg>' },
            { name:'house', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708z"/></svg>' },
            { name:'question-circle', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247m2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"/></svg>' },
            { name:'whatsapp', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251A6.56 6.56 0 0 1 1.407 7.93 6.59 6.59 0 0 1 7.998 1.34a6.6 6.6 0 0 1 4.657 1.93 6.57 6.57 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.589 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>' },
            { name:'telegram', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.516.224-.516.477c0 .166.13.283.39.35l.19.052c.35.1.59.149.71.149.2 0 .42-.083.66-.248q2.63-1.81 2.81-1.88c.13-.04.2-.01.22.04.07.09-.99 1-1.59 1.57l-.23.24c-.5.53-.04.8.43 1.04q.57.3 1.14.57c.28.13.53.26.76.36.25.12.47.18.67.18.35-.01.55-.29.6-.85q.27-2.04.54-4.06c.06-.48-.12-.83-.54-.83q-.4 0-1.34.46"/></svg>' },
            { name:'rocket', svg:'<svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 8c.828 0 1.5-.895 1.5-2S8.828 4 8 4s-1.5.895-1.5 2S7.172 8 8 8"/><path d="M11.953 8.81c-.195-3.388-.968-5.507-1.777-6.819C9.707 1.233 9.23.751 8.857.454a3.5 3.5 0 0 0-.463-.315A2 2 0 0 0 8.25.064.55.55 0 0 0 8 0a.55.55 0 0 0-.266.073 2 2 0 0 0-.142.08 4 4 0 0 0-.459.33c-.37.308-.844.803-1.31 1.57-.805 1.322-1.577 3.433-1.774 6.756l-1.497 1.826-.004.005A2.5 2.5 0 0 0 2 12.202V15.5a.5.5 0 0 0 .9.3l1.125-1.5c.166-.222.42-.4.752-.57.214-.108.414-.192.625-.281l.198-.084c.7.428 1.55.635 2.4.635s1.7-.207 2.4-.635q.1.044.196.083c.213.09.413.174.627.282.332.17.586.348.752.57l1.125 1.5a.5.5 0 0 0 .9-.3v-3.298a2.5 2.5 0 0 0-.548-1.562z"/></svg>' },
        ];

        function wpscb_openIconPickerModal(){
            if($('.wpscb-icon-picker-backdrop').length) return;

            const markup = `
            <div class="wpscb-icon-picker-backdrop" role="dialog" aria-modal="true">
              <div class="wpscb-icon-picker-modal">
                <header>
                  <span>${wpscb_escapeHtml(WPSCB.i18n.chooseIcon || 'Choose Icon')}</span>
                  <button type="button" class="wpscb-icon-picker-close">&times;</button>
                </header>
                <div class="wpscb-icon-picker-tabs">
                  <button type="button" class="wpscb-icon-tab active" data-tab="dashicons">Dashicons</button>
                  <button type="button" class="wpscb-icon-tab" data-tab="bootstrap">Bootstrap</button>
                  <button type="button" class="wpscb-icon-tab" data-tab="custom">Custom SVG</button>
                </div>
                <div class="wpscb-icon-picker-search">
                  <input type="text" placeholder="${wpscb_escapeHtml(WPSCB.i18n.searchPlaceholder || 'Search...')}" id="wpscb-icon-search">
                </div>
                <div class="wpscb-icon-picker-body">
                  <div class="wpscb-icon-grid" id="wpscb-icon-grid-dashicons"></div>
                  <div class="wpscb-icon-grid" id="wpscb-icon-grid-bootstrap" style="display:none"></div>
                  <div class="wpscb-icon-custom-tab" id="wpscb-icon-tab-custom" style="display:none">
                    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">${wpscb_escapeHtml(WPSCB.i18n.customSvgHelp || 'Paste your SVG code below:')}</p>
                    <textarea id="wpscb-custom-svg-input" rows="6" style="width:100%;font-family:monospace;font-size:12px;border:1px solid #e2e8f0;border-radius:8px;padding:10px;" placeholder="<svg viewBox=&quot;0 0 24 24&quot; ...>...</svg>"></textarea>
                    <div class="wpscb-custom-svg-preview" id="wpscb-custom-svg-preview" style="margin-top:12px;text-align:center;padding:16px;background:#f8f9fa;border-radius:8px;min-height:60px;display:flex;align-items:center;justify-content:center;"></div>
                    <button type="button" class="wpscb-btn" id="wpscb-use-custom-svg" style="margin-top:12px;width:100%">${wpscb_escapeHtml(WPSCB.i18n.useThisIcon || 'Use This Icon')}</button>
                  </div>
                </div>
              </div>
            </div>`;
            const $modal = $(markup).appendTo('body');

            // Render icon grids
            function renderGrid(containerId, icons){
                const $grid = $(containerId);
                icons.forEach(function(icon){
                    $grid.append('<div class="wpscb-icon-grid-item" data-name="'+wpscb_escapeHtml(icon.name)+'" title="'+wpscb_escapeHtml(icon.name)+'">'+icon.svg+'<span>'+wpscb_escapeHtml(icon.name)+'</span></div>');
                });
            }
            renderGrid('#wpscb-icon-grid-dashicons', wpscb_dashicons);
            renderGrid('#wpscb-icon-grid-bootstrap', wpscb_bootstrapIcons);

            // Tab switching
            $modal.on('click', '.wpscb-icon-tab', function(){
                const tab = $(this).data('tab');
                $modal.find('.wpscb-icon-tab').removeClass('active');
                $(this).addClass('active');
                $modal.find('.wpscb-icon-grid, .wpscb-icon-custom-tab').hide();
                if(tab === 'dashicons') $('#wpscb-icon-grid-dashicons').show();
                else if(tab === 'bootstrap') $('#wpscb-icon-grid-bootstrap').show();
                else $('#wpscb-icon-tab-custom').show();
                // Show/hide search for custom tab
                $modal.find('.wpscb-icon-picker-search').toggle(tab !== 'custom');
            });

            // Search
            $modal.on('input', '#wpscb-icon-search', function(){
                const q = $(this).val().toLowerCase();
                $modal.find('.wpscb-icon-grid:visible .wpscb-icon-grid-item').each(function(){
                    $(this).toggle($(this).data('name').toLowerCase().indexOf(q) >= 0);
                });
            });

            // Select icon from grid
            $modal.on('click', '.wpscb-icon-grid-item', function(){
                const svg = $(this).children('svg').prop('outerHTML') || $(this).html().split('<span')[0].trim();
                wpscb_selectIcon(svg);
                wpscb_closeIconPicker();
            });

            // Custom SVG live preview
            $modal.on('input', '#wpscb-custom-svg-input', function(){
                const raw = $(this).val().trim();
                const $preview = $('#wpscb-custom-svg-preview');
                if(wpscb_isValidSvg(raw)){
                    $preview.html(raw).css('color','inherit');
                } else {
                    $preview.html('<span style="color:#dc2626;font-size:12px;">Invalid SVG</span>');
                }
            });

            // Use custom SVG
            $modal.on('click', '#wpscb-use-custom-svg', function(){
                const raw = $('#wpscb-custom-svg-input').val().trim();
                if(wpscb_isValidSvg(raw)){
                    wpscb_selectIcon(raw);
                    wpscb_closeIconPicker();
                }
            });

            // Close
            $modal.on('click', '.wpscb-icon-picker-close', wpscb_closeIconPicker);
            $modal.on('click', function(e){ if($(e.target).is('.wpscb-icon-picker-backdrop')) wpscb_closeIconPicker(); });
            $(document).on('keydown.wpscb-icon-picker', function(e){ if(e.key==='Escape') wpscb_closeIconPicker(); });
        }

        function wpscb_closeIconPicker(){
            $('.wpscb-icon-picker-backdrop').remove();
            $(document).off('keydown.wpscb-icon-picker');
        }

        function wpscb_selectIcon(svg){
            $('#wpscb-button-icon-svg').val(svg);
            const $preview = $('#wpscb-icon-preview');
            $preview.html(svg);
            // Show reset button if not already visible
            if(!$('#wpscb-reset-icon').length){
                $preview.after('<button type="button" class="button button-link-delete" id="wpscb-reset-icon">'+wpscb_escapeHtml(WPSCB.i18n.resetDefault || 'Reset to Default')+'</button>');
            }
            wpscb_autoSave();
        }

        function wpscb_isValidSvg(str){
            if(!str) return false;
            // Basic check: must start with <svg and end with </svg>
            const trimmed = str.trim();
            return /^<svg[\s>]/i.test(trimmed) && /<\/svg\s*>$/i.test(trimmed);
        }

        // Bind icon picker
        $page.on('click', '#wpscb-open-icon-picker', function(e){
            e.preventDefault();
            wpscb_openIconPickerModal();
        });

        // Reset icon to default
        $page.on('click', '#wpscb-reset-icon', function(e){
            e.preventDefault();
            $('#wpscb-button-icon-svg').val('');
            $('#wpscb-icon-preview').html(wpscb_defaultChatIcon);
            $(this).remove();
            wpscb_autoSave();
        });

    }

}( jQuery ) );
