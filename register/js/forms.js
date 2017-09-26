$.fn.uaoFormFieldValue = function() {
	"use strict";
	return this.val();
}

$.fn.uaoFormFieldPattern = function() {
	"use strict";
	return this.attr('pattern');
}

$.fn.uaoFormFieldIsRequired = function() {
	"use strict";
	return typeof this.attr('required') !== 'undefined';
}

$.fn.uaoFormFieldIsEmpty = function() {
	"use strict";
	return this.uaoFormFieldValue() === '';
}

$.fn.uoaFormFileIsTooBig = function(file) {
	"use strict";
	return (this.data('max-size') < file.size);
}

$.fn.uoaFormFileTypeIsWrong = function(file) {
	"use strict";
	return (!file.type.match(this.data('types')));
}

$.fn.uaoFormClearFieldError = function() {
	"use strict";

	var elt = $(this).closest('.uoa-form__elt');
	elt.removeClass('uoa-form__elt--error');
	elt.find('.uoa-form__elt-error').text('');
	this.attr('aria-invalid', 'false');

	// Clear the global error message
	this.closest('.uoa-form').find('.uoa-form__submit-alert').html('');
}

$.fn.uaoFormSetFieldError = function(which) {
	"use strict";

	var elt = $(this).closest('.uoa-form__elt');
	elt.addClass('uoa-form__elt--error');

	var errorMsg = elt.data(which);
	elt.find('.uoa-form__elt-error').html(errorMsg);

	this.attr('aria-invalid', 'true');
}

$.fn.uaoFormValidate = function(submitting) {
	"use strict";

	var input,
			fileInput,
			inputs,
			dateInputs,
			pass = true,
			passPattern = true;
	
	// Determine what kind of form element this is	
	switch(true) {
		case (this.is('.uoa-form__text')):
		case (this.is('.uoa-form__tel')):
			input = this.find('input');
		break;

		case (this.is('.uoa-form__file')):
			fileInput = this.find('input');
		break;
		
		case (this.is('.uoa-form__select')):
			input = this.find('select');
		break;

		case (this.is('.uoa-form__textarea')):
			input = this.find('textarea');
		break;

		case (this.is('.uoa-form__checkbox')):
		case (this.is('.uoa-form__radio')):
			inputs = this.find('input'); 
		break;

		case (this.is('.uoa-form__date')):
			dateInputs = this.find('input[type=tel]'); 
		break;
		
	}

	// Is the text field required?
	if (typeof input !== 'undefined') {
		if (input.uaoFormFieldIsRequired() && input.uaoFormFieldIsEmpty()) {
			pass = false;
		}
	
		if (input.uaoFormFieldPattern() !== 'undefined' && !input.uaoFormFieldIsEmpty() && !input.uaoFormFieldValue().match(input.uaoFormFieldPattern())) {
			pass = false;
			passPattern = false;
		}
	
		if (!pass) {
			input.uaoFormSetFieldError(!passPattern ? 'pattern-error-msg' : 'error-msg');
		} else {
			input.uaoFormClearFieldError();
		}
	}

	// Is the file field required and/or valid?
	if (typeof fileInput !== 'undefined') {
		
		if (fileInput.uaoFormFieldIsRequired() && fileInput.uaoFormFieldIsEmpty()) {
			pass = false;
			fileInput.uaoFormSetFieldError('error-msg');
		}	else if(!fileInput.uaoFormFieldIsEmpty()) {
			var file = fileInput.get(0).files[0];

			if (fileInput.uoaFormFileTypeIsWrong(file)) {
				pass = false;
				fileInput.uaoFormSetFieldError('type-error-msg');
			} else {
				if (fileInput.uoaFormFileIsTooBig(file)) {
					pass = false;
					fileInput.uaoFormSetFieldError('size-error-msg');
				}
			}
		
		}

		if (pass) {
			fileInput.uaoFormClearFieldError();
		}
	}

	// Are the radios or checkboxes required
	if (typeof inputs !== 'undefined') {
		if (typeof this.data('required') !== 'undefined' && this.data('required')) {
			
			pass = false;
			
			inputs.each(function() {
				if ($(this).is(':checked')) {
					pass = true;
				}
			});

			if (!pass) {
				inputs.uaoFormSetFieldError(!passPattern ? 'pattern-error-msg' : 'error-msg');
			} else {
				inputs.uaoFormClearFieldError();
			}
		}
	}

	// Is the date required?
	if (typeof dateInputs !== 'undefined') {

		var stillCompleting = false, passRequired = true, passMin = true, passMax = true;

		dateInputs.each(function() {
			if (typeof $(this).attr('required') !== 'undefined' && $(this).val() === '') {
				passRequired = false;
			}
			
			if ($(this).val() === '') {
				stillCompleting = true;
			}
		});
		
		var surrogate = dateInputs.closest('.uoa-form__date-container').find('.uoa-form__date--surrogate');

		if (!stillCompleting && !passRequired) {
			pass = false;
		} else {
			pass = true;
		}
		
		// If submitting the form
		if (submitting && stillCompleting && !passRequired) {
			pass = false;
		}

		// complete and invalid
		if (!stillCompleting && !isValidDate(surrogate.val())) {
			pass = false;
			passPattern = false;
		}

		// complete and valid but not within min/max
		if (!stillCompleting && isValidDate(surrogate.val()) && (typeof surrogate.attr('min') !== 'undefined' || typeof surrogate.attr('max') !== 'undefined')) {
			var parts = surrogate.val().split("/");
			var day = parseInt(parts[0], 10);
			var month = parseInt(parts[1], 10);
			var year = parseInt(parts[2], 10);
			
			var date = + new Date(year, month, day);
			
			if (typeof surrogate.attr('min') !== 'undefined') {
				var minParts = surrogate.attr('min').split('-');
				var minDay = parseInt(minParts[2], 10);
				var minMonth = parseInt(minParts[1], 10);
				var minYear = parseInt(minParts[0], 10);

				var minDate = + new Date(minYear, minMonth, minDay);

				if (date < minDate) {
					pass = false;
					passMin = false;
				}
			}

			if (typeof surrogate.attr('max') !== 'undefined') {
				var maxParts = surrogate.attr('max').split('-');
				var maxDay = parseInt(maxParts[2], 10);
				var maxMonth = parseInt(maxParts[1], 10);
				var maxYear = parseInt(maxParts[0], 10);

				var maxDate = + new Date(maxYear, maxMonth, maxDay);

				if (date > maxDate) {
					pass = false;
					passMax = false;
				}
			}

		}

		// If submitting the form
		if (typeof $(this).attr('required') !== 'undefined') {
			if (submitting && stillCompleting && !isValidDate(surrogate.val())) {
				pass = false;
				passPattern = false;
			}
		}

		if (!pass) {
			var errorMessage = 'error-msg';
			if (!passPattern) {
				errorMessage = 'pattern-error-msg';
			} else if (!passMin) {
				errorMessage = 'min-error-msg';
			} else if (!passMax) {
				errorMessage = 'max-error-msg';
			}
			dateInputs.uaoFormSetFieldError(errorMessage);
		} else {
			dateInputs.uaoFormClearFieldError();
		}
	}

	return pass;
};

