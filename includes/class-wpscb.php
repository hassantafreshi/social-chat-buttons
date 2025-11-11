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
        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );

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

    public function load_textdomain() {
        load_plugin_textdomain( 'wp-social-chat-button', false, dirname( plugin_basename( WPSCB_PLUGIN_FILE ) ) . '/languages' );
    }

    // Data helpers
    public function get_supported_networks() {
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

    public function get_contacts() {
        $contacts = get_option( WPSCB_OPTION_CONTACTS, array() );
        $contacts = is_array( $contacts ) ? $contacts : array();
        /**
         * Filter the contacts before use.
         *
         * @param array $contacts
         */
        return apply_filters( 'wpscb_contacts', $contacts );
    }

    public function set_contacts( $contacts ) {
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

    public function get_settings() {
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

    public function set_settings( $settings ) {
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

    public function build_network_url( $network, $value ) {
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

    public static function verify_request() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'wp-social-chat-button' ) ), 403 );
        }
        $nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';
        if ( ! wp_verify_nonce( $nonce, 'wpscb_nonce' ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid nonce.', 'wp-social-chat-button' ) ), 400 );
        }
    }
}
