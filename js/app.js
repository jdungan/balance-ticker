var ExtMath,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ExtMath = (function(_super) {
  __extends(ExtMath, _super);

  function ExtMath() {
    return ExtMath.__super__.constructor.apply(this, arguments);
  }

  ExtMath.truncate = function(x, precision) {
    var scale, scales;
    if (precision == null) {
      precision = 0;
    }
    scales = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
    scale = scales[precision];
    return Math.round(x * scale) / scale;
  };

  return ExtMath;

})(Math);

$(document).ready(function() {
  var build, data_url, _sum;
  _sum = function(memo, num) {
    return memo + num;
  };
  build = function(data) {
    console.log(data.contents.data);
    d3.select('#programs').selectAll('li').data(data.contents.data).enter().append("li").classed("list-group-item", true);
    return d3.selectAll("li.list-group-item").each(function(d, i) {
      var e;
      e = d3.select(this);
      e.append("div").classed("media", true);
      e.append('h4').text(function(d, i) {
        return d.name;
      });
      e.append('p').text(function(d, i) {
        var sum;
        sum = _.reduce(d.y, _sum, 0);
        return "SUM: " + sum;
      });
      return e.append('p').text(function(d, i) {
        var sum;
        sum = _.reduce(d.y, _sum, 0);
        return "AVG: " + ExtMath.truncate(sum / d.y.length, 2);
      });
    });
  };
  data_url = 'http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?';
  return $.getJSON(data_url, build);
});
