var DateUtil, ExtMath, Sparkline, Summary, build, parseDate,
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

parseDate = d3.time.format("%Y-%m-%d").parse;

DateUtil = function(JSdate, type) {
  if (JSdate) {
    switch (type) {
      case "M/D":
        return (JSdate.getMonth() + 1) + "/" + JSdate.getDate();
    }
  }
};

Sparkline = (function() {
  Sparkline.prototype.width = 96;

  Sparkline.prototype.height = 64;

  Sparkline.prototype.x = d3.scale.linear().range([0, Sparkline.prototype.width - 2]);

  Sparkline.prototype.y = d3.scale.linear().range([Sparkline.prototype.height - 4, 0]);

  function Sparkline(g, d) {
    var line, x, y;
    if (d.calls.length > 0) {
      x = this.x.domain(d3.extent(d.dates));
      y = this.y.domain(d3.extent(d.calls));
      line = d3.svg.line().interpolate("basis").x(function(d) {
        return x(d[0]);
      }).y(function(d) {
        return y(d[1]);
      });
      g.append('path').datum(d.points()).classed('sparkline', true).attr('d', line);
      g.append('circle').classed('sparkcircle', true).attr('cx', this.x(_.last(d.dates))).attr('cy', this.y(_.last(d.calls))).attr('r', 1.5);
      g;
    }
  }

  return Sparkline;

})();

Summary = (function() {
  function Summary(obj) {
    if (obj) {
      this.name = obj.name, this.dates = obj.dates, this.calls = obj.calls;
    }
    if (this.name == null) {
      this.name = "";
    }
    if (this.dates == null) {
      this.dates = [];
    }
    if (this.calls == null) {
      this.calls = [];
    }
  }

  Summary.prototype.sum = function(days) {
    if (days == null) {
      days = this.calls;
    }
    if (this.calls.length > 0) {
      return _.reduce(days, function(memo, num) {
        return memo + num;
      });
    } else {
      return 0;
    }
  };

  Summary.prototype.max = function() {
    return _.reduce(this.calls, function(m, n) {
      if (n > m) {
        return n;
      } else {
        return m;
      }
    });
  };

  Summary.prototype.min = function() {
    return _.reduce(this.calls, function(m, n) {
      if (n < m) {
        return n;
      } else {
        return m;
      }
    });
  };

  Summary.prototype.avg = function(moving) {
    var pastdays;
    pastdays = _.last(this.calls, moving);
    return ExtMath.truncate(this.sum(pastdays) / moving, 1);
  };

  Summary.prototype.add = function(points) {
    var iter;
    iter = function(e, i, l) {
      var date, date_pos, _ref;
      date_pos = _.sortedIndex(this.dates, e[0]);
      date = (_ref = this.dates[date_pos]) != null ? _ref : 0;
      if (e[0].valueOf() !== date.valueOf()) {
        this.dates = _.first(this.dates, date_pos).concat([e[0]], _.rest(this.dates, date_pos));
        this.calls = _.first(this.calls, date_pos).concat([0], _.rest(this.calls, date_pos));
      }
      return this.calls[date_pos] += e[1];
    };
    return _.each(points, iter, this);
  };

  Summary.prototype.points = function() {
    return _.zip(this.dates, this.calls);
  };

  return Summary;

})();

