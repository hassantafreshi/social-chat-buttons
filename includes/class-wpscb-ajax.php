<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Ajax {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'wp_ajax_wpscb_save_contact', array( $this, 'save_contact' ) );
        add_action( 'wp_ajax_wpscb_delete_contact', array( $this, 'delete_contact' ) );
    add_action( 'wp_ajax_wpscb_save_settings', array( $this, 'save_settings' ) );
    add_action( 'wp_ajax_wpscb_update_contact', array( $this, 'update_contact' ) );
    }

    public function save_contact() {
        WPSCB::verify_request();
        $network = isset( $_POST['network'] ) ? sanitize_key( wp_unslash( $_POST['network'] ) ) : '';
        $value   = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';
    $name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
    $message = isset( $_POST['message'] ) ? sanitize_text_field( wp_unslash( $_POST['message'] ) ) : '';
        $photo   = isset( $_POST['photo'] ) ? absint( $_POST['photo'] ) : 0;
        $availability_raw = isset( $_POST['availability'] ) ? wp_unslash( $_POST['availability'] ) : '';
        $availability = json_decode( $availability_raw, true );
        if ( ! $availability || ! is_array( $availability ) ) {
            $availability = array( 'days' => array('mon','tue','wed','thu','fri','sat','sun'), 'hours' => array('start' => '00:00', 'end' => '23:59') );
        }

        $networks = $this->core->get_supported_networks();
        if ( ! isset( $networks[ $network ] ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid network.', 'wp-social-chat-button' ) ) );
        }

        $pattern = $networks[ $network ]['pattern'];
        if ( $value === '' || ( $pattern && ! preg_match( $pattern, $value ) ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid value format.', 'wp-social-chat-button' ) ) );
        }

        $contacts = $this->core->get_contacts();
        $contacts[] = array( 'network' => $network, 'value' => $value, 'name' => $name, 'message' => $message, 'photo' => $photo, 'availability' => $availability );
        $this->core->set_contacts( $contacts );
        // Enrich with photo URLs for immediate UI update
        $contacts_enriched = $contacts;
        foreach ( $contacts_enriched as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset( $c );
        wp_send_json_success( array( 'contacts' => $contacts_enriched ) );
    }

    public function delete_contact() {
        WPSCB::verify_request();
        $index = isset( $_POST['index'] ) ? absint( $_POST['index'] ) : -1;
        $contacts = $this->core->get_contacts();
        if ( $index < 0 || ! isset( $contacts[ $index ] ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid index.', 'wp-social-chat-button' ) ) );
        }
        unset( $contacts[ $index ] );
        $contacts = array_values( $contacts );
        $this->core->set_contacts( $contacts );
        wp_send_json_success( array( 'contacts' => $contacts ) );
    }

    public function save_settings() {
        WPSCB::verify_request();
        $enabled  = isset( $_POST['enabled'] ) ? 1 : 0;
        $position = isset( $_POST['position'] ) ? sanitize_key( wp_unslash( $_POST['position'] ) ) : 'right';
        $settings = $this->core->set_settings( array( 'enabled' => $enabled, 'position' => $position ) );
        wp_send_json_success( array( 'settings' => $settings ) );
    }

    public function update_contact() {
        WPSCB::verify_request();
        $index   = isset( $_POST['index'] ) ? absint( $_POST['index'] ) : -1;
        $network = isset( $_POST['network'] ) ? sanitize_key( wp_unslash( $_POST['network'] ) ) : '';
        $value   = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';
    $name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
    $message = isset( $_POST['message'] ) ? sanitize_text_field( wp_unslash( $_POST['message'] ) ) : '';
        $photo   = isset( $_POST['photo'] ) ? absint( $_POST['photo'] ) : 0;
        $availability_raw = isset( $_POST['availability'] ) ? wp_unslash( $_POST['availability'] ) : '';
        $availability = json_decode( $availability_raw, true );
        if ( ! $availability || ! is_array( $availability ) ) {
            $availability = array( 'days' => array('mon','tue','wed','thu','fri','sat','sun'), 'hours' => array('start' => '00:00', 'end' => '23:59') );
        }

        $contacts = $this->core->get_contacts();
        if ( $index < 0 || ! isset( $contacts[ $index ] ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid index.', 'wp-social-chat-button' ) ) );
        }

        $networks = $this->core->get_supported_networks();
        if ( ! isset( $networks[ $network ] ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid network.', 'wp-social-chat-button' ) ) );
        }
        $pattern = $networks[ $network ]['pattern'];
        if ( $value === '' || ( $pattern && ! preg_match( $pattern, $value ) ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid value format.', 'wp-social-chat-button' ) ) );
        }

        $contacts[ $index ] = array( 'network' => $network, 'value' => $value, 'name' => $name, 'message' => $message, 'photo' => $photo, 'availability' => $availability );
        $this->core->set_contacts( $contacts );
        // Enrich with photo URLs for immediate UI update
        $contacts_enriched = $contacts;
        foreach ( $contacts_enriched as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset( $c );
        wp_send_json_success( array( 'contacts' => $contacts_enriched ) );
    }
}
