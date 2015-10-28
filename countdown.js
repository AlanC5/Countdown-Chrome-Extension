// Beware of Sloppy Code

// Expanded Form is referred to as Year, Month, Day, Hour, Minute, Second, Milisecond
// One Year Form is the Expanded Form, but countdown to the user's next birthday
// Short Form is referred to as Year and Milisecond

var app = function() {
  // Check if user set a death date and birth date,
  // If user did set death date and birth date then start the countdown
  // If not then render the form for user to fill out
  if (localStorage.deathDate) {
    renderCountdownLoop();
  }
  else {
    renderForm();
    $("#submit").on("click", function(e) {
      submitForm(e);
    });
  }

};

// Sets up the countdown variables
function renderCountdownLoop() {
  // 365.25 accounts for leap years
  // 30.4375 is the average amount of days in a month per year
  var oneYear = 1000*60*60*24*365.25;
  var oneMonth = 1000*60*60*24*30.4375;
  var oneDay = 1000*60*60*24;
  var oneHour = 1000*60*60;
  var oneMinute = 1000*60;
  var oneSecond = 1000;

  toggleOption(oneYear, oneMonth, oneDay, oneHour, oneMinute, oneSecond);
}

// Giant Wrapper Function, originally created to toggle different time styles (hence the name)
// But added additional features and became more expansive
function toggleOption(oneYear, oneMonth, oneDay, oneHour, oneMinute, oneSecond) {

  var toggle = parseInt(localStorage.countDownToggle);
  var ambitionNum = localStorage.ambitionNum;

  var source = $("#option-template").html();
  var template = Handlebars.compile(source);
  $("body").append(template());
  var interval = setInterval(renderCountdown, 100, oneYear, oneMonth, oneDay, oneHour, oneMinute, oneSecond, toggle);

  // Checks if there are any ambitions and loads the associated symbols and description
  if (ambitionNum > 0) {
    chrome.storage.sync.get('ambitionList', function(obj) {
      var data = obj.ambitionList;
      var size = data.length;
      var symbol = [{
          symbolList: []
      }];

      var text = [{
          textList: []
      }];

      for (var i = 0; i < size; i++) {
        var symbolNumData = "symbol" + i.toString();
        var sList = symbol[0].symbolList;
        var tList = text[0].textList;
        sList.push({symbolNum : symbolNumData, ambitionSymbol : data[i].symbol});
        tList.push({symbolNum : symbolNumData, ambitionText : data[i].text});
      }

      // Checks if data is good and exists
      if (data) {
        source = $("#ambition-symbol-list-template").html();
        template = Handlebars.compile(source);
        $("body").prepend(template(symbol[0]));

        source = $("#ambition-text-list-template").html();
        template = Handlebars.compile(source);
        $("body").append(template(text[0]));

        // Hover over the symbol to display the associted description
        $("#ambition-symbol-list li").hover(function(){
          var locateText = $(this).attr("id");
          var $ambitionText = $("#ambition-text-list span[data-symbol=" + locateText + "]");
          $ambitionText.css("display", "block");
          }, function(){
          var locateText = $(this).attr("id");
          var $ambitionText = $("#ambition-text-list span[data-symbol=" + locateText + "]");
          $ambitionText.css("display", "none");
        });
      }
    });
  }

  // 0 is Expanded Form
  // 1 is One Year Form (Expanded)
  // 2 is Short Form
  $("body").on("click", ".fa-hourglass", function() {

    if (toggle === 2) {
      toggle = 0;
    }
    else if (toggle >= 0 && toggle < 2) {
      ++toggle;
    }

    clearInterval(interval);
    interval = setInterval(renderCountdown, 100, oneYear, oneMonth, oneDay, oneHour, oneMinute, oneSecond, toggle);
    localStorage.countDownToggle = toggle;
  });

  // Add an ambition
  $("body").on("click", ".fa-plus", function() {

    if (ambitionNum < 3) {
      $("body").off("click", ".fa-plus");
      $("body").off("click", ".fa-hourglass");

      $("#switch-timer").remove();
      $("#add-ambition").remove();
      $("#ambition-symbol-list").remove();
      $("#ambition-text-list").remove();
      source = $("#add-ambition-template").html();
      template = Handlebars.compile(source);
      $("#app").html(template({
        SYMBOL:   "globe"
      }));

      clearInterval(interval);
    }
    else {
      $("#message").fadeIn(1500).delay(1200).fadeOut(1500);

    }
  });

  // Create the ambition
  $("#app").on("click", "#accept", function() {
    // Check if there is a value inside description
    var inputText = $.trim($("#ambition-text").val());
    var symbol = $("#icon-box .fa").attr('class').substring(6);

    if (inputText) {

      chrome.storage.sync.get('ambitionList', function(obj) {
        var internalData = {
          ambitionId    : ambitionNum,
          text          : inputText,
          symbol        : symbol
        };

        var data = obj.ambitionList;
        if (!data) {
          var newData = [internalData];

          storeInChrome(newData);
        }

        else {
          data.push(internalData);
          storeInChrome(data);
        }

        function storeInChrome(data) {
          chrome.storage.sync.set({'ambitionList': data}, function() {
            localStorage.ambitionNum = ++ambitionNum;
            $("#app").off("click", "#accept");
            $("body").off("click", "#ambition-symbol-list li");
            $("#add-ambition").remove();
            renderCountdownLoop();
          });
        }
      });
    }
  });

  // Allows user to remove or achieve an AMBITION
  $("body").on("click", "#ambition-symbol-list li", function() {
    var find = $(this).attr("id");
    var currentSymbol = $(this).children("i").attr("class").substring(6);
    var currentText = $("#ambition-text-list").find("[data-symbol='" + find + "']").text();
    var currentId = find.substring(6);

    $("body").off("click", ".fa-plus");
    $("body").off("click", ".fa-hourglass");
    $("body").off("click", "#ambition-symbol-list li");
    $("#switch-timer").remove();
    $("#add-ambition").remove();
    $("#ambition-symbol-list").remove();
    $("#ambition-text-list").remove();

    source = $("#ambition-select-template").html();
    template = Handlebars.compile(source);
    $("#app").html(template({
      SYMBOL        : currentSymbol,
      ambitionText  : currentText,
      id            : currentId
    }));
    clearInterval(interval);
  });
}

