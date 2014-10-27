$(document).ready(function() {
  var build, data_url, _sum;
  _sum = function(memo, num) {
    return memo + num;
  };
  build = function(data) {
    console.log(data.contents.data);
    return d3.select('#programs').selectAll('li').data(data.contents.data).enter().append("li").classed("list-group-item", true).append('p').text(function(d, i) {
      return d.name;
    }).append('p').text(function(d, i) {
      return _.reduce(d.y, _sum, 0);
    });
  };
  data_url = 'http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?';
  return $.getJSON(data_url, build);
});
