<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB {
    private static $instance = null;

    public static function instance() {
        if ( self::$instance === null ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'plugins_loaded', array( $this, 'wpscb_load_textdomain' ) );

        // Initialize modules.
        if ( is_admin() ) {
            require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-admin.php';
            new WPSCB_Admin( $this );
        }

        require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-frontend.php';
        new WPSCB_Frontend( $this );

        require_once WPSCB_PLUGIN_DIR . 'includes/class-wpscb-ajax.php';
        new WPSCB_Ajax( $this );
    }

    public function wpscb_load_textdomain() {
        load_plugin_textdomain( 'wp-social-chat-button', false, dirname( plugin_basename( WPSCB_PLUGIN_FILE ) ) . '/languages' );
    }

    // Data helpers
    public function wpscb_get_supported_networks() {
        $urlPattern = '/^https?:\/\/[^\s]+$/i';
        $networks = array(
            // Core asked list
            'whatsapp'      => array( 'label' => 'WhatsApp',               'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'messenger'     => array( 'label' => 'Facebook Messenger',     'type' => 'username', 'pattern' => '/^[A-Za-z0-9.]{5,50}$/' ),
            'telegram'      => array( 'label' => 'Telegram',               'type' => 'username', 'pattern' => '/^[A-Za-z0-9_]{5,32}$/' ),
            'instagram_dm'  => array( 'label' => 'Instagram Direct',       'type' => 'id',       'pattern' => '/^[0-9]{5,20}$/' ),
            'viber'         => array( 'label' => 'Viber',                  'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'line'          => array( 'label' => 'LINE',                   'type' => 'username', 'pattern' => '/^@?[A-Za-z0-9_\-.]{2,50}$/' ),
            'wechat'        => array( 'label' => 'WeChat',                 'type' => 'url',      'pattern' => $urlPattern ), // expect QR/official URL
            'twitter_dm'    => array( 'label' => 'Twitter (X) DM',         'type' => 'id',       'pattern' => '/^[0-9]{1,20}$/' ),
            'discord'       => array( 'label' => 'Discord',                'type' => 'code',     'pattern' => '/^([A-Za-z0-9]{4,10}|https?:\/\/discord\.gg\/[^\s]+)$/i' ),
            'signal'        => array( 'label' => 'Signal',                 'type' => 'phone',    'pattern' => '/^[0-9+\- ]{6,20}$/' ),
            'skype'         => array( 'label' => 'Skype',                  'type' => 'code',     'pattern' => '/^[A-Za-z0-9]{6,32}$/' ),
            'snapchat'      => array( 'label' => 'Snapchat',               'type' => 'username', 'pattern' => '/^[A-Za-z0-9_.-]{3,39}$/' ),
            'kakaotalk'     => array( 'label' => 'KakaoTalk',              'type' => 'code',     'pattern' => '/^[A-Za-z0-9]{6,50}$/' ),
            'linkedin_msg'  => array( 'label' => 'LinkedIn Messaging',     'type' => 'url',      'pattern' => $urlPattern ),
            'threads'       => array( 'label' => 'Threads (Meta)',         'type' => 'username', 'pattern' => '/^@?[A-Za-z0-9_.]{1,30}$/' ),
            'pinterest_msg' => array( 'label' => 'Pinterest Messages',     'type' => 'username', 'pattern' => '/^[A-Za-z0-9_]{3,30}$/' ),
            'reddit_chat'   => array( 'label' => 'Reddit Chat',            'type' => 'username', 'pattern' => '/^[A-Za-z0-9_\-]{3,20}$/' ),
            'youtube_chat'  => array( 'label' => 'YouTube Chat',           'type' => 'url',      'pattern' => $urlPattern ),
            'slack'         => array( 'label' => 'Slack Invite',           'type' => 'url',      'pattern' => $urlPattern ),
            'teams'         => array( 'label' => 'Microsoft Teams',        'type' => 'email',    'pattern' => '/^[^\s@]+@[^\s@]+\.[^\s@]+$/' ),
        );
        /**
         * Filter the supported networks list.
         *
         * @param array $networks
         */
        return apply_filters( 'wpscb_supported_networks', $networks );
    }

    public function wpscb_get_contacts() {
        $contacts = get_option( WPSCB_OPTION_CONTACTS, array() );
        $contacts = is_array( $contacts ) ? $contacts : array();
        /**
         * Filter the contacts before use.
         *
         * @param array $contacts
         */
        return apply_filters( 'wpscb_contacts', $contacts );
    }

    public function wpscb_set_contacts( $contacts ) {
        if ( ! is_array( $contacts ) ) { $contacts = array(); }
        $contacts = array_values( $contacts );
        /**
         * Filter contacts before saving.
         *
         * @param array $contacts
         */
        $contacts = apply_filters( 'wpscb_set_contacts', $contacts );
        update_option( WPSCB_OPTION_CONTACTS, $contacts );
    }

    public function wpscb_get_settings() {
        $defaults = array( 'enabled' => 1, 'position' => 'right' );
        $settings = get_option( WPSCB_OPTION_SETTINGS, array() );
        $settings = wp_parse_args( is_array( $settings ) ? $settings : array(), $defaults );
        /**
         * Filter settings after load/merge defaults.
         *
         * @param array $settings
         */
        return apply_filters( 'wpscb_settings', $settings );
    }

    public function wpscb_set_settings( $settings ) {
        if ( ! is_array( $settings ) ) { $settings = array(); }
        $settings = wp_parse_args( $settings, array( 'enabled' => 1, 'position' => 'right' ) );
        if ( ! in_array( $settings['position'], array( 'right', 'left' ), true ) ) {
            $settings['position'] = 'right';
        }
        $settings['enabled'] = ! empty( $settings['enabled'] ) ? 1 : 0;
        /**
         * Filter settings before saving.
         *
         * @param array $settings
         */
        $settings = apply_filters( 'wpscb_set_settings', $settings );
        update_option( WPSCB_OPTION_SETTINGS, $settings );
        return $settings;
    }

    public function wpscb_get_advanced_settings() {
        $defaults = array(
            // Button
            'button_mode'            => 'icon',          // 'icon', 'text', 'image'
            'button_text'            => __( 'Chat', 'wp-social-chat-button' ),
            'button_image'           => 0,               // attachment ID
            'button_size'            => 56,              // px
            'button_icon_size'       => 24,              // px for icon/text size
            'button_color'           => '#6610f2',       // primary purple
            'button_text_color'      => '#ffffff',
            // Popup
            'popup_width'            => 340,             // px
            'popup_title'            => __( 'Chat', 'wp-social-chat-button' ), // popup header title
            'popup_bg_color'         => '#ffffff',
            'popup_header_color'     => '#6610f2',       // gradient start
            'popup_header_color_end' => '#d63384',       // gradient end
            'popup_text_color'       => '#212529',
            'popup_label_color'      => '#6c757d',
            'contact_bg_color'       => '#f8f9fa',       // contact item background
            'contact_hover_color'    => '#e2e8f0',       // contact item hover
            // Advanced
            'auto_dark_mode'         => 0,               // 0=off, 1=auto dark mode (8 PM - 7 AM)
            'hide_mobile'            => 0,               // 0=show on mobile, 1=hide
            'hide_copyright'         => 0,               // 0=show, 1=hide (premium)
            'responsive_scale'       => 1,               // 0=fixed, 1=responsive
        );
        $adv = get_option( 'wpscb_advanced_settings', array() );
        $adv = wp_parse_args( is_array( $adv ) ? $adv : array(), $defaults );
        return apply_filters( 'wpscb_advanced_settings', $adv );
    }

    public function wpscb_set_advanced_settings( $adv ) {
        if ( ! is_array( $adv ) ) { $adv = array(); }
        $defaults = $this->get_advanced_settings();
        $adv = wp_parse_args( $adv, $defaults );
        // sanitize
        $adv['button_mode']            = in_array( $adv['button_mode'], array( 'icon', 'text', 'image' ), true ) ? $adv['button_mode'] : 'icon';
        $adv['button_text']            = sanitize_text_field( $adv['button_text'] );
        $adv['button_image']           = absint( $adv['button_image'] );
        $adv['button_size']            = max( 40, min( 80, absint( $adv['button_size'] ) ) );
        $adv['button_icon_size']       = max( 16, min( 48, absint( $adv['button_icon_size'] ) ) );
        $adv['button_color']           = sanitize_hex_color( $adv['button_color'] );
        $adv['button_text_color']      = sanitize_hex_color( $adv['button_text_color'] );
        $adv['popup_width']            = max( 280, min( 480, absint( $adv['popup_width'] ) ) );
        $adv['popup_title']            = sanitize_text_field( $adv['popup_title'] );
        $adv['popup_bg_color']         = sanitize_hex_color( $adv['popup_bg_color'] );
        $adv['popup_header_color']     = sanitize_hex_color( $adv['popup_header_color'] );
        $adv['popup_header_color_end'] = sanitize_hex_color( $adv['popup_header_color_end'] );
        $adv['popup_text_color']       = sanitize_hex_color( $adv['popup_text_color'] );
        $adv['popup_label_color']      = sanitize_hex_color( $adv['popup_label_color'] );
        $adv['contact_bg_color']       = sanitize_hex_color( $adv['contact_bg_color'] );
        $adv['contact_hover_color']    = sanitize_hex_color( $adv['contact_hover_color'] );
        $adv['auto_dark_mode']         = ! empty( $adv['auto_dark_mode'] ) ? 1 : 0;
        $adv['hide_mobile']            = ! empty( $adv['hide_mobile'] ) ? 1 : 0;
        $adv['hide_copyright']         = ! empty( $adv['hide_copyright'] ) ? 1 : 0;
        $adv['responsive_scale']       = ! empty( $adv['responsive_scale'] ) ? 1 : 0;

        $adv = apply_filters( 'wpscb_set_advanced_settings', $adv );
        update_option( 'wpscb_advanced_settings', $adv );
        return $adv;
    }

    public function wpscb_build_network_url( $network, $value ) {
        switch ( $network ) {
            case 'whatsapp':
                $digits = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://wa.me/' . rawurlencode( $digits );
                break;
            case 'messenger':
                $url = 'https://m.me/' . rawurlencode( $value );
                break;
            case 'telegram':
                $url = 'https://t.me/' . rawurlencode( ltrim( $value, '@' ) );
                break;
            case 'instagram_dm':
                $digits = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://www.instagram.com/direct/t/' . rawurlencode( $digits ) . '/';
                break;
            case 'signal':
                $digits = preg_replace( '/[^0-9+]/', '', $value );
                $url = 'https://signal.me/#p/' . rawurlencode( $digits );
                break;
            case 'viber':
                $digits = preg_replace( '/[^0-9+]/', '', $value );
                $url = 'viber://chat?number=' . rawurlencode( $digits );
                break;
            case 'line':
                $u = ltrim( $value, '@' );
                $url = 'https://line.me/R/ti/p/@' . rawurlencode( $u );
                break;
            case 'wechat':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'twitter_dm':
                $id = preg_replace( '/[^0-9]/', '', $value );
                $url = 'https://twitter.com/messages/compose?recipient_id=' . rawurlencode( $id );
                break;
            case 'discord':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : ( 'https://discord.gg/' . rawurlencode( $value ) );
                break;
            case 'skype':
                $url = 'https://join.skype.com/invite/' . rawurlencode( $value );
                break;
            case 'snapchat':
                $url = 'https://www.snapchat.com/add/' . rawurlencode( $value );
                break;
            case 'kakaotalk':
                $url = 'https://open.kakao.com/o/' . rawurlencode( $value );
                break;
            case 'linkedin_msg':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : 'https://www.linkedin.com/messaging/thread/NEW/';
                break;
            case 'threads':
                $url = 'https://www.threads.net/' . ( strpos( $value, '@' ) === 0 ? '' : '@' ) . rawurlencode( $value );
                break;
            case 'pinterest_msg':
                $url = 'https://pinterest.com/send/' . rawurlencode( $value ) . '/';
                break;
            case 'reddit_chat':
                $url = 'https://www.reddit.com/message/compose/?to=' . rawurlencode( $value );
                break;
            case 'youtube_chat':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'slack':
                $url = preg_match( '/^https?:\/\//i', $value ) ? $value : '#';
                break;
            case 'teams':
                $url = 'https://teams.microsoft.com/l/chat/0/0?users=' . rawurlencode( $value );
                break;
            default:
                $url = '#';
                break;
        }
        /**
         * Filter the final URL for a given network/value.
         *
         * @param string $url
         * @param string $network
         * @param string $value
         */
        return apply_filters( 'wpscb_network_url', $url, $network, $value );
    }

    public static function wpscb_verify_request() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'wp-social-chat-button' ) ), 403 );
        }
        $nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
        if ( ! wp_verify_nonce( $nonce, 'wpscb_nonce' ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'wp-social-chat-button' ) ), 400 );
        }
    }
}
