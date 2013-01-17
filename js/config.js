require.config({
    locale: 'en_US',
    paths: {
        lib: 'js/lib',
        controllers: 'js/src/controllers',
        'jquery.event.drag': 'js/lib/jquery/jquery.event.drag-2.2',
        'jquery.dotimeout': 'js/lib/jquery/jquery-dotimeout/jquery.ba-dotimeout',
        'jquery.ui': 'js/lib/jquery/jquery-ui-1.9.0.custom',
        hbs: 'js/lib/hbs',
        'Handlebars': 'js/lib/Handlebars',
        underscore: 'js/lib/underscore',
        i18nprecompile: 'js/lib/hbs/i18nprecompile',
        json2: 'js/lib/hbs/json2',
        deck: 'core/deck.core',
        bootstrap: 'components/bootstrap/js/bootstrap'
        // And so on for other frameworks/utils
    },
    shim: {
        'bootstrap': ['jquery'],
        'underscore': {exports: '_'},
        'jquery.event.drag': ['jquery'],
        'lib/slickgrid/slick.grid': ['jquery.event.drag'],
        'jquery.dotimeout': ['jquery'],
        'deck': ['jquery'],
        'extensions/hash/deck.hash.js': ['deck'],
        'extensions/menu/deck.menu.js': ['deck'],
        'extensions/goto/deck.goto.js': ['deck'],
        'extensions/status/deck.status.js': ['deck'],
        'extensions/navigation/deck.navigation.js': ['deck'],
        'extensions/scale/deck.scale.js': ['deck']
    },
    hbs : {
        templateExtension : 'hbs',
        // if disableI18n is `true` it won't load locales and the i18n helper
        // won't work as well.
        disableI18n : true
    }
});

define(
    'core',
    [
        'jquery',
        'bootstrap',
        'js/src/QueryString',
        'deck',
        'extensions/hash/deck.hash.js',
        'extensions/menu/deck.menu.js',
        'extensions/goto/deck.goto.js',
        'extensions/status/deck.status.js',
        'extensions/navigation/deck.navigation.js',
        'extensions/scale/deck.scale.js'
    ],
    function ( $ ) {
        // jQuery and bootstrap have been loaded
        return $;
    }
);

define('slickgrid',
    [
        'jquery.ui',
        'lib/slickgrid/slick.core',
        'lib/slickgrid/plugins/slick.cellrangedecorator',
        'lib/slickgrid/plugins/slick.cellrangeselector',
        'lib/slickgrid/plugins/slick.cellselectionmodel',
        'lib/slickgrid/plugins/slick.rowselectionmodel',
        'lib/slickgrid/slick.editors',
        'lib/slickgrid/slick.formatters',
        'lib/slickgrid/slick.grid',
        'lib/slickgrid/slick.dataview'
    ],
    function($){
        return Slick;
    }
);

