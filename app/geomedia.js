d3.tsv("data/geomedia.csv", function(data){

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

      
      var selected = ["mo", "ti", "ft", "wp"];
      
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
        .filter(function(d){return d.key == selected[0]})
        .attr('selected', 'selected')
        
        d3.select('#j1').on('change', function(d){
            
            selected[0] = this.value
            journal.filterFunction(function(d){return d == selected[0] || d == selected[1]})
            dc.redrawAll()


            selected.forEach(function(d,i){

               initG(d, "#graph_" + (i+1));
            })

            })

        d3.select('#j2').selectAll('option')
        .data(journals.all())
        .enter()
        .append('option')
        .attr('value', function(d){return d.key})
        .text(function(d){return getJournalName(d.key)})
        .filter(function(d){return d.key == selected[1]})
        .attr('selected', 'selected')
               
        d3.select('#j2').on('change', function(d){
           
            selected[1] = this.value;
            journal.filterFunction(function(d){return d == selected[0] || d == selected[1]})
            dateBc.redraw()


            selected.forEach(function(d,i){

               initG(d, "#graph_" + (i+1));
            })

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
    .height(120)
    .margins({top: 10, right: 5, bottom: 30, left: 25})
    .dimension(date)
    .group(dates)
    .valueAccessor(function(p) { return p.value.journals[stacked[0].key]; })
    .elasticY(true)
    .x(d3.time.scale().domain([new Date(2012, 0, 1), new Date(2012, 11, 31)]))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .gap(1)
    .brushOn(true)
    .on("filtered", function(chart, filter){
       selected.forEach(function(d,i){

               initG(d, "#graph_" + (i+1));
            })
       
       d3.select("#active").text(article.top(Infinity).length)
    })

    var colors = ["#507984","#8B2A2F","#ECAA3E","#AFC9BB"];
    var cols = {};

    stacked.forEach(function(d,i){
      cols[d.key] = colors[i];
      if (i >0){
        dateBc.stack(dates, function(p) { return p.value.journals[d.key]; })
      }
    })

  
  //console.log(graphData.all())

 //  var jx = journals.top(Infinity).map(function(d){return d.key});
 //  jx.unshift("")
 //  var journalBc = dc.barChart("#journal")
 //    .width($("#journal").width())
 //    .height(100)
 //    .margins({top: 10, right: 10, bottom: 30, left: 50})
 //    .dimension(journal)
 //    .group(journals)
 //    .x(d3.scale.ordinal().domain(jx))
 //    .xUnits(dc.units.ordinal)
 //    .gap(1)
 //    .centerBar(true)
 //    .brushOn(true)
 //    .on("filtered", function(chart, filter){initG()})

 // var sx = sources.top(Infinity).map(function(d){return d.key});
 //  sx.unshift("")
 //  var sourceBc = dc.barChart("#source")
 //    .width($("#source").width())
 //    .height(100)
 //    .margins({top: 10, right: 10, bottom: 30, left: 50})
 //    .dimension(source)
 //    .group(sources)
 //    .x(d3.scale.ordinal().domain(sx))
 //    .xUnits(dc.units.ordinal)
 //    .gap(1)
 //    .centerBar(true)
 //    .brushOn(true)

 //  var tx = targets.top(Infinity).map(function(d){return d.key});
 //  tx.unshift("")
 //  var targetBc = dc.barChart("#target")
 //    .width($("#target").width())
 //    .height(100)
 //    .margins({top: 10, right: 10, bottom: 30, left: 50})
 //    .dimension(target)
 //    .group(targets)
 //    .x(d3.scale.ordinal().domain(tx))
 //    .xUnits(dc.units.ordinal)
 //    .gap(1)
 //    .centerBar(true)
 //    .brushOn(true)

 //  var wx = weights.top(Infinity).map(function(d){return d.key});
 //  wx.unshift(0)
 //  wx.sort()

 //  var weightBc = dc.barChart("#weight")
 //    .width($("#weight").width())
 //    .height(100)
 //    .margins({top: 10, right: 10, bottom: 30, left: 50})
 //    .dimension(weight)
 //    .group(weights)
 //    .x(d3.scale.ordinal().domain(wx))
 //    .xUnits(dc.units.ordinal)
 //    .gap(1)
 //    .centerBar(true)
 //    .brushOn(true)

 

   dc.renderAll();


  selected = ["mo", "ti"];
  journal.filterFunction(function(d){return d == selected[0] || d == selected[1]})
  dc.redrawAll();


  selected.forEach(function(d,i){

               initG(d, "#graph_" + (i+1));
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

 d3.select(target + " .btn-toolbar").attr("style", "border-bottom: solid 2px " + cols[journal] + "")

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