$.fn.uoaFormCountrySelect = function() {
	"use strict";

	var countries = [{"name":"Israel","dial_code":"+972","code":"IL"},{"name":"Afghanistan","dial_code":"+93","code":"AF"},{"name":"Albania","dial_code":"+355","code":"AL"},{"name":"Algeria","dial_code":"+213","code":"DZ"},{"name":"AmericanSamoa","dial_code":"+1 684","code":"AS"},{"name":"Andorra","dial_code":"+376","code":"AD"},{"name":"Angola","dial_code":"+244","code":"AO"},{"name":"Anguilla","dial_code":"+1 264","code":"AI"},{"name":"Antigua and Barbuda","dial_code":"+1268","code":"AG"},{"name":"Argentina","dial_code":"+54","code":"AR"},{"name":"Armenia","dial_code":"+374","code":"AM"},{"name":"Aruba","dial_code":"+297","code":"AW"},{"name":"Australia","dial_code":"+61","code":"AU"},{"name":"Austria","dial_code":"+43","code":"AT"},{"name":"Azerbaijan","dial_code":"+994","code":"AZ"},{"name":"Bahamas","dial_code":"+1 242","code":"BS"},{"name":"Bahrain","dial_code":"+973","code":"BH"},{"name":"Bangladesh","dial_code":"+880","code":"BD"},{"name":"Barbados","dial_code":"+1 246","code":"BB"},{"name":"Belarus","dial_code":"+375","code":"BY"},{"name":"Belgium","dial_code":"+32","code":"BE"},{"name":"Belize","dial_code":"+501","code":"BZ"},{"name":"Benin","dial_code":"+229","code":"BJ"},{"name":"Bermuda","dial_code":"+1 441","code":"BM"},{"name":"Bhutan","dial_code":"+975","code":"BT"},{"name":"Bosnia and Herzegovina","dial_code":"+387","code":"BA"},{"name":"Botswana","dial_code":"+267","code":"BW"},{"name":"Brazil","dial_code":"+55","code":"BR"},{"name":"British Indian Ocean Territory","dial_code":"+246","code":"IO"},{"name":"Bulgaria","dial_code":"+359","code":"BG"},{"name":"Burkina Faso","dial_code":"+226","code":"BF"},{"name":"Burundi","dial_code":"+257","code":"BI"},{"name":"Cambodia","dial_code":"+855","code":"KH"},{"name":"Cameroon","dial_code":"+237","code":"CM"},{"name":"Canada","dial_code":"+1","code":"CA"},{"name":"Cape Verde","dial_code":"+238","code":"CV"},{"name":"Cayman Islands","dial_code":"+ 345","code":"KY"},{"name":"Central African Republic","dial_code":"+236","code":"CF"},{"name":"Chad","dial_code":"+235","code":"TD"},{"name":"Chile","dial_code":"+56","code":"CL"},{"name":"China","dial_code":"+86","code":"CN"},{"name":"Christmas Island","dial_code":"+61 8","code":"CX"},{"name":"Colombia","dial_code":"+57","code":"CO"},{"name":"Comoros","dial_code":"+269","code":"KM"},{"name":"Congo","dial_code":"+242","code":"CG"},{"name":"Cook Islands","dial_code":"+682","code":"CK"},{"name":"Costa Rica","dial_code":"+506","code":"CR"},{"name":"Croatia","dial_code":"+385","code":"HR"},{"name":"Cuba","dial_code":"+53","code":"CU"},{"name":"Cyprus","dial_code":"+537","code":"CY"},{"name":"Czech Republic","dial_code":"+420","code":"CZ"},{"name":"Denmark","dial_code":"+45","code":"DK"},{"name":"Djibouti","dial_code":"+253","code":"DJ"},{"name":"Dominica","dial_code":"+1 767","code":"DM"},{"name":"Dominican Republic","dial_code":"+1 849","code":"DO"},{"name":"Ecuador","dial_code":"+593","code":"EC"},{"name":"Egypt","dial_code":"+20","code":"EG"},{"name":"El Salvador","dial_code":"+503","code":"SV"},{"name":"Equatorial Guinea","dial_code":"+240","code":"GQ"},{"name":"Eritrea","dial_code":"+291","code":"ER"},{"name":"Estonia","dial_code":"+372","code":"EE"},{"name":"Ethiopia","dial_code":"+251","code":"ET"},{"name":"Faroe Islands","dial_code":"+298","code":"FO"},{"name":"Fiji","dial_code":"+679","code":"FJ"},{"name":"Finland","dial_code":"+358","code":"FI"},{"name":"France","dial_code":"+33","code":"FR"},{"name":"French Guiana","dial_code":"+594","code":"GF"},{"name":"French Polynesia","dial_code":"+689","code":"PF"},{"name":"Gabon","dial_code":"+241","code":"GA"},{"name":"Gambia","dial_code":"+220","code":"GM"},{"name":"Georgia","dial_code":"+995","code":"GE"},{"name":"Germany","dial_code":"+49","code":"DE"},{"name":"Ghana","dial_code":"+233","code":"GH"},{"name":"Gibraltar","dial_code":"+350","code":"GI"},{"name":"Greece","dial_code":"+30","code":"GR"},{"name":"Greenland","dial_code":"+299","code":"GL"},{"name":"Grenada","dial_code":"+1 473","code":"GD"},{"name":"Guadeloupe","dial_code":"+590","code":"GP"},{"name":"Guam","dial_code":"+1 671","code":"GU"},{"name":"Guatemala","dial_code":"+502","code":"GT"},{"name":"Guinea","dial_code":"+224","code":"GN"},{"name":"Guinea-Bissau","dial_code":"+245","code":"GW"},{"name":"Guyana","dial_code":"+595","code":"GY"},{"name":"Haiti","dial_code":"+509","code":"HT"},{"name":"Honduras","dial_code":"+504","code":"HN"},{"name":"Hungary","dial_code":"+36","code":"HU"},{"name":"Iceland","dial_code":"+354","code":"IS"},{"name":"India","dial_code":"+91","code":"IN"},{"name":"Indonesia","dial_code":"+62","code":"ID"},{"name":"Iraq","dial_code":"+964","code":"IQ"},{"name":"Ireland","dial_code":"+353","code":"IE"},{"name":"Israel","dial_code":"+972","code":"IL"},{"name":"Italy","dial_code":"+39","code":"IT"},{"name":"Jamaica","dial_code":"+1 876","code":"JM"},{"name":"Japan","dial_code":"+81","code":"JP"},{"name":"Jordan","dial_code":"+962","code":"JO"},{"name":"Kazakhstan","dial_code":"+7 7","code":"KZ"},{"name":"Kenya","dial_code":"+254","code":"KE"},{"name":"Kiribati","dial_code":"+686","code":"KI"},{"name":"Kuwait","dial_code":"+965","code":"KW"},{"name":"Kyrgyzstan","dial_code":"+996","code":"KG"},{"name":"Latvia","dial_code":"+371","code":"LV"},{"name":"Lebanon","dial_code":"+961","code":"LB"},{"name":"Lesotho","dial_code":"+266","code":"LS"},{"name":"Liberia","dial_code":"+231","code":"LR"},{"name":"Liechtenstein","dial_code":"+423","code":"LI"},{"name":"Lithuania","dial_code":"+370","code":"LT"},{"name":"Luxembourg","dial_code":"+352","code":"LU"},{"name":"Madagascar","dial_code":"+261","code":"MG"},{"name":"Malawi","dial_code":"+265","code":"MW"},{"name":"Malaysia","dial_code":"+60","code":"MY"},{"name":"Maldives","dial_code":"+960","code":"MV"},{"name":"Mali","dial_code":"+223","code":"ML"},{"name":"Malta","dial_code":"+356","code":"MT"},{"name":"Marshall Islands","dial_code":"+692","code":"MH"},{"name":"Martinique","dial_code":"+596","code":"MQ"},{"name":"Mauritania","dial_code":"+222","code":"MR"},{"name":"Mauritius","dial_code":"+230","code":"MU"},{"name":"Mayotte","dial_code":"+262","code":"YT"},{"name":"Mexico","dial_code":"+52","code":"MX"},{"name":"Monaco","dial_code":"+377","code":"MC"},{"name":"Mongolia","dial_code":"+976","code":"MN"},{"name":"Montenegro","dial_code":"+382","code":"ME"},{"name":"Montserrat","dial_code":"+1664","code":"MS"},{"name":"Morocco","dial_code":"+212","code":"MA"},{"name":"Myanmar","dial_code":"+95","code":"MM"},{"name":"Namibia","dial_code":"+264","code":"NA"},{"name":"Nauru","dial_code":"+674","code":"NR"},{"name":"Nepal","dial_code":"+977","code":"NP"},{"name":"Netherlands","dial_code":"+31","code":"NL"},{"name":"Netherlands Antilles","dial_code":"+599","code":"AN"},{"name":"New Caledonia","dial_code":"+687","code":"NC"},{"name":"New Zealand","dial_code":"+64","code":"NZ"},{"name":"Nicaragua","dial_code":"+505","code":"NI"},{"name":"Niger","dial_code":"+227","code":"NE"},{"name":"Nigeria","dial_code":"+234","code":"NG"},{"name":"Niue","dial_code":"+683","code":"NU"},{"name":"Norfolk Island","dial_code":"+672","code":"NF"},{"name":"Northern Mariana Islands","dial_code":"+1 670","code":"MP"},{"name":"Norway","dial_code":"+47","code":"NO"},{"name":"Oman","dial_code":"+968","code":"OM"},{"name":"Pakistan","dial_code":"+92","code":"PK"},{"name":"Palau","dial_code":"+680","code":"PW"},{"name":"Panama","dial_code":"+507","code":"PA"},{"name":"Papua New Guinea","dial_code":"+675","code":"PG"},{"name":"Paraguay","dial_code":"+595","code":"PY"},{"name":"Peru","dial_code":"+51","code":"PE"},{"name":"Philippines","dial_code":"+63","code":"PH"},{"name":"Poland","dial_code":"+48","code":"PL"},{"name":"Portugal","dial_code":"+351","code":"PT"},{"name":"Puerto Rico","dial_code":"+1 939","code":"PR"},{"name":"Qatar","dial_code":"+974","code":"QA"},{"name":"Romania","dial_code":"+40","code":"RO"},{"name":"Rwanda","dial_code":"+250","code":"RW"},{"name":"Samoa","dial_code":"+685","code":"WS"},{"name":"San Marino","dial_code":"+378","code":"SM"},{"name":"Saudi Arabia","dial_code":"+966","code":"SA"},{"name":"Senegal","dial_code":"+221","code":"SN"},{"name":"Serbia","dial_code":"+381","code":"RS"},{"name":"Seychelles","dial_code":"+248","code":"SC"},{"name":"Sierra Leone","dial_code":"+232","code":"SL"},{"name":"Singapore","dial_code":"+65","code":"SG"},{"name":"Slovakia","dial_code":"+421","code":"SK"},{"name":"Slovenia","dial_code":"+386","code":"SI"},{"name":"Solomon Islands","dial_code":"+677","code":"SB"},{"name":"South Africa","dial_code":"+27","code":"ZA"},{"name":"South Georgia and the South Sandwich Islands","dial_code":"+500","code":"GS"},{"name":"Spain","dial_code":"+34","code":"ES"},{"name":"Sri Lanka","dial_code":"+94","code":"LK"},{"name":"Sudan","dial_code":"+249","code":"SD"},{"name":"Suriname","dial_code":"+597","code":"SR"},{"name":"Swaziland","dial_code":"+268","code":"SZ"},{"name":"Sweden","dial_code":"+46","code":"SE"},{"name":"Switzerland","dial_code":"+41","code":"CH"},{"name":"Tajikistan","dial_code":"+992","code":"TJ"},{"name":"Thailand","dial_code":"+66","code":"TH"},{"name":"Togo","dial_code":"+228","code":"TG"},{"name":"Tokelau","dial_code":"+690","code":"TK"},{"name":"Tonga","dial_code":"+676","code":"TO"},{"name":"Trinidad and Tobago","dial_code":"+1 868","code":"TT"},{"name":"Tunisia","dial_code":"+216","code":"TN"},{"name":"Turkey","dial_code":"+90","code":"TR"},{"name":"Turkmenistan","dial_code":"+993","code":"TM"},{"name":"Turks and Caicos Islands","dial_code":"+1 649","code":"TC"},{"name":"Tuvalu","dial_code":"+688","code":"TV"},{"name":"Uganda","dial_code":"+256","code":"UG"},{"name":"Ukraine","dial_code":"+380","code":"UA"},{"name":"United Arab Emirates","dial_code":"+971","code":"AE"},{"name":"United Kingdom","dial_code":"+44","code":"GB"},{"name":"United States","dial_code":"+1","code":"US"},{"name":"Uruguay","dial_code":"+598","code":"UY"},{"name":"Uzbekistan","dial_code":"+998","code":"UZ"},{"name":"Vanuatu","dial_code":"+678","code":"VU"},{"name":"Wallis and Futuna","dial_code":"+681","code":"WF"},{"name":"Yemen","dial_code":"+967","code":"YE"},{"name":"Zambia","dial_code":"+260","code":"ZM"},{"name":"Zimbabwe","dial_code":"+263","code":"ZW"},{"name":"land Islands","dial_code":"","code":"AX"},{"name":"Antarctica","dial_code":null,"code":"AQ"},{"name":"Bolivia, Plurinational State of","dial_code":"+591","code":"BO"},{"name":"Brunei Darussalam","dial_code":"+673","code":"BN"},{"name":"Cocos (Keeling) Islands","dial_code":"+61 891","code":"CC"},{"name":"Congo, The Democratic Republic of the","dial_code":"+243","code":"CD"},{"name":"Cote d'Ivoire","dial_code":"+225","code":"CI"},{"name":"Falkland Islands (Malvinas)","dial_code":"+500","code":"FK"},{"name":"Guernsey","dial_code":"+44","code":"GG"},{"name":"Holy See (Vatican City State)","dial_code":"+379","code":"VA"},{"name":"Hong Kong","dial_code":"+852","code":"HK"},{"name":"Iran, Islamic Republic of","dial_code":"+98","code":"IR"},{"name":"Isle of Man","dial_code":"+44","code":"IM"},{"name":"Jersey","dial_code":"+44","code":"JE"},{"name":"Korea, Democratic People's Republic of","dial_code":"+850","code":"KP"},{"name":"Korea, Republic of","dial_code":"+82","code":"KR"},{"name":"Lao People's Democratic Republic","dial_code":"+856","code":"LA"},{"name":"Libyan Arab Jamahiriya","dial_code":"+218","code":"LY"},{"name":"Macao","dial_code":"+853","code":"MO"},{"name":"Macedonia, The Former Yugoslav Republic of","dial_code":"+389","code":"MK"},{"name":"Micronesia, Federated States of","dial_code":"+691","code":"FM"},{"name":"Moldova, Republic of","dial_code":"+373","code":"MD"},{"name":"Mozambique","dial_code":"+258","code":"MZ"},{"name":"Palestinian Territory, Occupied","dial_code":"+970","code":"PS"},{"name":"Pitcairn","dial_code":"+872","code":"PN"},{"name":"Réunion","dial_code":"+262","code":"RE"},{"name":"Russia","dial_code":"+7","code":"RU"},{"name":"Saint Barthélemy","dial_code":"+590","code":"BL"},{"name":"Saint Helena, Ascension and Tristan Da Cunha","dial_code":"+290","code":"SH"},{"name":"Saint Kitts and Nevis","dial_code":"+1 869","code":"KN"},{"name":"Saint Lucia","dial_code":"+1 758","code":"LC"},{"name":"Saint Martin","dial_code":"+590","code":"MF"},{"name":"Saint Pierre and Miquelon","dial_code":"+508","code":"PM"},{"name":"Saint Vincent and the Grenadines","dial_code":"+1 784","code":"VC"},{"name":"Sao Tome and Principe","dial_code":"+239","code":"ST"},{"name":"Somalia","dial_code":"+252","code":"SO"},{"name":"Svalbard and Jan Mayen","dial_code":"+47","code":"SJ"},{"name":"Syrian Arab Republic","dial_code":"+963","code":"SY"},{"name":"Taiwan, Province of China","dial_code":"+886","code":"TW"},{"name":"Tanzania, United Republic of","dial_code":"+255","code":"TZ"},{"name":"Timor-Leste","dial_code":"+670","code":"TL"},{"name":"Venezuela, Bolivarian Republic of","dial_code":"+58","code":"VE"},{"name":"Viet Nam","dial_code":"+84","code":"VN"},{"name":"Virgin Islands, British","dial_code":"+1 284","code":"VG"},{"name":"Virgin Islands, U.S.","dial_code":"+1 340","code":"VI"}];

	var countryRegExp = /\+[0-9]{2}\ ?[0-9]{0,3}/,
		selectVal = this.val(),
		selectContainer = $(this).closest('.uoa-form__select-container');

	if (selectVal.match(countryRegExp)) {
		var countryCode = selectVal;
		var isoCountryCode = '';
		
		for (var i in countries) {
			if (countries[i].dial_code === countryCode) {
				isoCountryCode = countries[i].code;
			}
		}

		selectContainer.addClass('flag-applied');
		selectContainer.find('.uoa-form__country-flag').remove();
		$(this).after('<span class="uoa-form__country-flag flag flag-'+isoCountryCode.toLowerCase()+'"></span>');
	} else {
		selectContainer.removeClass('flag-applied');
		selectContainer.find('.uoa-form__country-flag').remove();
	}
}

