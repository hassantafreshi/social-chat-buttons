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
        add_action( 'wp_ajax_wpscb_save_advanced_settings', array( $this, 'save_advanced_settings' ) );
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
            $availability = array();
        }
        // Normalize to per-day slots schema on backend as well
        $dayKeys = array('mon','tue','wed','thu','fri','sat','sun');
        if ( isset( $availability['days'] ) && isset( $availability['hours'] ) && is_array( $availability['days'] ) ) {
            $hours = isset( $availability['hours'] ) && is_array( $availability['hours'] ) ? $availability['hours'] : array( 'start' => '00:00', 'end' => '23:59' );
            $converted = array();
            foreach ( $dayKeys as $d ) {
                $converted[ $d ] = in_array( $d, $availability['days'], true ) ? array( array( 'start' => $hours['start'], 'end' => $hours['end'] ) ) : array();
            }
            $availability = $converted;
        } else {
            // Ensure all day keys exist and are arrays of ranges
            $normalized = array();
            foreach ( $dayKeys as $d ) {
                $normalized[$d] = array();
                if ( isset( $availability[$d] ) && is_array( $availability[$d] ) ) {
                    foreach ( $availability[$d] as $slot ) {
                        $start = isset( $slot['start'] ) ? sanitize_text_field( $slot['start'] ) : '00:00';
                        $end   = isset( $slot['end'] ) ? sanitize_text_field( $slot['end'] ) : '23:59';
                        $normalized[$d][] = array( 'start' => $start, 'end' => $end );
                    }
                }
            }
            $availability = $normalized;
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
            $availability = array();
        }
        // Normalize to per-day slots
        $dayKeys = array('mon','tue','wed','thu','fri','sat','sun');
        if ( isset( $availability['days'] ) && isset( $availability['hours'] ) && is_array( $availability['days'] ) ) {
            $hours = isset( $availability['hours'] ) && is_array( $availability['hours'] ) ? $availability['hours'] : array( 'start' => '00:00', 'end' => '23:59' );
            $converted = array();
            foreach ( $dayKeys as $d ) {
                $converted[ $d ] = in_array( $d, $availability['days'], true ) ? array( array( 'start' => $hours['start'], 'end' => $hours['end'] ) ) : array();
            }
            $availability = $converted;
        } else {
            $normalized = array();
            foreach ( $dayKeys as $d ) {
                $normalized[$d] = array();
                if ( isset( $availability[$d] ) && is_array( $availability[$d] ) ) {
                    foreach ( $availability[$d] as $slot ) {
                        $start = isset( $slot['start'] ) ? sanitize_text_field( $slot['start'] ) : '00:00';
                        $end   = isset( $slot['end'] ) ? sanitize_text_field( $slot['end'] ) : '23:59';
                        $normalized[$d][] = array( 'start' => $start, 'end' => $end );
                    }
                }
            }
            $availability = $normalized;
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

    public function save_advanced_settings() {
        WPSCB::verify_request();
        $adv = array(
            'button_mode'            => isset( $_POST['button_mode'] ) ? sanitize_text_field( wp_unslash( $_POST['button_mode'] ) ) : 'icon',
            'button_text'            => isset( $_POST['button_text'] ) ? sanitize_text_field( wp_unslash( $_POST['button_text'] ) ) : '',
            'button_image'           => isset( $_POST['button_image'] ) ? absint( $_POST['button_image'] ) : 0,
            'button_size'            => isset( $_POST['button_size'] ) ? absint( $_POST['button_size'] ) : 56,
            'button_icon_size'       => isset( $_POST['button_icon_size'] ) ? absint( $_POST['button_icon_size'] ) : 24,
            'button_color'           => isset( $_POST['button_color'] ) ? sanitize_text_field( wp_unslash( $_POST['button_color'] ) ) : '#6610f2',
            'button_text_color'      => isset( $_POST['button_text_color'] ) ? sanitize_text_field( wp_unslash( $_POST['button_text_color'] ) ) : '#ffffff',
            'popup_width'            => isset( $_POST['popup_width'] ) ? absint( $_POST['popup_width'] ) : 340,
            'popup_title'            => isset( $_POST['popup_title'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_title'] ) ) : 'Chat',
            'popup_bg_color'         => isset( $_POST['popup_bg_color'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_bg_color'] ) ) : '#ffffff',
            'popup_header_color'     => isset( $_POST['popup_header_color'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_header_color'] ) ) : '#6610f2',
            'popup_header_color_end' => isset( $_POST['popup_header_color_end'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_header_color_end'] ) ) : '#d63384',
            'popup_text_color'       => isset( $_POST['popup_text_color'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_text_color'] ) ) : '#212529',
            'popup_label_color'      => isset( $_POST['popup_label_color'] ) ? sanitize_text_field( wp_unslash( $_POST['popup_label_color'] ) ) : '#6c757d',
            'contact_bg_color'       => isset( $_POST['contact_bg_color'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_bg_color'] ) ) : '#f8f9fa',
            'contact_hover_color'    => isset( $_POST['contact_hover_color'] ) ? sanitize_text_field( wp_unslash( $_POST['contact_hover_color'] ) ) : '#e2e8f0',
            'auto_dark_mode'         => isset( $_POST['auto_dark_mode'] ) ? 1 : 0,
            'hide_mobile'            => isset( $_POST['hide_mobile'] ) ? 1 : 0,
            'hide_copyright'         => isset( $_POST['hide_copyright'] ) ? 1 : 0,
            'responsive_scale'       => isset( $_POST['responsive_scale'] ) ? 1 : 0,
        );
        $saved = $this->core->set_advanced_settings( $adv );
        wp_send_json_success( array( 'settings' => $saved ) );
    }
}
