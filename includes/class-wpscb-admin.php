<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Admin {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'admin_menu', array( $this, 'wpscb_register_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'wpscb_enqueue_admin_assets' ) );
    }

    public function wpscb_register_admin_menu() {
        $cap = 'manage_options';
        add_menu_page(
            /* translators: Page title and menu name for the main plugin page in WordPress admin menu */
            esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ),
            /* translators: Menu name displayed in WordPress admin sidebar */
            esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ),
            $cap,
            'wpscb_panel',
            array( $this, 'wpscb_render_panel_page' ),
            'dashicons-format-chat',
            56
        );
        /* translators: Submenu page title and menu name for the Panel page where users manage their social media contacts */
        add_submenu_page( 'wpscb_panel', esc_html__( 'Panel', 'social-chat-buttons' ), esc_html__( 'Panel', 'social-chat-buttons' ), $cap, 'wpscb_panel', array( $this, 'wpscb_render_panel_page' ) );
        /* translators: Submenu page title and menu name for the Settings page where users configure widget appearance and behavior */
        add_submenu_page( 'wpscb_panel', esc_html__( 'Settings', 'social-chat-buttons' ), esc_html__( 'Settings', 'social-chat-buttons' ), $cap, 'wpscb_settings', array( $this, 'wpscb_render_settings_page' ) );
    }

    public function wpscb_enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'wpscb' ) === false ) {
            return;
        }
        // Media library for photo field
        wp_enqueue_media();
        // Use the asset modification time so browsers always receive admin UI fixes
        // immediately, even when the plugin version has not changed yet.
        $admin_css_version = WPSCB_VERSION . '.' . filemtime( WPSCB_PLUGIN_DIR . 'assets/css/admin.css' );
        $admin_js_version  = WPSCB_VERSION . '.' . filemtime( WPSCB_PLUGIN_DIR . 'assets/js/admin.js' );
        wp_enqueue_style( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/css/admin.css', array(), $admin_css_version );
        wp_enqueue_script( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/js/admin.js', array( 'jquery' ), $admin_js_version, true );
        $contacts = $this->core->wpscb_get_contacts();
        // enrich contacts with photo url (best-effort)
        foreach ( $contacts as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset( $c );
        $poweredBy = $this->core->wpscb_copyright_notice('admin');
        wp_localize_script( 'wpscb-admin', 'WPSCB', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'wpscb_nonce' ),
            'pluginUrl' => WPSCB_PLUGIN_URL,
            'timezone' => array(
                'offset' => get_option( 'gmt_offset', 0 ), // WordPress timezone offset in hours
                'string' => wp_timezone_string(), // WordPress timezone string
            ),
            'i18n'    => array(
                /* translators: Button text in admin panel modal to add a new social media contact */
                'addContact'      => esc_html__( 'Add Contact', 'social-chat-buttons' ),
                /* translators: Modal title when editing an existing social media contact */
                'editContact'     => esc_html__( 'Edit Contact', 'social-chat-buttons' ),
                /* translators: Short help line shown at the top of the add/edit contact modal */
                'contactModalHelp' => esc_html__( 'Pick a network, then fill in the contact\'s details below.', 'social-chat-buttons' ),
                /* translators: Label for the social network selection dropdown (e.g., WhatsApp, Telegram) */
                'network'         => esc_html__( 'Network', 'social-chat-buttons' ),
                /* translators: Label for username input field when network requires a username */
                'username'        => esc_html__( 'Username', 'social-chat-buttons' ),
                /* translators: Label for phone number input field when network requires a phone number */
                'phone'           => esc_html__( 'Phone Number', 'social-chat-buttons' ),
                /* translators: Button text to save a new contact in the admin panel */
                'save'            => esc_html__( 'Save', 'social-chat-buttons' ),
                /* translators: Button text to update an existing contact in the admin panel */
                'update'          => esc_html__( 'Update', 'social-chat-buttons' ),
                /* translators: Button text to cancel adding or editing a contact */
                'cancel'          => esc_html__( 'Cancel', 'social-chat-buttons' ),
                /* translators: Button text to delete a contact from the list */
                'delete'          => esc_html__( 'Delete', 'social-chat-buttons' ),
                /* translators: Label for the contact name input field */
                'name'            => esc_html__( 'Name', 'social-chat-buttons' ),
                /* translators: Label for the photo/avatar upload field */
                'photo'           => esc_html__( 'Photo', 'social-chat-buttons' ),
                /* translators: Button text to open WordPress media library for choosing or uploading a photo */
                'chooseUpload'    => esc_html__( 'Choose / Upload', 'social-chat-buttons' ),
                /* translators: Button text to remove the currently selected photo from a contact */
                'remove'          => esc_html__( 'Remove', 'social-chat-buttons' ),
                /* translators: Placeholder text shown when no image has been selected for a contact */
                'noImageSelected' => esc_html__( 'No image selected', 'social-chat-buttons' ),
                /* translators: Text displayed when a contact has no photo/avatar */
                'noImage'         => esc_html__( 'No image', 'social-chat-buttons' ),
                /* translators: Placeholder text in network dropdown when no network is selected */
                'selectNetwork'   => esc_html__( 'Select network', 'social-chat-buttons' ),
                /* translators: Placeholder text in search input boxes throughout the admin interface */
                'searchPlaceholder' => esc_html__( 'Search...', 'social-chat-buttons' ),
                /* translators: Message shown when search returns no matching results */
                'noResults'       => esc_html__( 'No results found', 'social-chat-buttons' ),
                /* translators: Confirmation prompt asking user to confirm deletion of an item */
                'confirmDelete'   => esc_html__( 'Delete this item?', 'social-chat-buttons' ),
                /* translators: Error message shown when user input doesn't match the required format */
                'invalidFormat'   => esc_html__( 'Invalid input format.', 'social-chat-buttons' ),
                /* translators: Generic error message shown when saving a contact fails */
                'errorSaving'     => esc_html__( 'Error saving', 'social-chat-buttons' ),
                /* translators: Generic error message shown when deleting a contact fails */
                'errorDeleting'   => esc_html__( 'Error deleting', 'social-chat-buttons' ),
                /* translators: Success message shown when settings are saved successfully */
                'settingsSaved'   => esc_html__( 'Settings saved.', 'social-chat-buttons' ),
                /* translators: Error message shown when saving settings fails */
                'errorSavingSettings' => esc_html__( 'Error saving settings', 'social-chat-buttons' ),
                /* translators: Message shown in contacts table when no contacts have been added yet */
                'emptyMessage'    => esc_html__( 'No contacts added. Click the add button.', 'social-chat-buttons' ),
                /* translators: Table column header for contact name */
                'tableHeaderName' => esc_html__( 'Name', 'social-chat-buttons' ),
                /* translators: Table column header for contact value (username, phone number, or other identifier) */
                'tableHeaderValue' => esc_html__( 'Username / Number / Value', 'social-chat-buttons' ),
                /* translators: Table column header for social network type */
                'tableHeaderNetwork' => esc_html__( 'Network', 'social-chat-buttons' ),
                /* translators: Table column header for contact photo/avatar */
                'tableHeaderPhoto' => esc_html__( 'Photo', 'social-chat-buttons' ),
                /* translators: Table column header for action buttons (edit, delete) */
                'tableHeaderActions' => esc_html__( 'Actions', 'social-chat-buttons' ),
                /* translators: Label for email address input field when network requires an email */
                'labelEmail'      => esc_html__( 'Email', 'social-chat-buttons' ),
                /* translators: Label for ID input field when network requires a numeric ID */
                'labelID'         => esc_html__( 'ID', 'social-chat-buttons' ),
                /* translators: Label for code input field when network requires a code or token */
                'labelCode'       => esc_html__( 'Code', 'social-chat-buttons' ),
                /* translators: Label for URL input field when network requires a full URL */
                'labelURL'        => esc_html__( 'URL', 'social-chat-buttons' ),
                /* translators: Generic label for value input field used across different input types */
                'labelValue'      => esc_html__( 'Value', 'social-chat-buttons' ),
                /* translators: Error message when WordPress media library is not available */
                'mediaUnavailable' => esc_html__( 'Media library unavailable.', 'social-chat-buttons' ),
                /* translators: Label for the message input field where users can set a default greeting */
                'message'          => esc_html__( 'Message', 'social-chat-buttons' ),
                /* translators: Default welcome message shown to website visitors when they open the chat widget */
                'defaultMessage'   => esc_html__( 'Hello from Social Chat Buttons — how can we help?', 'social-chat-buttons' ),
                /* translators: Success message shown when a new contact is added successfully */
                'savedContact'     => esc_html__( 'Contact added successfully.', 'social-chat-buttons' ),
                /* translators: Success message shown when an existing contact is updated successfully */
                'updatedContact'   => esc_html__( 'Contact updated successfully.', 'social-chat-buttons' ),
                /* translators: Validation error message shown when a required field is left empty */
                'fieldRequired'    => esc_html__( 'This field is required.', 'social-chat-buttons' ),
                /* translators: Validation error message shown when trying to save without selecting a network */
                'selectNetworkFirst' => esc_html__( 'Please select a network.', 'social-chat-buttons' ),
                /* translators: Validation error message shown when contact value field is empty */
                'valueRequired'    => esc_html__( 'Please enter a value.', 'social-chat-buttons' ),
                /* translators: Confirmation dialog title when deleting a contact */
                'deleteContactTitle' => esc_html__( 'Delete Contact', 'social-chat-buttons' ),
                /* translators: Confirmation message asking if user really wants to delete a contact permanently */
                'deleteContactMessage' => esc_html__( 'Are you sure you want to delete this contact? This action cannot be undone.', 'social-chat-buttons' ),
                /* translators: Button text in confirmation dialog to proceed with deletion */
                'deleteBtn'        => esc_html__( 'Delete', 'social-chat-buttons' ),
                /* translators: Success message shown when a contact is deleted successfully */
                'deletedContact'   => esc_html__( 'Contact deleted successfully.', 'social-chat-buttons' ),
                /* translators: Section heading for scheduling when a contact is available */
                'availability'     => esc_html__( 'Schedule & Availability', 'social-chat-buttons' ),
                /* translators: Label for days of the week selection in availability schedule */
                'availableDays'    => esc_html__( 'Days', 'social-chat-buttons' ),
                /* translators: Label for time hours selection in availability schedule */
                'availableHours'   => esc_html__( 'Hours', 'social-chat-buttons' ),
                /* translators: Button text to add a new time range in availability schedule */
                'addTimeRange'     => esc_html__( 'Add time range', 'social-chat-buttons' ),
                /* translators: Label for start time in time range selection */
                'from'             => esc_html__( 'From', 'social-chat-buttons' ),
                /* translators: Label for end time in time range selection */
                'to'               => esc_html__( 'To', 'social-chat-buttons' ),
                /* translators: Button text to remove all time ranges for a specific day */
                'clearDay'         => esc_html__( 'Clear day', 'social-chat-buttons' ),
                /* translators: Button text to copy current day's schedule to all other days of the week */
                'copyToAll'        => esc_html__( 'Copy to all days', 'social-chat-buttons' ),
                /* translators: Abbreviation for Monday in weekly schedule */
                'day_mon'          => esc_html__( 'Mon', 'social-chat-buttons' ),
                /* translators: Abbreviation for Tuesday in weekly schedule */
                'day_tue'          => esc_html__( 'Tue', 'social-chat-buttons' ),
                /* translators: Abbreviation for Wednesday in weekly schedule */
                'day_wed'          => esc_html__( 'Wed', 'social-chat-buttons' ),
                /* translators: Abbreviation for Thursday in weekly schedule */
                'day_thu'          => esc_html__( 'Thu', 'social-chat-buttons' ),
                /* translators: Abbreviation for Friday in weekly schedule */
                'day_fri'          => esc_html__( 'Fri', 'social-chat-buttons' ),
                /* translators: Abbreviation for Saturday in weekly schedule */
                'day_sat'          => esc_html__( 'Sat', 'social-chat-buttons' ),
                /* translators: Abbreviation for Sunday in weekly schedule */
                'day_sun'          => esc_html__( 'Sun', 'social-chat-buttons' ),
                'poweredBy'          => $poweredBy,
                /* translators: Button label to open icon selection modal */
                'chooseIcon'       => esc_html__( 'Choose Icon', 'social-chat-buttons' ),
                /* translators: Help text shown in custom SVG tab */
                'customSvgHelp'    => esc_html__( 'Paste your SVG code below:', 'social-chat-buttons' ),
                /* translators: Button to confirm using the selected icon */
                'useThisIcon'      => esc_html__( 'Use This Icon', 'social-chat-buttons' ),
                /* translators: Button to reset icon back to default chat bubble */
                'resetDefault'     => esc_html__( 'Reset to Default', 'social-chat-buttons' ),
                /* translators: Title of the dialog shown before copyright messages are hidden */
                'hideCopyrightTitle' => esc_html__( 'Enjoying Social Chat Buttons?', 'social-chat-buttons' ),
                /* translators: Explanation shown before copyright messages are hidden */
                'hideCopyrightMessage' => esc_html__( 'This plugin is free and built with care. A 5-star review takes 30 seconds and helps more people find it.', 'social-chat-buttons' ),
                /* translators: Button which opens the WordPress.org review page */
                'hideCopyrightRate' => esc_html__( '★ Leave a 5-Star Review', 'social-chat-buttons' ),
                /* translators: Button which confirms hiding copyright messages */
                'hideCopyrightContinue' => esc_html__( 'No thanks, just hide it', 'social-chat-buttons' ),
                'hideCopyrightReviewUrl' => 'https://wordpress.org/support/plugin/social-chat-buttons/reviews/?filter=5',
            ),
            'networks' => $this->core->wpscb_get_supported_networks(),
            'contacts' => $contacts,
            'settings' => $this->core->wpscb_get_settings(),
            'advanced' => $this->wpscb_enrich_advanced_settings(),
        ) );
    }

    private function wpscb_enrich_advanced_settings() {
        $advanced = $this->core->wpscb_get_advanced_settings();
        if ( ! empty( $advanced['button_image'] ) ) {
            $img_src = wp_get_attachment_image_src( absint( $advanced['button_image'] ), 'thumbnail' );
            if ( $img_src ) {
                $advanced['button_image_url'] = $img_src[0];
            }
        }
        return $advanced;
    }

    public function wpscb_render_panel_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        /* translators: Page heading for the admin panel where users manage their social media contacts */
        echo '<div class="wrap wpscb-wrap"><h1>' . esc_html__( 'Social Chat Panel', 'social-chat-buttons' ) . '</h1>';
        /* translators: Description text below page heading explaining the purpose of the panel */
        echo '<p>' . esc_html__( 'Manage your social support contact methods below.', 'social-chat-buttons' ) . '</p>';
        echo '<div id="wpscb-app" class="wpscb-panel"></div>';
        echo '</div>';
    }

    public function wpscb_render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = $this->core->wpscb_get_settings();
        $adv = $this->core->wpscb_get_advanced_settings();
        ?>
        <div class="wrap wpscb-wrap wpscb-settings-page">
            <h1><?php esc_html_e( 'Settings', 'social-chat-buttons' ); ?></h1>
            <p class="wpscb-page-subtitle"><?php esc_html_e( 'Configure how the chat widget looks, behaves, and where it appears on your site.', 'social-chat-buttons' ); ?></p>
            <div class="wpscb-settings-layout">
                <div class="wpscb-settings-controls">
                    <!-- Basic Settings -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Basic Settings', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="enabled" value="1" <?php checked( 1, (int) $settings['enabled'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Enable Widget', 'social-chat-buttons' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Position', 'social-chat-buttons' ); ?></label>
                            <select name="position" class="wpscb-select">
                                <option value="right" <?php selected( 'right', $settings['position'] ); ?>><?php esc_html_e( 'Right', 'social-chat-buttons' ); ?></option>
                                <option value="left" <?php selected( 'left', $settings['position'] ); ?>><?php esc_html_e( 'Left', 'social-chat-buttons' ); ?></option>
                            </select>
                        </div>
                    </div>

                    <!-- Display Rules -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Display Rules', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Show Button On', 'social-chat-buttons' ); ?></label>
                            <select name="display_scope" class="wpscb-select">
                                <option value="all" <?php selected( 'all', $adv['display_scope'] ); ?>><?php esc_html_e( 'All Pages (default)', 'social-chat-buttons' ); ?></option>
                                <option value="pages" <?php selected( 'pages', $adv['display_scope'] ); ?>><?php esc_html_e( 'Specific Pages', 'social-chat-buttons' ); ?></option>
                                <option value="categories" <?php selected( 'categories', $adv['display_scope'] ); ?>><?php esc_html_e( 'Specific Categories', 'social-chat-buttons' ); ?></option>
                            </select>
                        </div>
                        <p class="wpscb-setting-description"><?php esc_html_e( 'Choose where the chat button appears. It shows on every page by default.', 'social-chat-buttons' ); ?></p>

                        <div class="wpscb-setting-row wpscb-display-scope-conditional wpscb-picker-row" data-show-if-scope="pages">
                            <label><?php esc_html_e( 'Select Pages', 'social-chat-buttons' ); ?></label>
                            <?php $wpscb_all_pages = get_pages( array( 'sort_column' => 'post_title', 'sort_order' => 'ASC' ) ); ?>
                            <?php if ( empty( $wpscb_all_pages ) ) : ?>
                                <p class="wpscb-picker-empty"><?php esc_html_e( 'No pages found on this site yet.', 'social-chat-buttons' ); ?></p>
                            <?php else : ?>
                                <input type="search" class="wpscb-picker-search" data-target="display_page_ids" placeholder="<?php esc_attr_e( 'Search pages…', 'social-chat-buttons' ); ?>">
                                <div class="wpscb-picker-list" data-picker="display_page_ids">
                                    <?php foreach ( $wpscb_all_pages as $wpscb_page ) : ?>
                                        <label class="wpscb-picker-item">
                                            <input type="checkbox" name="display_page_ids[]" value="<?php echo esc_attr( $wpscb_page->ID ); ?>" <?php checked( in_array( (int) $wpscb_page->ID, array_map( 'absint', $adv['display_page_ids'] ), true ) ); ?>>
                                            <span><?php echo esc_html( $wpscb_page->post_title ? $wpscb_page->post_title : __( '(no title)', 'social-chat-buttons' ) ); ?></span>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                                <p class="wpscb-picker-hint"><?php esc_html_e( 'No pages selected yet — the button stays hidden until you pick at least one.', 'social-chat-buttons' ); ?></p>
                            <?php endif; ?>
                        </div>

                        <div class="wpscb-setting-row wpscb-display-scope-conditional wpscb-picker-row" data-show-if-scope="categories">
                            <label><?php esc_html_e( 'Select Categories', 'social-chat-buttons' ); ?></label>
                            <?php $wpscb_all_cats = get_categories( array( 'hide_empty' => false, 'orderby' => 'name', 'order' => 'ASC' ) ); ?>
                            <?php if ( empty( $wpscb_all_cats ) ) : ?>
                                <p class="wpscb-picker-empty"><?php esc_html_e( 'No categories found on this site yet.', 'social-chat-buttons' ); ?></p>
                            <?php else : ?>
                                <input type="search" class="wpscb-picker-search" data-target="display_category_ids" placeholder="<?php esc_attr_e( 'Search categories…', 'social-chat-buttons' ); ?>">
                                <div class="wpscb-picker-list" data-picker="display_category_ids">
                                    <?php foreach ( $wpscb_all_cats as $wpscb_cat ) : ?>
                                        <label class="wpscb-picker-item">
                                            <input type="checkbox" name="display_category_ids[]" value="<?php echo esc_attr( $wpscb_cat->term_id ); ?>" <?php checked( in_array( (int) $wpscb_cat->term_id, array_map( 'absint', $adv['display_category_ids'] ), true ) ); ?>>
                                            <span><?php echo esc_html( $wpscb_cat->name ); ?><span class="wpscb-picker-count"><?php echo esc_html( $wpscb_cat->count ); ?></span></span>
                                        </label>
                                    <?php endforeach; ?>
                                </div>
                                <p class="wpscb-picker-hint"><?php esc_html_e( 'No categories selected yet — the button stays hidden until you pick at least one.', 'social-chat-buttons' ); ?></p>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Display Mode -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Display Mode', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Display Mode', 'social-chat-buttons' ); ?></label>
                            <div class="wpscb-radio-group">
                                <label><input type="radio" name="display_mode" value="popup" <?php checked( 'popup', $adv['display_mode'] ); ?>> <?php esc_html_e( 'Popup', 'social-chat-buttons' ); ?></label>
                                <label><input type="radio" name="display_mode" value="direct" <?php checked( 'direct', $adv['display_mode'] ); ?>> <?php esc_html_e( 'Direct Icons', 'social-chat-buttons' ); ?></label>
                            </div>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Popup opens a chat window; Direct Icons fans the social icons out from the button.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                    </div>

                    <!-- Button Appearance -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Chat Button Appearance', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Button Mode', 'social-chat-buttons' ); ?></label>
                            <div class="wpscb-radio-group">
                                <label><input type="radio" name="button_mode" value="icon" <?php checked( 'icon', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Icon', 'social-chat-buttons' ); ?></label>
                                <label><input type="radio" name="button_mode" value="text" <?php checked( 'text', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Text', 'social-chat-buttons' ); ?></label>
                                <label><input type="radio" name="button_mode" value="image" <?php checked( 'image', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Image', 'social-chat-buttons' ); ?></label>
                            </div>
                        </div>
                        <div class="wpscb-setting-row wpscb-conditional" data-show-if="button_mode=icon">
                            <label><?php esc_html_e( 'Choose Icon', 'social-chat-buttons' ); ?></label>
                            <div class="wpscb-icon-picker-row">
                                <div class="wpscb-icon-preview" id="wpscb-icon-preview">
                                    <?php if ( ! empty( $adv['button_icon_svg'] ) ) : ?>
                                        <?php echo wp_kses( $adv['button_icon_svg'], array( 'svg' => array( 'viewbox' => true, 'width' => true, 'height' => true, 'fill' => true, 'xmlns' => true, 'class' => true, 'aria-hidden' => true ), 'path' => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true, 'opacity' => true ), 'circle' => array( 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true ), 'rect' => array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true, 'ry' => true, 'fill' => true ), 'line' => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true ), 'polyline' => array( 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true ), 'polygon' => array( 'points' => true, 'fill' => true ), 'g' => array( 'fill' => true, 'transform' => true, 'stroke' => true, 'stroke-width' => true ), 'ellipse' => array( 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true, 'fill' => true ) ) ); ?>
                                    <?php else : ?>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                                    <?php endif; ?>
                                </div>
                                <button type="button" class="button" id="wpscb-open-icon-picker"><?php esc_html_e( 'Choose Icon', 'social-chat-buttons' ); ?></button>
                                <?php if ( ! empty( $adv['button_icon_svg'] ) ) : ?>
                                    <button type="button" class="button button-link-delete" id="wpscb-reset-icon"><?php esc_html_e( 'Reset to Default', 'social-chat-buttons' ); ?></button>
                                <?php endif; ?>
                            </div>
                            <input type="hidden" name="button_icon_svg" id="wpscb-button-icon-svg" value="<?php echo esc_attr( $adv['button_icon_svg'] ); ?>">
                        </div>
                        <div class="wpscb-setting-row wpscb-conditional" data-show-if="button_mode=text">
                            <label><?php esc_html_e( 'Button Text', 'social-chat-buttons' ); ?></label>
                            <input type="text" name="button_text" value="<?php echo esc_attr( $adv['button_text'] ); ?>" class="wpscb-input">
                        </div>
                        <div class="wpscb-setting-row wpscb-conditional" data-show-if="button_mode=image">
                            <label><?php esc_html_e( 'Button Image', 'social-chat-buttons' ); ?></label>
                            <button type="button" class="button wpscb-upload-btn" data-target="button_image"><?php esc_html_e( 'Choose Image', 'social-chat-buttons' ); ?></button>
                            <input type="hidden" name="button_image" value="<?php echo esc_attr( $adv['button_image'] ); ?>">
                            <div class="wpscb-image-preview" data-for="button_image">
                                <?php if ( $adv['button_image'] ) : $src = wp_get_attachment_image_src( $adv['button_image'], 'thumbnail' ); if ( $src ) : ?>
                                <img src="<?php echo esc_url( $src[0] ); ?>" alt="">
                                <?php endif; endif; ?>
                            </div>
                        </div>
                        <p class="wpscb-group-label"><?php esc_html_e( 'Size & Shape', 'social-chat-buttons' ); ?></p>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Button Size (px)', 'social-chat-buttons' ); ?></label>
                            <input type="range" name="button_size" min="40" max="80" value="<?php echo esc_attr( $adv['button_size'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['button_size'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Icon/Text Size (px)', 'social-chat-buttons' ); ?></label>
                            <input type="range" name="button_icon_size" min="16" max="48" value="<?php echo esc_attr( $adv['button_icon_size'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['button_icon_size'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Border Radius (px)', 'social-chat-buttons' ); ?></label>
                            <input type="range" name="button_border_radius" min="0" max="50" value="<?php echo esc_attr( $adv['button_border_radius'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['button_border_radius'] ); ?></span>
                        </div>
                        <p class="wpscb-group-label"><?php esc_html_e( 'Colors', 'social-chat-buttons' ); ?></p>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="button_color" value="<?php echo esc_attr( $adv['button_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Text/Icon Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="button_text_color" value="<?php echo esc_attr( $adv['button_text_color'] ); ?>" class="wpscb-color">
                        </div>
                    </div>

                    <!-- Popup Appearance (hidden when direct mode) -->
                    <div class="wpscb-settings-section wpscb-display-conditional" data-show-if-display="popup">
                        <h2><?php esc_html_e( 'Popup Appearance', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Popup Width (px)', 'social-chat-buttons' ); ?></label>
                            <input type="range" name="popup_width" min="280" max="480" value="<?php echo esc_attr( $adv['popup_width'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['popup_width'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Popup Title', 'social-chat-buttons' ); ?></label>
                            <input type="text" name="popup_title" value="<?php echo esc_attr( $adv['popup_title'] ); ?>" class="wpscb-input" placeholder="<?php esc_attr_e( 'Chat', 'social-chat-buttons' ); ?>">
                        </div>
                        <p class="wpscb-group-label"><?php esc_html_e( 'Colors', 'social-chat-buttons' ); ?></p>
                        <div class="wpscb-color-grid">
                            <label class="wpscb-color-chip">
                                <input type="color" name="popup_bg_color" value="<?php echo esc_attr( $adv['popup_bg_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Background', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="popup_header_color" value="<?php echo esc_attr( $adv['popup_header_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Gradient Start', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="popup_header_color_end" value="<?php echo esc_attr( $adv['popup_header_color_end'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Gradient End', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="popup_text_color" value="<?php echo esc_attr( $adv['popup_text_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Text', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="popup_label_color" value="<?php echo esc_attr( $adv['popup_label_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Label', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="contact_bg_color" value="<?php echo esc_attr( $adv['contact_bg_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Contact BG', 'social-chat-buttons' ); ?></span>
                            </label>
                            <label class="wpscb-color-chip">
                                <input type="color" name="contact_hover_color" value="<?php echo esc_attr( $adv['contact_hover_color'] ); ?>" class="wpscb-color">
                                <span><?php esc_html_e( 'Contact Hover', 'social-chat-buttons' ); ?></span>
                            </label>
                        </div>
                    </div>

                    <!-- Advanced Options -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Advanced Options', 'social-chat-buttons' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="auto_dark_mode" value="1" <?php checked( 1, (int) $adv['auto_dark_mode'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Auto Dark Mode', 'social-chat-buttons' ); ?></span>
                            </label>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Switches to dark colors from 8 PM to 7 AM, based on each visitor\'s local time.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_mobile" value="1" <?php checked( 1, (int) $adv['hide_mobile'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide on Mobile', 'social-chat-buttons' ); ?></span>
                            </label>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Removes the chat widget on phones and small tablets entirely.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="responsive_scale" value="1" <?php checked( 1, (int) $adv['responsive_scale'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Responsive Scaling', 'social-chat-buttons' ); ?></span>
                            </label>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Shrinks the button and popup to fit smaller screens automatically.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_copyright" value="1" <?php checked( 1, (int) $adv['hide_copyright'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide Copyright Messages', 'social-chat-buttons' ); ?></span>
                            </label>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Removes the small credit link and site schema this plugin adds by default.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                    </div>

                    <div class="wpscb-settings-save-indicator" style="display:none;">
                        <span class="dashicons dashicons-yes-alt"></span> <?php esc_html_e( 'Saved', 'social-chat-buttons' ); ?>
                    </div>
                </div>

                <!-- Live Preview -->
                <div class="wpscb-settings-preview">
                    <div class="wpscb-preview-header">
                        <h3><?php esc_html_e( 'Live Preview', 'social-chat-buttons' ); ?></h3>
                    </div>
                    <div class="wpscb-preview-container">
                        <div id="wpscb-live-preview"></div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}
