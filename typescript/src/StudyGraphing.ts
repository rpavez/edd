/// <reference path="../typings/d3/d3.d.ts"/>;
/// <reference path="GraphHelperMethods.ts" />

var StudyDGraphing:any;

declare var createLineGraph;
declare var createSideBySide;
declare var createMeasurementGraph;

StudyDGraphing = {

	Setup:function(graphdiv) {

		if (graphdiv) {
			this.graphDiv = $("#" + graphdiv);
		} else {
			this.graphDiv = $("#graphDiv");
        }
	},

	clearAllSets:function() {

        var divs =  this.graphDiv.siblings();

        if ($(divs[1]).find( "svg" ).length == 0 ){
             d3.selectAll("svg").remove();
        }
        else {
            for (var div = 1; div < divs.length; div++) {
                $(divs[div]).find("svg").remove()
            }
        }
	},

	addNewSet:function(newSet) {
        var buttonArr = StudyDGraphing.getButtonElement(this.graphDiv);
        var selector = StudyDGraphing.getSelectorElement(this.graphDiv);
        //line chart
        $(buttonArr[0]).click(function(event) {
            event.preventDefault();
                  d3.select(selector[1]).style('display', 'block');
                  d3.select(selector[2]).style('display', 'none');
                  d3.select(selector[3]).style('display', 'none');
                  d3.select(selector[4]).style('display', 'none');
                  d3.select(selector[5]).style('display', 'none');
            $('label.btn').removeClass('active');
            $(this).addClass('active');
            return false
        });
        //bar chart grouped by time
        $(buttonArr[1]).click(function(event) {
            event.preventDefault();
                  d3.select(selector[1]).style('display', 'none');
                  d3.select(selector[2]).style('display', 'block');
                  d3.select(selector[3]).style('display', 'none');
                  d3.select(selector[4]).style('display', 'none');
                  d3.select(selector[5]).style('display', 'none');
            $('label.btn').removeClass('active');
            $(this).addClass('active');
            return false
        });
        //bar charts for each line entry
        $(buttonArr[2]).click(function(event) {
            event.preventDefault();
                  d3.select(selector[1]).style('display', 'none');
                  d3.select(selector[2]).style('display', 'none');
                  d3.select(selector[3]).style('display', 'block');
                  d3.select(selector[4]).style('display', 'none');
                  d3.select(selector[5]).style('display', 'none');
            $('label.btn').removeClass('active');
            $(this).addClass('active');
            return false;
        });
        //bar chart grouped by assay
        $(buttonArr[3]).click(function(event) {
            event.preventDefault();
                  d3.select(selector[1]).style('display', 'none');
                  d3.select(selector[2]).style('display', 'none');
                  d3.select(selector[3]).style('display', 'none');
                  d3.select(selector[4]).style('display', 'block');
                  d3.select(selector[5]).style('display', 'none');
            $('label.btn').removeClass('active');
            $(this).addClass('active');
            return false;
        });
        $(buttonArr[4]).click(function(event) {
            event.preventDefault();
                  d3.select(selector[1]).style('display', 'none');
                  d3.select(selector[2]).style('display', 'none');
                  d3.select(selector[3]).style('display', 'none');
                  d3.select(selector[4]).style('display', 'none');
                  d3.select(selector[5]).style('display', 'block');
            $('label.btn').removeClass('active');
            $(this).addClass('active');
            return false;
        });

        var data = EDDData; // main data
        var barAssayObj  = GraphHelperMethods.sortBarData(newSet);
        var x_units = GraphHelperMethods.findX_Units(barAssayObj);
        var y_units = GraphHelperMethods.findY_Units(barAssayObj);

        //data for graphs
        var graphSet = {
            barAssayObj: GraphHelperMethods.sortBarData(newSet),
            labels: GraphHelperMethods.names(data),
            y_unit: GraphHelperMethods.displayUnit(y_units),
            x_unit: GraphHelperMethods.displayUnit(x_units),
            create_x_axis: GraphHelperMethods.createXAxis,
            create_y_axis: GraphHelperMethods.createYAxis,
            x_axis: GraphHelperMethods.make_x_axis,
            y_axis: GraphHelperMethods.make_y_axis,
            individualData: newSet,
            assayMeasurements: barAssayObj,
            legend: GraphHelperMethods.legend,
            color: d3.scale.category10(),
            width: 750,
            height: 220
        };
        //create respective graphs
        createLineGraph(graphSet, GraphHelperMethods.createLineSvg(selector[1]));
        createSideBySide(graphSet, selector[3]);
        createMeasurementGraph(graphSet, GraphHelperMethods.createSvg(selector[2]), 'x');
        createMeasurementGraph(graphSet, GraphHelperMethods.createSvg(selector[4]), 'name');
        createMeasurementGraph(graphSet, GraphHelperMethods.createSvg(selector[5]), 'measurement');

		if (!newSet.label) {
			$('#debug').text('Failed to fetch series.');
			return;
		}
	},

    /* this function takes in element and returns an array of selectors
    * [<div id=​"linechart">​</div>​, <div id=​"timeBar">​</div>​, <div id=​"single">​</div>​,
    * <div id=​"groupedAssay">​</div>​]
    */
    getButtonElement:function (element) {
        if (($(element).siblings().siblings()).size() < 8) {
            return $(element.siblings()[0]).find("label")
        } else {
            return $(element.siblings()[1]).find("label")
        }
    },

    // this function takes in the graphDiv element and returns an array of 4 buttons
    getSelectorElement:function (element) {
        return element.siblings().siblings()
    }
};