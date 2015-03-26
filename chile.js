/**
 * Created by heetae on 3/25/15.
 */
var width = 960;
var height = 650;
var valueScaling = 5;

var yScale = d3.scale.linear()  // 스케일 설정
    .domain([0, 8000])   // 원래 크기
    .range([0, height]) // 실체 출력 크기
var xScale = d3.scale.linear()  // 스케일 설정
    .domain([0, 13000 ])   // 원래 크기
    .range([0, width ]) // 실체 출력 크기


d3.json("graph.json", function(error, graph) {
//    var dataSet = [ ];	// 데이터를 저장할 배열을 준비
//    for(var i=0; i<data.length; i++){	// 데이터 줄 수만큼 반복
//        dataSet.push(data[i].sales[0]);	// sales의 최초 데이터만 추출
//    }

    graph.links.forEach(function(d) {
        console.log(d.source);
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });

    linksElements = d3.select("#myGraph").append("g")
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
        .attr("x1", function(d) { return d.source.x/valueScaling; })
        .attr("y1", function(d) { return d.source.y/valueScaling; })
        .attr("x2", function(d) { return d.target.x/valueScaling; })
        .attr("y2", function(d) { return d.target.y/valueScaling; })

     circleElements = d3.select("#myGraph").append("g")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")	// 데이터의 개수만큼 circle 요소가 추가됨
        .call(function(elements){elements.each(function replaceByValue(d,i){ //JSON data의 value scale 조
            var temp = d["x"];
            d["x"] = temp/valueScaling;
            var temp = d["y"];
            d["y"] = temp/valueScaling;
        })})
        //.call(function(elements){elements.each(function(d,i){console.log(xScale(d["x"]))})})
        .attr("class", "basic_nodes")	// CSS 클래스 지정
        .attr("cx", function (d) {
            return d["x"];
        })
        //.call(function(elements){elements.each(function(d,i){console.log(xScale(d["x"]))})})
        //.call(function(elements){elements.each(function(d,i){console.log(d)})})
        //.call(function(elements){elements.each(function(graph){console.log(graph)})})
        .attr("cy", function (graph) {
            return graph["y"];
        })
        .attr("r", 4)	// 반지름을 지정
        .on("click",function(){d3.select(this).style("stroke", "black")})
         .on('dblclick', connectedNodes); //Added code

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

    // fisheye module statr
    var fisheye = d3.fisheye.circular()
        .radius(40);

    var eye = d3.select("#myGraph").on("mousemove", function() {
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
    // fisheye module end


    //Toggle stores whether the highlighting is on
    var toggle = 0;
    //Create an array logging what is connected to what
    var linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
        linkedByIndex[i + "," + i] = 1;
    };
    graph.links.forEach(function (d) {
        console.log(d.source.id )
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
            circleElements.style("opacity", function (o) {
                return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
            });
            linksElements.style("opacity", function (o) {
                return d.id==o.source.id | d.id==o.target.id ? 1 : 0.1;
            });
            //Reduce the op
            toggle = 1;
        } else {
            //Put them back to opacity=1
            circleElements.style("opacity", 1);
            linksElements.style("opacity", 1);
            toggle = 0;
        }
    }


});