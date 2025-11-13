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
            esc_html__( 'WP Social Chat Button', 'wp-social-chat-button' ),
            esc_html__( 'WP Social Chat Button', 'wp-social-chat-button' ),
            $cap,
            'wpscb_panel',
            array( $this, 'wpscb_render_panel_page' ),
            'dashicons-format-chat',
            56
        );
        add_submenu_page( 'wpscb_panel', esc_html__( 'Panel', 'wp-social-chat-button' ), esc_html__( 'Panel', 'wp-social-chat-button' ), $cap, 'wpscb_panel', array( $this, 'wpscb_render_panel_page' ) );
        add_submenu_page( 'wpscb_panel', esc_html__( 'Settings', 'wp-social-chat-button' ), esc_html__( 'Settings', 'wp-social-chat-button' ), $cap, 'wpscb_settings', array( $this, 'wpscb_render_settings_page' ) );
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
                'addContact'      => esc_html__( 'Add Contact', 'wp-social-chat-button' ),
                'editContact'     => esc_html__( 'Edit Contact', 'wp-social-chat-button' ),
                'network'         => esc_html__( 'Network', 'wp-social-chat-button' ),
                'username'        => esc_html__( 'Username', 'wp-social-chat-button' ),
                'phone'           => esc_html__( 'Phone Number', 'wp-social-chat-button' ),
                'save'            => esc_html__( 'Save', 'wp-social-chat-button' ),
                'update'          => esc_html__( 'Update', 'wp-social-chat-button' ),
                'cancel'          => esc_html__( 'Cancel', 'wp-social-chat-button' ),
                'delete'          => esc_html__( 'Delete', 'wp-social-chat-button' ),
                'name'            => esc_html__( 'Name', 'wp-social-chat-button' ),
                'photo'           => esc_html__( 'Photo', 'wp-social-chat-button' ),
                'chooseUpload'    => esc_html__( 'Choose / Upload', 'wp-social-chat-button' ),
                'remove'          => esc_html__( 'Remove', 'wp-social-chat-button' ),
                'noImageSelected' => esc_html__( 'No image selected', 'wp-social-chat-button' ),
                'noImage'         => esc_html__( 'No image', 'wp-social-chat-button' ),
                'selectNetwork'   => esc_html__( 'Select network', 'wp-social-chat-button' ),
                'searchPlaceholder' => esc_html__( 'Search...', 'wp-social-chat-button' ),
                'noResults'       => esc_html__( 'No results found', 'wp-social-chat-button' ),
                'confirmDelete'   => esc_html__( 'Delete this item?', 'wp-social-chat-button' ),
                'invalidFormat'   => esc_html__( 'Invalid input format.', 'wp-social-chat-button' ),
                'errorSaving'     => esc_html__( 'Error saving', 'wp-social-chat-button' ),
                'errorDeleting'   => esc_html__( 'Error deleting', 'wp-social-chat-button' ),
                'settingsSaved'   => esc_html__( 'Settings saved.', 'wp-social-chat-button' ),
                'errorSavingSettings' => esc_html__( 'Error saving settings', 'wp-social-chat-button' ),
                'emptyMessage'    => esc_html__( 'No contacts added. Click the add button.', 'wp-social-chat-button' ),
                'tableHeaderName' => esc_html__( 'Name', 'wp-social-chat-button' ),
                'tableHeaderValue' => esc_html__( 'Username / Number / Value', 'wp-social-chat-button' ),
                'tableHeaderNetwork' => esc_html__( 'Network', 'wp-social-chat-button' ),
                'tableHeaderPhoto' => esc_html__( 'Photo', 'wp-social-chat-button' ),
                'tableHeaderActions' => esc_html__( 'Actions', 'wp-social-chat-button' ),
                'labelEmail'      => esc_html__( 'Email', 'wp-social-chat-button' ),
                'labelID'         => esc_html__( 'ID', 'wp-social-chat-button' ),
                'labelCode'       => esc_html__( 'Code', 'wp-social-chat-button' ),
                'labelURL'        => esc_html__( 'URL', 'wp-social-chat-button' ),
                'labelValue'      => esc_html__( 'Value', 'wp-social-chat-button' ),
                'mediaUnavailable' => esc_html__( 'Media library unavailable.', 'wp-social-chat-button' ),
                'message'          => esc_html__( 'Message', 'wp-social-chat-button' ),
                'defaultMessage'   => esc_html__( 'Hello from WP Social Chat Button — how can we help?', 'wp-social-chat-button' ),
                'savedContact'     => esc_html__( 'Contact added successfully.', 'wp-social-chat-button' ),
                'updatedContact'   => esc_html__( 'Contact updated successfully.', 'wp-social-chat-button' ),
                'fieldRequired'    => esc_html__( 'This field is required.', 'wp-social-chat-button' ),
                'selectNetworkFirst' => esc_html__( 'Please select a network.', 'wp-social-chat-button' ),
                'valueRequired'    => esc_html__( 'Please enter a value.', 'wp-social-chat-button' ),
                'deleteContactTitle' => esc_html__( 'Delete Contact', 'wp-social-chat-button' ),
                'deleteContactMessage' => esc_html__( 'Are you sure you want to delete this contact? This action cannot be undone.', 'wp-social-chat-button' ),
                'deleteBtn'        => esc_html__( 'Delete', 'wp-social-chat-button' ),
                'deletedContact'   => esc_html__( 'Contact deleted successfully.', 'wp-social-chat-button' ),
                'availability'     => esc_html__( 'Schedule & Availability', 'wp-social-chat-button' ),
                'availableDays'    => esc_html__( 'Days', 'wp-social-chat-button' ),
                'availableHours'   => esc_html__( 'Hours', 'wp-social-chat-button' ),
                'addTimeRange'     => esc_html__( 'Add time range', 'wp-social-chat-button' ),
                'from'             => esc_html__( 'From', 'wp-social-chat-button' ),
                'to'               => esc_html__( 'To', 'wp-social-chat-button' ),
                'clearDay'         => esc_html__( 'Clear day', 'wp-social-chat-button' ),
                'copyToAll'        => esc_html__( 'Copy to all days', 'wp-social-chat-button' ),
                'day_mon'          => esc_html__( 'Mon', 'wp-social-chat-button' ),
                'day_tue'          => esc_html__( 'Tue', 'wp-social-chat-button' ),
                'day_wed'          => esc_html__( 'Wed', 'wp-social-chat-button' ),
                'day_thu'          => esc_html__( 'Thu', 'wp-social-chat-button' ),
                'day_fri'          => esc_html__( 'Fri', 'wp-social-chat-button' ),
                'day_sat'          => esc_html__( 'Sat', 'wp-social-chat-button' ),
                'day_sun'          => esc_html__( 'Sun', 'wp-social-chat-button' ),
            ),
            'networks' => $this->core->wpscb_get_supported_networks(),
            'contacts' => $contacts,
            'settings' => $this->core->wpscb_get_settings(),
            'advanced' => $this->core->wpscb_get_advanced_settings(),
        ) );
    }

    public function wpscb_render_panel_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap wpscb-wrap"><h1>' . esc_html__( 'Social Chat Panel', 'wp-social-chat-button' ) . '</h1>';
        echo '<p>' . esc_html__( 'Manage your social support contact methods below.', 'wp-social-chat-button' ) . '</p>';
        echo '<div id="wpscb-app" class="wpscb-panel"></div>';
        echo '</div>';
    }

    public function wpscb_render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = $this->core->wpscb_get_settings();
        $adv = $this->core->wpscb_get_advanced_settings();
        ?>
        <div class="wrap wpscb-wrap wpscb-settings-page">
            <h1><?php esc_html_e( 'Settings', 'wp-social-chat-button' ); ?></h1>
            <div class="wpscb-settings-layout">
                <div class="wpscb-settings-controls">
                    <!-- Basic Settings -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Basic Settings', 'wp-social-chat-button' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="enabled" value="1" <?php checked( 1, (int) $settings['enabled'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Enable Widget', 'wp-social-chat-button' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Position', 'wp-social-chat-button' ); ?></label>
                            <select name="position" class="wpscb-select">
                                <option value="right" <?php selected( 'right', $settings['position'] ); ?>><?php esc_html_e( 'Right', 'wp-social-chat-button' ); ?></option>
                                <option value="left" <?php selected( 'left', $settings['position'] ); ?>><?php esc_html_e( 'Left', 'wp-social-chat-button' ); ?></option>
                            </select>
                        </div>
                    </div>

                    <!-- Button Appearance -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Chat Button Appearance', 'wp-social-chat-button' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Button Mode', 'wp-social-chat-button' ); ?></label>
                            <div class="wpscb-radio-group">
                                <label><input type="radio" name="button_mode" value="icon" <?php checked( 'icon', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Icon', 'wp-social-chat-button' ); ?></label>
                                <label><input type="radio" name="button_mode" value="text" <?php checked( 'text', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Text', 'wp-social-chat-button' ); ?></label>
                                <label><input type="radio" name="button_mode" value="image" <?php checked( 'image', $adv['button_mode'] ); ?>> <?php esc_html_e( 'Image', 'wp-social-chat-button' ); ?></label>
                            </div>
                        </div>
                        <div class="wpscb-setting-row wpscb-conditional" data-show-if="button_mode=text">
                            <label><?php esc_html_e( 'Button Text', 'wp-social-chat-button' ); ?></label>
                            <input type="text" name="button_text" value="<?php echo esc_attr( $adv['button_text'] ); ?>" class="wpscb-input">
                        </div>
                        <div class="wpscb-setting-row wpscb-conditional" data-show-if="button_mode=image">
                            <label><?php esc_html_e( 'Button Image', 'wp-social-chat-button' ); ?></label>
                            <button type="button" class="button wpscb-upload-btn" data-target="button_image"><?php esc_html_e( 'Choose Image', 'wp-social-chat-button' ); ?></button>
                            <input type="hidden" name="button_image" value="<?php echo esc_attr( $adv['button_image'] ); ?>">
                            <div class="wpscb-image-preview" data-for="button_image">
                                <?php if ( $adv['button_image'] ) : $src = wp_get_attachment_image_src( $adv['button_image'], 'thumbnail' ); if ( $src ) : ?>
                                <img src="<?php echo esc_url( $src[0] ); ?>" alt="">
                                <?php endif; endif; ?>
                            </div>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Button Size (px)', 'wp-social-chat-button' ); ?></label>
                            <input type="range" name="button_size" min="40" max="80" value="<?php echo esc_attr( $adv['button_size'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['button_size'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Icon/Text Size (px)', 'wp-social-chat-button' ); ?></label>
                            <input type="range" name="button_icon_size" min="16" max="48" value="<?php echo esc_attr( $adv['button_icon_size'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['button_icon_size'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Color', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="button_color" value="<?php echo esc_attr( $adv['button_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Button Text/Icon Color', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="button_text_color" value="<?php echo esc_attr( $adv['button_text_color'] ); ?>" class="wpscb-color">
                        </div>
                    </div>

                    <!-- Popup Appearance -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Popup Appearance', 'wp-social-chat-button' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Popup Width (px)', 'wp-social-chat-button' ); ?></label>
                            <input type="range" name="popup_width" min="280" max="480" value="<?php echo esc_attr( $adv['popup_width'] ); ?>" class="wpscb-range">
                            <span class="wpscb-range-value"><?php echo esc_html( $adv['popup_width'] ); ?></span>
                        </div>
                        <div class="wpscb-setting-row">
                            <label><?php esc_html_e( 'Popup Title', 'wp-social-chat-button' ); ?></label>
                            <input type="text" name="popup_title" value="<?php echo esc_attr( $adv['popup_title'] ); ?>" class="wpscb-input" placeholder="<?php esc_attr_e( 'Chat', 'wp-social-chat-button' ); ?>">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Background Color', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="popup_bg_color" value="<?php echo esc_attr( $adv['popup_bg_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Header Gradient Start', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="popup_header_color" value="<?php echo esc_attr( $adv['popup_header_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Header Gradient End', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="popup_header_color_end" value="<?php echo esc_attr( $adv['popup_header_color_end'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Text Color', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="popup_text_color" value="<?php echo esc_attr( $adv['popup_text_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Label Color', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="popup_label_color" value="<?php echo esc_attr( $adv['popup_label_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Contact Background', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="contact_bg_color" value="<?php echo esc_attr( $adv['contact_bg_color'] ); ?>" class="wpscb-color">
                        </div>
                        <div class="wpscb-setting-row wpscb-color-row">
                            <label><?php esc_html_e( 'Contact Hover', 'wp-social-chat-button' ); ?></label>
                            <input type="color" name="contact_hover_color" value="<?php echo esc_attr( $adv['contact_hover_color'] ); ?>" class="wpscb-color">
                        </div>
                    </div>

                    <!-- Advanced Options -->
                    <div class="wpscb-settings-section">
                        <h2><?php esc_html_e( 'Advanced Options', 'wp-social-chat-button' ); ?></h2>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="auto_dark_mode" value="1" <?php checked( 1, (int) $adv['auto_dark_mode'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Auto Dark Mode', 'wp-social-chat-button' ); ?></span>
                            </label>
                            <p class="wpscb-setting-description">
                                <?php esc_html_e( 'Automatically switches to dark colors during evening hours (8 PM - 7 AM) based on visitor\'s local time. Provides a comfortable viewing experience that adapts to natural lighting conditions.', 'wp-social-chat-button' ); ?>
                            </p>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_mobile" value="1" <?php checked( 1, (int) $adv['hide_mobile'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide on Mobile', 'wp-social-chat-button' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="responsive_scale" value="1" <?php checked( 1, (int) $adv['responsive_scale'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Responsive Scaling', 'wp-social-chat-button' ); ?></span>
                            </label>
                        </div>
                        <div class="wpscb-setting-row">
                            <label class="wpscb-switch">
                                <input type="checkbox" name="hide_copyright" value="1" <?php checked( 1, (int) $adv['hide_copyright'] ); ?>>
                                <span class="wpscb-switch-slider"></span>
                                <span class="wpscb-switch-label"><?php esc_html_e( 'Hide Copyright Messages', 'wp-social-chat-button' ); ?></span>
                            </label>
                        </div>
                    </div>

                    <div class="wpscb-settings-save-indicator" style="display:none;">
                        <span class="dashicons dashicons-yes-alt"></span> <?php esc_html_e( 'Saved', 'wp-social-chat-button' ); ?>
                    </div>
                </div>

                <!-- Live Preview -->
                <div class="wpscb-settings-preview">
                    <div class="wpscb-preview-header">
                        <h3><?php esc_html_e( 'Live Preview', 'wp-social-chat-button' ); ?></h3>
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
