d3.tsv("data/geomedia.csv", function(data){
d3.json("data/world.json", function(geojson){

  var world = topojson.feature(geojson, geojson.objects.world_fixed)

  console.log(world)

  // Various formatters.
  var formatDate = d3.time.format("%d/%m/%Y");

  // A nest operator, for grouping the links list.
  var nestByDate = d3.nest()
      .key(function(d) { return d3.time.day(d.date); });

  data.forEach(function(d, i) {
    d.date = formatDate.parse(d['end_date'])
    d.weight = parseFloat(d.weight)
  });

  // Create the crossfilter for the relevant dimensions and groups.
  var links = crossfilter(data),
      all = links.groupAll(),
      date = links.dimension(function(d) { return d.date; }),
      dates = date.group(d3.time.day),
      journal = links.dimension(function(d) { return d.journal; }),
      journals = journal.group(),
      article = links.dimension(function(d) { return d.id_article }),
      articles = article.group(),
      source = links.dimension(function(d) { return d.source}),
      sources = source.group(),
      target = links.dimension(function(d) { return d.target}),
      targets = target.group(),
      weight = links.dimension(function(d) { return (Math.round(d.weight * 100)/100)}),
      weights = weight.group();

      
      
      //journal.filterFunction(function(d){return d == "mo"})


      //var mo = date.group(d3.time.day).reduceSum(function(d){return d.journal=="mo"?1:0;});
      //var ti = date.group(d3.time.day).reduceSum(function(d){return d.journal=="ti"?1:0;});
      //var ft = date.group(d3.time.day).reduceSum(function(d){return d.journal=="ft"?1:0;});
      //var wp = date.group(d3.time.day).reduceSum(function(d){return d.journal=="wp"?1:0;});

      //var mog = article.group().reduceSum(function(d){return d.journal=="mo"?1:0;});
      //var tig = source.group().reduceSum(function(d){return d.journal=="ti"?1:0;});
      //var ftg = source.group().reduceSum(function(d){return d.journal=="ft"?1:0;});
      //var wpg = source.group().reduceSum(function(d){return d.journal=="wp"?1:0;});

        
      //journal name

      function getJournalName(key){

          var val;
        switch(key)
        {
          case 'ft' :
            val="Financial Times"
            break;
          case 'mo' :
            val="Le Monde"
            break;
          case 'ti' :
            val="Times of India"
            break;
          case 'wp':
            val="Washington Post"
            break;
          }

        return val
      }

        //inizialize dropdown

        d3.select('#j1').selectAll('option')
        .data(journals.all())
        .enter()
        .append('option')
        .attr('value', function(d){return d.key})
        .text(function(d){return getJournalName(d.key)})
        
        d3.select('#j1').on('change', function(d){
            
            fv =this.value;

            journal.filterFunction(function(d){return d == fv})
            dc.redrawAll();

            updateMap(worldState)

            })



      function reduceAddDate(p, v) {

        ++p.links;

        if (p.articles.indexOf(v.id_article) == -1){
          p.articles.push(v.id_article);
          p.count = p.articles.length
          if(p.journals[v.journal] == undefined){
          p.journals[v.journal] = 1
          }else{
              p.journals[v.journal] = p.journals[v.journal] + 1
          }
        }


        return p;
      }

      function reduceRemoveDate(p, v) {

         --p.links;

        if (p.articles.indexOf(v.id_article) != -1){
          p.articles.splice(p.articles.indexOf(v.id_article), 1);
          p.count = p.articles.length
          if(p.journals[v.journal] == undefined){
          p.journals[v.journal] = 0
          }else{
              p.journals[v.journal] = p.journals[v.journal] - 1
          }
        }

        return p;
      }

      function reduceInitialDate() {
        return {links: 0, articles: [], count: 0, journals:{}};
      }




 var dates = date.group(d3.time.day).reduce(reduceAddDate, reduceRemoveDate, reduceInitialDate)

//console.log(dates.all())
      function reduceAdd(p, v) {

        if (p.country.indexOf(v.source) == -1){
        ++p.count;
        p.country.push(v.source);
        p.journal = v.journal;
        p.weight = 1/p.country.length;
        }
        return p;
      }

      function reduceRemove(p, v) {

        if (p.country.indexOf(v.source) != -1){
        --p.count;
        p.country.splice(p.country.indexOf(v.source), 1);
        p.journal = v.journal;
        p.weight = 1/p.country.length;
      }
        return p;
      }

      function reduceInitial() {
        return {count: 0, country: [], journal:"", weight: 0};
      }

   var graphData = article.group().reduce(reduceAdd, reduceRemove, reduceInitial)
 

  var stacked = d3.entries(dates.top(1)[0].value.journals)


  var dateBc = dc.barChart("#timeline")
    .width($("#timeline").width())
    .height(100)
    .margins({top: 10, right: 5, bottom: 30, left: 25})
    .dimension(date)
    .group(dates)
    .elasticY(true)
    .valueAccessor(function(p) { return p.value.journals[stacked[0].key]; })
    .x(d3.time.scale().domain([new Date(2012, 0, 1), new Date(2012, 11, 31)]))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .gap(1)
    .brushOn(true)
    .on("filtered", function(chart, filter){
       stacked.forEach(function(d,i){

              // initG(d.key, "#graph_" + (i+1));
            })
       updateMap(worldState)
    })

    var colors = ["#507984","#8B2A2F","#ECAA3E","#AFC9BB"];
    var cols = {};

    stacked.forEach(function(d,i){
      cols[d.key] = colors[i];
      if (i >0){
        dateBc.stack(dates, function(p) { return p.value.journals[d.key]; })
      }
    })

   dc.renderAll();

    var fv = $("#j1").val();

    journal.filterFunction(function(d){return d == fv})
    dc.redrawAll();




  var dataNodes = graphData.all()//.filter(function(d){return d.value.journal == "mo"})

  var nodes = {};

  dataNodes.forEach(function(d){
      d.value.country.forEach(function(f){

            if(nodes[f]){
            nodes[f].size = nodes[f].size +1
            
          }else{
              nodes[f] = {"size": 1}
          }
        
        })
      })

  var nodeMin = d3.min(d3.entries(nodes), function(d){return d.value.size}),
    nodeMax = d3.max(d3.entries(nodes), function(d){return d.value.size})

  var scaleOpacity = d3.scale.log().domain([nodeMin, nodeMax]).range([0,1])


  function getOpacity(iso_a3){
      if(nodes[iso_a3]){
        var opacity = scaleOpacity(nodes[iso_a3].size);
        return opacity;
      }
      else{
        return 0;
      }
  }

function getCitation(iso_a3){
      if(nodes[iso_a3]){
        
        return nodes[iso_a3].size;
      }
      else{
        return 0;
      }
  }
//start map

   var map = L.map('map',{
        center : [30,0],
        zoom : 2,
        minZoom :2,
        maxZoom: 8 
    })//.setView([0, 0], 2);


    var info = L.control();

    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML = '<h4>State resonance</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + getCitation(props.iso_a3) + ' citations'
        : 'Hover over a state');
    };

    info.addTo(map);

    function style(feature) {
      return {
        weight: 1,
        opacity: 1,
        color: '#ccc',
        dashArray: '3,3',
        fillOpacity: getOpacity(feature.properties.iso_a3),
        //fillColor: "#b94a48"
        fillColor: cols[fv]
      };
    }

    function highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        weight: 1,
        color: 'white',
        dashArray: '',
        //fillOpacity: 0.7
      });

      if (!L.Browser.ie) {
        layer.bringToFront();
      }

      info.update(layer.feature.properties);
    }


    function resetHighlight(e) {
      worldState.resetStyle(e.target);
      info.update();
    }

    function zoomToFeature(e) {
      map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    }

    var worldState = L.geoJson(world, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    function updateMap(geojson){

        dataNodes = graphData.all()//.filter(function(d){return d.value.journal == "ti"})

        nodes = {};

  dataNodes.forEach(function(d){
      d.value.country.forEach(function(f){

            if(nodes[f]){
            nodes[f].size = nodes[f].size +1
            
          }else{
              nodes[f] = {"size": 1}
          }
        
        })
      })

 nodeMin = d3.min(d3.entries(nodes), function(d){return d.value.size});
  nodeMax = d3.max(d3.entries(nodes), function(d){return d.value.size});

  scaleOpacity.domain([nodeMin, nodeMax])


worldState.eachLayer(function (layer) {
     var id = layer._leaflet_id;
      map._layers[id].setStyle(style(layer.feature));
});

    }

//end map


//start state sort

//var scale = 250,
    //R = 6371,
    //projection = d3.geo.stereographic().translate([0, 0]).scale(scale).clipAngle(180),
    //projection = d3.geo.mercator().translate([0, 0]).scale(scale)//.clipAngle(180),
    //path = d3.geo.path().projection(projection),
    //format = d3.format(",.0f");
    //tooltip = d3.select("body").append("div").attr("class", "tooltip"),
    //category = d3.scale.category10();

// queue()
//     .defer(d3.json, "../world-110m.json?20130322")
//     .defer(d3.csv, "codes.csv")
//     .defer(d3.csv, "areas.csv?20130401")
//     .defer(d3.tsv, "world-country-names.tsv")
//     .defer(d3.csv, "continents.csv")
//     .await(function(error, world, codes, areas, names, continents) {
//       var nameById = {},
//           areaById = {},
//           idByAlpha = {},
//           continentById = {};
//       continents.forEach(function(d) {
//         continentById[d.id] = d.continent;
//       });
//       names.forEach(function(d) {
//         nameById[d.id] = d.name;
//       });
//       codes.forEach(function(d) {
//         idByAlpha[d.a3] = d.n3;
//       });
//       areas.forEach(function(d) {
//         areaById[idByAlpha[d.code]] = +d.area;
//       });
      // var svg = d3.select('#list').selectAll("svg")
      //     .data(world.features)
      //   .enter().append("svg")
      //     .each(function(d) {
      //       d.area = d3.geo.area(d);
      //       d.citations = getCitation(d.properties['iso_a3'])
      //       if (d.citations > 0){
      //       var svg = d3.select(this),
      //           b = d3.geo.bounds(d),
      //           centroid = b[0][0] === -180 && b[1][0] === 180
      //             ? [100, .5 * (b[0][1] + b[1][1])] // Russia
      //             : [.5 * (b[0][0] + b[1][0]), .5 * (b[0][1] + b[1][1])];
      //       projection.rotate(Math.abs(b[0][1]) === -90 ? [0, 90] : Math.abs(b[1][1]) === 90 ? [0, -90] : [-centroid[0], -centroid[1]]);
      //       var bounds = path.bounds(d),
      //           area = path.area(d),
      //           s = Math.sqrt(d.area / area) * scale,
      //           dx = bounds[1][0] - bounds[0][0],
      //           dy = bounds[1][1] - bounds[0][1];
      //       svg 
      //           .attr("width", dx * s + 20)
      //           .attr("height", dy * s + 20)
      //         .append("g")
      //           .attr("transform", "scale(" + s + ")translate(" + [10 - bounds[0][0], 10 - bounds[0][1]] + ")")
      //         .append("path")
      //           //.style("fill", category(continentById[d.id]))
      //           .style("fill", "gray")
      //           .attr("d", path);
      //         }
      //     })
      //     .sort(function(a, b) { return b.citations - a.citations; })
          // .on("mouseover", function(d, i) {
          //   var t = tooltip.html("").style("display", "block");
          //   t.append("span").attr("class", "country").text(nameById[d.id]);
          //   t.append("span").text(": " + format(d.area * R * R) + " km").append("sup").text("2");
          //   t.append("span").text("; ranked " + ++i).append("sup").text(ordinal(i));
          //   t.append("span").text("; " + continentById[d.id]);
          //   t.append("span").text(".");
          // })
          // .on("mouseout", function() {
          //   tooltip.style("display", null);
          // });
    //});

function ordinal(d) {
  var e = d % 100;
  return ["st", "nd", "rd", "th"][3 < e && e < 21 ? 3 : Math.min(d % 10 - 1, 3)];
}



//end state sort

  stacked.forEach(function(d,i){

               //initG(d.key, "#graph_" + (i+1));
    })



   function initG(journal, target){

  var data = graphData.all().filter(function(d){return d.value.journal == journal && d.value.count > 1})

  var nodes = {};
  var edges = []

  data.forEach(function(d){
      d.value.country.forEach(function(f){

            if(nodes[f]){
            nodes[f].size = nodes[f].size +1
            
          }else{
              nodes[f] = {"size": 1}
          }
        
        })
      })


      
    data.forEach(function(d){
      var weight = d.value.weight;
      var length =  d.value.country.length-1;
      d.value.country.forEach(function(f,i){

            
              
              for (var e = i+1; e <= length; e++) {
              var edge = {"source": f, "target":d.value.country[e], "weight":weight, "g": f + "," + d.value.country[e]}
              edges.push(edge)
  
            }
        
        })
      })
  
    var allEdges = crossfilter(edges),
    allE = allEdges.groupAll(),
    edge = allEdges.dimension(function(d) { return d.g; }),
    edgeF = edge.group().reduceSum(function(d){return d.weight})



 //   nodes = source.group().top(Infinity)

 //   edges = source.top(Infinity)
$(target + " .sigma").empty();

	var graph = sven.viz.graph()
			.target(target + " .sigma")
			//.id(function(d){ return d.id ? d.id : d; })
			//.label(function(d){ return d.name ? d.name : d; })
			.init();

	// 	nodes
		// d3.entries(nodes).forEach(function(d){
		// 	d.id = d.key;
		// 	d.name = d.key;
		// 	d.size = d.value.size;
		// 	graph.addNode(d)
		// })

	// 	// edges

	// 	var min = d3.min(edges.map(function(d){ return d.value })),
	// 		max = d3.max(edges.map(function(d){ return d.value })),
	// 		weight = d3.scale.linear().domain([min,max]).range([1,10])

	// var scale = d3.scale.ordinal().domain(jx).range(["#1A9641", "#A6D96A", "#FFFFBF", "#FDAE61"])

    edgeF.all().forEach(function(d){
      if (d.value >= 1){
        var source = d.key.split(",")[0],
          target = d.key.split(",")[1];

          var node = {"id": source, "name": source, "size": nodes[source].size}
          graph.addNode(node)
          node = {"id": target, "name": target, "size": nodes[target].size}
          graph.addNode(node)
			graph.addEdge(source,target,{ weight : d.value, size: d.value, color:"rgba(165,165,165,0.75)"})

    }
    graph.getNodes();
		})


    $(target + ' .zoomIn').click(function(){graph.zoomIn()})
    $(target + ' .zoomOut').click(function(){graph.zoomOut()})
    $(target + ' .zoomCenter').click(function(){graph.center()})
        $(target + ' .stopFA').click(function(){graph.stop()})
    $(target + ' .startFA').click(function(){graph.start()})


	}
});
});