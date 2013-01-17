define([
    'jquery',
    'js/src/controllers/DataGridController',
    'js/src/controllers/FacetResultsController',
    'js/src/controllers/ViewBuilderController',
    'components/dripjs/src/drip.js',
    'js/src/service/DripDropService',
    'js/src/service/DripDropColumns',
    'js/src/PopOverManager',
    'underscore',
    'hbs!templates/advancedGrid',
    'js/lib/bootstrap-datepicker'],
    function ($, DataGridController, FacetResultsController,
              ViewBuilderController, drip,
              DripDropService, DripDropColumns, PopOverManager, _, advancedGrid) {

        "use strict";


        $().ready( function() {


            var gridContent = advancedGrid();
            $('#advancedGrid').html(gridContent);


            var gridOptions = {
                rowHeight: 24,
                enableCellNavigation:true,
                enableColumnReorder:true
            };

            /**
             * Keywords Grid
             */
            var keywordColumns = [
                DripDropColumns.COLUMN_KEYWORD_TITLE,
                DripDropColumns.COLUMN_CHANNEL_TITLE,
                DripDropColumns.COLUMN_MATCH_TYPE,
                DripDropColumns.COLUMN_CAMPAIGN_TITLE,
                DripDropColumns.COLUMN_CLICKS,
                DripDropColumns.COLUMN_REVENUE,
                DripDropColumns.COLUMN_PUBLISHER_COST
            ];

            var onStatsChanged = function(event, stats) {
                $("#progress div").width((_(stats).result("service.progress") * 100.0) + "%");
                var recordCount = $("#recordCounts");
                var rowCount = _(stats).result("service.model.count") || 0;
                var totalCount = searchKeywordsGridController._rows.getLength();
                if (totalCount) {
                    recordCount.removeClass('hidden');
                    recordCount.text(Math.min(rowCount, totalCount) + '/' + totalCount);
                } else {
                    recordCount.addClass('hidden');
                }
                if (_(stats).result("service.activity")){
                    $('#loaderImage').removeClass('hidden');
                } else {
                    $('#loaderImage').addClass('hidden');
                }
            };

            var getFacetTypeTitle = function(facetType) {
                var columns = DripDropColumns.getColumns();
                var matchingColumn = _.find(columns, function(column){
                    return column.field.indexOf(facetType) >= 0;
                });
                if (matchingColumn) {
                    return matchingColumn.name;
                } else {
                    return facetType;
                }
            };

            var onFacetsChanged = function(event, facets) {
                var structuredFacets = {facets: {}, dimensions: {}};

                var processFacet = function(facet) {
                    var ignoredFacets = ['dimensions', 'client', 'aggregate', 'dimension-value', 'dimension'];
                    if (!_(ignoredFacets).contains(facet.type)) { // ignore some facet types
                        if(!structuredFacets.facets.hasOwnProperty(facet.type)) {
                            structuredFacets.facets[facet.type] = {type: facet.type, name: getFacetTypeTitle(facet.type), values: []};
                        }
                        structuredFacets.facets[facet.type].values.push({name: facet.name, type: facet.type, count: facet.count, id: facet.id});
                        structuredFacets.facets[facet.type].values = sortAndLimit(structuredFacets.facets[facet.type].values);
                    }
                    _(facet.children).each(function(childFacet){
                        if (childFacet.type === 'dimensions') {
                            structuredFacets.dimensions = childFacet.children;
                            _(structuredFacets.dimensions).each(function(dimension){
                                DripDropColumns.addDimension(dimension.id, dimension.name);
                                dimension.children = sortAndLimit(dimension.children);
                            });

                        } else {
                            processFacet(childFacet);

                        }
                    });
                };
                _(facets.children).each( function(facetChild){
                    processFacet(facetChild);
                });
                structuredFacets.facets = _(structuredFacets.facets).values();
                structuredFacets.totalRecords = searchKeywordsGridController._rows.getLength();
                facetResultsController.setFacetResults(structuredFacets);
            };

            var sortAndLimit = function(array) {
                return _(array).chain()
                    .sortBy(function(facetValue){
                        return facetValue.count*-1;
                    })
                    .first(5).value();
            };

            var refreshSearchQuery = function() {
                var dimsPrefix = 'dim.';
                var selectedFacets = facetResultsController.getSelectedFacets();
                var query = {};
                query.q = $('#searchInput').val();
                for( var key in selectedFacets) {
                    if (selectedFacets.hasOwnProperty(key)){
                        query[key] = _(selectedFacets[key]).keys().toString();

                        if (key.indexOf(dimsPrefix) === 0) {
                            if (!query.hasOwnProperty('dims')) {
                                query.dims = {};
                            }
                            query.dims[key.slice(dimsPrefix.length)] = _(selectedFacets[key]).keys().toString();
                        }
                    }
                }


                searchKeywordsGridController.setSearchQuery(query);
            };


            var onDateChanged = function(event) {

                var startDate = Date.parse($('#startDatePicker').val());
                var endDate = Date.parse($('#endDatePicker').val());

                var days = getDays(startDate, endDate);
                if (days.length >= 1) {
                    searchKeywordsGridController.setDays(days.join(','));
                }
            };


            var onFacetSelected = function(event, changedFacet) {
                refreshSearchQuery();
            };

            var facetResultsController = new FacetResultsController('#facetResults');
            $(facetResultsController).bind(FacetResultsController.EVENT_FACET_SELECTED, onFacetSelected);
            $(facetResultsController).bind(FacetResultsController.EVENT_FACET_DESELECTED, onFacetSelected);

            var searchKeywordsGridController = new DataGridController('#keyword_page_results', 'keywordsGrid', {rowType: DripDropService.KEYWORD_ROW_TYPE, defaultColumns: keywordColumns, gridOptions: gridOptions});
            $(searchKeywordsGridController).bind(DataGridController.EVENT_STATS_CHANGED, onStatsChanged );
            $(searchKeywordsGridController).bind(DataGridController.EVENT_FACETS_CHANGED, onFacetsChanged );
            refreshSearchQuery();
            onDateChanged();


            /**
             * get an array of dates based on start and end date, each item in the array is the SECONDS since the epoch
             * @param startDate
             * @param endDate
             * @return {Array} // array of seconds since
             */
            function getDays( startDate, endDate ){
                if (endDate < startDate) {
                    throw new Error('end date cannot be before start date');
                }

                if (startDate === endDate) {
                    return [new Date(endDate).getTime() / 1000];
                }

                var oneDay = 24*3600*1000;
                for (var d=[],ms=startDate*1,last=endDate*1;ms<last;ms+=oneDay){
                    d.push( new Date(ms).getTime() / 1000 );  // push in the seconds.  yeah, I know.
                }
                return d;
            }

            var viewBuilderController = null;


            var onColumnSelectionChanged = function(event) {
                var selectedColumns = viewBuilderController.getSelectedColumns();
                searchKeywordsGridController.setColumns(selectedColumns);
            };

            var datePickers = $('.datepicker');
            datePickers.datepicker();
            datePickers.on('changeDate', onDateChanged);
            _(datePickers).each(function(datePicker){
                PopOverManager.registerControl($(datePicker).data('datepicker').picker, null, null, datePicker);
            });

            $('#searchInput').keypress(function(event){
                if(event.keyCode == 13) {
                    event.preventDefault();
                    return false;
                }
                _.debounce(refreshSearchQuery(), 500);
            });
            $('#clearSavedViewButton').click(function(){
                DripDropService.clearViewForGrid('keywordsGrid');
            });
            $('#downloadDataset').click(function(){
                searchKeywordsGridController.downloadDataset();
            });
            $('#toggleGraphs').click(function(){
                dripGraphController.toggleVisible(false);
            });
            $('#viewBuilderButton').click(function(event){
                if (!viewBuilderController) {
                    var container = $('<div />').attr('id', 'viewBuilderModal').addClass('modal').appendTo('body');
                    viewBuilderController = new ViewBuilderController(container);
                    viewBuilderController.get$().modal({trigger: 'manual', backdrop: true, show: false});
                    $(viewBuilderController).bind(ViewBuilderController.EVENT_COLUMN_SELECTION_CHANGED, onColumnSelectionChanged);
                    PopOverManager.registerControl(viewBuilderController.get$());
                }
                viewBuilderController.fetchColumns(searchKeywordsGridController.getRowType(), searchKeywordsGridController.getColumns());
                viewBuilderController.invalidate();
                event.stopPropagation();
                viewBuilderController.get$().show();

            });




        } );

    });