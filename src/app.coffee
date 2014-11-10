# copied from http://www.calicowebdev.com/2011/05/01/simple-coffeescript-introduction/
class ExtMath extends Math
  @truncate = (x, precision = 0) ->
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
    scale = scales[precision]
    Math.round(x * scale) / scale

# sparkline adapted from http://www.tnoda.com/blog/2013-12-19
sparkline =
  width : 96
  height : 64

x = d3.scale.linear().range([0, sparkline.width - 2])
y = d3.scale.linear().range([sparkline.height - 4, 0])

sparkline.line = d3.svg.line()
  .interpolate("bundle")
  .x( (d) -> x( d[0] ) )
  .y( (d) -> y( d[1] ) )

sparkline.append = (g, d) ->
  if d.calls.length > 0
    x.domain d3.extent d.dates 
    y.domain d3.extent d.calls  
    g.append('path')
      .datum(d.points())
      .classed('sparkline',true)
      .attr('d', @line)

    g.append('circle')
      .classed('sparkcircle',true)
      .attr('cx', -> x _.last d.dates)
      .attr('cy', -> y _.last d.calls)
      .attr('r', 1.5)

parseDate = d3.time.format("%Y-%m-%d").parse

DateUtil = (JSdate,type)->
  if JSdate
    switch type
      when "M/D" then (JSdate.getMonth() + 1) + "/" + JSdate.getDate()

class Summary
  constructor:(obj)->
    if obj
      {@name,@dates,@calls} = obj
    @name ?= ""
    @dates ?= []
    @calls ?= []
    
  sum : (days)->
    days ?= @calls
    if @calls.length > 0
      _.reduce days,(memo, num) -> memo + num
    else
      0
  max : -> _.reduce @calls,(m,n)-> if n>m then n else m
  min : -> _.reduce @calls,(m,n)-> if n<m then n else m
  avg : (moving)->
    pastdays = _.last(@calls,moving)
    ExtMath.truncate @sum(pastdays) / pastdays.length,1
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
        v.dates = _.map(v.x, (v,i,l) -> parseDate v ) 
        v.calls = _.map(v.y, (v,i,l) -> v-l[i-1]?=0 )  
        this_state = new Summary(v)
        total_calls.add this_state.points()
        this_state
    )
    
    #sort by biggest call increase
    display = _.sortBy display,(v)->
      v.calls[v.calls.length-2]-v.calls[v.calls.length-1]
    
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

        media = d3.select @

        svg = media.append("div")
          .classed("pull-left",true)
          .append('svg')
            .classed("media-object",true)
            .attr('width', sparkline.width)
            .attr('height', sparkline.height)
            .append('g')
              .attr('transform', 'translate(0, 2)');

        sparkline.append svg, d
        
        body = media .append('div')
          .classed("media-body",true)

        body.append('h4')
          .classed("media-heading",true)
          .text (d,i)->d.name

        body.append('p')
          .text (d,i)-> 
            sentence = ["There were","","balance checks between","","and",""]
            sentence[1]=d.sum()
            sentence[3]=DateUtil(_.first(d.dates),"M/D")
            sentence[5]=DateUtil(_.last(d.dates),"M/D")+"."
            sentence.join " "
            
        body.append('p')
          .text (d,i)->
            tenday = d.avg(10)
            chk = if tenday is 1 then " check" else " checks"
            "There is an average of  " + tenday + chk + " per day over the past 10 days."

        body.append('p').text (d,i)->
            lastcalls = _.last(d.calls,2)
            lastdates = _.last(d.dates,2)
            diff= lastcalls[1] - lastcalls[0]
            sentence = ["There ...","num","more","checks","on","date","than on","date"]
            sentence[0] = if (Math.abs diff) is 1 then "There was" else "There were"
            sentence[1] = Math.abs diff
            sentence[2] = if diff > 0 then "more" else "fewer"
            sentence[3] = if (Math.abs diff) is 1 then "check" else "checks"
            sentence[5] = DateUtil lastdates[1],"M/D"
            sentence[7] = DateUtil( lastdates[0],"M/D" )+ "."
            if diff is 0
              sentence[1]="the"
              sentence[2]="same number of"
              sentence[6]="and"
            sentence.join " "
            
$(document).ready ->
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build