// Allows user to change symbol when adding AMBITION
$("#app").on("click", "#icon-box", function() {
  $("#add-ambition").css({"display" : "none"});
  var source = $("#change-symbol-template").html();
  var template = Handlebars.compile(source);
  $("#app").append(template());
});

$("#app").on("click", "#change-Symbol li", function() {
  var symbol = $(this).html();
  $("#change-Symbol").remove();
  $("#add-ambition").children("footer").children("#icon-box").html(symbol);
  $("#add-ambition").css({"display" : "block"});
});

// Delete Ambition
$("#app").on("click", "#delete-ambition", removeAmbition);

$("#app").on("click", "#return", function() {


  $("#app").html("");
  renderCountdownLoop();
});

// Achieve Ambition (Remove)
$("#app").on("click", "#achieve-ambition", removeAmbition);

function removeAmbition() {
  var type = $(this).text();


  chrome.storage.sync.get('ambitionList', function(obj) {
    var data = obj.ambitionList;
    var size = data.length;
    var selectedId = $("#app").children("footer").data("ambitionid");

    $("body").off("click", ".fa-plus");
    $("body").off("click", ".fa-hourglass");
    $("#app").off("click", "#accept");

    for (var i = 0; i < size; i++) {
      if (parseInt(data[i].ambitionId) === selectedId) {

        data.splice(i, 1);
        var newSize = data.length;

        for (var j = 0; j < newSize; j++) {
          data[j].ambitionId = j;
        }

        break;
      }
    }

    chrome.storage.sync.set({'ambitionList': data}, function() {
      localStorage.ambitionNum = --size;
      if (type === "Achieve") {
        $("#message0").fadeIn(1500).delay(1200).fadeOut(1500);
      }
      $("#app").html("");
      renderCountdownLoop();
    });


  });
}

