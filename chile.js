var width = 960;
var height = 650;
var valueScaling = 5;
var offsetx = 100;
var offsety = 600;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.behavior.zoom().scaleExtent([0.4, 8]).on("zoom", zoomed)).on("dblclick.zoom", null)
    .append("g");

var container = svg.append("g");

function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    //d3.select(this).classed("selected", true);
}

function dragended(d) {
    //d3.select(this).classed("selected", false);
}

var dblclick_timer = false;

d3.json("graph.json", function(error, graph) {

    graph.nodes.forEach(function (d) { // nodes coordinate scaling
        d.x = (d.x / valueScaling)+offsetx;
        d.y = height-(d.y / valueScaling)+offsety;
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
    var background = container
        .append("rect")
        .attr("class", "background")
        .attr("x",0)
        .attr("y",0)
        .attr("width",width)
        .attr("height",height)
        .attr("fill","white")
        .on("click",function(){
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.classed("selected",true);
            toggle = 0;
            oneclick = 0;
        });


    var linksElements = container.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .style("stroke", "#999")
        .attr("opacity", 0)
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
        .attr("r", 40)
        .attr("opacity", 0)
        .on("click", clicked)
        .call(d3.behavior.drag()
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended))
        .on('dblclick', connectedNodes); //Added code for toggle highlight

    nodeElements.transition().duration(400).attr("r",4).attr("opacity", 1);
    linksElements.transition().duration(400).attr("opacity", 1);

    // ============ fisheye module start
    //var fisheye = d3.fisheye.circular()
    //    .radius(100);
    //
    //var eye = svg.on("mousemove", function() {
    //    fisheye.focus(d3.mouse(this));
    //    d3.select("circle").each(function(d) { d.fisheye = fisheye(d); })
    //        .attr("cx", function(d) { return d.fisheye.x; })
    //        .attr("cy", function(d) { return d.fisheye.y; })
    //        .attr("r", function(d) { return d.fisheye.z * 4; });
    //    linksElements
    //        .attr("x1", function(d) { return d.source.fisheye.x; })
    //        .attr("y1", function(d) { return d.source.fisheye.y; })
    //        .attr("x2", function(d) { return d.target.fisheye.x; })
    //        .attr("y2", function(d) { return d.target.fisheye.y; });
    //})
    // ============ fisheye module end

    // ============ Toggle highlighting start+ .on('dblclick', connectedNodes);
    var toggle = 0;
    var oneclick = 0;
    //Create an array logging what is connected to what
    var linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
        linkedByIndex[i + "," + i] = 1; // <==== self link
    };

    graph.links.forEach(function (d) {
        linkedByIndex[d.source.id + "," + d.target.id] = 1; // <=== edge list
    });
    //This function looks up whether a pair are neighbours
    function neighboring(a, b) {
        return linkedByIndex[a.id + "," + b.id];
    }

    function connectedNodes() {
        //nodeElements.classed("selected",false);
        if (toggle == 0) {
            console.log("connected ok")
            //Reduce the opacity of all but the neighbouring nodes
            d = d3.select(this).node().__data__;
            nodeElements.style("opacity", function (o) {
                return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
            })
            nodeElements.classed("selected", false);
            linksElements.style("opacity", function (o) {
                return d.id == o.source.id | d.id == o.target.id ? 1 : 0.1;
            });
            //Reduce the op
            d3.select(this).classed("selected", true);
            toggle = 1;
            oneclick = 1;
        } else {
            console.log("connected end")
            //Put them back to opacity=1
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            toggle = 0;
            oneclick = 0;
        }

    }
    // ============ Toggle highlighting end
    //var selectednode=null;

//    function clicked() {
//        //selectednode=d3.select(this)
//        if (dblclick_timer) {
//            clearTimeout(dblclick_timer)
//            dblclick_timer = false
//            // double click code code comes here
//            console.log("double click fired")
//        } else {
//            dblclick_timer = setTimeout(function(){
//                dblclick_timer = false
//                // single click code code comes here
//                console.log("one click fired");
//            }, 250)
//            if (toggle == 1 && oneclick ==1) {
//                nodeElements.style("opacity", 1).classed("selected",false);
//                linksElements.style("opacity", 1);
//                toggle = 0;
//                oneclick = 0;
//            } else if (toggle == 0 && oneclick ==0){
//                //Put them back to opacity=1
//                nodeElements.style("opacity", 1).classed("selected",false);
//                linksElements.style("opacity", 1);
//                d3.select(this).classed("selected", true);
//                toggle = 0;
//                oneclick=1;
//            } else if (toggle == 0 && oneclick ==1 && d3.select(this).style("opacity") ==1){
//                nodeElements.style("opacity", 1).classed("selected",false);
//                linksElements.style("opacity", 1);
//                d3.select(this).classed("selected", false);
//                oneclick = 0;
//            } else {
//                nodeElements.style("opacity", 1).classed("selected",false);
//                linksElements.style("opacity", 1);
//                d3.select(this).classed("selected", true);
//                toggle = 0;
//                oneclick=1;
//            }
//            //Reduce the op
//
//        }
//    }

    function clicked() {
        if (dblclick_timer) {
            clearTimeout(dblclick_timer)
            dblclick_timer = false
            // double click code code comes here
            console.log("double click fired")
        } else {
            dblclick_timer = setTimeout(function(){
                dblclick_timer = false
                // single click code code comes here
                console.log("one click fired");
            }, 250)}
        d3.select(this).attr("r",40)
        }

    var windowgraph = svg
        .append("rect")
        .attr("class", "background")
        .attr("x",600)
        .attr("y",100)
        .attr("width",320)
        .attr("height",240)
        .attr("fill","red");

    d3.json("transition.json", function(error, plotdata) {
        var svgWidth = 320;	// SVG 요소의 넓이
        var svgHeight = 240;	// SVG 요소의 높이
        var dataSet = [10, 47, 65, 8, 64, 99, 75, 22, 63, 80];	// 데이터셋
//        var margin = svgWidth / (dataSet.length - 1);	// 꺾은선 그래프의 간격 계산
        var windowoffsetx = 600
        var windowoffsety = 100


//        var margin = svgWidth/(plotpoint - 1);	// 꺾은선 그래프의 간격 계산

        nodeElements.on("click", function(){
            pickupdata(dataSet,d3.select(this).node().__data__.id)
//            drawGraph(dataSet,d3.select(this).node().__data__.id)

        });
//        console.log(plotdata[20])
//        console.log(plotdata[20][2])
//
//        console.log(plotdata[20][2]["x"])
        function pickupdata(dataSet,id){
            var dataSet = [];
            console.log(id);
            plotpoint=plotdata[id].length;
//        console.log(plotdata[20][2])
            for (var i=0; i<plotpoint; i++) {	// 최초의 데이터만 처리
                dataSet.push([plotdata[id][i]["x"],plotdata[id][i]["y"]]);	// 가로 한 줄 모두를 한꺼번에 넣음
            }
                    console.log(dataSet);
            drawGraph(dataSet,id);
        };

// 꺾은선 그래프의 좌표를 계산하는 메서드

        function drawGraph(dataSet,nodeid) {
            console.log("graph draw")
            console.log(dataSet[0])
            var margin = svgWidth / (dataSet.length - 1);
            var delta_k = d3.svg.line()	// svg의 선
                .x(function (d, i) {
                    return d[0]*svgHeight/19.9 + windowoffsetx;	// X 좌표는 표시 순서×간격
                })
                .y(function (d, i) {
                    return svgHeight - (d[1]*svgHeight)+windowoffsety;	// 데이터로부터 Y 좌표 빼기
                })

                // 꺾은선 그래프 그리기
            var lineElements = svg.append("path")
                .attr("class", "line")// 데이터 수만큼 path 요소가 추가됨
                .attr("d", delta_k(dataSet))	//연속선 지정

//            svg.selectAll(delta_k).remove();
        };

//
//        var line = d3.svg.line()	// svg의 선
//            .x(function(d, i){
//                return d.x*100;	// X 좌표는 표시 순서×간격
//            })
//            .y(function(d, i){
//                return d.y*100;	// 데이터로부터 Y 좌표 빼기
//            })
//
//// 꺾은선 그래프 그리기
//        var lineElements = d3.svg
//            .append("path")	// 데이터 수만큼 path 요소가 추가됨
//            .attr("class", "line")	// CSS 클래스 지정
//            .attr("d", line(dataSet))

    })


});