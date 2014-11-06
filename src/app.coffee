# copied from http://www.calicowebdev.com/2011/05/01/simple-coffeescript-introduction/
class ExtMath extends Math
  @truncate = (x, precision = 0) ->
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
    scale = scales[precision]
    Math.round(x * scale) / scale

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
  
  if data.length > 0
    g.append('path')
      .datum(data)
      .classed('sparkline',true)
      .attr('d', line)

    g.append('circle')
      .classed('sparkcircle',true)
      .attr('cx', -> x( _.last(data)[0] ) )
      .attr('cy', -> y( _.last(data)[1] ) )
      .attr('r', 1.5)

DateUtil = (JSdate,type)->
  if JSdate
    switch type
      when "M/D" then (JSdate.getMonth() + 1) + "/" + JSdate.getDate()

class Summary
  constructor:->
    @name =""  
    @calls=[]
    @dates=[]
  sum : ->
    if @calls.length > 0
      _.reduce @calls,(memo, num) -> memo + num
    else
      0
  max : -> _.reduce @calls,(m,n)-> if n>m then n else m
  min : -> _.reduce @calls,(m,n)-> if n<m then n else m
  avg : -> ExtMath.truncate @sum() / @calls.length,1
    
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
    _.zip @dates,@calls



build = (data)->
    console.log(data)
    total_calls= new Summary        
    total_calls.name ="ALL"
    
    display = _.map(data.contents.data,
      (v,i,l)->
        dates = _.map(v.x, (v,i,l) -> parseDate v ) 
        calls = _.map(v.y, (v,i,l) -> v-l[i-1]?=0 )  
        this_state = new Summary
        this_state.name = v.name
        this_state.add(_.zip(dates,calls))              
        total_calls.add this_state.points()
        this_state
    )
    
    display.unshift total_calls
    
    media_li = d3.select('#programs')
      .selectAll('li')
      .data(display)
      .enter()
      .append("li")
        .classed("list-group-item",true)
      .append("div")
        .classed("media",true)

    media_li 
      .each (d,i)->

        x.domain d3.extent d.dates 
        y.domain d3.extent d.calls  

        media = d3.select @

        svg = media.append("div")
          .classed("pull-left",true)
          .append('svg')
            .classed("media-object",true)
            .attr('width', width)
            .attr('height', height)
            .append('g')
              .attr('transform', 'translate(0, 2)');

        sparkline svg, d.points()
        
        body = media .append('div')
          .classed("media-body",true)
        body.append('h4')
          .classed("media-heading",true)
          .text (d,i)->d.name
        body.append('p')
          .text (d,i)-> 
            lastdate=_.last(d.dates)
            "There have been " + d.sum() + " balance checks by the end of " + DateUtil(lastdate,"M/D")
        body.append('p')
          .text (d,i)-> "The average checks per day is " +  d.avg()
        body.append('p').text (d,i)->
            lastcalls = _.last(d.calls,2)
            lastdates = _.last(d.dates,2)
            diff= lastcalls[1] - lastcalls[0]
            sentence = ["","","","on","","than on",""]
            sentence[0] = if (Math.abs diff) is 1 then "There was" else "There were"
            sentence[1] = Math.abs diff
            sentence[2] = if diff > 0 then "more" else "fewer" 
            sentence[4] = DateUtil lastdates[1],"M/D"
            sentence[6] = DateUtil lastdates[0],"M/D"
            sentence.join " "
            
$(document).ready ->
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build

