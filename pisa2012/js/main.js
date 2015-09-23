// HELPERS
function parseData(d) {
  var keys = _.keys(d[0]);
  return _.map(d, function(d) {
    var o = {};
    _.each(keys, function(k) {
      if( k == 'Country' )
        o[k] = d[k];
	  else if( k == 'Area' )
        o[k] = d[k];
      else
        o[k] = parseFloat(d[k]);
    });
    return o;
  });
}

function getBounds(d, paddingFactor) {
  // Find min and maxes (for the scales)
  paddingFactor = typeof paddingFactor !== 'undefined' ? paddingFactor : 1;

  var keys = _.keys(d[0]), b = {};
  _.each(keys, function(k) {
    b[k] = {};
    _.each(d, function(d) {
      if(isNaN(d[k]))
        return;
      if(b[k].min === undefined || d[k] < b[k].min)
        b[k].min = d[k];
      if(b[k].max === undefined || d[k] > b[k].max)
        b[k].max = d[k];
    });
    b[k].max > 0 ? b[k].max *= paddingFactor : b[k].max /= paddingFactor;
    b[k].min > 0 ? b[k].min /= paddingFactor : b[k].min *= paddingFactor;
  });
  return b;
}

function getCorrelation(xArray, yArray) {
  function sum(m, v) {return m + v;}
  function sumSquares(m, v) {return m + v * v;}
  function filterNaN(m, v, i) {isNaN(v) ? null : m.push(i); return m;}

  // clean the data (in case some values are missing)
  var xNaN = _.reduce(xArray, filterNaN , []);
  var yNaN = _.reduce(yArray, filterNaN , []);
  var include = _.intersection(xNaN, yNaN);
  var fX = _.map(include, function(d) {return xArray[d];});
  var fY = _.map(include, function(d) {return yArray[d];});

  var sumX = _.reduce(fX, sum, 0);
  var sumY = _.reduce(fY, sum, 0);
  var sumX2 = _.reduce(fX, sumSquares, 0);
  var sumY2 = _.reduce(fY, sumSquares, 0);
  var sumXY = _.reduce(fX, function(m, v, i) {return m + v * fY[i];}, 0);

  var n = fX.length;
  var ntor = ( ( sumXY ) - ( sumX * sumY / n) );
  var dtorX = sumX2 - ( sumX * sumX / n);
  var dtorY = sumY2 - ( sumY * sumY / n);
 
  var r = ntor / (Math.sqrt( dtorX * dtorY )); // Pearson ( http://www.stat.wmich.edu/s216/book/node122.html )
  var m = ntor / dtorX; // y = mx + b
  var b = ( sumY - m * sumX ) / n;

  // console.log(r, m, b);
  return {r: r, m: m, b: b};
}

