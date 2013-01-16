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
    }
}

var initBasicGrid = function() {
    require(['slickgrid','jquery'], function(Slick, $){
        var grid;
        var columns = [
            {id: "title", name: "Title", field: "title", width: 150},
            {id: "duration", name: "Duration", field: "duration", width: 150},
            {id: "%", name: "% Complete", field: "percentComplete", width: 150},
            {id: "start", name: "Start", field: "start", width: 150},
            {id: "finish", name: "Finish", field: "finish", width: 150},
            {id: "effort-driven", name: "Effort Driven", field: "effortDriven", width: 150}
        ];

        var options = {
            enableCellNavigation: true,
            enableColumnReorder: false
        };

        var data = [];

        $(function () {
            grid = new Slick.Grid("#basicGrid", data, columns, options);
            var populateGrid = function(){
                var data = [];
                var rowCount = parseInt($('#basicRows').val());
                if (rowCount) {
                    for (var i = 0; i < rowCount; i++) {
                        data[i] = {
                            title: "Task " + i,
                            duration: "5 days",
                            percentComplete: Math.round(Math.random() * 100),
                            start: "01/01/2009",
                            finish: "01/05/2009",
                            effortDriven: (i % 5 == 0)
                        };
                    }
                    grid.setData(data);
                    grid.invalidate();
                }
            };
            populateGrid();
            $('#basicRows').on('blur', populateGrid);
        });



    });
};

