var PASSWORD_STRENGTH_LABEL = ["Very weak", "Weak", "Medium", "Medium", "Strong"];
var YEAR_IN_MS = 31556926000;
var TOO_YOUNG = $('meta[name="dob.too.young"]').attr('content');
var AGE_OF_CONSENT = $('meta[name="dob.age.of.consent"]').attr('content');

var password_shown = false;
var shown_ageOfConsent_warning = false;
var ignore_nameFormat_warning = false;

function showPasswordStrength(score, feedback) {
    var $hintContainer = $('#password-hints');

    $('.password-strength-cube').each(function() {
        $(this).removeClass('score-0 score-1 score-2 score-3 score-4');
        $(this).addClass('score-' + score);
    });
    $('#password-strength-text').text('Strength: ' + PASSWORD_STRENGTH_LABEL[score]);

    $hintContainer.html(passwordHint(feedback.warning));
    for (var i = 0; i < feedback.suggestions.length; i++) {
        $hintContainer.append(passwordHint(feedback.suggestions[i]));
    }
}

function passwordHint(text) {
    if (text) {
        return '<span class="password-hint small">'
               + '<svg class="icon" aria-hidden="true">'
               + '<use xlink:href="register/images/icons.svg#icn-info-circle"></use>'
               + '</svg>'
               + text
               + '</span>';
    } else {
        return '';
    }
}

function checkRequirements(password) {
    var minPasswordSize = $('meta[name="password.bounds.min"]').attr('content');
    var maxPasswordSize = $('meta[name="password.bounds.max"]').attr('content');

    if (password.length < minPasswordSize) {
        $('#requirement-min').addClass('matched');
    } else {
        $('#requirement-min').removeClass('matched');
    }

    if (password.length > maxPasswordSize) {
        $('#requirement-max').addClass('matched');
    } else {
        $('#requirement-max').removeClass('matched');
    }

    // Ugly check brought by IE not supporting endsWidth
    if (password.lastIndexOf('/') === (password.length - 1)) {
        $('#requirement-forwardslash').addClass('matched');
    } else {
        $('#requirement-forwardslash').removeClass('matched');
    }

    if (password.indexOf('"') >= 0) {
        $('#requirement-quotes').addClass('matched');
    } else {
        $('#requirement-quotes').removeClass('matched');
    }
}

function checkPasswordMatch() {
    if (password_shown === true || $('#password').val() === $('#passwordConfirmation').val()) {
        $('#requirement-match').removeClass('matched');
    } else {
        $('#requirement-match').addClass('matched');
    }
}

function togglePasswordVisibility() {
    var password = document.getElementById('password');

    if (password.getAttribute('type') === 'password') {
        password_shown = true;
        password.setAttribute('type', 'text');
        $('#password-visibility-off').show();
        $('#password-visibility-on').hide();
        $('#passwordConfirmationSection').hide();
        $('#passwordConfirmation').prop('required', false);
    } else {
        password_shown = false;
        password.setAttribute('type', 'password');
        $('#password-visibility-off').hide();
        $('#password-visibility-on').show();
        $('#passwordConfirmationSection').show();
        $('#passwordConfirmation').prop('required', true);
    }

    $('#password').trigger('input');
}

function setUpPicker() {
    var $dateField = $('#bootstrapDateOfBirth');
    var $picker = $dateField.datepicker();
    $picker.format("dd/MM/yyyy");
    $picker.startDate('30/09/1981');
    $picker.show();

    var disabled = $dateField.attr('data-verified');

    if ($dateField.val() !== '0/0/0' && $dateField.attr('data-value') !== '') {
        var dob = new Date($dateField.attr('data-value'));
        var $day = $('.uoa-form__date-day');
        var $month = $('.uoa-form__date-month');
        var $year = $('.uoa-form__date-year');

        $day.val(dob.getDate());
        $month.val(dob.getMonth() + 1);
        $year.val(dob.getFullYear());

        // $picker.set('select', dob);
    }

    if (disabled === 'true') {
        $day.prop('readonly', 'true');
        $month.prop('readonly', 'true');
        $year.prop('readonly', 'true');
        // $picker.set('disable', true);
    }

    $picker.on('changeDate', function() {
        $('#my_hidden_input').val(
            $('#datepicker').datepicker('getFormattedDate')
        );
    });

    // $picker.on({
    //    set: function(context) {
    //        if (typeof context.select !== 'undefined') {
    //            validateDate(new Date(context.select));
    //        }
    //    }
    // });

    // TODO: Better calendar options that include dropdowns
    // $('.icon-calendar').hide();
}

