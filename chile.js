/**
 * Created by heetae on 3/25/15.
 */
var width = 960;
var height = 650;

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

    var circleElements = d3.select("#myGraph").append("g")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")	// 데이터의 개수만큼 circle 요소가 추가됨
        .attr("class", "basic_nodes")	// CSS 클래스 지정
        .attr("cx", function (d) {
            return d["x"]/5;	// 최초 요소를 X 좌표로 함
        })
        .call(function(elements){elements.each(function(d,i){console.log(xScale(d["x"]))})})
        .attr("cy", function (graph) {
            return graph["y"]/5;	// 2번째의 요소를 Y 좌표로 함
        })
        .attr("r", 4)	// 반지름을 지정
        .on("click",function(){d3.select(this).style("stroke", "black")})


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
    var fisheye = d3.fisheye.circular()
        .radius(40);
    var eye = d3.select("#myGraph").on("mousemove", function() {
        fisheye.focus(d3.mouse(this));
        d3.selectAll("circle").each(function(d) { d.fisheye = fisheye(d); })
            .attr("cx", function(d) { return d.fisheye.x; })
            .attr("cy", function(d) { return d.fisheye.y; })
            .attr("r", function(d) { return d.fisheye.z * 4; });
//        link.attr("x1", function(d) { return d.source.fisheye.x; })
//            .attr("y1", function(d) { return d.source.fisheye.y; })
//            .attr("x2", function(d) { return d.target.fisheye.x; })
//            .attr("y2", function(d) { return d.target.fisheye.y; });
    })




});