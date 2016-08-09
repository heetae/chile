var width = 960;
var height = 650;
var valueScaling = 5;
var offsetx = 100;
var offsety = 600;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id","#mainsvg")
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

d3.json("graph_info.json", function(error, graph) {

    d3.json("transition.json", function(error, plotdata) {

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
            d3.select("svg").selectAll("path").remove(); // clear graph
            nodeElements.style("opacity", 1).classed("selected",false); // clear double-cick-connected
            linksElements.style("opacity", 1);  // clear double-cick-connected
            toggle = 0;                          // clear double-cick-connected
            oneclick = 0;                         // clear double-cick-connected
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

            var tmp = d3.select(this);
            deltagraph(tmp);
            toggle = 1;
            oneclick = 1;
        } else {
            console.log("connected end")
            //Put them back to opacity=1
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            d3.select("svg").selectAll("path").remove(); // clear graph
            toggle = 0;
            oneclick = 0;
        }

    }
    // ============ Toggle highlighting end
    //var selectednode=null;

    function clicked() {
        var tmp = d3.select(this);
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
                choice(tmp)
            }, 250)}
        }

        function choice(node){
            // kd=node.node().__data__;
            console.log(node.style("fill"))
            if (toggle == 1 && oneclick ==1) { //when connected-mode
                nodeElements.style("opacity", 1).classed("selected",false);
                linksElements.style("opacity", 1);
                toggle = 0;
                oneclick = 0;
                d3.select("svg").selectAll("path").remove(); // clear graph
                console.log("a");
            } else if (toggle == 0 && oneclick ==0){ // when select one while not connected, not selected
                //Put them back to opacity=1
                nodeElements.style("opacity", 1).classed("selected",false);
                linksElements.style("opacity", 1);
                node.classed("selected", true);
                deltagraph(node);
                toggle = 0;
                oneclick=1;
                console.log("b");
                // console.log(kd.name);
            } else if (toggle == 0 && oneclick ==1 && node.style("fill") == "rgb(255, 0, 0)"){ //when selected, select 'selected'
                nodeElements.style("opacity", 1).classed("selected",false);
                linksElements.style("opacity", 1);
                node.classed("selected", false);
                oneclick = 0;
                d3.select("svg").selectAll("path").remove(); // clear graph
                console.log("c");
            } else { // when selected, select 'not-selected'
                nodeElements.style("opacity", 1).classed("selected",false);
                linksElements.style("opacity", 1);
                node.classed("selected", true);
                deltagraph(node);
                console.log("d");
                toggle = 0;
                oneclick=1;
            }
        }

        var graphWidth = 320;	// SVG 요소의 넓이
        var graphHeight = 240;	// SVG 요소의 높이
        var dataSet = [];	// 데이터셋
        var windowoffsetx = 600
        var windowoffsety = 100

    var windowgraph = svg
        .append("rect")
        .attr("class", "background")
        .attr("x",500)
        .attr("y",80)
        .attr("width",graphWidth*1.5)
        .attr("height",graphHeight*1.5)
        .attr("fill","orange")
        .style("opacity",0)
        .transition()
        .attr("x",600)
        .attr("y",100)
        .style("opacity",1)
        .attr("width",graphWidth)
        .attr("height",graphHeight);


//        function deltagraph (node){
//            pickupdata(dataSet,node.node().__data__.id)
//            drawGraph(dataSet,node.node().__data__.id)
//        };
//        var path_var=0;
//        function pickupdata(dataSet,id){
//            var dataSet = [];
//            plotpoint=plotdata[id].length;
//            for (var i=0; i<plotpoint; i++) {	// 최초의 데이터만 처리
//                dataSet.push([plotdata[id][i]["x"],plotdata[id][i]["y"]]);	// 가로 한 줄 모두를 한꺼번에 넣음
//            }
//            console.log(dataSet)
//            d3.select("svg").selectAll("path").remove();
//            drawGraph(dataSet,id);
//        };

        function deltagraph (node){
            pickupdata(dataSet,node.node().__data__.id)
            drawGraph(dataSet,node.node().__data__.id)
            text_name(dataSet,node.node().__data__.name)
            // console.log(node.node().__data__.name)
        };

        function text_name(dataSet,name) {
            console.log("text name")
            console.log(name)
        }
        var nulldata=null
        var path_var=0;
        function pickupdata(dataSet,id){
            var dataSet = [];
            var nulldata=[];
//            var olddata=dataSet.length
            plotpoint=plotdata[id].length;
            for (var i=0; i<plotpoint; i++) {	// 최초의 데이터만 처리
                dataSet.push([plotdata[id][i]["x"],plotdata[id][i]["y"]]);	// 가로 한 줄 모두를 한꺼번에 넣음
                nulldata.push([plotdata[id][i]["x"],0]);
            }
//            dataSet.shift(olddata)
//            console.log(id)
            d3.select("svg").selectAll("path").remove();
            drawGraph(dataSet,nulldata,id);
        };

// 꺾은선 그래프의 좌표를 계산하는 메서드

        function drawGraph(dataSet,nulldata,nodeid) {
            var delta_k = d3.svg.line()	// svg의 선
                .x(function (d, i) {
                    return d[0]*graphWidth/19.9 + windowoffsetx;	// X 좌표는 표시 순서×간격
                })
                .y(function (d, i) {
                    return graphHeight*0.9 - (d[1]*0.8*graphHeight)+windowoffsety;	// 데이터로부터 Y 좌표 빼기
                })


            // 꺾은선 그래프 그리기
            var lineElements = svg.append("path")
                .attr("class", "line")
                .attr("id","#k_line")
                .style("opacity",0)
//                .attr("transform", "translate(0,0)")
//                .attr("d", delta_k(nulldata))
                .transition()
                .style("opacity",1)
                .attr("d", delta_k(dataSet));
        };
    })
});