build = function(data) {
  var display, media_li, total_calls;
  console.log(data);
  total_calls = new Summary;
  total_calls.name = "ALL";
  display = _.map(data, function(v, i, l) {
    var this_state;
    v.dates = _.map(v.x, function(v, i, l) {
      return parseDate(v);
    });
    v.calls = _.map(v.y, function(v, i, l) {
      var _name;
      return v - (l[_name = i - 1] != null ? l[_name] : l[_name] = 0);
    });
    this_state = new Summary(v);
    total_calls.add(this_state.points());
    return this_state;
  });
  display = _.sortBy(display, function(v) {
    return v.calls[v.calls.length - 2] - v.calls[v.calls.length - 1];
  });
  display.unshift(total_calls);
  media_li = d3.select('#programs').selectAll('li').data(display).enter().append("li").classed("list-group-item", true).append("div").classed("media", true);
  return media_li.each(function(d, i) {
    var body, g, media;
    media = d3.select(this);
    g = media.append("div").classed("pull-left", true).append('svg').classed("media-object", true).attr('width', 96).attr('height', 64).append('g').attr('transform', 'translate(0, 2)');
    new Sparkline(g, d);
    body = media.append('div').classed("media-body", true);
    body.append('h4').classed("media-heading", true).text(d.name);
    body.append('p').text(function(d, i) {
      var sentence;
      sentence = ["There were", "", "balance checks between", "", "and", ""];
      sentence[1] = d.sum();
      sentence[3] = DateUtil(_.first(d.dates), "M/D");
      sentence[5] = DateUtil(_.last(d.dates), "M/D") + ".";
      return sentence.join(" ");
    });
    body.append('p').text(function(d, i) {
      var chk, tenday;
      tenday = d.avg(10);
      chk = tenday === 1 ? " check" : " checks";
      return "There was an average of  " + tenday + chk + " per day over the past 10 days.";
    });
    return body.append('p').text(function(d, i) {
      var diff, lastcalls, lastdates, sentence;
      lastcalls = _.last(d.calls, 2);
      lastdates = _.last(d.dates, 2);
      diff = lastcalls[1] - lastcalls[0];
      sentence = ["There ...", "num", "more", "checks", "on", "date", "than on", "date"];
      sentence[0] = (Math.abs(diff)) === 1 ? "There was" : "There were";
      sentence[1] = Math.abs(diff);
      sentence[2] = diff > 0 ? "more" : "fewer";
      sentence[3] = (Math.abs(diff)) === 1 ? "check" : "checks";
      sentence[5] = DateUtil(lastdates[1], "M/D");
      sentence[7] = DateUtil(lastdates[0], "M/D") + ".";
      if (diff === 0) {
        sentence[1] = "the";
        sentence[2] = "same number of";
        sentence[6] = "and";
      }
      return sentence.join(" ");
    });
  });
};

$(document).ready(function() {
  var data_url;
  data_url = 'http://whateverorigin.org/get?url=' + encodeURIComponent('https://plot.ly/~lippytak/184/balance-metrics-checks.json') + '&callback=?';
  return $.getJSON(data_url).done(function(data) {
    if (data.contents.data) {
      build(data.contents.data);
      return d3.select('#ticker_msg').text('');
    } else {
      return d3.select('#ticker_msg').text('Sorry, the data is not available.');
    }
  }).fail(function(err) {
    return d3.select('#ticker_msg').text('Sorry, the request failed.');
  });
});

