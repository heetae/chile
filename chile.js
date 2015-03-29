var svg_width = 960;
var svg_height = 650;
var valueScaling = 7;

var svg = d3.select("body").append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .call(d3.behavior.zoom().scaleExtent([0.4, 8]).on("zoom", zoomed))
    .append("g");

var container = svg.append("g");

function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("selected", true);
}

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

    function dragged() {
        d = d3.select(this).node().__data__;
        d3.select(this).attr("cx", d.x += d3.event.dx).attr("cy", d.y += d3.event.dy);
        linksElements
            .attr("x1", function (o) {
                return d.id == o.target.id ? d.x : o.target.x;})
            .attr("x2", function (o) {
                return d.id == o.source.id ? d.x : o.source.x;})
            .attr("y1", function (o) {
                return d.id == o.target.id ? d.y : o.target.y;})
            .attr("y2", function (o) {
                return d.id == o.source.id ? d.y : o.source.y;});
//            .attr("x1", function (o) {
//                return d.id == o.target.id ? o.target.x += d3.event.dx : o.target.x;})
//            .attr("x2", function (o) {
//                return d.id == o.source.id ? o.source.x += d3.event.dx : o.source.x;})
//            .attr("y1", function (o) {
//                return d.id == o.target.id ? o.target.y += d3.event.dy : o.target.y;})
//            .attr("y2", function (o) {
//                return d.id == o.source.id ? o.source.y += d3.event.dy : o.source.y;});
    }

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
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("cx", function (d) {return d["x"];})
        .attr("cy", function (graph) {return graph["y"];})
        .attr("r", 4)
        .on("click", function () {
            d3.select(".selected").classed("selected", false);
            d3.select(this).style("selected", true);
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


});