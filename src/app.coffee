# copied from http://www.calicowebdev.com/2011/05/01/simple-coffeescript-introduction/
class ExtMath extends Math
  @truncate = (x, precision = 0) ->
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
    scale = scales[precision]
    Math.round(x * scale) / scale

_sum = (memo, num) -> memo + num

# sparkline adapted from http://www.tnoda.com/blog/2013-12-19
width = 96
height = 64
x = d3.scale.linear().range([0, width - 2])
y = d3.scale.linear().range([height - 4, 0])
parseDate = d3.time.format("%Y-%m-%d").parse

line = d3.svg.line()
  .interpolate("basis")
  .x( (d) -> x( d[0] ) )
  .y( (d) -> y( d[1] ) )

sparkline = (g, data) -> 
  g.append('path')
    .datum(data)
    .classed('sparkline',true)
    .attr('d', line)

  g.append('circle')
    .classed('sparkcircle',true)
    .attr('cx', -> x( _.last(data)[0] ) )
    .attr('cy', -> y( _.last(data)[1] ) )
    .attr('r', 1.5)


class Summary
  constructor:->  
    @calls=[]
    @dates=[]
  add: (points)->
    iter = (e,i,l)->
      date_pos = _.sortedIndex(@dates,e[0])
      date = @dates[date_pos] ? 0
      if e[0].valueOf() isnt date.valueOf()
        @dates= _.first(@dates,date_pos).concat  [e[0]] , _.rest(@dates,date_pos)
        @calls= _.first(@calls,date_pos).concat  [0] , _.rest(@calls,date_pos)
      @calls[date_pos]  += e[1]

    _.each points,iter,@

  points: ->
    #drop last, possibly incomplete day
    all_days = _.zip @dates,@calls
    _.first(all_days,all_days.length-1)

all_states= new Summary        

build = (data)->
    console.log(data)
    
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
        dates = _.map(d.x, (v,i,l) -> parseDate v ) 
        calls = _.map(d.y, (v,i,l) -> v-l[i-1]?=0 )  
        points = _.zip(dates,calls)
        all_states.add points

        x.domain d3.extent dates 
        y.domain d3.extent calls  

        media = d3.select @

        svg = media.append("div")
          .classed("pull-left",true)
          .append('svg')
            .classed("media-object",true)
            .attr('width', width)
            .attr('height', height)
            .append('g')
              .attr('transform', 'translate(0, 2)');

        sparkline svg, points
        
        body = media .append('div')
          .classed("media-body",true)
        body.append('h4')
          .classed("media-heading",true)
          .text( (d,i)-> d.name )
        body.append('p')
          .text (d,i)-> 
            "TOTAL CALLS: "+ _.last(d.y)  
        body.append('p')
          .text (d,i)-> 
            sum= _.last(d.y)
            "DAILY AVG: " +  ExtMath.truncate sum / d.y.length,2
        body.append('p')
          .text (d,i)-> 
            lasttwo=_.last(calls,2)
            diff= lasttwo[1]? - lasttwo[0]?=0
            "CHG: " +  diff

    total_li = d3.select("#total")
      .append("li")
        .classed("list-group-item",true)
      .append("div")
        .classed("media",true)
      
    x.domain d3.extent all_states.dates 
    y.domain d3.extent all_states.calls  

    svg = total_li .append("div")
      .classed("pull-left",true)
      .append('svg')
        .classed("media-object",true)
        .attr('width', width)
        .attr('height', height)
        .append('g')
          .attr('transform', 'translate(0, 2)');
      
    full_days = all_states.points()
    sparkline svg, full_days 
    
    sum=_.reduce(all_states.calls, _sum) 
    
    body = total_li.append('div')
      .classed("media-body",true)
    body.append('h4')
      .classed("media-heading",true)
      .text( "ALL" )
    body.append('p')
      .text (d,i)->
        "TOTAL CALLS: "+ sum
    body.append('p')
      .text (d,i)-> 
        "DAILY AVG: " +  ExtMath.truncate sum / all_states.calls.length,2
    body.append('p')
      .text (d,i)-> 
        lasttwo=_.last(all_states.calls,2)
        diff= lasttwo[1]? - lasttwo[0]?=0
        "CHG: " +  diff

$(document).ready ->
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build

