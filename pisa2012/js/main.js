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
	  else if( k == 'Order' )
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


  // Load the data
d3.csv('data/pisa.csv', function(data) {

  // Declare axis, descriptions and labels.
  var xAxis = 'Longitude', yAxis = 'Latitude';
  
  var xAxisOptions = ["Homework Hours",
  					  "Quiet Place to Study",
					  "Computer at Home", 
					  "Internet at Home",
					  "Play Chess",
					  "Books", 
					  "Car",
					  "Computer Programming",
					  "Problems"];
					  
  var yAxisOptions = ["Maths Score", "Reading Score", "Science Score"];
  
  var descriptions = {
	"Abs Latitude" :"Absolute latitude (non-negatives values)", 
	"Longitude" : "Longitude",
	"Latitude" : "Latitude",
	"Maths Score" : "Mean maths score",
    "Reading Score" : "Mean reading score",
	"Science Score" : "Mean science score",
	"Homework Hours" : "Hours spent in homework per week (h)",
    "Internet at Home" : "Has internet at home (%)",
    "Play Chess": "Play chess (%)",
    "Quiet Place to Study" : "Has a quiet place to study (%)",
	"Computer at Home": "Has a computer at home that can use to study (%)",
	"Books" : "Has more than 100 boooks at home (%)",
	"Car" : "Family has a car (%)",
	"Computer Programming" : "Spends time programming computers (%)", 
	"Problems" : "Family demands or other problems prevent them from putting a lot of time into their school work (%)"
  };
  
    var labels = {
    "Abs Latitude" :"Absolute latitude",
	"Longitude" : "Longitude",
	"Latitude" : "Latitude",
	"Maths Score" : "Mean maths score",
    "Reading Score" : "Mean reading score",
	"Science Score" : "Mean science score",
	"Homework Hours" : "Homework Hours (h)",
    "Internet at Home" : "Internet at home (%)",
    "Play Chess": "Play chess (%)",
    "Quiet Place to Study" : "Quiet place (%)",
	"Computer at Home": "Computer (%)",
	"Books" : "More than 100 boooks (%)",
	"Car" : "Family has a car (%)",
	"Computer Programming" : "Program computers (%)", 
	"Problems" : "Problems (%)"
  };

  // Get keys, data and bounds from file
  var keys = _.keys(data[0]);
  var data = parseData(data);
  var bounds = getBounds(data, 1);

  // Create svg and stuff
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", 900)
    .attr("height", 700);
  var xScale, yScale;

  svg.append('g')
    .classed('chart', true)
    .attr('transform', 'translate(80, -140)');

  // Build axis menus
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
	  if( yAxis == 'Latitude' )
        yAxis = "Maths Score";
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
	   if( xAxis == 'Longitude' )
	     xAxis = "Homework Hours";
       updateChart();
       updateMenus();
     });
	 
	 
   // Countries dropdown  
  var dropDown = d3.select("#countries-list2")
  				   .append("select")
                   .attr("name", "country-list");
  
  var options = dropDown.selectAll("option")
                        .data(data)
                        .enter()
                        .append("option");
		   
  options.text(function (d) { return d.Order; })
         .attr("value", function (d) { return d.Order; });
	   
  dropDown.on("change", menuChanged );
  
  function menuChanged(d) {
	  
  d3.select('svg g.chart')
    .selectAll('circle')
	.transition()
    .attr("stroke-width", 0);
		
  d3.select("#tooltip")
    .classed("hidden", true);

    var selectedValue = d3.event.target.value; 
	var selectedCountry =  "#"+selectedValue.replace(/ /g,'');

  d3.select(selectedCountry)
	.transition()
	.attr("stroke", "#999")
    .attr("stroke-width", 60)
	.style("stroke-opacity", 0.3);	    
}
  
  // Countries list

	
  d3.select('#countries-list')
    .selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .text(function(d) {return d.Order;})
    .on('mouseover', function(d) {

		
  d3.select("#"+d.Order.replace(/ /g,''))
	.transition()
	.attr("stroke", "#333")
	.style("stroke-opacity", 1)	  
    .attr("stroke-width", 3);	
		
		
  //Get this bar's x/y values, then augment for the tooltip
var xPosition = parseFloat(d3.select("#"+d.Order.replace(/ /g,'')).attr("cx")) + 110;
var yPosition = parseFloat(d3.select("#"+d.Order.replace(/ /g,'')).attr("cy")) - 140;
		
  d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px")
    .select("#country")
    .text(d.Order + " (" + d.aOrder + ")");
  d3.select("#tooltip #y")
    .text(labels[yAxis] + ": " + d[yAxis]);
  d3.select("#tooltip #x")
    .text(labels[xAxis] + ": " + d[xAxis]);
  
  		
  d3.select("#tooltip")
    .classed("hidden", false);		
    })	
	
	.on('mouseout', function(d) {	
  d3.select("#"+d.Order.replace(/ /g,''))
    .transition()
    .attr("stroke-width", 0);
		
  d3.select("#tooltip")
    .classed("hidden", true);
	});	 
	 
	
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
    .attr('transform', 'translate(-50, 390)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text('Maths Score');


	// Legend 1

	var linear = d3.scale.category10()
	  .domain(["AMERICA", "ASIA", "EUROPE", "OCEANIA", "AF & ME"])
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendLinear")
	  .attr("transform", "translate(565,620)");
	
	var legendLinear = d3.legend.color()
	  .shapeWidth(55)
	  .orient('horizontal')
	  .shape("path", d3.svg.symbol().type("circle").size(800)())
	  .shapePadding(30)
	  .labelOffset(35)
	  .scale(linear);
	
	svg.select(".legendLinear")
	  .call(legendLinear);
  
  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(180, 710)')
    .attr({'text-anchor': 'middle', 'font-weight': 'bold'})
    .text('Country Population');
	
	
  // Legend 2
  
	var linearSize = d3.scale.linear().domain([0.5,  300]).range([1.6, 39]);
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendSize")
	  .attr("transform", "translate(130, 620)")
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
         
  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(610, 710)')
    .attr({'text-anchor': 'middle', 'font-weight': 'bold'})
    .text('Country Area');		 
  
   
  
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


  // Mouse over. Change stroke and show tooltip
    .on('mouseover', function(d) {
	  d3.select(this)
		.transition()
		.attr("stroke", "#333")
		.style("stroke-opacity", 1)
        .attr("stroke-width", 2);
		
	//Get this bar's x/y values, then augment for the tooltip
var xPosition = parseFloat(d3.select(this).attr("cx")) + 110;
var yPosition = parseFloat(d3.select(this).attr("cy")) - 140;
		
	d3.select("#tooltip")
	  .style("left", xPosition + "px")
	  .style("top", yPosition + "px")
	  .select("#country")
	  .text(d.Country + " (" + d.Area + ")");
	d3.select("#tooltip #y")
	  .text(labels[yAxis] + ": " + d[yAxis]);
	d3.select("#tooltip #x")
	  .text(labels[xAxis] + ": " + d[xAxis]);
   

  //Show the tooltip
  d3.select("#tooltip")
    .classed("hidden", false);	
    })

  // Mouse out
  
    .on('mouseout', function(d) {
	  d3.select(this)
		.transition()
        .attr("stroke-width", 0)
			
	//Hide the tooltip
	d3.select("#tooltip").classed("hidden", true);
	});
	
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
      .duration(1000)
      .ease('cubic-out')
      .attr('cx', function(d) {
        return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
      })
      .attr('cy', function(d) {
        return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
      })
      .attr('r', function(d) {
//     return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : 12;
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
	
	 if( xAxis == 'Longitude' )
        var op = 0;
	  else
	    var op = 1;
	  
	  
    d3.select('#bestfit')
      .style('opacity', 0)
      .attr({'x1': xScale(x1), 'y1': yScale(y1), 'x2': xScale(x2), 'y2': yScale(y2)})
      .transition()
      .duration(2500)	  
      .style('opacity', op);
  }

  function updateScales() {
    xScale = d3.scale.linear()
                    .domain([bounds[xAxis].min, bounds[xAxis].max])
                    .range([20, 780]);

    yScale = d3.scale.linear()
                    .domain([bounds[yAxis].min, bounds[yAxis].max])
                    .range([600, 200]);    
  }

  function makeXAxis(s) {
    s.call(d3.svg.axis()
      .scale(xScale)
	  .tickSize(3, 0)
      .orient("bottom"));
  }

  function makeYAxis(s) {
    s.call(d3.svg.axis()
      .scale(yScale)
	  .tickSize(3, 0)
	  .ticks(5)
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


