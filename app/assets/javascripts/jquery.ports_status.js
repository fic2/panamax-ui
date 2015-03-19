(function($) {
  $.PMX.PortsStatus = function($el, options) {
    var base = this;

    base.$el = $el;
    base.xhr = null;
    base.timer = null;

    base.defaultOptions = {
      refreshInterval: 11300,
      currentInterval: 2000,
      $portsRunning: base.$el.find('.ports-running')
    };

    base.init = function() {
      base.options = $.extend({}, base.defaultOptions, options);
      base.bindEvents();
      base.fetchStatus();
    };

    base.bindEvents = function() {
      base.$el.on('update-service-status', base.updateStatus);
    };

    base.fetchStatus = function() {
      if (base.xhr) {
        base.xhr.abort();
      }

      base.xhr = $.ajax({
        url: base.$el.data('source')
      });

      base.xhr.done(function(response, status) {
        base.$el.trigger('update-service-status', [response]);
        clearTimeout(base.timer);
        var interval = base.options.currentInterval;
        base.options.currentInterval = Math.min(interval * 2, base.options.refreshInterval);
        base.timer = setTimeout(base.fetchStatus, interval);
      });
    };

    base.addEntries = function(privateIp, key, value) {
      var entrie = function() {
        if (value) {
          var port = value[0].HostPort;
          var ref = 'http://' + location.hostname + ':' + port;
          return $('<li>')
            .append($('<span>').append('public '))
            .append(
              $('<a>').attr('href', ref)
                .append(ref))
            .append(
              $('<span class="private">').append(' --> (private ' + privateIp + ':' + key + ')'));
        } else {
          return $('<li>').append(
            $('<span class="private">').append('(private ' + privateIp + ':' + key + ')'));
        }
      };
      base.options.$portsRunning.append(entrie());
    };

    base.updateStatus = function(_, service) {
      base.options.$portsRunning.empty();
      if (service.docker_status && 'info' in service.docker_status
          && 'NetworkSettings' in service.docker_status.info
          && 'Ports' in service.docker_status.info.NetworkSettings) {
        var privateIp = service.docker_status.info.NetworkSettings.IPAddress;
        var ports = service.docker_status.info.NetworkSettings.Ports;
        for (var key in ports) {
          base.addEntries(privateIp, key, ports[key]);
        }
      } else {
        base.options.$portsRunning.append('no used ports');
      }
    };

  };

  $.fn.portsStatus = function(options){
    return this.each(function() {
      (new $.PMX.PortsStatus($(this), options)).init();
    });
  };

})(jQuery);