d3.csv('data/pisa.csv', function(data) {

  var xAxis = 'Reading Score', yAxis = 'Math Score';
  var xAxisOptions = ["Math Score", "Reading Score", "Science Score", "Play Chess", "Internet"];
  var yAxisOptions = ["Math Score", "Reading Score", "Science Score"];
  var descriptions = {
	"Math Score" : "Math Score",
    "Reading Score" : "Reading Score",
    "Internet" : "Has internet at home (%)",
    "Science Score" : "Science Score",
    "Work income" : "Other",
    "Play Chess": "Play chess (%)",
    "Family" : "Fertility (children per women)",
    "Quiet Place to Study" : "Has a quiet place to study (%)",
    "Working hours" : "Average working hours per week per person",
    "Cinema spending" : "Cinema spending (% of GDP)",
    "Health spending" : "Government health spending (% of government spend)"
  };

  var keys = _.keys(data[0]);
  var data = parseData(data);
  var bounds = getBounds(data, 1);

  // SVG AND D3 STUFF
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", 1300)
    .attr("height", 730);
  var xScale, yScale;

  svg.append('g')
    .classed('chart', true)
    .attr('transform', 'translate(40, 0)');

  // Build menus
  d3.select('#x-axis-menu')
    .selectAll('li')
    .data(xAxisOptions)
    .enter()
    .append('li')
    .text(function(d) {return d;})
    .classed('selected', function(d) {
      return d === xAxis;
    })
    .on('click', function(d) {
      xAxis = d;
      updateChart();
      updateMenus();
    });

   d3.select('#y-axis-menu')
     .selectAll('li')
     .data(yAxisOptions)
     .enter()
     .append('li')
     .text(function(d) {return d;})
     .classed('selected', function(d) {
       return d === yAxis;
     })
     .on('click', function(d) {
       yAxis = d;
       updateChart();
       updateMenus();
     });
	 
  // Countries list

   d3.select('#countries-list')
     .selectAll('li')
     .data(data)
     .enter()
     .append('li')
     .text(function(d) {return d.Country;})
     .on('mouseover', function(d) {
      d3.select('svg g.chart #countryLabel')
        .text(d.Country)
        .transition()
        .style('opacity', 1);
	  d3.select('svg g.chart #areaLabel')
        .text(d.Area)
        .transition()
        .style('opacity', 1);	
		
	  d3.select("#"+d.Country.replace(/ /g,''))
		.transition()
		.attr("stroke", "#333")
        .attr("stroke-width", 3);	
				
		
		
    })	
	.on('mouseout', function(d) {
      d3.select('svg g.chart #countryLabel')
        .transition()
        .duration(1000)
        .style('opacity', 0);

      d3.select('svg g.chart #areaLabel')
        .transition()
        .duration(1200)
        .style('opacity', 0);
		
  	  d3.select("#"+d.Country.replace(/ /g,''))
	    .transition()
        .attr("stroke-width", 0);	
				    })

	;	 
	 

  // Country name
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'countryLabel', 'x': 400, 'y': 130, 'text-anchor': 'middle'})
    .style({'font-size': '30px', 'fill': '#999'});

  // Area name
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'areaLabel', 'x': 400, 'y': 158, 'text-anchor': 'middle'})
    .style({'font-size': '24px', 'fill': '#ddd'});
	
  // Best fit line (to appear behind points)
  d3.select('svg g.chart')
    .append('line')
    .attr('id', 'bestfit')
	.style("stroke-dasharray", ("5, 5"))  
	;

  // Axis labels
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
    .text(descriptions[xAxis]);

  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(-60, 330)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text('Maths Score');




	// Legend 1

	var linear = d3.scale.category10()
	  .domain(["OCEANIA", "EUROPE", "AMERICA", "AF & ME", "ASIA"])
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendLinear")
	  .attr("transform", "translate(910,500)");
	
	var legendLinear = d3.legend.color()
	  .shapeWidth(55)
	  .orient('horizontal')
	  .scale(linear);
	
	svg.select(".legendLinear")
	  .call(legendLinear);
  
  // Legend 2
  
	var linearSize = d3.scale.linear().domain([0.5,  300]).range([1.6, 39]);
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendSize")
	  .attr("transform", "translate(930, 600)")
	  .attr("fill", "#aaa");
	
	var legendSize = d3.legend.size()
	  .scale(linearSize)
	  .shape('circle')
	  .shapePadding(7)
	  .labelOffset(20)
	  .orient('horizontal')
	  .labels(["0.5M", "75M", "150M", "225M", "300M"]);
	
	svg.select(".legendSize")
	  .call(legendSize);
         
		 
  
  
  
  
  // Render circles
  updateScales();
  var pointColour = d3.scale.category10();
  d3.select('svg g.chart')
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
	.attr("id", function (d) { return d.Country.replace(/ /g,''); })
    .attr('cx', function(d) {
      return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
    })
    .attr('cy', function(d) {
      return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
    })
    .attr('fill', function(d, i) {return pointColour(d.aColor);})
	.style("fill-opacity", 0.8)
    .style('cursor', 'pointer')
    .on('mouseover', function(d) {
      d3.select('svg g.chart #countryLabel')
        .text(d.Country)
        .transition()
        .style('opacity', 1);
	  d3.select('svg g.chart #areaLabel')
        .text(d.Area)
        .transition()
        .style('opacity', 1);	
	  d3.select(this)
		.transition()
		.attr("stroke", "#333")
        .attr("stroke-width", 2);
	
		
		
		
    })
	
    .on('mouseout', function(d) {
      d3.select('svg g.chart #countryLabel')
        .transition()
        .duration(1000)
        .style('opacity', 0);

      d3.select('svg g.chart #areaLabel')
        .transition()
        .duration(1200)
        .style('opacity', 0);
		
	  d3.select(this)
		.transition()
        .attr("stroke-width", 0)
		    })
   ;
	

  updateChart(true);
  updateMenus();

  // Render axes
  d3.select('svg g.chart')
    .append("g")
    .attr('transform', 'translate(0, 630)')
    .attr('id', 'xAxis')
    .call(makeXAxis);

  d3.select('svg g.chart')
    .append("g")
    .attr('id', 'yAxis')
    .attr('transform', 'translate(-10, 0)')
    .call(makeYAxis);



  //// RENDERING FUNCTIONS
  function updateChart(init) {
    updateScales();

    d3.select('svg g.chart')
      .selectAll('circle')
      .transition()
      .duration(500)
      .ease('quad-out')
      .attr('cx', function(d) {
        return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
      })
      .attr('cy', function(d) {
        return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
      })
      .attr('r', function(d) {
//        return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : 12;
//      return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : 12;
//     return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? d3.select(this).attr('Math Score') : 30 - yScale(d[yAxis])/25;
		return 4*Math.sqrt(d.Population/3.14);
      });




	
	
    // Also update the axes
    d3.select('#xAxis')
      .transition()
      .call(makeXAxis);

    d3.select('#yAxis')
      .transition()
      .call(makeYAxis);

    // Update axis labels
    d3.select('#xLabel')
      .text(descriptions[xAxis]);
    d3.select('#yLabel')
      .text(descriptions[yAxis]);
	  
    // Update correlation
    var xArray = _.map(data, function(d) {return d[xAxis];});
    var yArray = _.map(data, function(d) {return d[yAxis];});
    var c = getCorrelation(xArray, yArray);
    var x1 = xScale.domain()[0], y1 = c.m * x1 + c.b;
    var x2 = xScale.domain()[1], y2 = c.m * x2 + c.b;

    // Fade in
    d3.select('#bestfit')
      .style('opacity', 0)
      .attr({'x1': xScale(x1), 'y1': yScale(y1), 'x2': xScale(x2), 'y2': yScale(y2)})
      .transition()
      .duration(2500)
      .style('opacity', 1);
  }

  function updateScales() {
    xScale = d3.scale.linear()
                    .domain([bounds[xAxis].min, bounds[xAxis].max])
                    .range([20, 780]);

    yScale = d3.scale.linear()
                    .domain([bounds[yAxis].min, bounds[yAxis].max])
                    .range([600, 100]);    
  }

  function makeXAxis(s) {
    s.call(d3.svg.axis()
      .scale(xScale)
      .orient("bottom"));
  }

  function makeYAxis(s) {
    s.call(d3.svg.axis()
      .scale(yScale)
      .orient("left"));
  }

  function updateMenus() {
    d3.select('#x-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === xAxis;
      });
    d3.select('#y-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === yAxis;
    });
  }

})