//# sourceMappingURL=data:application/json;base64,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IiMgY29waWVkIGZyb20gaHR0cDovL3d3dy5jYWxpY293ZWJkZXYuY29tLzIwMTEvMDUvMDEvc2ltcGxlLWNvZmZlZXNjcmlwdC1pbnRyb2R1Y3Rpb24vXG5jbGFzcyBFeHRNYXRoIGV4dGVuZHMgTWF0aFxuICBAdHJ1bmNhdGUgPSAoeCwgcHJlY2lzaW9uID0gMCkgLT5cbiAgICBzY2FsZXMgPSBbMSwgMTAsIDEwMCwgMTAwMCwgMTAwMDAsIDEwMDAwMCwgMTAwMDAwMCwgMTAwMDAwMDAsIDEwMDAwMDAwMF1cbiAgICBzY2FsZSA9IHNjYWxlc1twcmVjaXNpb25dXG4gICAgTWF0aC5yb3VuZCh4ICogc2NhbGUpIC8gc2NhbGVcblxuIyBkYXRlIHV0aWxpdGllc1xucGFyc2VEYXRlID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZFwiKS5wYXJzZVxuXG5EYXRlVXRpbCA9IChKU2RhdGUsdHlwZSktPlxuICBpZiBKU2RhdGVcbiAgICBzd2l0Y2ggdHlwZVxuICAgICAgd2hlbiBcIk0vRFwiIHRoZW4gKEpTZGF0ZS5nZXRNb250aCgpICsgMSkgKyBcIi9cIiArIEpTZGF0ZS5nZXREYXRlKClcblxuIyBzcGFya2xpbmUgYWRhcHRlZCBmcm9tIGh0dHA6Ly93d3cudG5vZGEuY29tL2Jsb2cvMjAxMy0xMi0xOVxuY2xhc3MgU3BhcmtsaW5lXG4gIHdpZHRoIDogOTZcbiAgaGVpZ2h0IDogNjRcbiAgeCA6IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFswLCBAOjp3aWR0aCAtIDJdKVxuICB5IDogZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWyBAOjpoZWlnaHQgLSA0LCAwXSlcbiAgY29uc3RydWN0b3I6IChnLGQpLT5cbiAgICBpZiBkLmNhbGxzLmxlbmd0aCA+IDBcbiAgICAgIHggPSBAeC5kb21haW4gZDMuZXh0ZW50IGQuZGF0ZXMgXG4gICAgICB5ID0gQHkuZG9tYWluIGQzLmV4dGVudCBkLmNhbGxzXG4gICAgICBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgICAuaW50ZXJwb2xhdGUgXCJiYXNpc1wiXG4gICAgICAgIC54IChkKSAtPiB4IGRbMF1cbiAgICAgICAgLnkgKGQpIC0+IHkgZFsxXVxuICAgICAgICBcbiAgICAgIGcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKGQucG9pbnRzKCkpXG4gICAgICAgIC5jbGFzc2VkKCdzcGFya2xpbmUnLHRydWUpXG4gICAgICAgIC5hdHRyKCdkJywgbGluZSlcblxuICAgICAgZy5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgIC5jbGFzc2VkKCdzcGFya2NpcmNsZScsdHJ1ZSlcbiAgICAgICAgLmF0dHIoJ2N4JywgQHggXy5sYXN0IGQuZGF0ZXMpXG4gICAgICAgIC5hdHRyKCdjeScsIEB5IF8ubGFzdCBkLmNhbGxzKVxuICAgICAgICAuYXR0cigncicsIDEuNSlcbiAgICAgIGdcblxuY2xhc3MgU3VtbWFyeVxuICBjb25zdHJ1Y3Rvcjoob2JqKS0+XG4gICAgaWYgb2JqXG4gICAgICB7QG5hbWUsQGRhdGVzLEBjYWxsc30gPSBvYmpcbiAgICBAbmFtZSA/PSBcIlwiXG4gICAgQGRhdGVzID89IFtdXG4gICAgQGNhbGxzID89IFtdXG4gICAgXG4gIHN1bSA6IChkYXlzKS0+XG4gICAgZGF5cyA/PSBAY2FsbHNcbiAgICBpZiBAY2FsbHMubGVuZ3RoID4gMFxuICAgICAgXy5yZWR1Y2UgZGF5cywobWVtbywgbnVtKSAtPiBtZW1vICsgbnVtXG4gICAgZWxzZVxuICAgICAgMFxuICBtYXggOiAtPiBfLnJlZHVjZSBAY2FsbHMsKG0sbiktPiBpZiBuPm0gdGhlbiBuIGVsc2UgbVxuICBtaW4gOiAtPiBfLnJlZHVjZSBAY2FsbHMsKG0sbiktPiBpZiBuPG0gdGhlbiBuIGVsc2UgbVxuICBhdmcgOiAobW92aW5nKS0+XG4gICAgcGFzdGRheXMgPSBfLmxhc3QgQGNhbGxzLG1vdmluZ1xuICAgIEV4dE1hdGgudHJ1bmNhdGUgQHN1bShwYXN0ZGF5cykgLyBtb3ZpbmcsMVxuICBhZGQ6IChwb2ludHMpLT5cbiAgICBpdGVyID0gKGUsaSxsKS0+XG4gICAgICBkYXRlX3BvcyA9IF8uc29ydGVkSW5kZXgoQGRhdGVzLGVbMF0pXG4gICAgICBkYXRlID0gQGRhdGVzW2RhdGVfcG9zXSA/IDBcbiAgICAgIGlmIGVbMF0udmFsdWVPZigpIGlzbnQgZGF0ZS52YWx1ZU9mKClcbiAgICAgICAgQGRhdGVzPSBfLmZpcnN0KEBkYXRlcyxkYXRlX3BvcykuY29uY2F0ICBbZVswXV0gLCBfLnJlc3QoQGRhdGVzLGRhdGVfcG9zKVxuICAgICAgICBAY2FsbHM9IF8uZmlyc3QoQGNhbGxzLGRhdGVfcG9zKS5jb25jYXQgICAgIFswXSAsIF8ucmVzdChAY2FsbHMsZGF0ZV9wb3MpXG4gICAgICBAY2FsbHNbZGF0ZV9wb3NdICArPSBlWzFdXG4gICAgXy5lYWNoIHBvaW50cyxpdGVyLEBcbiAgcG9pbnRzOiAtPlxuICAgIF8uemlwIEBkYXRlcyxAY2FsbHNcblxuYnVpbGQgPSAoZGF0YSktPlxuICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgdG90YWxfY2FsbHM9IG5ldyBTdW1tYXJ5ICAgICBcbiAgICB0b3RhbF9jYWxscy5uYW1lID1cIkFMTFwiXG4gICAgZGlzcGxheSA9IF8ubWFwKFxuICAgICAgZGF0YSxcbiAgICAgICh2LGksbCktPlxuICAgICAgICB2LmRhdGVzID0gXy5tYXAodi54LCAodixpLGwpIC0+IHBhcnNlRGF0ZSB2ICkgXG4gICAgICAgIHYuY2FsbHMgPSBfLm1hcCh2LnksICh2LGksbCkgLT4gdi1sW2ktMV0/PTAgKSAgXG4gICAgICAgIHRoaXNfc3RhdGUgPSBuZXcgU3VtbWFyeSh2KVxuICAgICAgICB0b3RhbF9jYWxscy5hZGQgdGhpc19zdGF0ZS5wb2ludHMoKVxuICAgICAgICB0aGlzX3N0YXRlXG4gICAgKVxuICAgIFxuICAgICNzb3J0IGJ5IGJpZ2dlc3QgY2FsbCBpbmNyZWFzZVxuICAgIGRpc3BsYXkgPSBfLnNvcnRCeSBkaXNwbGF5LCh2KS0+XG4gICAgICB2LmNhbGxzW3YuY2FsbHMubGVuZ3RoLTJdLXYuY2FsbHNbdi5jYWxscy5sZW5ndGgtMV1cbiAgICBcbiAgICBkaXNwbGF5LnVuc2hpZnQgdG90YWxfY2FsbHNcbiAgICBcbiAgICBtZWRpYV9saSA9IGQzLnNlbGVjdCgnI3Byb2dyYW1zJylcbiAgICAgIC5zZWxlY3RBbGwoJ2xpJylcbiAgICAgIC5kYXRhKGRpc3BsYXkpXG4gICAgICAuZW50ZXIoKVxuICAgICAgLmFwcGVuZChcImxpXCIpXG4gICAgICAgIC5jbGFzc2VkKFwibGlzdC1ncm91cC1pdGVtXCIsdHJ1ZSlcbiAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmNsYXNzZWQoXCJtZWRpYVwiLHRydWUpXG5cbiAgICBtZWRpYV9saSBcbiAgICAgIC5lYWNoIChkLGkpLT5cblxuICAgICAgICBtZWRpYSA9IGQzLnNlbGVjdCBAXG5cbiAgICAgICAgZyA9IG1lZGlhLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAgIC5jbGFzc2VkKFwicHVsbC1sZWZ0XCIsdHJ1ZSlcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgLmNsYXNzZWQoXCJtZWRpYS1vYmplY3RcIix0cnVlKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgOTYpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgNjQpXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMiknKTtcblxuICAgICAgICBuZXcgU3BhcmtsaW5lIGcsIGQgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgYm9keSA9IG1lZGlhIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgICAgLmNsYXNzZWQoXCJtZWRpYS1ib2R5XCIsdHJ1ZSlcblxuICAgICAgICBib2R5LmFwcGVuZCgnaDQnKVxuICAgICAgICAgIC5jbGFzc2VkKFwibWVkaWEtaGVhZGluZ1wiLHRydWUpXG4gICAgICAgICAgLnRleHQgZC5uYW1lXG5cbiAgICAgICAgYm9keS5hcHBlbmQoJ3AnKVxuICAgICAgICAgIC50ZXh0IChkLGkpLT4gXG4gICAgICAgICAgICBzZW50ZW5jZSA9IFtcIlRoZXJlIHdlcmVcIixcIlwiLFwiYmFsYW5jZSBjaGVja3MgYmV0d2VlblwiLFwiXCIsXCJhbmRcIixcIlwiXVxuICAgICAgICAgICAgc2VudGVuY2VbMV09ZC5zdW0oKVxuICAgICAgICAgICAgc2VudGVuY2VbM109RGF0ZVV0aWwoXy5maXJzdChkLmRhdGVzKSxcIk0vRFwiKVxuICAgICAgICAgICAgc2VudGVuY2VbNV09RGF0ZVV0aWwoXy5sYXN0KGQuZGF0ZXMpLFwiTS9EXCIpK1wiLlwiXG4gICAgICAgICAgICBzZW50ZW5jZS5qb2luIFwiIFwiXG4gICAgICAgICAgICBcbiAgICAgICAgYm9keS5hcHBlbmQoJ3AnKVxuICAgICAgICAgIC50ZXh0IChkLGkpLT5cbiAgICAgICAgICAgIHRlbmRheSA9IGQuYXZnKDEwKVxuICAgICAgICAgICAgY2hrID0gaWYgdGVuZGF5IGlzIDEgdGhlbiBcIiBjaGVja1wiIGVsc2UgXCIgY2hlY2tzXCJcbiAgICAgICAgICAgIFwiVGhlcmUgd2FzIGFuIGF2ZXJhZ2Ugb2YgIFwiICsgdGVuZGF5ICsgY2hrICsgXCIgcGVyIGRheSBvdmVyIHRoZSBwYXN0IDEwIGRheXMuXCJcblxuICAgICAgICBib2R5LmFwcGVuZCgncCcpLnRleHQgKGQsaSktPlxuICAgICAgICAgICAgbGFzdGNhbGxzID0gXy5sYXN0KGQuY2FsbHMsMilcbiAgICAgICAgICAgIGxhc3RkYXRlcyA9IF8ubGFzdChkLmRhdGVzLDIpXG4gICAgICAgICAgICBkaWZmPSBsYXN0Y2FsbHNbMV0gLSBsYXN0Y2FsbHNbMF1cbiAgICAgICAgICAgIHNlbnRlbmNlID0gW1wiVGhlcmUgLi4uXCIsXCJudW1cIixcIm1vcmVcIixcImNoZWNrc1wiLFwib25cIixcImRhdGVcIixcInRoYW4gb25cIixcImRhdGVcIl1cbiAgICAgICAgICAgIHNlbnRlbmNlWzBdID0gaWYgKE1hdGguYWJzIGRpZmYpIGlzIDEgdGhlbiBcIlRoZXJlIHdhc1wiIGVsc2UgXCJUaGVyZSB3ZXJlXCJcbiAgICAgICAgICAgIHNlbnRlbmNlWzFdID0gTWF0aC5hYnMgZGlmZlxuICAgICAgICAgICAgc2VudGVuY2VbMl0gPSBpZiBkaWZmID4gMCB0aGVuIFwibW9yZVwiIGVsc2UgXCJmZXdlclwiXG4gICAgICAgICAgICBzZW50ZW5jZVszXSA9IGlmIChNYXRoLmFicyBkaWZmKSBpcyAxIHRoZW4gXCJjaGVja1wiIGVsc2UgXCJjaGVja3NcIlxuICAgICAgICAgICAgc2VudGVuY2VbNV0gPSBEYXRlVXRpbCBsYXN0ZGF0ZXNbMV0sXCJNL0RcIlxuICAgICAgICAgICAgc2VudGVuY2VbN10gPSBEYXRlVXRpbCggbGFzdGRhdGVzWzBdLFwiTS9EXCIgKSsgXCIuXCJcbiAgICAgICAgICAgIGlmIGRpZmYgaXMgMFxuICAgICAgICAgICAgICBzZW50ZW5jZVsxXT1cInRoZVwiXG4gICAgICAgICAgICAgIHNlbnRlbmNlWzJdPVwic2FtZSBudW1iZXIgb2ZcIlxuICAgICAgICAgICAgICBzZW50ZW5jZVs2XT1cImFuZFwiXG4gICAgICAgICAgICBzZW50ZW5jZS5qb2luIFwiIFwiXG4gICAgICAgICAgICBcbiQoZG9jdW1lbnQpLnJlYWR5IC0+XG4gICAgZGF0YV91cmwgPSdodHRwOi8vd2hhdGV2ZXJvcmlnaW4ub3JnL2dldD91cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCgnaHR0cHM6Ly9wbG90Lmx5L35saXBweXRhay8xODQvYmFsYW5jZS1tZXRyaWNzLWNoZWNrcy5qc29uJykgKyAnJmNhbGxiYWNrPT8nIFxuICAgICQuZ2V0SlNPTihkYXRhX3VybClcbiAgICAgICAuZG9uZSAoZGF0YSktPlxuICAgICAgICAgaWYgZGF0YS5jb250ZW50cy5kYXRhXG4gICAgICAgICAgIGJ1aWxkIGRhdGEuY29udGVudHMuZGF0YVxuICAgICAgICAgICBkMy5zZWxlY3QoJyN0aWNrZXJfbXNnJykudGV4dCgnJylcbiAgICAgICAgIGVsc2VcbiAgICAgICAgICAgZDMuc2VsZWN0KCcjdGlja2VyX21zZycpLnRleHQoJ1NvcnJ5LCB0aGUgZGF0YSBpcyBub3QgYXZhaWxhYmxlLicpXG4gICAgICAgLmZhaWwgKGVycikgLT5cbiAgICAgICAgICBkMy5zZWxlY3QoJyN0aWNrZXJfbXNnJykudGV4dCgnU29ycnksIHRoZSByZXF1ZXN0IGZhaWxlZC4nKSJdfQ==