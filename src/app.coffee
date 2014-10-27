class ExtMath extends Math
  @truncate = (x, precision = 0) ->
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
    scale = scales[precision]
    Math.round(x * scale) / scale


$(document).ready( ->
  # color = d3.scale.category10();
  # h= window.innerHeight
  # w= window.innerWidth
  #
  # svg=d3.select('svg')
  #     .style({
  #       height : h,
  #       width : w
  #     })


  _sum = (memo, num) -> memo + num
  
  build = (data)->
      console.log(data.contents.data)
      d3.select('#programs')
        .selectAll('li')
        .data(data.contents.data)
        .enter()
        .append("li")
          .classed("list-group-item",true)
            
      d3.selectAll("li.list-group-item")
        .each (d,i)->
          e = d3.select @
          e.append("div")
            .classed("media",true)
          e.append('h4')
            .text( (d,i)-> d.name )
          e.append('p')
            .text( (d,i)-> 
              sum=_.reduce d.y ,_sum, 0 
              "SUM: "+sum  
            )
          e.append('p')
            .text( (d,i)-> 
              sum=_.reduce d.y ,_sum, 0 
              "AVG: " + ExtMath.truncate sum / d.y.length,2
            )
    
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build
)

