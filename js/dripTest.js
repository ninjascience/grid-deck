require(['hbs!templates/testGrid', 'jquery', '/components/dripjs/src/drip.js'],
    function(testGrid, $, drip) {

        $('#dripTest').html(testGrid());

        // dripdrop stats api
        var stats = new drip.Stats(statsChanged);

        // dripdrop remote api
        var remote = new drip.Remote({
            customerId: $.QueryString.customerId || 1,
            clientId: $.QueryString.clientId || 1
        }, stats);

        var options = {
            rowType: "keyword",
            changed: draw,
            facets: facets
        };

        // dripdrop datasource api
        var datasource = new drip.DataSource(remote, options);

        // dripdrop query
        var query = {
            columns: ["revenue", "conversions"]
        };

        // drip service
        var service = new drip.Service(datasource, query, options, stats);

        var page = 0;
        var pageSize = 50;

        function draw() {

            var columns = ["title", "groupName", "campaignName", "revenue", "conversions", "dims", "id", "third_counter"];

            var tr = $("<tr/>");
            _(columns).each(function(col) {
                var td = $("<td/>").text(col);
                tr.append(td);
            });
            tr.addClass('h');
            $("#right #grid table thead tr").replaceWith(tr);

            var table = $("<tbody/>");
            _(_.range(page * pageSize, page * pageSize + pageSize)).each(function(index) {
                var row = service.row(index).flatObject();
                var tr = $("<tr/>");
                tr.data("index", index);
                if (row) {
                    _(columns).each(function(col) {
                        var value = row[col];
                        if (_(value).isUndefined()) value = "...";
                        else if (col === "dims") value = _(value).size() + " dims";
                        var td = $("<td/>").text(value);
                        if (col === 'title') td.addClass('kw');
                        if (col !== 'title') td.addClass('h');
                        tr.append(td);
                    });
                } else {
                    tr.append($("<td/>").prop("colspan", (_(columns).size())).text("..."));
                }
                table.append(tr);
            });
            $("#right #grid table tbody").replaceWith(table);

            $("#right #grid table tbody tr:even").css("background-color", "rgb(240,240,240)");

            $("#paging .msg").text("" + (page + 1) + " of " + Math.ceil(service.length() / pageSize));

            go();
            select(selected);
        }

        $("#previous").click(function() {
            page = Math.max(0, page - 1);
            service.viewing(range());
            draw();
        });

        $("#next").click(function() {
            ++page;
            service.viewing(range());
            draw();
        });

        function range() {
            return new drip.Range(page * pageSize, pageSize);
        }

        // drip services facets handler
        function facets(facets) {
            function facetToLi(facet, parent) {
                var li = $("<div/>");

                var label = facet.type + ":";
                if (label === "dimension:" || label === "dimension-value:") label = "";

                if (!_(facet.children).isEmpty()) {
                    li.append($("<i/>").text("-"));
                }

                var a = $("<a href='#' class='facet'/>").
                    text(label + facet.name).
                    append($("<span class='pull-right'></span>").text((facet.count ? (" (" + facet.count + ")") : ""))).
                    prop("type", facet.type).
                    prop("value", facet.id || facet.name). // relational entities have IDs; dimension values do not
                    prop("parent", parent).
                    click(facetClick);
                li.append(a);

                if (!_(facet.children).isEmpty()) {
                    var ul = $("<div/>");
                    _(facet.children).each(function(child) {
                        ul.append(facetToLi(child, facet));
                    });
                    li.append(ul);
                }

                return li;
            }
            $(".facets").empty().append(facetToLi(facets));
        }

        function facetClick(e) {
            var type = $(e.currentTarget).prop("type");
            var value = $(e.currentTarget).prop("value");
            var parent = $(e.currentTarget).prop("parent");
            _(query).extend({
                group: null,
                campaign: null,
                publisherClientAccount: null,
                publisher: null,
                folder: null,
                dims: null
            });
            if (type === 'dimension-value') {
                query.dims = {};
                query.dims[parent.name] = value;
            } else {
                query[type] = value;
            }
            service.query(query);
            e.preventDefault();
        }

        // updates stats display
        function statsChanged(stats) {
            var max = _(stats).chain().keys().reduce(function(max, key) {
                return Math.max(max, key.length);
            }, 0).value();
            $("#stats").text(_(_(stats).chain().keys().value().sort()).reduce(function(s, k) {
                var v = _(stats).result(k) || "";
                if (_(v).isNumber()) {
                    if (v != Math.round(v)) {
                        v = v.toFixed(2);
                    }
                }
                var padding = _.range(max - k.length).map(function() { return " "; }).join("");
                return s + k + padding + " = " + v.toString() + "\n";
            }, ""));
            var len = service && service.length() || 0;
            $("#total").text(len.toLocaleString());
            if (_(stats).result("service.activity") === true) {
                $("#refresh").addClass("icon-glass").removeClass("icon-refresh");
            } else {
                $("#refresh").removeClass("icon-glass").addClass("icon-refresh");

            }
            $("#progress div").width((_(stats).result("service.progress") * 100.0) + "%");
            $('#query').text(JSON.stringify(query, null, 2));
        }

        // search query input handler
        $(".search-q").keyup(function(e) {
            page = 0;
            var update = {};
            update[$(e.target).attr("param")] = $(e.target).val();
            service.query(_(query).extend(update));
        });

        $("#load-all").click(function() {
            service.loadAll();
        });

        $(".native-sort-apply").click(function(e) {
            var col = $(e.target).attr("col");
            if (col === "null") col = null;
            service.query(_(query).extend({
                sort: col,
                d: e.metaKey == true
            }));
        });

        $(".local-sort-apply").click(function(e) {
            var col = $(e.target).attr("col");
            service.localSort((function() {
                switch (col) {
                    case "null"         : return null;
                    case "id"           : return function(row) { row = row.flatObject(); return row[col] ? parseInt(row[col], 10) : Number.MAX_VALUE;          };
                    case "title"        :
                    case "groupName"    :
                    case "campaignName" : return function(row) { row = row.flatObject(); return row[col] ? row[col].toLowerCase() : "zzzzzzzzzzzzzzzzzzzzzzzz" };
                    case "revenue"      :
                    case "conversions"  : return function(row) { row = row.flatObject(); return row[col] ? (parseInt(row[col], 10)) : 0                        };
                }
            })(), e.metaKey == true);
            draw();
        });

        $(".days-apply").click(function(e) {
            function day(offset) {
                var d = new Date();
                d.setUTCHours(0, 0, 0, 0);
                return (d.getTime() + (86400000 * offset)) / 1000;
            }
            var v = $(e.target).attr("v");
            var days = [];
            switch (v) {
                case "null":      days = []; break;
                case "today":     days = [day(0)]; break;
                case "yesterday": days = [day(-1)]; break;
                case "week":      days = _(_.range(-6, 1)).map(day); break;
            };
            _(query).extend({
                days: days.join(",")
            });
            service.query(query);
        });

        $("#refresh").click(function() {
            service.refresh();
        });

        service.viewing(new drip.Range(0, 100));

        var grid = {};
        var detail = {};
        var state = grid;

        function toDetail() {
            state = detail;
            go();
        }

        function toGrid() {
            state = grid;
            go();
        }

        function go() {
            $("#left").animate({
                width: (state === detail ? "1000px" : "400px")
            }, 200);

            $("#right").animate({
                left: (state === detail ? "1000px" : "400px")
            }, 200);

            if (state === detail) {
                $("#right .h").hide();
            } else {
                _(function() {
                    $("#right .h").show();
                }).delay(100);
            }

            $("#detail").fadeTo(100, state === detail ? 1 : 0, function() {
                $("#detail").toggle(state === detail);
            });
        }

        $("#right #grid table tbody tr").live('click', function(e) {
            var index = $(e.currentTarget).data("index");
            select(index, e.currentTarget);
            toDetail();
        });

        $("#right #q").focus(function(e) {
            $("#right table tr").removeClass("sel");
            toGrid();
        });

        $("#detail .esc").click(function() {
            $("#right table tr").removeClass("sel");
            toGrid();
        });

        var selected = null;
        function select(index, el) {
            selected = index;
            var el = el || _($("#right #grid table tbody tr")).find(function(tr) {
                return $(tr).data("index") === index;
            });
            if (!el) return;
            $("#right #grid table tbody tr").removeClass("sel");
            $(el).addClass("sel");
        }

        $(window).keydown(function(e){
            if (e.keyCode === 13) {
                e.preventDefault();
                return false;
            }

            if (e.keyCode === 27) { // esc
                eng(false);
                $("#detail .esc").click();
            }

            if (!e.metaKey) return;

            if (e.keyCode === 74 || e.keyCode === 40) { // down
                select(Math.max(0, selected+1));
                if (selected >= (page + 1) * pageSize) {
                    $("#next").click();
                }
            }
            if (e.keyCode === 75 || e.keyCode === 38) { // up
                select(Math.max(0, selected-1));
                if (selected <= page * pageSize - 1) {
                    $("#previous").click();
                }
            }
            if (e.keyCode === 69) { // e
                eng();
            }

            if (!e.shiftKey) return;

            if (e.keyCode === 74 || e.keyCode === 40) { // down
                $("#next").click();
                select(page * pageSize);
            }
            if (e.keyCode === 75 || e.keyCode === 38) { // up
                $("#previous").click();
                select(page * pageSize);
            }

//            console.log(e);
        });

        function eng(show) {
            if (show === true) $("#eng").show(200);
            else if (show === false) $("#eng").hide(200);
            else $("#eng").toggle(200);
        }
        $("#e").click(function() {
            eng(true);
        });
        $("#eng .esc").click(function() {
            eng(false);
        });

        $("#advanced-button").click(function() {
            $("#advanced").toggle(100, function() {
                $("#grid").animate({
                    "top": $("#advanced").is(":visible") ? "240px" : "40px"
                }, 100);
            });
        });
    }
);