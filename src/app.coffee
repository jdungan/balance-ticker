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
          .append('p')
          .text( (d,i)-> d.name )
          .append('p')
          .text( (d,i)-> _.reduce d.y ,_sum, 0 )
    
  data_url ='http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?' 
  $.getJSON data_url ,build
)