function dateLessThan(date, years) {
    var today = new Date();

    // This is a rough conversion in years and will be out by a day or two usually
    var difference = (today - date) / YEAR_IN_MS;

    return difference < years;
}

function validateDate(date) {
    if (dateLessThan(date, AGE_OF_CONSENT) && !shown_ageOfConsent_warning) {
        shown_ageOfConsent_warning = true;
        $('#ageOfConsent-warning').show();
    }
}

function hideModals() {
    $('.modal').hide();
}

function passwordValid() {
    var passwordValid = true;

    $('.password-requirement').each(function() {
        if( $(this).hasClass('matched')) {
            $('#password-form').addClass('uoa-form__elt--error');
            passwordValid = false;
        }
    });

    return passwordValid;
}

function dobValid() {
    var dateOfBirth = $('#dateOfBirth').val();
    var input = dateOfBirth.split('/');
    var date = new Date(input[2], input[1] - 1, input[0]);

    if (dateOfBirth !== '0/0/0' && dateLessThan(date, TOO_YOUNG)) {
        $('#tooYoung-warning').show();
        return false;
    } else {
        return true;
    }
}

function nameFormatValid() {
    var nameValid = true;
    var checkPreferredName = $('#preferredNameRadioYes').is(':checked');

    $('.nameField').each(function() {
        // Ignore only the verified name fields
        if ($(this).prop('readonly')) {
            return;
        }
        if ($(this).hasClass('preferredName') && !checkPreferredName) {
            return;
        }
        var $field = $(this).val();
        if($field !== '' && $field === $field.toUpperCase()) {
            nameValid = false;
        } else if($field !== '' && $field === $field.toLowerCase()) {
            nameValid = false;
        }
    });

    return nameValid;
}

function startTimeoutTimer() {
    var timeout = parseInt($('meta[name="timeout"]').attr('content')) * 1000;
    setTimeout(function() {
        $('#timeout-warning').show();
    }, timeout);
}

// $(window).on("load", function () {
//     // setUpPicker();
    
// });


$(document).ready(function() {
    $('#bootstrapDateOfBirth').datepicker({
        startView: "years",
        autoClose: true
    });
    
    $('input[type=radio][name=hasPreferredName]').change(function() {
        if (this.value === "true") {
            $('#preferredNameSection').removeClass('collapse');
        } else {
            $('#preferredNameSection').addClass('collapse');
        }
    });

    $('#password').on('input', function() {
        // This feeds their personal information into the insecure passwords dictionary
        var user_inputs = [
            $('#email').val(),
            $('#firstName').val(),
            $('#middleName').val(),
            $('#lastName').val(),
            $('#preferredFirstName').val(),
            $('#preferredMiddleName').val(),
            $('#preferredLastName').val()
        ];
        var response = zxcvbn(this.value, user_inputs);
        showPasswordStrength(response.score, response.feedback);
        checkRequirements(this.value);
        checkPasswordMatch();
    });

    $('#passwordConfirmation').on('input', function() {
        checkPasswordMatch();
    });

    $('#password-toggle').on('click', togglePasswordVisibility);

    $('.modal-close').on('click', hideModals);

    $('#registerSubmit').on('click', function(event) {
        event.preventDefault();

        // Copy password to confirmation if visibility is on
        if (document.getElementById('password').getAttribute('type') !== 'password') {
            $('#passwordConfirmation').val($('#password').val());
        }

        // From forms.js, has to be loaded here to prevent validation conflicts
        var requiredFields = true;
        var valid = true;

        $('.uoa-form').find('.uoa-form__elt').each( function() {
            if (!$(this).uaoFormValidate(true)) {
                requiredFields = false;
            }
        });

        if (requiredFields) {
            valid = valid && passwordValid();
            valid = valid && dobValid();

            if (valid && !ignore_nameFormat_warning && !nameFormatValid()) {
                $('#nameFormat-warning').show();
                valid = false
            }

            if (valid) {
                var $submitButton = $('#registerSubmit');
                $submitButton.prop('disabled', 'disabled');
                $submitButton.addClass('disabled');
                $("#registerForm").submit();
            }
        }
    });

    $('#nameFormatContinue').on('click', function() {
        ignore_nameFormat_warning = true;
        var $submitButton = $('#registerSubmit');
        $submitButton.removeAttr('disabled');
        $submitButton.removeClass('disabled');
        $submitButton.click();
    });

    startTimeoutTimer();
    svg4everybody();
});