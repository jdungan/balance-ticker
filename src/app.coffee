# copied from http://www.calicowebdev.com/2011/05/01/simple-coffeescript-introduction/
class ExtMath extends Math
  @truncate = (x, precision = 0) ->
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
    scale = scales[precision]
    Math.round(x * scale) / scale

_sum = (memo, num) -> memo + num

# sparkline adapted from http://www.tnoda.com/blog/2013-12-19
width = 64
height = 64
x = d3.scale.linear().range([0, width - 2])
y = d3.scale.linear().range([height - 4, 0])
parseDate = d3.time.format("%Y-%m-%d").parse

line = d3.svg.line()
  .interpolate("basis")
  .x( (d) -> x( d[0] ) )
  .y( (d) -> y( d[1] ) )

sparkline = (g, data) -> 
  dates = _.map(data.x, (d) -> parseDate d )
  points = _.zip(dates,data.y)
  x.domain d3.extent dates 
  y.domain d3.extent data.y  

  g.append('path')
    .datum(points)
    .classed('sparkline',true)
    .attr('d', line)

  g.append('circle')
    .classed('sparkcircle',true)
    .attr('cx', -> x(_.last dates) )
    .attr('cy', -> y(_.last data.y) )
    .attr('r', 1.5)

build = (data)->
    console.log(data.contents.data)
    media_li = d3.select('#programs')
      .selectAll('li')
      .data(data.contents.data)
      .enter()
      .append("li")
        .classed("list-group-item",true)
      .append("div")
        .classed("media",true)
          
    media_li 
      .each (d,i)->
        media = d3.select @

        svg = media.append("div")
          .classed("pull-left",true)
          .append('svg')
            .classed("media-object",true)
            .attr('width', width)
            .attr('height', height)
            .append('g')
              .attr('transform', 'translate(0, 2)');

        sparkline svg, d
        
        body = media .append('div')
          .classed("media-body",true)
        body.append('h4')
          .classed("media-heading",true)
          .text( (d,i)-> d.name )
        body.append('p')
          .text (d,i)-> 
            sum=_.reduce d.y ,_sum, 0 
            "TOTAL CALLS: "+sum  
        body.append('p')
          .text (d,i)-> 
            sum= _.reduce d.y , _sum , 0
            "DAILY AVG: " +  ExtMath.truncate sum / d.y.length,2


$(document).ready ->
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build

