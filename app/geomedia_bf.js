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
  	  window.links = crossfilter(data),
      window.all = links.groupAll(),
      window.date = links.dimension(function(d) { return d.date; }),
      window.dates = date.group(d3.time.day),
      window.journal = links.dimension(function(d) { return d.journal; }),
      window.journals = journal.group(),
      window.article = links.dimension(function(d) { return d.id_article }),
      window.articles = article.group(),
      window.source = links.dimension(function(d) { return d.source}),
      window.sources = source.group(),
      window.target = links.dimension(function(d) { return d.target}),
      window.targets = target.group(),
      window.weight = links.dimension(function(d) { return (Math.round(d.weight * 100)/100)}),
      window.weights = weight.group();

      window.selected = ["mo", "ti", "ft", "wp"];

      // journals.all().forEach(function(d,i){
      	
      // 	val=""
      // 	k=""
      // 	switch(d.key)
      // 	{
      // 		case 'ft' :
      // 			val="Financial Times"
      // 			break;
      // 		case 'mo' :
      // 			val="Le Monde"
      // 			break;
      // 		case 'ti' :
      // 			val="Times of India"
      // 			break;
      // 		case 'wp':
      // 			val="Washington Post"
      // 			break;
      // 		}
      		
      // 	$("#journal1").append("<li role='presentation'><a href='#' data='"+d.key+"' role='menuitem'>"+val+"</a></li>")
      // 	$("#journal2").append("<li role='presentation'><a href='#' data='"+d.key+"' role='menuitem'>"+val+"</a></li>")	
      // })
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

            initG();
            $("#biforce").empty();
            biforce();

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

            initG();
            $("#biforce").empty();
            biforce();

            })
      
      //journal.filterFunction(function(d){return d == "mo" || d == "ti"})


      var mo = date.group(d3.time.day).reduceSum(function(d){return d.journal=="mo"?1:0;});
      var ti = date.group(d3.time.day).reduceSum(function(d){return d.journal=="ti"?1:0;});
      var ft = date.group(d3.time.day).reduceSum(function(d){return d.journal=="ft"?1:0;});
      var wp = date.group(d3.time.day).reduceSum(function(d){return d.journal=="wp"?1:0;});

      //var mog = article.group().reduceSum(function(d){return d.journal=="mo"?1:0;});
      //var tig = source.group().reduceSum(function(d){return d.journal=="ti"?1:0;});
      //var ftg = source.group().reduceSum(function(d){return d.journal=="ft"?1:0;});
      //var wpg = source.group().reduceSum(function(d){return d.journal=="wp"?1:0;});



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

      window.graphData = article.group().reduce(reduceAdd, reduceRemove, reduceInitial)

      //console.log(graphData.all())

  var stacked = d3.entries(dates.top(1)[0].value.journals)


  window.dateBc = dc.barChart("#timeline")
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
      initG();
      $("#biforce").empty();
      biforce();
      
    })

    var colors = ["#507984","#8B2A2F","#ECAA3E","#AFC9BB"];
    window.cols = {};

    stacked.forEach(function(d,i){
      cols[d.key] = colors[i];
      if (i >0){
        dateBc.stack(dates, function(p) { return p.value.journals[d.key]; })
      }
    })

  

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

  initG();
  $("#biforce").empty();
  biforce();

   function initG(){
  
 //if(j1!="" && j2!="") {
    var data_j1 = graphData.all().filter(function(d){return d.value.journal == selected[1] })
    var data_j2 = graphData.all().filter(function(d){return d.value.journal == selected[0] })
  
  //console.log(d3.nest().key(function(d){return d.value.country}).entries(data))
  //console.log(data_j1)
  //console.log(data_j2)
  
  window.nod = [];
  
  data_j1.forEach(function(d){
      d.value.country.forEach(function(f){
      i=lookup(f,nod)
            if(i<0){
            obj={}
            obj.label=f;
            obj.a = 1;
            obj.b=0;
          nod.push(obj);    
          }else{
              nod[i].a++;
          }
          
        })
        
      })
      
  data_j2.forEach(function(d){
      d.value.country.forEach(function(f){

           i=lookup(f,nod)
            if(i<0){
            obj={}
            obj.label=f;
            obj.a = 0;
            obj.b=1;
          nod.push(obj);    
          }else{
              nod[i].b++;
          }
          
        })
      })
      

  
//}  

  }
  
  
function lookup( name, arr ) {
    for(var i = 0, len = arr.length; i < len; i++) {
        if( arr[ i ].label === name )
            return i;
    }
    return -1;
}


});


