// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function ($, window, document, undefined) {

  "use strict";

  // undefined is used here as the undefined global variable in ECMAScript 3 is
  // mutable (ie. it can be changed by someone else). undefined isn't really being
  // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
  // can no longer be modified.

  // window and document are passed through as local variable rather than global
  // as this (slightly) quickens the resolution process and can be more efficiently
  // minified (especially when both are regularly referenced in your plugin).

  // Create the defaults once
  var
    pluginName = "formValidators",
    defaults = {

    };

  // The actual plugin constructor
  function Plugin(element, options) {
    this.element = element;
    // jQuery has an extend method which merges the contents of two or
    // more objects, storing the result in the first object. The first object
    // is generally empty as we don't want to alter the default options for
    // future instances of the plugin
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  // Avoid Plugin.prototype conflicts
  $.extend(Plugin.prototype, {
    init: function () {
      var self = this;
      // Place initialization logic here
      // You already have access to the DOM element and
      // the options via the instance, e.g. this.element
      // and this.settings
      // you can add more functions like the one below and
      // call them like so: this.yourOtherFunction(this.element, this.settings).
      $(self.element).bind('submit', function(event){
        event.preventDefault();
        self.refreshForm(this.element);

        //TODO: Prevent default form submit, implement another ajax call or something else if form validated.
        if (self.doValidate()) {
          // Do something
        } else {
          return false;
        }
      });
    },
    doValidate: function () {
      var self = this;
      var result = false;
      var validators = self.buildValidators();
      // validate each field in form
      $('input').each(function (index, elem) {
        result = self.validateField($(elem), validators);
      });
      return result;
    },
    validateField: function ($o, validators) {
      var self = this;
      var errorIndex = -1;

      for(var i = 0; i < validators.length; i++) {
        if (self.hasValidator($o, validators[i][0])) {
          if (validators[i][1]($o)) {
            if ($o.attr('validator') === validators[i][0]) {
              errorIndex = i;
            }
          } else {
            break;
          }
        }
      }

      if(errorIndex !== -1){
        self.buildErrorMessage($o, validators[errorIndex][2]);
        return false;
      } else {
        return true;
      }
    },
    buildValidators: function() {
      var self = this;
      // default validators
      var validators = [
        ['required', function ($o) {
          return $o.val() == '';
        }, 'Please enter the appropriate text in this field..'],
        ['checked', function ($o) {
          return !$o.is(':checked');
        }, 'It is required that you check this check box.'],
        ['email', function ($o) {
          return !$($o).val().match(/^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/);
        }, 'Please enter a valid email address. For example john@somedomain.com.'],
        ['phone', function ($o) {
          return !$($o).val().match(/^[01]?[- .]?\(?(?!\d[1]{2})[2-9]\d{2}\)?[- .]?(?!\d[1]{2})\d{3}[- .]?\d{4}$/);
        }, 'Please enter a valid US phone number. For example (603) 555-5555'],
        ['password', function ($o) {
          return !$($o).val().match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/);
        }, 'Please enter valid password. Minimum 8 charactes at least 1 alphabet and 1 number.']
      ];

      // check if custom validators, then apply them
      if (self.settings.customEmailValidator) {
        if (self.settings.customEmailValidator.regex) {
          validators[2][1] = function($o) {
            return !$o.val().match(self.settings.customEmailValidator.regex);
          }
        }
        if (self.settings.customEmailValidator.message) {
          validators[2][2] = self.settings.customEmailValidator.message;
        }
      }

      if (self.settings.customPhoneValidator) {
        if (self.settings.customPhoneValidator.regex) {
          validators[3][1] = function($o) {
            return !$o.val().match(self.settings.customPhoneValidator.regex);
          }
        }
        if (self.settings.customPhoneValidator.message) {
          validators[3][2] = self.settings.customPhoneValidator.message;
        }
      }

      if (self.settings.isStrongPassword) {
        validators[4][1] = function ($o) {
          return !$($o).val().match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/);
        };
        validators[4][2] = 'Please enter valid password. Minimum 8 charactes at least 1 Uppercase Alphabet, 1 Lowercase Alphabet, 1 Number and 1 Special Character.'
      }

      return validators;

      // TODO: apply these other validators same as above
    },
    buildErrorMessage: function($o, message) {
      console.log(message);
      var errorElement = '<div class="alert alert-danger" role="alert"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>'
                          + '<span class="sr-only">Error: </span>' + message + '</div>';
      return $o.after(errorElement);
    },
    hasValidator: function($o, validator){
      var fieldValidator = ($o.attr('validator'));
      return fieldValidator == validator;
    },
    refreshForm: function() {
      $('div', this.element).remove('.alert');
    }
  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function (options) {
    return this.each(function () {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin($(this), options));
      }
    });
  };

})(jQuery, window, document);
