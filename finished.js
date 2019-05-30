'use strict';

(function() {

  let data = "no data"; // Reference to selected year
  let yearData = "no data"
  let dataEveryCountry = "no data"; // Reference to full data set
  let svgContainer = ""; // keep SVG reference in global scope
  let defaultCountry = 'Albania' // default country
  let countryCode = "ALB"
  let tooltipSVG = "" // keep SVG reference for tooltip in global scope
  let div = "" // keep reference to div

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 900) // increase size to mimic Tableau chart
      .attr('height', 600); // increase size to mimic Tableau chart

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("GDP_pop.csv")
      .then((csvData) => {
        dataEveryCountry = csvData;               

        // Drop-down to filter by year
        var dropDown = d3.select('body')
          .append('select')
          .on('change', function() {
            makeScatterPlot(this.value);
          });

        // Array of years (use to populate options)
        let location = Array.from(new Set(dataEveryCountry.map((row) => row["Country Name"])))
        
        // Options for the drop-down (default to 1977)
        var dropDownOptions = dropDown.selectAll('option')
          .data(location)
          .enter()
            .append('option')
            .text((d) => { return d; })
            .property("selected", function(d){ return d === defaultCountry; }); // Set default to AUS

    // make tooltip
    div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("opacity", 0);

        // create tooltip svg
        tooltipSVG = d3.select("div")
        .append('svg')
        .attr('width', 300)
        .attr('height', 300)
        tooltipSVG.html("");

        makeToolTip();
        
        makeScatterPlot(defaultCountry);

      });
  }

  // make scatter plot with trend line
  function makeScatterPlot(country) {
    selectCountry(country);
    
    svgContainer.html("");
    
    // get arrays of fertility rate data and life Expectancy data
    let years_data = data.map((row) => row["Year"]);// x-axis
    let population_data = data.map((row) => parseFloat(row["GDP"])); //y-axis

    // find data limits
    let axesLimits = findMinMax(years_data, population_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "Year", "GDP");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels(country);
  }

  function selectCountry(country) {
    data = dataEveryCountry.filter((row) => row['Country Name'] == country);
    countryCode = data[1]['Country Code']
  }

  // make title and axes labels
  function makeLabels(country) {
    svgContainer.append('text')
      .attr('x', 250)
      .attr('y', 25)
      .style('font-size', '22pt')
      .text("Gross Domestic Product Through Time");

      svgContainer.append('text')
      .attr('x', 450)
      .attr('y', 590)
      .style('font-size', '10pt')
      .text('Year');

      svgContainer.append('text')
      .attr('transform', 'translate(10, 375)rotate(-90)')
      .style('font-size', '10pt')
      .text('GDP (Gross Domestic Product)');

      svgContainer.append('text')
      .attr('x', 800)
      .attr('y', 530)
      .style('font-size', '14pt')
      .text(countryCode);
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // scaling functions
    let xScale = map.xScale
    let yScale = map.yScale

    svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 4)
      .attr('fill', "#4286f4")
      .style("opacity", 0.6) // Make it possible to see all the dots
      .style("stroke", "#244ED9") // Give each dot an outline

        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

  }

  function makeToolTip(){
    // Parse values
    let GDP = dataEveryCountry.map((row) => parseFloat(row["GDP"])); // x-axis
    let population = dataEveryCountry.map((row) => parseFloat(row["Population"])); //y-axis
    // Get min and max
    let axesLimits = findMinMax(population, GDP);
    // Scale axes
    let mapFunctions = drawDivAxes(axesLimits, 'Population', 'GDP');
    // mapping functions
    let xMap = mapFunctions.x;
    let yMap = mapFunctions.y;

    // scaling functions
    let xScale = mapFunctions.xScale
    let yScale = mapFunctions.yScale

    tooltipSVG.append('text')
    .attr('x', 80)
    .attr('y', 30)
    .style('font-size', '12pt')
    .text("Population vs GDP");

    tooltipSVG.append('text')
    .attr('x', 125)
    .attr('y', 280)
    .style('font-size', '8pt')
    .text('Population');

    tooltipSVG.append('text')
    .attr('transform', 'translate(17, 170)rotate(-90)')
    .style('font-size', '8pt')
    .text('GDP');

    tooltipSVG.selectAll('.dot')
      .data(dataEveryCountry)
      .enter()
      .append('circle')
        .attr('cx', x => xMap(x))
        .attr('cy', y => yMap(y))
        .attr('r', 3)
        .attr('fill', "#787777")
        .style("stroke", "black")
        .style("opacity", 0.6) // Make it possible to see all the dots
  }

  function drawDivAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([50, 250]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).ticks(7, "s");
    tooltipSVG.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin-25]) // give domain buffer
      .range([50, 250]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale).ticks(10,"s");
    tooltipSVG.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

    // draw the axes and ticks
    function drawAxes(limits, x, y) {
      // return x value from a row of data
      let xValue = function(d) { return +d[x]; }
  
      // function to scale x value
      let xScale = d3.scaleLinear()
        .domain([limits.xMin-5, limits.xMax]) // give domain buffer room
        .range([50, 850]);
  
      // xMap returns a scaled x value from a row of data
      let xMap = function(d) { return xScale(xValue(d)); };
  
      // plot x-axis at bottom of SVG
      let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
      svgContainer.append("g")
        .attr('transform', 'translate(0, 550)')
        .call(xAxis);
  
      // return y value from a row of data
      let yValue = function(d) { return +d[y]}
  
      // function to scale y
      let yScale = d3.scaleLinear()
        .domain([limits.yMax, limits.yMin - 100000000]) // give domain buffer
        .range([50, 550]);
  
      // yMap returns a scaled y value from a row of data
      let yMap = function (d) { return yScale(yValue(d)); };
  
      // plot y-axis at the left of SVG
      let yAxis = d3.axisLeft().scale(yScale).ticks(10,"s");
      svgContainer.append('g')
        .attr('transform', 'translate(50, 0)')
        .call(yAxis);
  
      // return mapping and scaling functions
      return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
      };
    }
  

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