$.fn.uoaFormCheckboxChange = function() {
	"use strict";

	if (this.is('[type=radio]')) {
		this.closest('.uoa-form__elt').find('label').removeClass('on');
	}
	this.parent('label').toggleClass('on');

	if (this.is(':checked')) {
		this.uaoFormClearFieldError();
	} else {
		this.closest('.uoa-form__elt').uaoFormValidate();
	}
}

$.fn.uoaFormCheckboxFocus = function() {
	"use strict";

	this.closest('.uoa-form__elt').find('label').removeClass('focus');

	this.parent('label').toggleClass('focus');
}
$.fn.uoaFormCheckboxBlur = function() {
	"use strict";

	this.closest('.uoa-form__elt').find('label').removeClass('focus');
}

$.fn.uoaFormCheckboxPrecheck = function() {
	"use strict";
	this.attr("autocomplete", "off");
	(this.is(':checked') || this.prop("checked") === 'checked' )? this.parent('label').addClass('on') : this.parent('label').removeClass('on');
}

$.fn.uaoFormFileInput = function() {
	"use strict";

	var self = this;
	var elt = this.closest('.uoa-form__elt');

	var labelElt = this.closest('.uoa-form__elt').find('label');
	var label, title;
	var labelToSplit = labelElt.text();
	var labelParts = labelToSplit.split('|');
	
	console.log(labelParts.length);
	
	if (labelParts.length === 2) {
		label = labelParts[1];
		labelElt.text(labelParts[0]);
	} else {
		label = labelToSplit;
	}

	elt.addClass('uoa-form__file--surrogated');
	this.wrap('<div></div>');
	this.after('<div class="uoa-form__file-button">'+label+'</div>');

	var button = elt.find('.uoa-form__file-button');

	elt.on('click', '.uoa-form__del-file', function() {
		self.val('');
		button.removeClass('dropped').html(label);
		elt.find('.uoa-form__del-file').remove();
		elt.uaoFormClearFieldError(true);
	});

	this.on('change', function() {
		var file = $(this).get(0).files[0];
		
		if (typeof file !== 'undefined') {
			var roundedSize = (file.size < 1024*1024) ? Math.round(file.size/1024) + 'KB' : Math.round(file.size/1024/1024) + 'MB';
			
			button.addClass('dropped').html(file.name + ' (' + roundedSize + ')');
	
			if (!elt.find('.uoa-form__del-file').length) {
				self.next().after('<span class="uoa-form__del-file">Delete</span>');
			}
		} else {
			self.val('');
			button.removeClass('dropped').html(label);
			elt.find('.uoa-form__del-file').remove();
		}
		
		$(this).closest('.uoa-form__elt').uaoFormValidate();
	});
	
  this.get(0).ondragenter = function () {
		button.addClass('dragover');
  }
  this.get(0).ondragleave = function () {
		button.removeClass('dragover');
  }
  this.get(0).ondrop = function () {
		button.removeClass('dragover').addClass('dropped');
	}
	
}

