//__AUTHOR__DylanOsborn__
//making these variables global
var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
var expressed = attrArray[0]; //initial attribute
(function(){
//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap(){


    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 550;
    //map frame dimensions
    // var width = 960,
    //     height = 550;
    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on California
    var projection = d3.geoAlbers()
        // specifies the [longitude, latitude] coordinates of the center of the plane
        .center([0, 37.5])
        //specifies the [longitude, latitude, and roll] angles by which to rotate the globe
        .rotate([120, 0])
        //specifies the two standard parallels of a conic projection
        .parallels([29.5, 45.5])
        .scale(2900)
        //offsets the pixel coordinates of the projection's center in the svg container
        //keep these at one - half the svg width and height to keep map centered in container
        .translate([width / 2, height / 2]);

    //holds the path generator
    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/Cali_Data.csv") //load attributes from csv
        .defer(d3.json, "data/US_States.topojson") //load background spatial data
        .defer(d3.json, "data/Cali_Counties.topojson") //load choropleth spatial data
        .await(callback);

    //callback function
    function callback(error, csvData, us, cali){
      //place graticule on the map
      setGraticule(map, path);

        //translate europe TopoJSON
        var unitedStates = topojson.feature(us, us.objects.US_States), //object from US_States.topojson
            caliCounties = topojson.feature(cali, cali.objects.Cali_Counties).features; //object from Cali_Counties.topojson

        //var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
        //var expressed = attrArray[0]; //initial attribute
        //add usa states to map
        var states = map.append("path")
          .datum(unitedStates)
          .attr("class", function(d){
            return "state "; //creates style for states
          })
          .attr("d", path);


        var colorScale = makeColorScale(csvData);
        //add enumeration units to the map
        setEnumerationUnits(caliCounties, map, path, colorScale, csvData);

        //add coordinated visualization to the map
        setChart(csvData, colorScale);
      };
}; //end of setMap()

//examine the results
function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
    //create graticule generator
    var graticule = d3.geoGraticule()
      .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
    //create graticule background
    var gratBackground = map.append("path")
      .datum(graticule.outline()) //bind graticule background
      .attr("class", "gratBackground") //assign class for styling
      .attr("d", path) //project graticule

    //Example 2.6 creates graticule lines

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
      .data(graticule.lines()) //bind graticule lines to each element to be created
      .enter() //create an element for each datum
      .append("path") //append each element to the svg as a path element
      .attr("class", "gratLines") //assign class for styling
      .attr("d", path); //project graticule lines

};

function joinData(caliCounties, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //variables for data join
    //loop through csv to assign each set of csv attribute values to geojson county
    for (var i=0; i<csvData.length; i++){
        var csvCounty = csvData[i]; //the current county
        var csvKey = csvCounty.NAME; //the CSV primary key

        //loop through geojson counties to find correct county
        for (var a=0; a<caliCounties.length; a++){

            var geojsonProps = caliCounties[a].properties; //the current county geojson properties
            var geojsonKey = geojsonProps.NAME; //the geojson primary key
            //console.log(csvKey, geojsonKey);
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvCounty[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return caliCounties;
};

function setEnumerationUnits(caliCounties, map, path, colorScale, csvData){
    caliCounties = joinData(caliCounties, csvData)

    //...counties BLOCK FROM MODULE 8
    //var attrArray = ["Percent below poverty line", "percent completed highschool", "Percent black", "Percent asian", "percent hispanic/latino", "percent white"];
    //var expressed = attrArray[0]; //initial attribute
    //add France counties to map
    var counties = map.selectAll(".counties")
        .data(caliCounties)
        .enter()
        .append("path")
        .attr("class", function(d){
          return "county " + d.properties.NAME;//creates style for counties
        })
        .attr("d", path)
        .style("fill", function(d){
          //console.log(d.properties, expressed);
          return colorScale(d.properties[expressed]);
        })
        .style("fill", function(d){
          return choropleth(d.properties, colorScale);

        });
};
//bar graph made the most sense for my data, however if i have more time i would like to try another visualization
var n = attrArray, // The number of series.
    m = d.NAME; // The number of values per series.

// The xz array has m elements, representing the x-values shared by all series.
// The yz array has n elements, representing the y-values of each of the n series.
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
var xz = d3.range(m),
    yz = d3.range(n).map(function() { return bumps(m); }),
    y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
    yMax = d3.max(yz, function(y) { return d3.max(y); }),
    y1Max = d3.max(y01z, function(y) { return d3.max(y, function(d) { return d[1]; }); });

var svg = d3.select("svg"),
    margin = {top: 40, right: 10, bottom: 20, left: 10},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .domain(xz)
    .rangeRound([0, width])
    .padding(0.08);

var y = d3.scaleLinear()
    .domain([0, y1Max])
    .range([height, 0]);

var color = d3.scaleOrdinal()
    .domain(d3.range(n))
    .range(d3.schemeCategory20c);

var series = g.selectAll(".series")
  .data(y01z)
  .enter().append("g")
    .attr("fill", function(d, i) { return color(i); });

var rect = series.selectAll("rect")
  .data(function(d) { return d; })
  .enter().append("rect")
    .attr("x", function(d, i) { return x(i); })
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0);

rect.transition()
    .delay(function(d, i) { return i * 10; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
        .tickSize(0)
        .tickPadding(6));

d3.selectAll("input")
    .on("change", changed);

var timeout = d3.timeout(function() {
  d3.select("input[value=\"grouped\"]")
      .property("checked", true)
      .dispatch("change");
}, 2000);

function changed() {
  timeout.stop();
  if (this.value === "grouped") transitionGrouped();
  else transitionStacked();
}

function transitionGrouped() {
  y.domain([0, yMax]);

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
      .attr("width", x.bandwidth() / n)
    .transition()
      .attr("y", function(d) { return y(d[1] - d[0]); })
      .attr("height", function(d) { return y(0) - y(d[1] - d[0]); });
}

function transitionStacked() {
  y.domain([0, y1Max]);

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .transition()
      .attr("x", function(d, i) { return x(i); })
      .attr("width", x.bandwidth());
}

// Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
// Inspired by Lee Byron’s test data generator.
// http://leebyron.com/streamgraph/
function bumps(m) {
  var values = [], i, j, w, x, y, z;

  // Initialize with uniform random values in [0.1, 0.2).
  for (i = 0; i < m; ++i) {
    values[i] = 0.1 + 0.1 * Math.random();
  }

  // Add five random bumps.
  for (j = 0; j < 5; ++j) {
    x = 1 / (0.1 + Math.random());
    y = 2 * Math.random() - 0.5;
    z = 10 / (0.1 + Math.random());
    for (i = 0; i < m; i++) {
      w = (i / m - y) * z;
      values[i] += x * Math.exp(-w * w);
    }
  }

  // Ensure all values are positive.
  for (i = 0; i < m; ++i) {
    values[i] = Math.max(0, values[i]);
  }

  return values;
}

//function to create color scale generator
function makeColorScale(data){
  //console.log(data);

    var colorClasses = [
        "#fee5d9",
        "#fcbba1",
        "#fc9272",
        "#fb6a4a",
        "#de2d26",
        "#a50f15"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];



    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 6);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
//function to create a dropdown menu for attribute selection
function createDropdown(){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown");

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
})(); //last line of main.js
