/* global jQuery, WPSCB */
(function($){
    const wpscb_state = {
        contacts: (WPSCB.contacts || []).map(c => wpscb_normalizeContact(c)),
        networks: WPSCB.networks || {},
        settings: WPSCB.settings || {},
        modalOpen: false,
        modal: null,
        editIndex: null
    };

    function wpscb_normalizeContact(c){
        const defSlots = () => [{start:'00:00', end:'23:59'}];
        // Backward compatibility: convert old schema {days:[], hours:{}} to per-day slots
        let availability = c.availability;
        const dayKeys = ['mon','tue','wed','thu','fri','sat','sun'];
        if(!availability){
            availability = {};
            dayKeys.forEach(d=>availability[d]=defSlots());
        } else if(Array.isArray(availability.days) && availability.hours){
            const hours = availability.hours || {start:'00:00', end:'23:59'};
            const days = availability.days || [];
            const obj = {};
            dayKeys.forEach(d=>{ obj[d] = days.includes(d) ? [{start:hours.start, end:hours.end}] : []; });
            availability = obj;
        } else {
            // Ensure shape: object with day arrays
            dayKeys.forEach(d=>{
                if(!Array.isArray(availability[d])) availability[d] = [];
                // sanitize times
                availability[d] = availability[d].map(r=>({ start: (r&&r.start)||'00:00', end: (r&&r.end)||'23:59' }));
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

    function wpscb_render(){
        const $app = $('#wpscb-app');
        if(!$app.length) return;
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
                html += '<td>'+escapeHtml(c.name || '-')+'</td>';
                html += '<td>'+escapeHtml(c.value)+'</td>';
                html += '<td><span class="wpscb-network-tag">'+networkIconSvg(c.network)+escapeHtml(capitalize(c.network))+'</span></td>';
                html += '<td>'+renderPhotoCell(c)+'</td>';
                html += '<td><div class="wpscb-actions"><button type="button" class="wpscb-btn secondary wpscb-edit" aria-label="Edit">✎</button><button type="button" class="wpscb-btn danger wpscb-delete" aria-label="Delete">🗑</button></div></td>';
                html += '</tr>';
            });
            html += '</tbody></table></div>';
        } else {
            html += '<div class="wpscb-empty">'+escapeHtml(WPSCB.i18n.emptyMessage)+'</div>';
        }
        $app.html(html);
    }

    function wpscb_renderPhotoCell(photo){
        const c = typeof photo === 'object' ? photo : null;
        const id = c ? (c.photo||0) : (photo||0);
        const url = c ? c.photo_url : '';
        if((id && parseInt(id,10) > 0) || url){
            const src = url || getAttachmentUrl(id);
            return '<img class="wpscb-avatar" src="'+escapeHtml(src)+'" alt="" />';
        }
        const net = c ? c.network : '';
        return '<span class="wpscb-avatar wpscb-avatar-icon" aria-hidden="true">'+networkIconSvg(net)+'</span>';
    }

    function wpscb_getAttachmentUrl(id){
        // We'll resolve via AJAX on demand if not localized; fallback to WP generic.
        return WPSCB.mediaBase ? (WPSCB.mediaBase + id) : (WPSCB.uploadsBase ? (WPSCB.uploadsBase + '/' + id) : '');
    }

        function openModal(editIndex){
        if(state.modalOpen) return;
        state.modalOpen = true;
                state.editIndex = (typeof editIndex === 'number') ? editIndex : null;
                const editing = state.editIndex !== null;
                const existing = editing ? state.contacts[state.editIndex] : normalizeContact({ network:'whatsapp', value:'', name:'', photo:0, message:'', availability:null });
                    const dropdown = buildNetworkDropdown(existing.network);
                const titleText = editing ? WPSCB.i18n.editContact : WPSCB.i18n.addContact;
                const markup = `
        <div class="wpscb-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wpscb-modal-title" aria-describedby="wpscb-modal-desc">
          <div class="wpscb-modal">
                        <header>
                            <span id="wpscb-modal-title">${escapeHtml(titleText)}</span>
                        </header>
            <div class="body">
                <div class="notice notice-error wpscb-alert" id="wpscb-top-alert" style="display:none"><p></p></div>
                <p id="wpscb-modal-desc" style="margin-top:0;color:#475569;font-size:13px">${escapeHtml(WPSCB.i18n.selectNetwork)} ${escapeHtml(WPSCB.i18n.searchPlaceholder)}</p>
                            <div class="wpscb-field">
                                <label>${escapeHtml(WPSCB.i18n.name)}</label>
                                <input type="text" id="wpscb-name" value="${escapeHtml(existing.name)}" />
                            </div>
              <div class="wpscb-field">
                     <label>${escapeHtml(WPSCB.i18n.network)}</label>
                     ${dropdown}
              </div>
                            <div class="wpscb-field">
                                <label id="wpscb-value-label"></label>
                                                                <input type="text" id="wpscb-value" value="${escapeHtml(existing.value)}" />
                            </div>
                                                        <div class="wpscb-field">
                                                                <label>${escapeHtml(WPSCB.i18n.message)}</label>
                                                                <input type="text" id="wpscb-message" value="${escapeHtml(existing.message || WPSCB.i18n.defaultMessage)}" />
                                                        </div>
                            <div class="wpscb-field">
                                <label>${escapeHtml(WPSCB.i18n.photo)}</label>
                                <div><button type="button" class="wpscb-btn secondary" id="wpscb-pick-media">${escapeHtml(WPSCB.i18n.chooseUpload)}</button></div>
                                                <div class="wpscb-media-preview" id="wpscb-media-preview">${(existing.photo_url||existing.photo)?('<img src="'+escapeHtml(existing.photo_url||getAttachmentUrl(existing.photo))+'" alt="" /><button type="button" class="wpscb-media-remove" id="wpscb-remove-media">'+escapeHtml(WPSCB.i18n.remove)+'</button>'):('<span style="font-size:12px;color:#64748b">'+escapeHtml(WPSCB.i18n.noImageSelected)+'</span>')}</div>
                                <input type="hidden" id="wpscb-photo" value="${existing.photo}" />
                            </div>
                            <div class="wpscb-field">
                                <button type="button" class="wpscb-btn outline wpscb-accordion-toggle" id="wpscb-availability-toggle">
                                    <span>${escapeHtml(WPSCB.i18n.availability)}</span>
                                    <span class="wpscb-accordion-arrow">▾</span>
                                </button>
                                <div class="wpscb-availability-panel" id="wpscb-availability-panel" style="display:none;margin-top:12px;">
                                    ${['mon','tue','wed','thu','fri','sat','sun'].map(d => {
                                        const slots = existing.availability[d] || [];
                                        return `
                                        <div class="wpscb-day-row" data-day="${d}">
                                            <div class="wpscb-day-header">
                                                <span class="wpscb-day-label">${escapeHtml(WPSCB.i18n['day_'+d])}</span>
                                                <div class="wpscb-day-actions">
                                                    <button type="button" class="button button-small wpscb-add-slot" data-day="${d}">${escapeHtml(WPSCB.i18n.addTimeRange)}</button>
                                                    <button type="button" class="button button-link-delete wpscb-clear-day" data-day="${d}">${escapeHtml(WPSCB.i18n.clearDay)}</button>
                                                </div>
                                            </div>
                                            <div class="wpscb-slots" data-day="${d}">
                                                ${slots.length ? slots.map((r,i)=>slotRowTpl(d,i,r.start,r.end)).join('') : ''}
                                            </div>
                                        </div>`;
                                    }).join('')}
                                    <div class="wpscb-copyall-row">
                                        <button type="button" class="button wpscb-copy-to-all" id="wpscb-copy-to-all">${escapeHtml(WPSCB.i18n.copyToAll)}</button>
                                    </div>
                                </div>
                            </div>
              <div class="wpscb-field" id="wpscb-error" style="display:none;color:#dc2626;font-size:13px"></div>
            </div>
            <footer>
                            <button type="button" class="wpscb-btn" id="wpscb-save">${escapeHtml(editing ? WPSCB.i18n.update : WPSCB.i18n.save)}</button>
              <button type="button" class="wpscb-btn secondary" id="wpscb-cancel">${escapeHtml(WPSCB.i18n.cancel)}</button>
            </footer>
          </div>
        </div>`;
        state.modal = $(markup).appendTo('body');
        updateValueLabel();
        state.modal.on('change','#wpscb-network', updateValueLabel);
        initNetworkDropdown(existing.network);
        state.modal.on('click','#wpscb-cancel', closeModal);
                state.modal.on('click','#wpscb-save', saveContact);
                state.modal.on('click','#wpscb-pick-media', openMediaFrame);
                state.modal.on('click','#wpscb-remove-media', function(){ $('#wpscb-photo').val('0'); $('#wpscb-media-preview').html('<span style="font-size:12px;color:#64748b">'+escapeHtml(WPSCB.i18n.noImageSelected)+'</span>'); });
        // Accordion toggle
        state.modal.on('click','#wpscb-availability-toggle', function(){
            const $panel = $('#wpscb-availability-panel');
            const $arrow = $(this).find('.wpscb-accordion-arrow');
            $panel.slideToggle(200);
            $arrow.toggleClass('open');
        });
        // Add slot handler
        state.modal.on('click','.wpscb-add-slot', function(){
            const day = $(this).data('day');
            const $slotsWrap = $('.wpscb-slots[data-day="'+day+'"]');
            const index = $slotsWrap.children('.wpscb-slot-row').length;
            const rowHtml = slotRowTpl(day,index,'09:00','17:00');
            $slotsWrap.append(rowHtml);
        });
        // Remove slot
        state.modal.on('click','.wpscb-remove-slot', function(){
            $(this).closest('.wpscb-slot-row').remove();
            // reindex
            $('.wpscb-slots').each(function(){
                $(this).children('.wpscb-slot-row').each(function(i){
                    $(this).attr('data-index', i);
                });
            });
        });
        // Clear day slots
        state.modal.on('click','.wpscb-clear-day', function(){
            const day = $(this).data('day');
            $('.wpscb-slots[data-day="'+day+'"]').empty();
        });
        // Copy first non-empty day to all empty days
        state.modal.on('click','#wpscb-copy-to-all', function(){
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
                        $(this).append(slotRowTpl(day,i,r.start,r.end));
                    });
                }
            });
        });
        // Focus first input for accessibility
        setTimeout(function(){ $('#wpscb-name').trigger('focus'); }, 0);
        // Close on Escape
        $(document).on('keydown.wpscb-modal', function(e){ if(e.key === 'Escape'){ closeModal(); } });
    }

    function updateValueLabel(){
        const network = $('#wpscb-network').val();
        const data = state.networks[network];
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

    function buildNetworkDropdown(selected){
        return '<div class="wpscb-select-wrapper"><div class="wpscb-md-select" tabindex="0" id="wpscb-select-trigger"><span class="current-label">'+networkIconSvg(selected)+'<span>'+escapeHtml(networkLabel(selected))+'</span></span><span class="dropdown-arrow">▾</span></div><input type="hidden" id="wpscb-network" value="'+escapeHtml(selected)+'" /><div class="wpscb-dropdown" style="display:none" id="wpscb-dropdown"><input type="text" placeholder="'+escapeHtml(WPSCB.i18n.searchPlaceholder)+'" class="wpscb-dropdown-search" id="wpscb-search" />'+buildNetworkItems(selected)+'</div></div>';
    }
    function buildNetworkItems(selected){
        const items = Object.keys(state.networks).map(key=>{
            const data = state.networks[key];
            const active = key===selected ? ' style="background:#e0f2fe"' : '';
            return '<div class="wpscb-dropdown-item" data-value="'+key+'">'+networkIconSvg(key)+'<span>'+escapeHtml(data.label)+'</span></div>';
        });
        return items.join('');
    }
    function initNetworkDropdown(selected){
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
            $('.current-label').html(networkIconSvg(val)+'<span>'+escapeHtml(networkLabel(val))+'</span>');
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
                    $dropdown.append('<div class="wpscb-dropdown-empty">'+escapeHtml(WPSCB.i18n.noResults)+'</div>');
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
    function networkLabel(key){
        const d = state.networks[key];
        return d ? d.label : WPSCB.i18n.selectNetwork;
    }
    function networkIconSvg(key){
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
            skype: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#00AFF0"/><path fill="#fff" d="M8 12c0 2 2 3.5 4.5 3.5 1.8 0 3.5-.7 3.5-2 0-1.4-1.3-1.8-2.9-2.1-1.2-.2-2.5-.4-2.5-1.1 0-.6.9-.9 1.8-.9 1 0 1.9.3 2.5.7l.7-1.3c-.8-.5-1.9-.8-3.1-.8C10 8 8 9 8 10.5c0 1.5 1.4 2 3 2.3 1.2.2 2.4.4 2.4 1 0 .6-.8 1-1.9 1-1 0-2-.4-2.6-.9L8 12Z"/></svg>',
            snapchat: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#FFFC00" d="M12 2c-2.8 0-5 2.2-5 5v2.5c0 1-.8 1.8-1.8 1.8H5c.2.7.9 1.2 1.6 1.3 1.2.3 1.5.8 1.5 1.2 0 .6-.8 1-2 .9-1 0-1.6.6-1.6 1.3 0 .7 1.3 1.3 3.1 1.5.5.1.9.4 1.1.9C9.1 20.8 10.4 22 12 22s2.9-1.2 3.3-3.3c.1-.5.5-.8 1-.9 1.8-.2 3.1-.8 3.1-1.5s-.6-1.3-1.6-1.3c-1.2 0-2-.3-2-.9 0-.4.3-1 1.5-1.2.8-.2 1.5-.7 1.6-1.3h-.2c-1 0-1.8-.8-1.8-1.8V7c0-2.8-2.2-5-5-5Z"/></svg>',
            kakaotalk: '<svg viewBox="0 0 24 24" width="18" height="18"><ellipse cx="12" cy="11" rx="9" ry="7" fill="#FFE812"/><path d="M12 18l-3 3 1-3H12Z" fill="#6e4b00"/></svg>',
            linkedin_msg: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" fill="#0A66C2" rx="4"/><path fill="#fff" d="M7 17V9h2v8H7Zm1-9.5c-.7 0-1.2-.5-1.2-1.2S7.3 5 8 5s1.2.5 1.2 1.2S8.7 7.5 8 7.5ZM18 17h-2v-4c0-1-.8-1.8-1.8-1.8S12.4 12 12.4 13v4h-2V9h2v1c.4-.6 1.2-1.1 2.2-1.1 1.9 0 3.4 1.5 3.4 3.4V17Z"/></svg>',
            threads: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#000"/><path fill="#fff" d="M7 14c1.5 1.2 3.3 2 5 2 4 0 5-3 5-4.5S15.5 7 12 7C9 7 7 9 7 11h2c0-1.3 1.5-2 3-2 2.3 0 3 .9 3 2 0 1.6-1 2.5-3 2.5-1.1 0-2.2-.5-3-1.2V14Z"/></svg>',
            pinterest_msg: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#E60023"/><path fill="#fff" d="M12.3 7C9.9 7 8 8.7 8 10.9c0 1 .5 1.8 1.6 2 .2 0 .4 0 .5-.2.1-.1.3-.5.3-.6 0-.1 0-.1-.1-.3-.1-.2-.2-.5-.2-.8 0-1.9 1.4-3.2 3.3-3.2 1.8 0 2.8 1.1 2.8 2.6 0 2.1-1 3.9-2.6 3.9-.8 0-1.4-.6-1.2-1.4.2-.9.6-1.8.6-2.4 0-.6-.3-1.1-1-1.1-.8 0-1.5.9-1.5 2.1 0 .8.3 1.3.3 1.3l-1.2 5c-.4 1.6-.1 3.5 0 3.7h.1c.1-.2 1.3-1.6 1.7-3.1l.7-2.5c.3.6 1.2 1.1 2.1 1.1 2.7 0 4.5-2.4 4.5-5.7C18.7 8.8 16.9 7 14 7h-1.7Z"/></svg>',
            reddit_chat: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#FF4500"/><circle cx="8.5" cy="12" r="1.5" fill="#fff"/><circle cx="15.5" cy="12" r="1.5" fill="#fff"/><path fill="#fff" d="M7.5 14c.9 1 2.6 1.7 4.5 1.7S15.6 15 16.5 14c.3-.3-.1-.8-.5-.6-.8.4-2 1-3.5 1s-2.7-.6-3.5-1c-.4-.2-.8.3-.5.6Z"/></svg>',
            youtube_chat: '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="6" width="18" height="12" rx="3" fill="#FF0000"/><path fill="#fff" d="M10 9.5v5l5-2.5-5-2.5Z"/></svg>',
            slack: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4A154B" d="M3 10a2 2 0 1 1 4 0v1H5a2 2 0 0 1-2-2Zm4 0V8a2 2 0 1 1 4 0v2H7Zm0 4H5a2 2 0 1 0 2 2v-2Zm4 0v2a2 2 0 1 0 2-2h-2Zm6-3a2 2 0 1 1 0-4h2a2 2 0 1 1 0 4h-2Zm0 2h2a2 2 0 1 1-2 2v-2Zm-4-6h2a2 2 0 1 1-2-2v2Zm0 6h2v2a2 2 0 1 1-2-2Z"/></svg>',
            teams: '<svg viewBox="0 0 24 24" width="18" height="18"><rect width="24" height="24" rx="5" fill="#464EB8"/><path fill="#fff" d="M6 8h12v2h-5v8H11v-8H6V8Z"/></svg>'
        };
        return svg[key] || '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#94a3b8"/></svg>';
    }

    function closeModal(){
        if(!state.modalOpen) return;
        $(document).off('click.wpscb-dropdown');
        $(document).off('keydown.wpscb-modal');
        state.modal.remove();
        state.modalOpen = false;
        state.editIndex = null;
    }

    function saveContact(){
        const network = $('#wpscb-network').val();
        const value = $('#wpscb-value').val().trim();
    const name = $('#wpscb-name').val().trim();
    const message = $('#wpscb-message').val() ? $('#wpscb-message').val().trim() : '';
        const photo = $('#wpscb-photo').val();
        const data = state.networks[network];
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
            fieldError('#wpscb-network', WPSCB.i18n.selectNetworkFirst); hasError = true;
        }
        if(!value){
            fieldError('#wpscb-value', WPSCB.i18n.valueRequired); hasError = true;
        }
        if(!name){
            fieldError('#wpscb-name', WPSCB.i18n.fieldRequired); hasError = true;
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
        const payload = { action: state.editIndex!==null ? 'wpscb_update_contact' : 'wpscb_save_contact', nonce: WPSCB.nonce, network, value, name, message, photo, availability: JSON.stringify(availability), index: state.editIndex };
        $.post(WPSCB.ajaxUrl, payload, function(resp){
            if(!resp.success){
                $('#wpscb-error').text(resp.data.message || WPSCB.i18n.errorSaving).show();
                return;
            }
            state.contacts = (resp.data.contacts || []).map(normalizeContact);
            closeModal();
            // Inject a WP-style success notice on panel
            const noticeMsg = state.editIndex!==null ? WPSCB.i18n.updatedContact : WPSCB.i18n.savedContact;
            const $panel = $('#wpscb-app');
            if($panel.length){
                $('<div class="notice notice-success is-dismissible wpscb-alert"><p>'+escapeHtml(noticeMsg)+'</p></div>').insertBefore($panel).delay(4000).fadeOut();
            }
            render();
        });
    }

    function deleteContact(index){
        // Show MD3-style confirmation modal instead of native confirm
        const contact = state.contacts[index];
        if(!contact) return;
        const contactName = contact.name || contact.value || WPSCB.i18n.selectNetwork;
        const markup = `
        <div class="wpscb-modal-backdrop wpscb-delete-modal" role="dialog" aria-modal="true" aria-labelledby="wpscb-delete-title">
          <div class="wpscb-modal">
            <header>
              <span id="wpscb-delete-title">${escapeHtml(WPSCB.i18n.deleteContactTitle)}</span>
            </header>
            <div class="body">
              <p style="margin:0;font-size:14px;color:#475569">${escapeHtml(WPSCB.i18n.deleteContactMessage)}</p>
              <p style="margin-top:12px;font-weight:500;font-size:14px;color:#1e293b">${escapeHtml(contactName)}</p>
            </div>
            <footer>
              <button type="button" class="wpscb-btn danger" id="wpscb-confirm-delete">${escapeHtml(WPSCB.i18n.deleteBtn)}</button>
              <button type="button" class="wpscb-btn secondary" id="wpscb-cancel-delete">${escapeHtml(WPSCB.i18n.cancel)}</button>
            </footer>
          </div>
        </div>`;
        const $deleteModal = $(markup).appendTo('body');
        $deleteModal.on('click','#wpscb-confirm-delete', function(){
            $deleteModal.remove();
            $(document).off('keydown.wpscb-delete-modal');
            $.post(WPSCB.ajaxUrl, { action: 'wpscb_delete_contact', nonce: WPSCB.nonce, index }, function(resp){
                if(resp.success){
                    state.contacts = (resp.data.contacts || []).map(normalizeContact);
                    const $panel = $('#wpscb-app');
                    if($panel.length){
                        $('<div class="notice notice-success is-dismissible wpscb-alert"><p>'+escapeHtml(WPSCB.i18n.deletedContact)+'</p></div>').insertBefore($panel).delay(4000).fadeOut();
                    }
                    render();
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
        $('#wpscb-app').on('click','#wpscb-add', function(){ openModal(); });
        $('#wpscb-app').on('click','.wpscb-delete', function(){
            const idx = $(this).closest('tr').data('index');
            deleteContact(idx);
        });
        $('#wpscb-app').on('click','.wpscb-edit', function(){
            const idx = $(this).closest('tr').data('index');
            openModal(idx);
        });
        $('#wpscb-settings-form').on('submit', function(e){
            e.preventDefault();
            const enabled = $(this).find('input[name="enabled"]').is(':checked') ? 1 : 0;
            const position = $(this).find('select[name="position"]').val();
            $.post(WPSCB.ajaxUrl, { action: 'wpscb_save_settings', nonce: WPSCB.nonce, enabled, position }, function(resp){
                if(resp.success){
                    $('<div class="updated notice is-dismissible wpscb-notice"><p>'+escapeHtml(WPSCB.i18n.settingsSaved)+'</p></div>').insertAfter('#wpscb-settings-form h1').delay(3000).fadeOut();
                } else {
                    alert(resp.data.message || WPSCB.i18n.errorSavingSettings);
                }
            });
        });
    }

    function fieldError(selector, message){
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
    function openMediaFrame(){
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
            $('#wpscb-media-preview').html('<img src="'+escapeHtml(attachment.url)+'" alt="" /><button type="button" class="wpscb-media-remove" id="wpscb-remove-media">'+escapeHtml(WPSCB.i18n.remove)+'</button>');
        });
        mediaFrame.open();
    }

    function wpscb_escapeHtml(str){
        if(!str) return '';
        return String(str).replace(/[&<>"]/g, function(c){
            return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c];
        });
    }
    function capitalize(str){ return str.charAt(0).toUpperCase() + str.slice(1); }

    // Template for a time range row
    function slotRowTpl(day, index, start, end){
        start = start || '09:00';
        end = end || '17:00';
        return '<div class="wpscb-slot-row" data-day="'+day+'" data-index="'+index+'">'
            + '<span class="wpscb-slot-label">'+escapeHtml(WPSCB.i18n.from)+'</span>'
            + '<input type="time" class="wpscb-slot-start" value="'+escapeHtml(start)+'" />'
            + '<span class="wpscb-slot-sep">—</span>'
            + '<span class="wpscb-slot-label">'+escapeHtml(WPSCB.i18n.to)+'</span>'
            + '<input type="time" class="wpscb-slot-end" value="'+escapeHtml(end)+'" />'
            + '<button type="button" class="button button-small button-link-delete wpscb-remove-slot" aria-label="Remove">×</button>'
            + '</div>';
    }

    $(document).ready(function(){
        wpscb_render();
        wpscb_bindEvents();
        wpscb_initSettingsPage();
    });

    // Settings page auto-save and preview
    function wpscb_initSettingsPage(){
        const $page = $('.wpscb-settings-page');
        console.log('Settings page found:', $page.length);
        if(!$page.length) return;

        let saveTimeout;
        const $indicator = $('.wpscb-settings-save-indicator');
        const $livePreview = $('#wpscb-live-preview');
        console.log('Live preview element found:', $livePreview.length);

        // Debounced auto-save
        function autoSave(){
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function(){
                saveAllSettings();
            }, 800);
        }

        function saveAllSettings(){
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
                button_mode: $page.find('input[name="button_mode"]:checked').val(),
                button_text: $page.find('input[name="button_text"]').val(),
                button_image: $page.find('input[name="button_image"]').val(),
                button_size: $page.find('input[name="button_size"]').val(),
                button_icon_size: $page.find('input[name="button_icon_size"]').val(),
                button_color: $page.find('input[name="button_color"]').val(),
                button_text_color: $page.find('input[name="button_text_color"]').val(),
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
                responsive_scale: $page.find('input[name="responsive_scale"]').is(':checked') ? 1 : 0
            };

            // Save basic first, then advanced
            $.post(WPSCB.ajaxUrl, basicData, function(res1){
                console.log('Basic settings saved:', res1);
                $.post(WPSCB.ajaxUrl, advData, function(res2){
                    console.log('Advanced settings saved:', res2);
                    if(res2.success){
                        showSaveIndicator();
                        updatePreview();
                    }
                }).fail(function(xhr, status, error) {
                    console.error('Advanced settings save failed:', error, xhr.responseText);
                });
            }).fail(function(xhr, status, error) {
                console.error('Basic settings save failed:', error, xhr.responseText);
            });
        }

        function showSaveIndicator(){
            $indicator.fadeIn(200).delay(1500).fadeOut(300);
        }

        function updatePreview(){
            console.log('updatePreview called, livePreview length:', $livePreview.length);
            if($livePreview.length){
                renderLivePreview();
            } else {
                console.error('Live preview element not found!');
            }
        }

        // Live Preview Renderer
        function renderLivePreview(){
            console.log('renderLivePreview called');

            // Quick test to ensure preview element works
            if(!$livePreview.length){
                console.error('Live preview element not found in renderLivePreview!');
                return;
            }

            // Get current settings from form
            const enabled = $page.find('input[name="enabled"]').is(':checked');
            const position = $page.find('select[name="position"]').val() || 'right';
            const buttonMode = $page.find('input[name="button_mode"]:checked').val() || 'icon';
            const buttonText = $page.find('input[name="button_text"]').val() || 'Chat';
            const buttonSize = parseInt($page.find('input[name="button_size"]').val()) || 56;
            const buttonIconSize = parseInt($page.find('input[name="button_icon_size"]').val()) || 24;
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

            console.log('Settings:', {enabled, position, buttonMode, buttonSize, buttonColor, popupBgColor, textColor, labelColor});

            // Always show preview, even if disabled (with message)
            if(!enabled){
                $livePreview.html('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ffffff;font-size:16px;text-align:center;"><div><div style="font-size:48px;margin-bottom:16px;">💬</div><div>Widget is disabled</div><div style="font-size:12px;opacity:0.8;margin-top:8px;">Enable widget to see preview</div></div></div>');
                return;
            }

            // Auto Dark Mode check (8 PM - 7 AM based on WordPress timezone)
            function getWordPressTime(){
                const timezone = WPSCB.timezone || {};
                const offsetHours = timezone.offset || 0;
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const wpTime = new Date(utc + (offsetHours * 3600000));
                return wpTime;
            }

            const wpNow = getWordPressTime();
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

            // Sample contacts for preview
            const sampleContacts = [
                { network: 'whatsapp', name: 'WhatsApp Support', value: '1234567890' },
                { network: 'telegram', name: 'Telegram Chat', value: 'yourusername' },
                { network: 'messenger', name: 'Facebook Chat', value: 'yourpage' }
            ];

            // Network icons
            const networkIcons = {
                whatsapp: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.66 15.06L2 22l4.94-1.3A10 10 0 1 0 12 2Z"/><path fill="#fff" d="M9.5 7.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4 0-.6.3-.2.3-.8.7-.8 1.8s.8 2.1 1 2.2c.1.1 1.6 2.6 4 3.5 2 .8 2.4.7 2.8.6.4-.1 1.4-.6 1.6-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3s-1.4-.7-1.6-.7-.4-.1-.6.2c-.2.3-.7.8-.8.9-.1.1-.3.1-.5 0s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5s.3-.3.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.5-1.3-.7-1.7Z"/></svg>',
                telegram: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#229ED9" d="M21.5 3.6 2.6 11.4c-1 .4-.9 1.8.2 2l4.7 1.4 1.8 5.4c.3.9 1.5 1 .9-.1l2.4-4 5.2 3.8c.8.6 1.8.1 2-.9l3.2-14.8c.2-1-1-1.8-2-1.2Z"/></svg>',
                messenger: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#0084FF" d="M12 2C6.48 2 2 6.02 2 10.98c0 2.75 1.34 5.2 3.5 6.86V22l3.2-1.76c1.03.29 2.13.45 3.3.45 5.52 0 10-4.02 10-8.98S17.52 2 12 2Z"/><path fill="#fff" d="m6.8 14.2 4-2.5 2.1 2.5 4.3-5.2-4 2.5-2.1-2.5-4.3 5.2Z"/></svg>'
            };

            const chatIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

            // Button content based on mode
            let buttonContent = chatIcon;
            if(buttonMode === 'text'){
                buttonContent = buttonText || 'Chat';
            }

            // Generate contacts HTML (exact same structure as frontend)
            const contactsHtml = sampleContacts.map(contact => {

                const icon = networkIcons[contact.network] || '';
                return `
                    <a href="#" class="wpscb-contact-item" onclick="return false;">
                        <span class="wpscb-contact-avatar-icon">${icon}</span>
                        <div class="wpscb-contact-info">
                            <div class="wpscb-contact-name">${contact.name}</div>
                        </div>
                    </a>
                `;
            }).join('');

            // Copyright footer
            const copyrightHtml = hideCopyright ? '' : `
                <div class="wpscb-popup-footer">
                    <div style="font-size:11px;color:var(--wpscb-popup-label);">Developed by WP Chat Button</div>
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
                        width:var(--wpscb-button-size); height:var(--wpscb-button-size); border-radius:16px;
                        background:var(--wpscb-button-color); color:var(--wpscb-button-text-color); border:none; cursor:pointer;
                        box-shadow:0 6px 16px rgba(102,16,242,.4), 0 2px 6px rgba(0,0,0,.15);
                        display:flex; align-items:center; justify-content:center; transition:transform .2s, box-shadow .2s;
                        font-weight:600; overflow:hidden;
                        position: absolute;
                        ${position === 'left' ? 'left: 20px;' : 'right: 20px;'}
                        bottom: 20px;
                        z-index: 1000;
                    }
                    .wpscb-fab svg { width:var(--wpscb-button-icon-size); height:var(--wpscb-button-icon-size); }
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
                </style>
                <div class="wpscb-widget-root ${position === 'left' ? 'wpscb-left' : 'wpscb-right'}">
                    <button class="wpscb-fab" onclick="wpscb_togglePreviewPopup()" aria-label="Chat">${buttonContent}</button>
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
                </div>
                <script>
                    window.wpscb_togglePreviewPopup = function(){
                        const popup = document.getElementById('wpscb-preview-popup');
                        if(popup) popup.classList.toggle('show');
                    };
                </script>
            `;

            $livePreview.html(widgetHtml);
            console.log('Live preview HTML set');
        }

        // Conditional visibility for button_mode
        function updateConditionals(){
            const mode = $page.find('input[name="button_mode"]:checked').val();
            $page.find('.wpscb-conditional').removeClass('show');
            $page.find('.wpscb-conditional[data-show-if="button_mode='+mode+'"]').addClass('show');
        }

        // Range value display
        $page.on('input', '.wpscb-range', function(){
            $(this).next('.wpscb-range-value').text($(this).val());
            autoSave();
        });

        // All inputs trigger auto-save
        $page.on('change input', 'input, select', function(){
            autoSave();
        });

        // Radio change triggers conditional visibility
        $page.on('change', 'input[name="button_mode"]', function(){
            updateConditionals();
            autoSave();
        });

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
                $preview.html('<img src="'+escapeHtml(attachment.url)+'" alt="">');
                autoSave();
            });
            frame.open();
        });

        // Initialize conditionals
        updateConditionals();

        // Initialize live preview
        if($livePreview.length){
            console.log('Initializing live preview...');
            // Test content first
            $livePreview.html('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ffffff;font-size:16px;">🚀 Live Preview Loading...</div>');
            setTimeout(function(){
                updatePreview();
            }, 100);
        }
    }
})(jQuery);
