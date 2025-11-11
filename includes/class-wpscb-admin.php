<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Admin {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
    }

    public function register_admin_menu() {
        $cap = 'manage_options';
        add_menu_page(
            __( 'WP Social Chat Button', 'wp-social-chat-button' ),
            __( 'WP Social Chat Button', 'wp-social-chat-button' ),
            $cap,
            'wpscb_panel',
            array( $this, 'render_panel_page' ),
            'dashicons-format-chat',
            56
        );
        add_submenu_page( 'wpscb_panel', __( 'Panel', 'wp-social-chat-button' ), __( 'Panel', 'wp-social-chat-button' ), $cap, 'wpscb_panel', array( $this, 'render_panel_page' ) );
        add_submenu_page( 'wpscb_panel', __( 'Settings', 'wp-social-chat-button' ), __( 'Settings', 'wp-social-chat-button' ), $cap, 'wpscb_settings', array( $this, 'render_settings_page' ) );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'wpscb' ) === false ) {
            return;
        }
        // Media library for photo field
        wp_enqueue_media();
        wp_enqueue_style( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/css/admin.css', array(), WPSCB_VERSION );
        wp_enqueue_script( 'wpscb-admin', WPSCB_PLUGIN_URL . 'assets/js/admin.js', array( 'jquery' ), WPSCB_VERSION, true );
        $contacts = $this->core->get_contacts();
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
            'i18n'    => array(
                'addContact'      => __( 'Add Contact', 'wp-social-chat-button' ),
                'editContact'     => __( 'Edit Contact', 'wp-social-chat-button' ),
                'network'         => __( 'Network', 'wp-social-chat-button' ),
                'username'        => __( 'Username', 'wp-social-chat-button' ),
                'phone'           => __( 'Phone Number', 'wp-social-chat-button' ),
                'save'            => __( 'Save', 'wp-social-chat-button' ),
                'update'          => __( 'Update', 'wp-social-chat-button' ),
                'cancel'          => __( 'Cancel', 'wp-social-chat-button' ),
                'delete'          => __( 'Delete', 'wp-social-chat-button' ),
                'name'            => __( 'Name', 'wp-social-chat-button' ),
                'photo'           => __( 'Photo', 'wp-social-chat-button' ),
                'chooseUpload'    => __( 'Choose / Upload', 'wp-social-chat-button' ),
                'remove'          => __( 'Remove', 'wp-social-chat-button' ),
                'noImageSelected' => __( 'No image selected', 'wp-social-chat-button' ),
                'noImage'         => __( 'No image', 'wp-social-chat-button' ),
                'selectNetwork'   => __( 'Select network', 'wp-social-chat-button' ),
                'searchPlaceholder' => __( 'Search...', 'wp-social-chat-button' ),
                'noResults'       => __( 'No results found', 'wp-social-chat-button' ),
                'confirmDelete'   => __( 'Delete this item?', 'wp-social-chat-button' ),
                'invalidFormat'   => __( 'Invalid input format.', 'wp-social-chat-button' ),
                'errorSaving'     => __( 'Error saving', 'wp-social-chat-button' ),
                'errorDeleting'   => __( 'Error deleting', 'wp-social-chat-button' ),
                'settingsSaved'   => __( 'Settings saved.', 'wp-social-chat-button' ),
                'errorSavingSettings' => __( 'Error saving settings', 'wp-social-chat-button' ),
                'emptyMessage'    => __( 'No contacts added. Click the add button.', 'wp-social-chat-button' ),
                'tableHeaderName' => __( 'Name', 'wp-social-chat-button' ),
                'tableHeaderValue' => __( 'Username / Number / Value', 'wp-social-chat-button' ),
                'tableHeaderNetwork' => __( 'Network', 'wp-social-chat-button' ),
                'tableHeaderPhoto' => __( 'Photo', 'wp-social-chat-button' ),
                'tableHeaderActions' => __( 'Actions', 'wp-social-chat-button' ),
                'labelEmail'      => __( 'Email', 'wp-social-chat-button' ),
                'labelID'         => __( 'ID', 'wp-social-chat-button' ),
                'labelCode'       => __( 'Code', 'wp-social-chat-button' ),
                'labelURL'        => __( 'URL', 'wp-social-chat-button' ),
                'labelValue'      => __( 'Value', 'wp-social-chat-button' ),
                'mediaUnavailable' => __( 'Media library unavailable.', 'wp-social-chat-button' ),
                'message'          => __( 'Message', 'wp-social-chat-button' ),
                'defaultMessage'   => __( 'Hello from WP Social Chat Button — how can we help?', 'wp-social-chat-button' ),
                'savedContact'     => __( 'Contact added successfully.', 'wp-social-chat-button' ),
                'updatedContact'   => __( 'Contact updated successfully.', 'wp-social-chat-button' ),
                'fieldRequired'    => __( 'This field is required.', 'wp-social-chat-button' ),
                'selectNetworkFirst' => __( 'Please select a network.', 'wp-social-chat-button' ),
                'valueRequired'    => __( 'Please enter a value.', 'wp-social-chat-button' ),
                'deleteContactTitle' => __( 'Delete Contact', 'wp-social-chat-button' ),
                'deleteContactMessage' => __( 'Are you sure you want to delete this contact? This action cannot be undone.', 'wp-social-chat-button' ),
                'deleteBtn'        => __( 'Delete', 'wp-social-chat-button' ),
                'deletedContact'   => __( 'Contact deleted successfully.', 'wp-social-chat-button' ),
                'availability'     => __( 'Availability Settings', 'wp-social-chat-button' ),
                'availableDays'    => __( 'Available Days', 'wp-social-chat-button' ),
                'availableHours'   => __( 'Available Hours', 'wp-social-chat-button' ),
                'day_mon'          => __( 'Mon', 'wp-social-chat-button' ),
                'day_tue'          => __( 'Tue', 'wp-social-chat-button' ),
                'day_wed'          => __( 'Wed', 'wp-social-chat-button' ),
                'day_thu'          => __( 'Thu', 'wp-social-chat-button' ),
                'day_fri'          => __( 'Fri', 'wp-social-chat-button' ),
                'day_sat'          => __( 'Sat', 'wp-social-chat-button' ),
                'day_sun'          => __( 'Sun', 'wp-social-chat-button' ),
            ),
            'networks' => $this->core->get_supported_networks(),
            'contacts' => $contacts,
            'settings' => $this->core->get_settings(),
        ) );
    }

    public function render_panel_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap wpscb-wrap"><h1>' . esc_html__( 'Social Chat Panel', 'wp-social-chat-button' ) . '</h1>';
        echo '<p>' . esc_html__( 'Manage your social support contact methods below.', 'wp-social-chat-button' ) . '</p>';
        echo '<div id="wpscb-app" class="wpscb-panel"></div>';
        echo '</div>';
    }

    public function render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = $this->core->get_settings();
    echo '<div class="wrap wpscb-wrap"><h1>' . esc_html__( 'Settings', 'wp-social-chat-button' ) . '</h1>';
        echo '<form id="wpscb-settings-form">';
        echo '<table class="form-table"><tbody>';
        echo '<tr><th scope="row">' . esc_html__( 'Enable Widget', 'wp-social-chat-button' ) . '</th><td><label><input type="checkbox" name="enabled" value="1" ' . checked( 1, (int) $settings['enabled'], false ) . '> ' . esc_html__( 'Show chat button on frontend', 'wp-social-chat-button' ) . '</label></td></tr>';
        echo '<tr><th scope="row">' . esc_html__( 'Position', 'wp-social-chat-button' ) . '</th><td><select name="position"><option value="right"' . selected( 'right', $settings['position'], false ) . '>' . esc_html__( 'Right', 'wp-social-chat-button' ) . '</option><option value="left"' . selected( 'left', $settings['position'], false ) . '>' . esc_html__( 'Left', 'wp-social-chat-button' ) . '</option></select></td></tr>';
        echo '</tbody></table>';
        echo '<p><button class="button button-primary" type="submit">' . esc_html__( 'Save Settings', 'wp-social-chat-button' ) . '</button></p>';
        echo '</form>';
        echo '</div>';
    }
}