$.fn.uoaFormConstraintsToPattern = function() {
	"use strict";

	var constraint = this.data('constraint'),
			type = 'text',
			pattern;

	if (typeof constraint !== 'undefined') {
		switch(constraint) {
			case 'Email':
				type = 'email';
				pattern = "^[^@ ]+@[^@ ]+.[^@ ]+$";
			break;

			case 'Numeric':
				type = 'number';
				pattern = "[0-9+-.]+";
			break;

			default:
				
			break;
		}
		
		this.attr('pattern', pattern).attr('type', type);
	}
}

$.fn.uoaFormDatePicker = function() {
	"use strict";

	var $dateInput = this.pickadate({
		// Don't show the buttons along the bottom.
		today: false,
		clear: false,
		close: false,
		firstDay: 1,

		// Makes the text input editable
		editable: true,

		format: 'dd/mm/yyyy',
//			formatSubmit: 'dd/mm/yyyy',

		onSet: function(context) {
			if (typeof context.select !== 'undefined') {

				var datePickerDate = new Date(context.select);
				var day = datePickerDate.getDate();
				var month = datePickerDate.getMonth()+1;
				var year = datePickerDate.getFullYear();

				var container = $picker.$holder.closest('.uoa-form__date-container');
	
				container.find('.uoa-form__date-day').val(day);
				container.find('.uoa-form__date-month').val(month);
				container.find('.uoa-form__date-year').val(year);
				
				container.closest('.uoa-form__elt').uaoFormValidate();
				
			}
		}
	});

	// Get a reference to the picker object.
	var $picker = $dateInput.pickadate('picker');

	// Set min and max
	if (typeof $(this).attr('min') !== 'undefined') {
		var splitMin = $(this).attr('min').split('-')
		$picker.set('min', [+splitMin[0], +splitMin[1]-1, +splitMin[2]]);
	}

	// Set min and max
	if (typeof $(this).attr('max') !== 'undefined') {
		var splitMax = $(this).attr('max').split('-')
		$picker.set('max', [+splitMax[0], +splitMax[1]-1, +splitMax[2]]);
	}

	// Date should open when the calendar icon is clicked.
	$(this).closest('.uoa-form__date-container').find('.icon-calendar').on('click', function() {
		if ($picker.$holder.closest('.uoa-form__date-container').find('.uoa-form__date--surrogate').attr('aria-expanded') === 'true') {
			$picker.close(false);
		} else {
			$picker.open(false);
		}
	});

	var label = this.closest('.uoa-form__date').find('label').text();
	var describer = this.attr('aria-describedby');
	var required = this.attr('required') ? 'required aria-required="true"' : '';

	this.addClass('uoa-form__date--surrogate');
	this.after('<input type="tel" min="1" max="31" name="dateOfBirth_day" id="dateOfBirth_day" class="uoa-form__date-day" placeholder="DD" maxlength="2" aria-describedby="'+describer+'"'+required+' aria-label="'+label+', Day"><input type="tel" min="1" max="12" class="uoa-form__date-month" name="dateOfBirth_month" id="dateOfBirth_month" placeholder="MM" maxlength="2" aria-describedby="'+describer+'"'+required+' aria-label="'+label+', Month"><input type="tel" min="1816" max="2116" class="uoa-form__date-year" name="dateOfBirth_year" id="dateOfBirth_year" placeholder="YYYY" maxlength="4" aria-describedby="'+describer+'"'+required+' aria-label="'+label+', Year">');
	
	this.closest('.uoa-form__date-container').find('input[type=tel]').on('blur', function() {
		var container = $(this).closest('.uoa-form__date-container');
		var day = + container.find('.uoa-form__date-day').val();
		var month = + container.find('.uoa-form__date-month').val();
		var year = + container.find('.uoa-form__date-year').val();
		
		var date = day + '/' + month + '/' + year;
		container.find('.uoa-form__date--surrogate').val(date);
		if (isValidDate(date)) {
			$picker.set('select', + new Date(year, month-1, day));
		}
	});

	this.closest('.uoa-form__date-container').find('input[type=tel]').keyup(function (e) {
		if (this.value.length === this.maxLength && e.which !== 9 && e.which !== 16) {
			var $next = $(this).next('input[type=tel]');
			if ($next.length)
				$(this).next('input[type=tel]').focus();
			else
				$(this).blur();
		}
	});
}

