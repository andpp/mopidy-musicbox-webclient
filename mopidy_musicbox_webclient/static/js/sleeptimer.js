
(function() {
  var sleeptimerNav,
      dropdown,
      statusArea,
      timeLeftDisplay;
      running = false;

  function init() {
    sleeptimerNav = $('#navsleeptimer');
    dropdown = $('#sleeptimer');
    statusArea = $('#sleeptimer_status');
    timeLeftDisplay = $('#sleeptimer_timeleft');

    dropdown.on('change', function(){
      var val = this.value;

      if (val == 'Off') {
        if (running) {
          mopidy.sleeptimer.cancel();
        }
      }
      else {
        var duration = parseInt(val, 10);
        start(duration);
      }
    });


    // Using a timer for now as the mopidy object created in gui.js isn't available yet
    // and really don't want to have two websocket connections.
    // Perhaps gui.js needs a way for additional modules to register.

    window.setTimeout(function() {
//      mopidy.on('state:online', function() {
{
//        if (!!mopidy.sleeptimer) {

          mopidy.on('event:sleeptimerStarted', onServerStart);
          mopidy.on('event:sleeptimerTick', onServerTick);
          mopidy.on('event:sleeptimerExpired', onServerTimerExpired);
          mopidy.on('event:sleeptimerCancelled', onServerCancel);

          sleeptimerNav.show();
          // initialise with current state
          mopidy.sleeptimer.getState().done(function(state) {
            if (state.running) {
              onServerStart(state);
            }
          })
        }
//      });
    }, 200);
  }

  function start(duration) {
    renderTimeLeft(duration * 1000);
    statusArea.show();
    running = true;
    mopidy.sleeptimer.start({'duration': duration});
  }

  // pretty sure there's a library function somewhere to do this
  function formatDigits(n, numDigits) {
    s = n.toString();

    if (numDigits > 12) {
      numDigits = 12;
    }

    if (s.length < numDigits) {
      s = '000000000000'.substr(12 - (numDigits - s.length)) + s;
    }

    return s;
  }

  // and this
  function milliSecondsToHMS(dur) {
    var h, m, s;

    // round to nearest second
    var ms = dur % 1000;

    if (ms < 500) {
      dur -= ms;
    }
    else {
      dur += (1000 - ms);
    }

    dur = Math.floor(dur /1000);

    s = dur % 60;
    dur = Math.floor(dur/60);
    m = dur % 60;
    h = Math.floor(dur/60);

    return formatDigits(h, 2) + ':' + formatDigits(m, 2) + ':' + formatDigits(s, 2);
  }

  function renderTimeLeft(milliseconds) {
    timeLeftDisplay.html(milliSecondsToHMS(milliseconds));
  }

  function resetDisplay() {
    dropdown.val('Off');
    dropdown.trigger('change');
    statusArea.hide();
  }

  function onServerStart(state) {
    dropdown.val(state.duration);
    dropdown.selectmenu('refresh', true);
    onServerTick(state);
    statusArea.show();
  }

  function onServerTick(data) {
    var milliseconds = Math.floor((parseFloat(data.seconds_left) + 0.5) * 1000);
    var displayTime = milliSecondsToHMS(milliseconds);
    timeLeftDisplay.html(displayTime);
  }

  function onServerTimerExpired() {
    running = false;
    timeLeftDisplay.html('Ended');
    dropdown.val('Off');
    dropdown.trigger('change');
  }

  function onServerCancel() {
    running = false;
    resetDisplay();
  }

  // OK, let's go
  $(document).ready(init);

}
)();
