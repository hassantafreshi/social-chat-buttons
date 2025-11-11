<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

class WPSCB_Frontend {
    private $core;

    public function __construct( $core ) {
        $this->core = $core;
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_front_assets' ) );
        add_action( 'wp_footer', array( $this, 'render_frontend_widget' ) );
    }

    public function enqueue_front_assets() {
        $settings = $this->core->get_settings();
        if ( empty( $settings['enabled'] ) ) { return; }
        wp_enqueue_style( 'wpscb-front', WPSCB_PLUGIN_URL . 'assets/css/front.css', array(), WPSCB_VERSION );
        wp_enqueue_script( 'wpscb-front', WPSCB_PLUGIN_URL . 'assets/js/front.js', array(), WPSCB_VERSION, true );
        // Localize frontend settings & contacts with availability
        $contacts = $this->core->get_contacts();
        foreach ( $contacts as &$c ) {
            if ( ! empty( $c['photo'] ) ) {
                $src = wp_get_attachment_image_src( absint( $c['photo'] ), 'thumbnail' );
                if ( $src ) { $c['photo_url'] = $src[0]; }
            }
        }
        unset($c);
        wp_localize_script( 'wpscb-front', 'WPSCB_FRONT', array(
            'contacts' => $contacts,
            'settings' => $settings,
            'i18n' => array(
                'chat' => __( 'Chat', 'wp-social-chat-button' ),
                'poweredBy' => __( 'Developed by WP Chat Button', 'wp-social-chat-button' ),
                'sponsoredBy' => __( 'Sponsored by whitestudio.team', 'wp-social-chat-button' ),
            ),
        ) );
    }

    public function render_frontend_widget() {
        $settings = $this->core->get_settings();
        if ( empty( $settings['enabled'] ) ) { return; }
        $contacts = $this->core->get_contacts();
        if ( empty( $contacts ) ) { return; }
        $position_class = $settings['position'] === 'left' ? 'wpscb-left' : 'wpscb-right';

        echo '<div id="wpscb-widget-root" class="' . esc_attr( $position_class ) . '"></div>';
    }
}