// Render the countdown toogle will determine which form the countdown will take
function renderCountdown(oneYear, oneMonth, oneDay, oneHour, oneMinute, oneSecond, toggle) {

  var now = new Date();
  var deathDate = new Date(localStorage.deathDate);
  var duration;

  // Long Form
  if (toggle === 0) {
    // Casts to Miliseconds
    duration = deathDate - now;
    expandedForm(duration);
  }

  if (toggle === 1) {
    var nextBirthday = new Date(localStorage.dob);
    nextBirthday.setFullYear(now.getFullYear() + 1);
    // Casts to Miliseconds
    duration = nextBirthday - now;
    expandedForm(duration);
  }

  // Short Form
  if (toggle === 2) {
    duration = deathDate - now;
    var Year = duration / oneYear;
    var yearMillisecond = Year.toFixed(9).toString().split('.');

    source = $("#countdown-short-template").html();
    template = Handlebars.compile(source);
    $("#app").html(template({
      YEAR:         yearMillisecond[0],
      MILLISECOND: yearMillisecond[1]
    }));
  }


  function expandedForm(duration) {
    var Year = duration / oneYear;
    var leftOver = Year % 1;
    Year = padZero(Math.floor(Year));

    var Month = (leftOver * oneYear) / oneMonth;
    leftOver = Month % 1;
    Month = padZero(Math.floor(Month));

    var Day = (leftOver * oneMonth) / oneDay;
    leftOver = Day % 1;
    Day = padZero(Math.floor(Day));

    var Hour = (leftOver * oneDay) / oneHour;
    leftOver = Hour % 1;
    Hour = padZero(Math.floor(Hour));

    var Minute = (leftOver * oneHour) / oneMinute;
    leftOver = Minute % 1;
    Minute = padZero(Math.floor(Minute));

    var Second = (leftOver * oneMinute) / oneSecond;
    leftOver = Second % 1;
    Second = padZero(Math.floor(Second));

    var Milisecond = padZero(Math.floor(leftOver * oneSecond / 10));

    var source = $("#countdown-long-template").html();
    var template = Handlebars.compile(source);
    $("#app").html(template({
      YEAR:         Year,
      MONTH:        Month,
      DAY:          Day,
      HOUR:         Hour,
      MINUTE:       Minute,
      SECOND:       Second,
      MILLISECOND:  Milisecond
    }));
  }

}

// First time users will input data concerning birth date and death age
function renderForm() {
  var source = $("#question-template").html();
  var template = Handlebars.compile(source);
  $("#app").html(template);
}

// Submit the Form and store the data
function submitForm(e) {
  e.preventDefault();
  var birthInput = $("#birthdate")[0];
  var birthDate = birthInput.valueAsDate;
  var deathInput = $("#deathage").val();

  // Check if there is a valid birthDate entered and if deathInput is empty
  if (birthDate && deathInput !== "") {
    // Stores birthDate and deathInput in localStorage
    localStorage.dob = birthDate;
    localStorage.deathAge = deathInput;
    var deathYear = parseInt(birthDate.getFullYear()) + parseInt(deathInput);

    var deathDate = birthDate;
    deathDate.setFullYear(deathYear);

    localStorage.deathDate = deathDate;
    localStorage.countDownToggle = 0;

    if (!localStorage.ambitionNum) {
      localStorage.ambitionNum = 0;
    }

    renderCountdownLoop();
  }
}

// Pads the numbers for the long form - Convert integers to strings and add a 0 in front of numbers less than 10
function padZero(num) {
  var paddedNumber = num.toString();
  if (num < 10) {
      paddedNumber = "0" + paddedNumber;
  }
  return paddedNumber;
}

// Create an instance of the app
window.app = new app();