function isValidDate(dateString) {
	"use strict";

	// First check for the pattern
	if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
		return false;

    // Parse the date parts to integers
		var parts = dateString.split("/");
		var day = parseInt(parts[0], 10);
		var month = parseInt(parts[1], 10);
		var year = parseInt(parts[2], 10);

		// Check the ranges of month and year
		if(year < 1000 || year > 3000 || month === 0 || month > 12)
			return false;

		var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

		// Adjust for leap years
		if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))
			monthLength[1] = 29;

		// Check the range of the day
		return day > 0 && day <= monthLength[month - 1];
}

$(window).on("load", function () {
	"use strict";

	// $('.uoa-form__date input[type=date]').each(function() {
	// 	$(this).uoaFormDatePicker();
	// })

	$('.uoa-bootstrap_datepicker').each(function() {
		$(this).uoaBootstrapDatepicker();
	})

	// Validation when leaving an input
	$('.uoa-form .uoa-form__elt').find('select, input[type=text], input[type=number], input[type=tel], input[type=email], textarea').on('blur', function() {
		$(this).closest('.uoa-form__elt').uaoFormValidate();
	});

	// Convert contraints to correct type and pattern
	$('.uoa-form .uoa-form__text input').each(function() {
		$(this).uoaFormConstraintsToPattern();
	});

	// Country selects
	$('.uoa-form .uoa-form__select select').on('change', function() {
		$(this).uoaFormCountrySelect();
	});

	// Checkboxes logic (handles the label pseudo element)
	$('.uoa-form .uoa-form__checkbox, .uoa-form .uoa-form__radio').find('input').on('change', function() {
		$(this).uoaFormCheckboxChange();
	});

	$('.uoa-form .uoa-form__checkbox, .uoa-form .uoa-form__radio').find('input').on('focus', function() {
		$(this).uoaFormCheckboxFocus();
	});

	$('.uoa-form .uoa-form__checkbox, .uoa-form .uoa-form__radio').find('input').on('blur', function() {
		$(this).uoaFormCheckboxBlur();
	});

	// Prechecked inputs update
	$('.uoa-form .uoa-form__checkbox, .uoa-form .uoa-form__radio').find('input').each(function() {
		$(this).uoaFormCheckboxPrecheck();
	});

	// Clear error on text input keypress
	$('.uoa-form').find('input, textarea').on('keypress', function() {
		$(this).uaoFormClearFieldError(true);
	});

	// File upload handling
	$('.uoa-form__file input').each( function() {
		$(this).uaoFormFileInput();
	});

	// Clear error on dropdown change
	$('.uoa-form').find('select').on('change', function() {
		$(this).uaoFormClearFieldError();
	});

	// Submit forms
	$('.uoa-form').each( function() {
		$(this).on('submit', function(e) {
			
			var valid = true,
				errorFields = [],
				formErrorMsg = $(this).data('error-msg') || 'Please correct errors in these fields:';
			
			// Go through all the fields and validate them			
			$(this).find('.uoa-form__elt').each( function() {
				if (!$(this).uaoFormValidate(true)) {
					errorFields.push($(this));
					valid = false;
				}
			});
			
			if (valid) {
				// Terminate function if form is valid (will submit)
				return;
			} else {
				// Populate global error message
				$(this).find('.uoa-form__submit-alert').html('<strong>'+formErrorMsg+'</strong><ul></ul>');
				// List all problematic fields
				for (var i in errorFields) {
					var errorField = errorFields[i];
					$(this).find('.uoa-form__submit-alert ul').append('<li><a href="#' + errorField.find('input[type=text], input[type=number], input[type=tel], input[type=email], input[type=password], select, textarea, .uoa-form__radios, .uoa-form__checkboxes').attr('id') + '">' + (errorField.find('.uoa-form__label').length ? errorField.find('.uoa-form__label').text() : errorField.find('label').text()) + '</a></li>');
				}
			}

			e.preventDefault();
		});
	});
});

