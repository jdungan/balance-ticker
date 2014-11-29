# utilities
parseDate = d3.time.format("%Y-%m-%d").parse

DateUtil = (JSdate,type)->
  if JSdate
    switch type
      when "M/D" then (JSdate.getMonth() + 1) + "/" + JSdate.getDate()

FillArray = (c,fill)->
  if fill?
    iter = -> ((v)->v)(fill)
  else
    iter = (v,i)->i+1
  Array.apply(null,Array(c)).map(iter)

class SmallGraph
  width : 96
  height : 32  
  x : d3.scale.linear().range([0, @::width])
  y : d3.scale.linear().range([ @::height, 0])

# sparkline adapted from http://www.tnoda.com/blog/2013-12-19
class Sparkline extends SmallGraph
  constructor: (g,d)->
    if d.calls.length > 0
      x = @x.domain d3.extent d.dates 
      y = @y.domain d3.extent d.calls
      line = d3.svg.line()
        .interpolate "basis"
        .x (d) -> x d[0]
        .y (d) -> y d[1]
        
      g.append('path')
        .datum(d.points())
        .classed('sparkline',true)
        .attr('d', line)

      g.append('circle')
        .attr({
          class: 'sparkcircle'
          cx: @x _.last d.dates
          cy: @y _.last d.calls
          r: 1.5
        })
      g
      
class Weekday extends SmallGraph
  labels : ['S','M','T','W','T','F','S'],
  x : d3.scale.ordinal().domain([0,1,2,3,4,5,6]).rangeRoundBands([0, @::width], .2),
  xAxis : d3.svg.axis().scale(@::x).orient("bottom"),
  
  constructor: (g,d)->
    days = FillArray(7,0)
    add_point = (p)-> days[p[0].getDay()] += p[1] 
    add_point point for point in d.points()
    @y.domain [0,d3.max days]

    bar = g.selectAll("g")
      .data(days)
      .enter().append("g")
      .attr("transform", (d,i) => "translate(" + @x(i) + ",0)")

    bar.append("rect")
      .attr({
        class: "bar"
        y:      (d) => @y(d)
        height: (d) => @height - @y(d)
        width:  @x.rangeBand()
      })

    ticks = g.append("g")
      .classed("x axis",true)
      .attr("transform", "translate(0," + @height + ")")
      .call(@xAxis);
   
    ticks.selectAll('text')
     .text (d,i) => @labels[i]
     
class Month extends SmallGraph
  labels : FillArray(31),
  x : d3.scale.ordinal().domain(@::labels).rangeRoundBands([0, @::width], .2),
  xAxis : d3.svg.axis().scale(@::x).orient("bottom").tickValues([1,7,14,21,31]),
  
  constructor: (g,d)->
    days = FillArray(31,0)
    add_point = (p)-> days[p[0].getDate()-1] += p[1] 
    add_point point for point in d.points()
    @y.domain [0,d3.max days]
    
    bar = g.selectAll("g")
      .data(days)
      .enter().append("g")
      .attr("transform", (d,i) => "translate(" + @x(i+1) + ",0)")

    bar.append("rect")
      .attr({
        class: "bar"
        y: (d) => @y(d)
        height: (d) => @height - @y(d)
        width: @x.rangeBand()
      })

    ticks = g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(-0.5," + @height + ")")
      .call(@xAxis);
  
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
    pastdays = _.last @calls,moving
    @sum(pastdays) / moving
  add: (points)->
    iter = (e,i,l)->
      date_pos = _.sortedIndex(@dates,e[0])
      date = @dates[date_pos] ? 0
      if e[0].valueOf() isnt date.valueOf()
        @dates= _.first(@dates,date_pos).concat  [e[0]] , _.rest(@dates,date_pos)
        @calls= _.first(@calls,date_pos).concat     [0] , _.rest(@calls,date_pos)
      @calls[date_pos]  += e[1]
    _.each points,iter,@
  points: ->
    _.zip @dates,@calls

build = (data)->
  # console.log(data)
  total_calls= new Summary     
  total_calls.name ="All phone numbers"
  display = _.map data,
    (v,i,l)->
      v.dates = _.map(v.x, (v,i,l) -> parseDate v ) 
      v.calls = _.map(v.y, (v,i,l) -> v-l[i-1]?=0 )  
      this_state = new Summary(v)
      total_calls.add this_state.points()
      this_state
  
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
          .attr('width', 112)
          .attr('height', 192)
      
      
      spark = svg.append('g')
        .attr('transform', 'translate(0, 2)');
            
      week = svg.append('g')
        .attr('transform', 'translate(0, 112)');

      month= svg.append('g')
        .attr('transform', 'translate(0, 48)');
        
      new Sparkline spark, d       
      
      new Weekday week, d

      new Month month, d

      body = media .append('div')
        .classed("media-body",true)

      body.append('h4')
        .classed("media-heading",true)
        .text d.name

      body.append('p')
        .text (d,i)-> 
          sentence = ["There were","","balance checks between","","and",""]
          sentence[1]=d.sum()
          sentence[3]=DateUtil(_.first(d.dates),"M/D")
          sentence[5]=DateUtil(_.last(d.dates),"M/D")+"."
          sentence.join " "
          
      body.append('p')
        .text (d,i)->
          tenday = d.avg(10).toFixed(1)
          chk = if tenday is 1 then " check" else " checks"
          "There was an average of  " + tenday + chk + " per day over the past 10 days."

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

  return 'Sorted by largest daily increase'
            
$(document).ready ->      
    msg = (text)->
      d3.select('#ticker_msg').text(text)
      
    msg 'Requesting balance check info ... '
    
    $.ajax {
      dataType: "json"
      url: 'https://plot.ly/~lippytak/184/balance-metrics-checks.json'
    }
    .done (data)->
      if data.data
        msg 'Got it.  Building reports now ...'
        msg build data.data
      else
        msg 'Sorry, no data was sent back.'
    .fail (err) ->
      msg 'Sorry, the request failed.'