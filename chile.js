/**
 * Created by heetae on 3/25/15.
 */
var width = 960;
var height = 650;
var valueScaling = 7;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
//
//var margin1 = {top: 10, right: 400, bottom: 10, left: 10},  // <---- focus
//    margin2 = {top: 10, right: 10, bottom: 200, left: 400}, // <---context
//    width1 = 960 - margin1.left - margin1.right,
//    width2 = 960 - margin2.left - margin2.right,
//    height1 = 500 - margin1.top - margin1.bottom, // <---- focus
//    height2 = 500 - margin2.top - margin2.bottom; // <------ context
//
//var x = d3.time.scale().range([0, width1]),
//    x2 = d3.time.scale().range([0, width2]),
//    y = d3.scale.linear().range([height1, 0]),
//    y2 = d3.scale.linear().range([height2, 0]);
//
//var brush = d3.svg.brush()
//    .x(x2)
//    .on("brush", brushed);

//var focus = svg.append("g") << reference
//    .attr("class", "focus")
//    .attr("transform", "translate(" + 400 + "," + 200 + ")");
//focus.append("rect")
//    .attr("width", 200)
//    .attr("height", 300);

d3.json("graph.json", function(error, graph) {
//    var dataSet = [ ];	// 데이터를 저장할 배열을 준비
//    for(var i=0; i<data.length; i++){	// 데이터 줄 수만큼 반복
//        dataSet.push(data[i].sales[0]);	// sales의 최초 데이터만 추출
//    }

    graph.nodes.forEach(function(d) { // nodes coordinate scaling
        d.x = d.x/valueScaling;
        d.y = d.y/valueScaling;
    });
    graph.links.forEach(function(d) {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });


    linksElements = svg.append("g")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")	// 데이터의 개수만큼 circle 요소가 추가됨
        //.call(function(elements){elements.each(function replaceByValue(d,i){ //JSON data의 value scale 조
        //    var temp = d.source["x"];
        //    d.source["x"] = temp/valueScaling;
        //    var temp = d.source["y"];
        //    d.source["y"] = temp/valueScaling;
        //})})
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })


     nodeElements = svg.append("g")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")	// 데이터의 개수만큼 circle 요소가 추가됨
//        .call(function(elements){elements.each(function replaceByValue(d,i){ //JSON data의 value scale 조
//            var temp = d["x"];
//            d["x"] = temp/valueScaling;
//            var temp = d["y"];
//            d["y"] = temp/valueScaling;
//        })})
        //.call(function(elements){elements.each(function(d,i){console.log(xScale(d["x"]))})})
        .attr("class", "basic_nodes")	// CSS 클래스 지정
        .attr("cx", function (d) {
            return d["x"];
        })
        //.call(function(elements){elements.each(function(d,i){console.log(d)})})
        //.call(function(elements){elements.each(function(graph){console.log(graph)})})
        .attr("cy", function (graph) {
            return graph["y"];
        })
        .attr("r", 4)	// 반지름을 지정
        .on("click",function(){d3.select(this).style("stroke", "black")})
         .on('dblclick', connectedNodes); //Added code for toggle highlight

    var zoomer = d3.behavior.zoom().
        scaleExtent([0.1,10]).
        x(xScale).
        y(yScale).
        on("zoomstart", zoomstart).
        on("zoom", redraw);

    function zoomstart() {
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    }

    function redraw() {
        vis.attr("transform",
                "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }

    // ============ fisheye module start
    var fisheye = d3.fisheye.circular()
        .radius(80);

    var eye = svg.on("mousemove", function() {
        fisheye.focus(d3.mouse(this));
        d3.selectAll("circle").each(function(d) { d.fisheye = fisheye(d); })
            .attr("cx", function(d) { return d.fisheye.x; })
            .attr("cy", function(d) { return d.fisheye.y; })
            .attr("r", function(d) { return d.fisheye.z * 4; });
        linksElements.attr("x1", function(d) { return d.source.fisheye.x; })
            .attr("y1", function(d) { return d.source.fisheye.y; })
            .attr("x2", function(d) { return d.target.fisheye.x; })
            .attr("y2", function(d) { return d.target.fisheye.y; });
    })
    // ============ fisheye module end


    // ============ Toggle highlighting start
    var toggle = 0;
    //Create an array logging what is connected to what
    var linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
        linkedByIndex[i + "," + i] = 1;
    };
    graph.links.forEach(function (d) {
        linkedByIndex[d.source.id + "," + d.target.id] = 1;
    });
    //This function looks up whether a pair are neighbours
    function neighboring(a, b) {
        return linkedByIndex[a.id + "," + b.id];
    }
    function connectedNodes() {
        if (toggle == 0) {
            //Reduce the opacity of all but the neighbouring nodes
            d = d3.select(this).node().__data__;
            nodeElements.style("opacity", function (o) {
                return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
            });
            linksElements.style("opacity", function (o) {
                return d.id==o.source.id | d.id==o.target.id ? 1 : 0.1;
            });
            //Reduce the op
            toggle = 1;
        } else {
            //Put them back to opacity=1
            nodeElements.style("opacity", 1);
            linksElements.style("opacity", 1);
            toggle = 0;
        }
    }
    // ============ Toggle highlighting end

});