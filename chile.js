var svg_width = 960;
var svg_height = 650;
var valueScaling = 7;

var svg = d3.select("body").append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .call(d3.behavior.zoom().scaleExtent([0.2, 8]).on("zoom", zoomed))
    .append("g");

var container = svg.append("g");

function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

//
//var zoom = d3.behavior.zoom()
//    .scaleExtent([1, 10])
//    .on("zoom", zoomed);
//
//
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

//var drag = d3.behavior.drag()
//    .origin(function(d) { return d; })
//    .on("dragstart", dragstarted)
//    .on("drag", dragged)
//    .on("dragend", dragended);

function dragstarted(d) {
    console.log(d3.select(this));
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("selected", true);
}

//
//function dragged(d) {
//    node.filter(function(d) { return d.selected; })
//        .each(function(d) {
//            d.x += d3.event.dx;
//            d.y += d3.event.dy;
//
//            d.px += d3.event.dx;
//            d.py += d3.event.dy;
//        });


function dragended(d) {
    d3.select(this).classed("selected", false);
}

d3.json("graph.json", function(error, graph) {

    graph.nodes.forEach(function (d) { // nodes coordinate scaling
        d.x = d.x / valueScaling;
        d.y = d.y / valueScaling;
    });
    graph.links.forEach(function (d) {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });


    var linksElements = container.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .style("stroke", "#999")
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    var nodeElements = container.append("g")
        .attr("class", "nodes")	// CSS 클래스 지정
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")	// 데이터의 개수만큼 circle 요소가 추가됨
        .attr("cx", function (d) {
            return d["x"];
        })
        //.call(function(elements){elements.each(function(d,i){console.log(d)})})
        //.call(function(elements){elements.each(function(graph){console.log(graph)})})
        .attr("cy", function (graph) {
            return graph["y"];
        })
        .attr("r", 4)	// 반지름을 지정
        .on("click", function () {
            d3.select(".selected").classed("selected", false);
            d3.select(this).style("selected", true)
        })
        .call(d3.behavior.drag()
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended))
        .on('dblclick', connectedNodes); //Added code for toggle highlight

    // ============ fisheye module start
//    var fisheye = d3.fisheye.circular()
//        .radius(80);
//
//    var eye = svg.on("mousemove", function() {
//        fisheye.focus(d3.mouse(this));
//        d3.select("circle").each(function(d) { d.fisheye = fisheye(d); })
//            .attr("cx", function(d) { return d.fisheye.x; })
//            .attr("cy", function(d) { return d.fisheye.y; })
//            .attr("r", function(d) { return d.fisheye.z * 4; });
//        linksElements.attr("x1", function(d) { return d.source.fisheye.x; })
//            .attr("y1", function(d) { return d.source.fisheye.y; })
//            .attr("x2", function(d) { return d.target.fisheye.x; })
//            .attr("y2", function(d) { return d.target.fisheye.y; });
//    })
    // ============ fisheye module end


    // ============ Toggle highlighting start+ .on('dblclick', connectedNodes);
    var toggle = 0;
    //Create an array logging what is connected to what
    var linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
        linkedByIndex[i + "," + i] = 1; // <==== self link
    }
    ;
    graph.links.forEach(function (d) {
        linkedByIndex[d.source.id + "," + d.target.id] = 1; // <=== edge list
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
                return d.id == o.source.id | d.id == o.target.id ? 1 : 0.1;
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

    function dragged(d) {

//        nodeElements.filter(function (d) {
//            return d.selected;
//        })
//            .attr("transform", "translate(" + d3.event.translate + ")");
//    }

//        targetid = d3.select(this).node().__data__;
//        linksElements.attr("x1", function (o) {return targetid.id==o.source.id ? targetid.x += d3.event.dx : targetid.x;})
//
        d3.select(this).attr("cx", d.x += d3.event.dx).attr("cy", d.y += d3.event.dy);
//    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }
});