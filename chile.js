var width = 960;
var height = 650;
var valueScaling = 5;
var offsetx = 100;
var offsety = 600;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id","mainsvg")
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

    d3.json("transition3.json", function(error, plotdata) {

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
            // nodeElements.style("opacity", 1).classed("selected",false);
            // linksElements.classed("selected",true);
            // toggle = 0;
            // oneclick = 0;
            remove_drawing()
            nodeElements.style("opacity", 1).classed("selected",false); // clear double-cick-connected
            linksElements.style("opacity", 1);  // clear double-cick-connected
            toggle = 0;                          // clear double-cick-connected
            oneclick = 0;                         // clear double-cick-connected
        });
    function remove_drawing(){
        d3.select("#node_tag").remove();
        d3.select("#region_tag").remove() // clear node_region
        d3.select("#province_tag").remove() // clear node_province
        d3.select("#type_tag").remove() // clear node_type
        // d3.select("svg").selectAll("path").remove(); // clear graph
        d3.select("#k_line").remove(); // clear graph
        // d3.selectAll(".tick").remove();
        // d3.selectAll(".axis").remove();

    }

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
        .attr("id",function (d) {return d["id"];})
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
            //Put them back to opacity=1
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            remove_drawing()
            toggle = 0;
            oneclick = 0;
        }

    }
    // ============ Toggle highlighting end
    //var selectednode=null;

    function clicked() {
        var tmp = d3.select(this);
        if (dblclick_timer) {
            clearTimeout(dblclick_timer);
            dblclick_timer = false;
            // double click code code comes here
            // console.log("double click fired")
        } else {

            dblclick_timer = setTimeout(function(){
                dblclick_timer = false;
                // single click code code comes here
                // console.log("one click fired");
                choice(tmp);
                console.log(tmp.node().__data__.communityconsistancy);
            }, 250)}
        };

    function choice(node){
        console.log(node.node().__data__.id)
        console.log("toggle: "+toggle)
        console.log("oneclick :"+oneclick)
        if (toggle == 1 && oneclick ==1) { //when connected-mode
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            toggle = 0;
            oneclick = 0;
            remove_drawing()
            // console.log("a");
        } else if (toggle == 0 && oneclick ==0){ // when select one while not connected, not selected
            //Put them back to opacity=1
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            node.classed("selected", true);
            deltagraph(node);
            toggle = 0;
            oneclick=1;
            // console.log("b");
        } else if (toggle == 0 && oneclick ==1 && node.style("fill") == "rgb(255, 0, 0)"){ //when selected, select 'selected'
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            node.classed("selected", false);
            oneclick = 0;
            remove_drawing()
            // console.log("c");
        } else { // when selected, select 'not-selected'
            nodeElements.style("opacity", 1).classed("selected",false);
            linksElements.style("opacity", 1);
            node.classed("selected", true);
            deltagraph(node);
            // console.log("d");
            toggle = 0;
            oneclick=1;
        }
    };

        var graphWidth = 320;	// SVG 요소의 넓이
        var graphHeight = 240;	// SVG 요소의 높이
        var dataSet = [];	// 데이터셋
        var windowoffsetx = 600
        var windowoffsety = 225

        var windowgraph = svg
            .append("rect")
            .attr("class", "background")
            .attr("x",500)
            .attr("y",90)
            .attr("width",graphWidth*1.5)
            .attr("height",graphHeight*1.5)
            .attr("fill","lightgrey")
            .style("opacity",0)
            .transition()
            .attr("x",600+graphWidth/20.)
            .attr("y",windowoffsety+graphHeight*0.1)
            .style("opacity",0.4)
            .attr("width",graphWidth-graphWidth/20.0)
            .attr("height",graphHeight*0.8);

        var legend_name=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",600)
            .attr("y",145)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Name: ");

        var legend_province=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",600)
            .attr("y",185)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Province: ");

        var legend_region=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",600)
            .attr("y",165)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Region: ");

        var legend_type=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",600)
            .attr("y",205)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Type: ");

        var legend_graph_title=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",600)
            .attr("y",240)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Basin stability transition");

        var title_bar=svg
            .append("rect")
            .attr("class", "background")
            .attr("x",0)
            .attr("y",0)
            .attr("width",width)
            .attr("height",50)
            .style("opacity",0.7)
            .attr("fill","darkslategray");

        var title=svg
            .append("text")
            .attr("class","spec_label")
            .style("fill","white")
            .attr("x",20)
            .attr("y",30)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",20)
            .style("opacity",1)
            .style("fill","white")
            .style("fill-opacity",1)
            .text("Synchronization Stability of Chilean Power Grid");

        var legend_node_circle=svg
            .append("circle")
            .attr("fill","orange")
            .attr("stroke","#fff")
            .attr("cx", 620)
            .attr("cy", 80)
            .attr("r", 40)
            .attr("opacity", 0)
            .transition()
            .attr("r", 6)
            .attr("opacity", 1);

        var legend_node_text=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",640)
            .attr("y",85)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Node: 420 ");

        var legend_link_line=svg
            .append("line")
            .style("stroke", "#666666")
            .attr("opacity", 0)
            .attr("x1", 605)
            .attr("y1", 100)
            .attr("x2", 635)
            .attr("y2", 100)
            .transition()
            .attr("opacity", 1);

        var legend_link_text=svg
            .append("text")
            .attr("class","spec_label")
            .attr("x",640)
            .attr("y",105)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",18)
            .style("opacity",1)
            .text("Edge: 573");

        var cc_color = d3.scale.linear()
            .domain([0.5, 1])
            .range(["white", "red"]);

        var cc_bar=svg
            .append("rect")
            .attr("class", "background")
            .attr("x",windowoffsetx)
            .attr("y",windowoffsety+graphHeight+50)
            .attr("width",70)
            .attr("height",20)
            .attr("rx",4)
            .attr("ry",4)
            .style("opacity",0.7)
            .attr("fill","darkslategray")
            .on("click",function(){
                // nodeElements.style("opacity", 1).style("fill",function(d){return cc_color(d.communityconsistancy);})
                nodeElements.style("opacity", 1).style("fill",function(d){return cc_color(d.communityconsistancy);})
                d = d3.selectAll(".nodes circle").node().__data__;

                // nodeElements.data(graph.nodes).enter()
                // d3.selectAll(".nodes circle").style("opacity", 1).classed("selected",false);
                // d3.selectAll(".nodes circle").style("fill",function(d) { return cc_color(d.communityconsistancy);})
                // d3.selectAll(".nodes circle").style("stroke","#888888")
                // nodeElements.style("opacity", 1).classed("selected",false)

            });

        var or_bar=svg
            .append("rect")
            .attr("class", "background")
            .attr("x",windowoffsetx)
            .attr("y",windowoffsety+graphHeight+20)
            .attr("width",70)
            .attr("height",20)
            .attr("rx",4)
            .attr("ry",4)
            .style("opacity",0.7)
            .attr("fill","darkslategray")
            .on("click",function(){
                nodeElements.classed("selected",false)
                // d3.selectAll(".nodes circle").style("opacity", 1).classed("selected",false)
                // d3.selectAll(".nodes circle").style("stroke","#fff")
            });

        var reference=svg.append("a")
            .append("text")
            .attr("class","spec_label")
            .attr("x",width-260)
            .attr("y",height-10)
            .style("opacity",0)
            .style("font-size",40)
            .transition()
            .style("font-size",12)
            .style("opacity",1)
            .style("fill-opacity",0.8)
            .text("Reference: New J. Phys. 16(12)125001, 2014");
            // .on("click", function() { window.open("http://iopscience.iop.org/article/10.1088/1367-2630/17/11/113005"); });

        function deltagraph (node){
            pickupdata(dataSet,node.node().__data__.id)
            d3.select("#node_tag").remove() // clear node_name
            d3.select("#region_tag").remove() // clear node_region
            d3.select("#province_tag").remove() // clear node_province
            d3.select("#type_tag").remove()
            text_name(node);
        };

        function text_name(node) {
            // var name=node.node().__data__.name;
            // var region=node.node().__data__.name
            var name_tag=svg.append("text")
                .attr("id","node_tag")
                .text(node.node().__data__.name)
                .attr("x",660)
                .attr("y",145)
                .attr("class","spec_label")
                .style("fill","#dc143c")
                .attr("opacity",1);

            var region_tag=svg.append("text")
                .attr("id","region_tag")
                .text(node.node().__data__.region)
                .attr("x",670)
                .attr("y",165)
                .attr("class","spec_label")
                .style("fill","#dc143c")
                .attr("opacity",1);

            var province_tag=svg.append("text")
                .attr("id","province_tag")
                .text(node.node().__data__.province)
                .attr("x",685)
                .attr("y",185)
                .attr("class","spec_label")
                .style("fill","#dc143c")
                .attr("opacity",1);

            var type_tag=svg.append("text")
                .attr("id","type_tag")
                .text(node.node().__data__.kind)
                .attr("x",655)
                .attr("y",205)
                .attr("class","spec_label")
                .style("fill","#dc143c")
                .attr("opacity",1);
        };

        //draw axis
        function draw_axis() {
            var x = d3.scale.linear()
                .domain([0, 20.0])
                .range([windowoffsetx + graphWidth / 20.0, windowoffsetx + graphWidth]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(10);

            svg.append("g")
                .call(xAxis)
                .attr("class", "axis")
                .attr("fill", "#888888")
                .attr("transform", "translate(0," + (windowoffsety + graphHeight * 0.9) + ")");

            var y = d3.scale.linear()
                .domain([0, 1])
                .range([0, -graphHeight * 0.8]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(1);

            svg.append("g")
                .call(yAxis)
                .attr("class", "axis")
                .attr("fill", "#888888")
                .attr("transform", "translate(" + (windowoffsetx + graphWidth / 20.0) + "," + (windowoffsety + graphHeight * 0.9) + ")");
        };
        draw_axis();

        var nulldata=null
        var path_var=0;

        function pickupdata(dataSet,id){
            var dataSet = [];
            var nulldata=[];
            plotpoint=plotdata[id].length;
            for (var i=0; i<plotpoint; i++) {	// 최초의 데이터만 처리
                dataSet.push([plotdata[id][i]["x"],plotdata[id][i]["y"]]);	// 가로 한 줄 모두를 한꺼번에 넣음
                nulldata.push([plotdata[id][i]["x"],0]);
            }
            d3.select("svg").selectAll("#k_line").remove();
            // d3.selectAll(".tick").remove();
            drawGraph(dataSet,nulldata,id);
        };

// 꺾은선 그래프의 좌표를 계산하는 메서드
        function drawGraph(dataSet,nulldata,nodeid) {
            var delta_k = d3.svg.line()	// svg의 선
                .x(function (d, i) {
                    return (d[0]+1)*graphWidth/21.0 + windowoffsetx;	// X 좌표는 표시 순서×간격
                })
                .y(function (d, i) {
                    return graphHeight*0.9 - (d[1]*0.8*graphHeight)+windowoffsety;	// 데이터로부터 Y 좌표 빼기
                })


            // 꺾은선 그래프 그리기
            var lineElements = svg.append("path")
                .attr("class", "line")
                .attr("id","k_line")
                .style("opacity",0)
               .attr("transform", "translate(0,0)") // for pop-up animation
               .attr("d", delta_k(nulldata)) // for pop-up animation
                .transition()
                .style("opacity",1)
                .attr("d", delta_k(dataSet))
                .style("fill","#666666") //#dc143c
                .style("stroke","#888888");

            // draw_axis()

        };
    })
});