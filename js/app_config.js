require.config({
    baseUrl: '/'
});

require(['/js/config.js'], function(){

    require(['core'], function($){

        $(document).on('deck.init', function() {
            var classAttr = $('#slideDeck').attr('class');
            var onSlideClass = classAttr.match(/on-slide-[0-9]+/)[0];
            var slideIndex = onSlideClass.slice(9);
            processSlideIndex(parseInt(slideIndex));
        });
        $.deck('.slide');
        $(document).on('deck.change', function(event, from, to) {
            processSlideIndex(to);
        });
    });
});

var processSlideIndex = function(index) {
    switch(index) {
        case 7:
            initBasicGrid();
            break;
        case 8:
            initDiagram();
            break;
        case 9:
            initAdvancedGrid();
            break;
        case 10:
            initTestGrid();
            break;
    }
}

var initDiagram = function() {
    require(['hbs!templates/diagram'], function(diagram){
        $('#diagram').html(diagram());
    });
};

var initBasicGrid = function() {
    require(['js/basicGrid']);
};


var initTestGrid = function() {
    require(['js/dripTest']);
};

var initAdvancedGrid = function() {
    require(['js/advancedGrid']);
}

