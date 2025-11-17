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
            esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ),
            esc_html__( 'Social Chat Buttons', 'social-chat-buttons' ),
            $cap,
            'wpscb_panel',
            array( $this, 'wpscb_render_panel_page' ),
            'dashicons-format-chat',
            56
        );
        add_submenu_page( 'wpscb_panel', esc_html__( 'Panel', 'social-chat-buttons' ), esc_html__( 'Panel', 'social-chat-buttons' ), $cap, 'wpscb_panel', array( $this, 'wpscb_render_panel_page' ) );
        add_submenu_page( 'wpscb_panel', esc_html__( 'Settings', 'social-chat-buttons' ), esc_html__( 'Settings', 'social-chat-buttons' ), $cap, 'wpscb_settings', array( $this, 'wpscb_render_settings_page' ) );
    }

    public function wpscb_enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'wpscb' ) === false ) {
            return;
        }
        // Media library for photo field
        wp_enqueue_media();
        wp_enqueue_style( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/css/admin.css', array(), WPSCB_VERSION );
        wp_enqueue_script( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/js/admin.js', array( 'jquery' ), WPSCB_VERSION, true );
        $contacts = $this->core->wpscb_get_contacts();
        // enrich contacts with photo url (best-effort)
        foreach ( $contacts as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset( $c );
        wp_localize_script( 'wpscb-admin', 'WPSCB', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'wpscb_nonce' ),
            'pluginUrl' => WPSCB_PLUGIN_URL,
            'timezone' => array(
                'offset' => get_option( 'gmt_offset', 0 ), // WordPress timezone offset in hours
                'string' => wp_timezone_string(), // WordPress timezone string
            ),
            'i18n'    => array(
                'addContact'      => esc_html__( 'Add Contact', 'social-chat-buttons' ),
                'editContact'     => esc_html__( 'Edit Contact', 'social-chat-buttons' ),
                'network'         => esc_html__( 'Network', 'social-chat-buttons' ),
                'username'        => esc_html__( 'Username', 'social-chat-buttons' ),
                'phone'           => esc_html__( 'Phone Number', 'social-chat-buttons' ),
                'save'            => esc_html__( 'Save', 'social-chat-buttons' ),
                'update'          => esc_html__( 'Update', 'social-chat-buttons' ),
                'cancel'          => esc_html__( 'Cancel', 'social-chat-buttons' ),
                'delete'          => esc_html__( 'Delete', 'social-chat-buttons' ),
                'name'            => esc_html__( 'Name', 'social-chat-buttons' ),
                'photo'           => esc_html__( 'Photo', 'social-chat-buttons' ),
                'chooseUpload'    => esc_html__( 'Choose / Upload', 'social-chat-buttons' ),
                'remove'          => esc_html__( 'Remove', 'social-chat-buttons' ),
                'noImageSelected' => esc_html__( 'No image selected', 'social-chat-buttons' ),
                'noImage'         => esc_html__( 'No image', 'social-chat-buttons' ),
                'selectNetwork'   => esc_html__( 'Select network', 'social-chat-buttons' ),
                'searchPlaceholder' => esc_html__( 'Search...', 'social-chat-buttons' ),
                'noResults'       => esc_html__( 'No results found', 'social-chat-buttons' ),
                'confirmDelete'   => esc_html__( 'Delete this item?', 'social-chat-buttons' ),
                'invalidFormat'   => esc_html__( 'Invalid input format.', 'social-chat-buttons' ),
                'errorSaving'     => esc_html__( 'Error saving', 'social-chat-buttons' ),
                'errorDeleting'   => esc_html__( 'Error deleting', 'social-chat-buttons' ),
                'settingsSaved'   => esc_html__( 'Settings saved.', 'social-chat-buttons' ),
                'errorSavingSettings' => esc_html__( 'Error saving settings', 'social-chat-buttons' ),
                'emptyMessage'    => esc_html__( 'No contacts added. Click the add button.', 'social-chat-buttons' ),
                'tableHeaderName' => esc_html__( 'Name', 'social-chat-buttons' ),
                'tableHeaderValue' => esc_html__( 'Username / Number / Value', 'social-chat-buttons' ),
                'tableHeaderNetwork' => esc_html__( 'Network', 'social-chat-buttons' ),
                'tableHeaderPhoto' => esc_html__( 'Photo', 'social-chat-buttons' ),
                'tableHeaderActions' => esc_html__( 'Actions', 'social-chat-buttons' ),
                'labelEmail'      => esc_html__( 'Email', 'social-chat-buttons' ),
                'labelID'         => esc_html__( 'ID', 'social-chat-buttons' ),
                'labelCode'       => esc_html__( 'Code', 'social-chat-buttons' ),
                'labelURL'        => esc_html__( 'URL', 'social-chat-buttons' ),
                'labelValue'      => esc_html__( 'Value', 'social-chat-buttons' ),
                'mediaUnavailable' => esc_html__( 'Media library unavailable.', 'social-chat-buttons' ),
                'message'          => esc_html__( 'Message', 'social-chat-buttons' ),
                'defaultMessage'   => esc_html__( 'Hello from Social Chat Buttons — how can we help?', 'social-chat-buttons' ),
                'savedContact'     => esc_html__( 'Contact added successfully.', 'social-chat-buttons' ),
                'updatedContact'   => esc_html__( 'Contact updated successfully.', 'social-chat-buttons' ),
                'fieldRequired'    => esc_html__( 'This field is required.', 'social-chat-buttons' ),
                'selectNetworkFirst' => esc_html__( 'Please select a network.', 'social-chat-buttons' ),
                'valueRequired'    => esc_html__( 'Please enter a value.', 'social-chat-buttons' ),
                'deleteContactTitle' => esc_html__( 'Delete Contact', 'social-chat-buttons' ),
                'deleteContactMessage' => esc_html__( 'Are you sure you want to delete this contact? This action cannot be undone.', 'social-chat-buttons' ),
                'deleteBtn'        => esc_html__( 'Delete', 'social-chat-buttons' ),
                'deletedContact'   => esc_html__( 'Contact deleted successfully.', 'social-chat-buttons' ),
                'availability'     => esc_html__( 'Schedule & Availability', 'social-chat-buttons' ),
                'availableDays'    => esc_html__( 'Days', 'social-chat-buttons' ),
                'availableHours'   => esc_html__( 'Hours', 'social-chat-buttons' ),
                'addTimeRange'     => esc_html__( 'Add time range', 'social-chat-buttons' ),
                'from'             => esc_html__( 'From', 'social-chat-buttons' ),
                'to'               => esc_html__( 'To', 'social-chat-buttons' ),
                'clearDay'         => esc_html__( 'Clear day', 'social-chat-buttons' ),
                'copyToAll'        => esc_html__( 'Copy to all days', 'social-chat-buttons' ),
                'day_mon'          => esc_html__( 'Mon', 'social-chat-buttons' ),
                'day_tue'          => esc_html__( 'Tue', 'social-chat-buttons' ),
                'day_wed'          => esc_html__( 'Wed', 'social-chat-buttons' ),
                'day_thu'          => esc_html__( 'Thu', 'social-chat-buttons' ),
                'day_fri'          => esc_html__( 'Fri', 'social-chat-buttons' ),
                'day_sat'          => esc_html__( 'Sat', 'social-chat-buttons' ),
                'day_sun'          => esc_html__( 'Sun', 'social-chat-buttons' ),
            ),
            'networks' => $this->core->wpscb_get_supported_networks(),
            'contacts' => $contacts,
            'settings' => $this->core->wpscb_get_settings(),
            'advanced' => $this->core->wpscb_get_advanced_settings(),
        ) );
    }

    public function wpscb_render_panel_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap wpscb-wrap"><h1>' . esc_html__( 'Social Chat Panel', 'social-chat-buttons' ) . '</h1>';
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
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="button_color" value="<?php echo esc_attr( $adv['button_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Text/Icon Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="button_text_color" value="<?php echo esc_attr( $adv['button_text_color'] ); ?>" class="wpscb-color">
                        </div>
                    </div>

                    <!-- Popup Appearance -->
                    <div class="wpscb-settings-section">
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
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Background Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="popup_bg_color" value="<?php echo esc_attr( $adv['popup_bg_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Header Gradient Start', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="popup_header_color" value="<?php echo esc_attr( $adv['popup_header_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Header Gradient End', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="popup_header_color_end" value="<?php echo esc_attr( $adv['popup_header_color_end'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Text Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="popup_text_color" value="<?php echo esc_attr( $adv['popup_text_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Label Color', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="popup_label_color" value="<?php echo esc_attr( $adv['popup_label_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Contact Background', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="contact_bg_color" value="<?php echo esc_attr( $adv['contact_bg_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Contact Hover', 'social-chat-buttons' ); ?></label>
                            <input type="color" name="contact_hover_color" value="<?php echo esc_attr( $adv['contact_hover_color'] ); ?>" class="wpscb-color">
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
                                <?php esc_html_e( 'Automatically switches to dark colors during evening hours (8 PM - 7 AM) based on visitor\'s local time. Provides a comfortable viewing experience that adapts to natural lighting conditions.', 'social-chat-buttons' ); ?>
                            </p>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_mobile" value="1" <?php checked( 1, (int) $adv['hide_mobile'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide on Mobile', 'social-chat-buttons' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="responsive_scale" value="1" <?php checked( 1, (int) $adv['responsive_scale'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Responsive Scaling', 'social-chat-buttons' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_copyright" value="1" <?php checked( 1, (int) $adv['hide_copyright'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide Copyright Messages', 'social-chat-buttons' ); ?></span>
                            </label>
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
