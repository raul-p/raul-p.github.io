  // Parse data as float but countries an
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
  
  
  // Find min and maxes (for the scales)
function getBounds(d, paddingFactor) {
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


 // Get the correlation between x and y
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

  // Create svg
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", 880)
    .attr("height", 700);
  var xScale, yScale;

  svg.append('g')
    .classed('chart', true)
    .attr('transform', 'translate(80, -160)');
  
  
   // Titles for the navigation menu
   var explanationTitle = [
   "1. What is PISA?",
   "2. Correlation among scores.",
   "3. Having a quiet place to study.",
   "4. Having internet at home.",
   "5. Having many books.",
   "6. Playing chess.",
   "7. Explore some variables."
   ];
   
   
   // Explanations for the navigation menu
  var explanationText = [
  "PISA is a survey of students' skills and knowledge as they approach the end of compulsory education. It assessed the competencies of 15-year-olds in reading, mathematics and science in 65 countries and economies.",
  "The results in maths, reading and science are highly correlated. For example, this plot shows the correlation between maths and reading scores. Countries with good reading scores also have good maths scores.",
  "One of the variables that show a clearer correlation with the results in the survey is having a quiet place to study.", 
  "Having internet at home also seems to be very correlated with all results in the test. Vietnam is an exception, as it has very good results with a very low internet penetration.",
  "Having a large number of books is also correlated with good results in the test. ",
  "However, it is surprising to see how factors like playing chess show a negative correlation with results.", 
  "This interactive graph allows you to observe the connections between mean PISA scores per country and some variables. Select variables to compare them and see correlations. Select or click any country to follow it.",
   ];
   

   
					  
  // Option selected in the navigation menu
	var menuOption = 0

  // Control the prev button		  
  d3.select("#navigation #prev ").on("click", function() {

	if( menuOption > 0) {
        menuOption -= 1;
	}
	if( menuOption == 0) {
	  d3.select("#navigation #prev")
		.style('background-image', 'url("images/prev_light.png")')
	}	
	if( menuOption == 5 ) {
	  d3.select("#navigation #next")
		.style('background-image', 'url("images/next.png")')
	}
	navigation()			
	
	});
	
  // Control the next button
  d3.select("#navigation #next ").on("click", function() {
          
	if( menuOption < 6) {		
        menuOption += 1;
		navigation()
	}
	if( menuOption == 6) {
	  d3.select("#navigation #next")
		.style('background-image', 'url("images/next_light.png")')
	}	
	if( menuOption == 1) {
	  d3.select("#navigation #prev")
		.style('background-image', 'url("images/prev.png")')
	}		

		
	});
	
	
  // Change texts and axis for every step in navigation		   	
  function navigation(d) {
    d3.select("#explanation p")
	  .text(explanationText[menuOption]);
	  
	d3.select("#explanationTitle p")
	  .text(explanationTitle[menuOption]);  
	  
	if( menuOption == 0) {
	xAxis = 'Longitude';
	yAxis = 'Latitude';
	}	  

	if( menuOption == 1) {
	xAxis = 'Reading Score';
	yAxis = 'Maths Score';
	}		  
	
	if( menuOption == 2) {
	xAxis = 'Quiet Place to Study';
	yAxis = 'Maths Score';
	}		
	
	if( menuOption == 3) {
	xAxis = 'Internet at Home';
	yAxis = 'Science Score';
	}		  
	  
	if( menuOption == 4) {
	xAxis = 'Books';
	yAxis = 'Reading Score';
	}		  
	  	  
	if( menuOption == 5) {
	  d3.select("#menu")
		.style('visibility', 'hidden')
		
		
	xAxis = 'Play Chess';
	yAxis = 'Maths Score';
	
	
	}

	if( menuOption == 6) {
	  d3.select("#menu")
		.style('visibility', 'visible')
		
	xAxis = 'Homework Hours';
	yAxis = 'Maths Score';
	updateMenus();

	}
	
	
    updateChart();
	

  }







	
  // Build x axis menus
  
  
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

  // Build y axis menus
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
	 
	 
   // Create countries dropdown  
  var dropDown = d3.select("#countries-list")
  				   .append("select")
                   .attr("name", "country-list");
				   
	
  var options = dropDown.selectAll("option")
                        .data(data)
                        .enter()
                        .append("option");
		 		   
  options.text(function (d) { return d.Order; })
         .attr("value", function (d) { return d.Order; });
	   
  dropDown.on("change", menuChanged );


   // Change the stroke of the selected country  
  function menuChanged(d) {
	  
  d3.select('svg g.chart')
    .selectAll('circle')
	.transition()
	.style("stroke-opacity", 1)
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


  // Best fit line (to appear behind points)
  d3.select('svg g.chart')
    .append('line')
    .attr('id', 'bestfit')
	.style("stroke-dasharray", ("5, 5"))  
	;

  // Axis labels
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'xLabel', 'x': 400, 'y': 660, 'text-anchor': 'middle'})
    .text(descriptions[xAxis]);

  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(-45, 390)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text('Maths Score');

	
  // Create Legend 1
  
	var linearSize = d3.scale.linear().domain([0.5,  300]).range([1.6, 39]);
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendSize")
	  .attr("transform", "translate(130, 575)")
	  .attr("fill", "#aaa");
	
	var legendSize = d3.legend.size()
	  .scale(linearSize)
	  .shape('circle')
	  .shapePadding(7)
	  .labelOffset(12)
	  .orient('horizontal')
	  .labels(["0.5M", "75M", "150M", "225M", "300M"]);
	
	svg.select(".legendSize")
	  .call(legendSize);
         
  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(180, 690)')
    .attr({'text-anchor': 'middle', 'font-weight': 'bold'})
    .text('Country Population');		 
  
  
  // Create Legend 2

	var linear = d3.scale.category10()
	  .domain(["AMERICA", "ASIA", "EUROPE", "OCEANIA", "AF & ME"])
	
	var svg = d3.select("svg");
	
	svg.append("g")
	  .attr("class", "legendLinear")
	  .attr("transform", "translate(545,575)");
	
	var legendLinear = d3.legend.color()
	  .shapeWidth(55)
	  .orient('horizontal')
	  .shape("path", d3.svg.symbol().type("circle").size(800)())
	  .shapePadding(30)
	  .labelOffset(27)
	  .scale(linear);
	
	svg.select(".legendLinear")
	  .call(legendLinear);
  
  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(580, 690)')
    .attr({'text-anchor': 'middle', 'font-weight': 'bold'})
    .text('Continent');
	   
  
  // Render circles
  updateScales();
  var pointColour = d3.scale.category10();
  d3.select('svg g.chart')
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
	 // The id is the country name without spaces
	.attr("id", function (d) { return d.Country.replace(/ /g,''); })
    .attr('cx', function(d) {
      return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
    })
    .attr('cy', function(d) {
      return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
    })
    // Fill color acording to the area of the world
	.attr('fill', function(d, i) {return pointColour(d.aColor);})
	.style("fill-opacity", 0.8)
    .style('cursor', 'pointer')


  // Mouse over. Change stroke if it's not selected
    .on('mouseenter', function(d) {	  		
	if( d3.select(this).attr('stroke-width')  != 60 )
        var stroke_width = 2;
	else
		var stroke_width = 60;
		
	  d3.select(this)
		.transition()
		.attr("stroke", "#333")
        .attr("stroke-width", stroke_width);
	
	var mouse_over_circle = true;	
    })

  // Mouse out. Change stroke back to original
  
    .on('mouseout', function(d) {
		
	if(d3.select(this).attr('stroke-width')  != 60)
        var stroke_width = 0;
	else
		var stroke_width = 60;
		
	  d3.select(this)
		.transition()
		.attr("stroke", "#999")
        .attr("stroke-width", stroke_width)
			
	//Hide the tooltip
	d3.select("#tooltip").classed("hidden", true);
	
	mouse_over_circle = false;
	
	})
	
	// On click, select ot unselect
    .on('click', function(d) {
		
	if(d3.select(this).attr('stroke-width')  == 60) {
	  d3.select(this)
		.transition()
		.style("stroke-opacity", 1)
		.attr("stroke-width", 0);
	
	} else {
	  d3.select('svg g.chart')
		.selectAll('circle')
		.transition()
		.style("stroke-opacity", 1)
		.attr("stroke-width", 0);
		
	  d3.select(this)
		.transition()
		.style("stroke-opacity", 0.3)
		.attr("stroke-width", 60);
	}
		
	})
	
	
  // Print the tooltip in pointer position
  
	.on('mousemove', function(d) {	
			
	//Get the mouse x/y, then augment for the tooltip
	
	var coordinates = [0, 0];
	coordinates = d3.mouse(this);
	var xPosition = coordinates[0] + 100;
	var yPosition = coordinates[1] - 150;

		
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
	
	});
	
	
  // Update charts and menus	
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


  // Update chart elements when axis variables change
  function updateChart(init) {
	 
	// Update the scales first  
    updateScales();

    // Move the circles
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
	   // Area proportional to population
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
	  
	 // Change the best fit line 
    d3.select('#bestfit')
      .style('opacity', 0)
      .attr({'x1': xScale(x1), 'y1': yScale(y1), 'x2': xScale(x2), 'y2': yScale(y2)})
      .transition()
      .duration(2500)	  
      .style('opacity', op);
  }

  // Update the scales
  function updateScales() {
    xScale = d3.scale.linear()
                    .domain([bounds[xAxis].min-2, bounds[xAxis].max+2])
                    .range([10, 750]);

    yScale = d3.scale.linear()
                    .domain([bounds[yAxis].min-5, bounds[yAxis].max+5])
                    .range([610, 220]);    
  }

  // Plot X axis
  function makeXAxis(s) {
    s.call(d3.svg.axis()
      .scale(xScale)
	  .tickSize(3, 0)
	  .ticks(9)
      .orient("bottom"));
  }

  // Plot Y axis
  function makeYAxis(s) {
    s.call(d3.svg.axis()
      .scale(yScale)
	  .tickSize(3, 0)
	  .ticks(5)
      .orient("left"));
  }
  
  
  // Update menus
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


