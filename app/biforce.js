function biforce(){


var data= nod
//console.log(data)

calcK(data);

function calcK(data) {
  data.forEach(function(d) {
  	d.total=d.a+d.b;
  	d.k=d.b/d.total;
  	d.r=(Math.sqrt(d.total)/Math.PI)*5
  });
}


var w = ($("#timeline").width()),
    h = 500,
    padding = 2,
    clipPadding = 4,
    fill = d3.scale.category10();
    

window.radius = d3.scale.sqrt().range([0, 12])
var vis = d3.select("#biforce").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

var force = d3.layout.force()
    .nodes(data)
    .links([]) 
    .charge(0)
    .gravity(0)
    .size([w, h])
    .start();
    
max=d3.max(data,function(d) {return d.r});

var scala=d3.scale.linear()
.range([5,50])
.domain([1,max]);

var node = vis.selectAll(".g-comp")
    .data(data)
    .enter().append("g")
    .attr("class", "g-comp")
    .on("click", function(d) {

		console.log(d.label)
		})
    .call(force.drag);
    
    var j1n=node.append("g")
    .attr("class", "g-j1");

    j1n.append("clipPath")
    .attr("id", function(d) { return "g-clip-j1-" + d.label; })
    .append("rect");
    
    j1n.append("circle")
    .attr("fill",function(d){ return cols[selected[1]] })
    .attr("fill-opacity", 0.75)
    
    
    var j2n=node.append("g")
    .attr("class", "g-j2");

    j2n.append("clipPath")
    .attr("id", function(d) { return "g-clip-j2-" + d.label; })
    .append("rect");
    
    j2n.append("circle")
    .attr("fill",function(d){ return cols[selected[0]] })
    .attr("fill-opacity", 0.75)
    
   
      
      
    node.selectAll("rect")
      .attr("y", function(d) { return d.y-d.r})
      .attr("height", function(d) { return 2 * d.r + 2 * clipPadding; });

  node.select(".g-j1 rect")
      .style("display", function(d) { return d.k > 0 ? null : "none" })
      .attr("x", function(d) { return d.x-d.r })
      .attr("width", function(d) { return 2 * d.r * d.k; });

  node.select(".g-j2 rect")
      .style("display", function(d) { return d.k < 1 ? null : "none" })
      .attr("x", function(d) { return d.x-d.r+d.r*d.k*2 })
      .attr("width", function(d) { return d.r*2*(1-d.k) });

  node.select(".g-j2 circle")
      .attr("clip-path", function(d) { return d.k < 1 ? "url(#g-clip-j1-" + d.label + ")" : null; });

  node.select(".g-j1 circle")
      .attr("clip-path", function(d) { return d.k > 0 ? "url(#g-clip-j2-" + d.label + ")" : null; });

  node.selectAll("circle")
	  .attr("cx", function(d) { return d.x; })
	  .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; });
      
      
  node
  //.filter(function(d) { return d.r > 10 })
  .append("text")
  .attr("font-size",function(d){
  	return 9+d.r/8;
  })
  .attr("dy",5)
  .attr("z-index",10)
  .attr("text-anchor", "middle")
  .text(function(d){return d.label});
  
  node.filter(function(d) { return d.r <= 10 })
  .selectAll("text")
  .attr("visibility","hidden");
  
   node.filter(function(d) { return d.r <= 10 })
  .on("mouseover", function(s){node.filter(function(t){return t.label==s.label}).select("text").attr("visibility", "visible");})
  .on("mouseout", function(s){node.filter(function(t){return t.label==s.label}).select("text").attr("visibility", "hidden");});
  
  
  // .append("svg:circle")
    // .attr("class", "node")
    // .attr("cx", function(d) { return d.x; })
    // .attr("cy", function(d) { return d.y; })
    // .attr("r", function(d) { return d.total; })
    // .style("fill", function(d, i) { return fill(i & 3); })
    // .style("stroke", function(d, i) { return d3.rgb(fill(i & 3)).darker(2); })
    // .style("stroke-width", 1.5)
    // .on("click", function(d) {
//     	
    	// var text = d3.select("svg")
    	// .append("text")
    	// .attr("font-family","Helvetica")
    	// .attr("font-size","12px")
    	// .attr("x", d.x)
		// .attr("y", d.y)
		// .text(d.label)
// 		
		// console.log(d.label)
    // })
    // .call(force.drag);

vis.style("opacity", 1e-6)
  .transition()
    .duration(1000)
    .style("opacity", 1);

force.on("tick", function(e) {

  // Push different nodes in different directions for clustering.
  var k = 0.1 * e.alpha;
  
  data.forEach(function(o, i) {
    o.y += (0.5*h-o.y)*k;
    o.x +=(((1-o.k)*w)+50*(Math.sqrt(o.b)/Math.PI-Math.sqrt(o.a)/Math.PI)-o.x)*k;
    //console.log(o.a/o.total)
  });

   node.each(collide(.5));
   
   d3.selectAll("circle")
   .attr("cx", function(d) { return d.x; })
   .attr("cy", function(d) { return d.y; });
   
   
   node.selectAll("rect")
   .attr("y", function(d) { return d.y-d.r});
   
   node.selectAll(".g-j1 rect")
      .attr("x", function(d) { return d.x-d.r });


  node.selectAll(".g-j2 rect")
      .attr("x", function(d) { return d.x-d.r+d.r*d.k*2 });
      
  node.select("text")
  .attr("x", function(d){return d.x})
  .attr("y", function(d){return d.y});

  
  
});

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
  	
    var r = d.r + radius.domain()[1] + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;

    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var xl = d.x - quad.point.x,
            yl = d.y - quad.point.y,
            l = Math.sqrt(xl * xl + yl * yl),
            //r = d.total + quad.point.total + padding;
            r = d.r + quad.point.r+padding;
            //console.log(l+"-"+r);
        if (l < r) {    
          l = (l - r) / l * alpha;
          d.x -= xl *= l;
          d.y -= yl *= l;
          quad.point.x += xl;
          quad.point.y += yl;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    });
  };
}

}
