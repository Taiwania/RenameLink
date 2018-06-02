// <nowiki>
/*global jQuery:false, mediaWiki:false, AjaxQuickDelete:false*/
/*jshint curly:false, laxbreak:true*/

/**************************************
Request renaming of an image
composed in 2012 by Rillke

Thanks to all translators.

The following code is jsHint-valid.
**************************************/

(function ($, mw) {
'use strict';
if (window.rRename || mw.config.get('wgNamespaceNumber') !== 6) return;

var pn = mw.config.get('wgPageName'),
	lang = mw.config.get('wgUserLanguage'),
	user = mw.config.get('wgUserName');

var _this = window.rRename = {
	rDialog: function () {
		this.showProgress();

		var dlgButtons = {},
			$submitButton,
			$txtNewNameL = $('<label>', {
				'for': 'txtNewName',
				text: this.rI18n.lNewName
			});
		this.$txtNewName = $('<input>').attr({
				id: 'txtNewName',
				type: 'text',
				style: 'width: 99%',
				placeholder: this.rI18n.pNewName,
				value: pn
			}).on('change', function () {
				var val = _this.cleanFileName(this.value).replace(/\%/g, ' ');
				if (val !== this.value)
					this.value = _this.cleanFileName(this.value).replace(/\%/g, ' ');
			}).keyup().tipsy({
				'gravity': 's',
				'fallback': this.rI18n.tNewName,
				'trigger': 'focus'
			}).keyup(function (e) {
				$submitButton.submitOnEnter(e);
			});

		var $selRationaleL = $('<label>', {
				'for': 'txtReason',
				text: this.rI18n.lRationale
			});
		this.$selRationale = $('<select>').attr({
				id: 'selRationale',
				style: 'width: 99%',
				size: 1
			}).tipsy({
				'gravity': 's',
				'fallback': this.rI18n.tRationale,
				'trigger': 'focus'
			}).append($('<option>', {
					value: 0
				}).text(this.rI18n.pRationale)).val(0).on('change', function () {
				var val = this.value - 0;
				$('table.hovertable tr.ui-state-focus').removeClass('ui-state-focus');
				if (!val)
					return;
				$('table.hovertable').find('tr').eq(val).addClass('ui-state-focus');
			}).keyup(function (e) {
				$submitButton.submitOnEnter(e);
			});

		var $txtReasonL = $('<label>', {
				'for': 'txtReason',
				text: this.rI18n.lReason
			});
		this.$txtReason = $('<input>').attr({
				id: 'txtReason',
				type: 'text',
				style: 'width: 99%',
				placeholder: this.rI18n.pReason
			}).tipsy({
				'gravity': 's',
				'fallback': this.rI18n.tReason,
				'trigger': 'focus'
			}).keyup(function (e) {
				$submitButton.submitOnEnter(e);
			});

		mw.util.addCSS('table.hovertable tr:hover { background-color: white !important; border: 1px solid #A7D7F9 !important; outline: 1px solid #A7D7F9; }\n' + 'table.hovertable tr:hover > td { background-color: white !important; border: 1px solid #A7D7F9 !important; }\n' + 'table.hovertable tr:active > td { background: orange !important; }\n' + 'table.hovertable tr:focus > td { background: orange !important; }\n' + 'table.hovertable tr.ui-state-focus { outline: 1px solid #7E7 !important; }\n' + 'table.hovertable { cursor:pointer; }\n');
		this.rPolicy
			.css({
				'max-height': $(window).height() - 300,
				'overflow': 'auto'
			})
			.find('table')
			.addClass('hovertable');
		var selectionHandler = function () {
			var $this = $(this);
			if ($this.find('td').length) {
				$('table.hovertable tr.ui-state-focus').removeClass('ui-state-focus');
				$this.addClass('ui-state-focus');
				var $belongsTo = $this.data('com-owner') || $this;
				_this.$selRationale.val($belongsTo.data('v'));
			}
		};
		var skip = 0,
			option = 1,
			$owner,
			rowMap = {};
		this.rPolicy.data('com-rowmap', rowMap);
		this.rPolicy.find('tr').each(function (i, el) {
			if (!i) return;
			var $el = $(el),
				$tds = $el.find('td'),
				tdVerbose = $tds.eq(1).find('b').text();

			$(this).on('click', selectionHandler);
			rowMap[i] = option;
			if (--skip > 0) {
				$el.data('com-owner', $owner);
				return;
			}
			var rowspan = $tds.eq(0).attr('rowspan');
			if (rowspan)
				skip = Number(rowspan);
			$owner = $el;

			_this.$selRationale.append($('<option>', {
					value: i
				}).text(option + ". " + tdVerbose.substr(0, 80) + (tdVerbose.length > 70 ? '…' : '')));
			$el.data('v', i);
			option++;
		});

		this.$dlgNode = $('<div>', {
				style: 'border:1px solid white'
			}).append(
				this.rPolicy,
				$txtNewNameL, '<br>',
				this.$txtNewName, '<br><br>',
				$selRationaleL, '<br>',
				this.$selRationale, '<br><br>',
				$txtReasonL, '<br>',
				this.$txtReason
			);

		dlgButtons[this.rI18n.submitButtonLabel] = function () {
			_this.tasks = [];
			_this.$dButtons.button('option', 'disabled', true);
			_this.addTask('rCheckInputs');
			_this.addTask('doesFileExist');
			_this.fileNameExistsCB = 'rFileExists';
			_this.addTask('rIsOnBlackList');
			_this.addTask('rSendRequest');
			_this.addTask('rReady');
			_this.nextTask();
		};
		dlgButtons[this.rI18n.cancelButtonLabel] = function () {
			$(this).dialog("close");
		};

		this.$dlgNode.dialog({
			modal: true,
			closeOnEscape: true,
			position: 'center',
			title: this.rConfig.helpLink + this.rI18n.headline,
			height: this.rConfig.dlg.height,
			width: Math.min($(window).width(), this.rConfig.dlg.width),
			buttons: dlgButtons,
			close: function () {
				$(this).dialog("destroy");
				$(this).remove();
				$('.tipsy').remove();
				_this.dlgPresent = false;
			},
			open: function () {
				var $dlg = $(this);

				$dlg.parents('.ui-dialog').css({
					position: 'fixed',
					top: Math.round(($(window).height() - Math.min($(window).height(), $('.ui-dialog.ui-widget').height())) / 2) + 'px'
				});

				_this.$dButtons = $dlg.parent().find('.ui-dialog-buttonpane').find('button');
				$submitButton = _this.$dButtons.eq(0);
				$submitButton.specialButton('proceed').button();
				_this.$dButtons.eq(1).specialButton('cancel');
				$submitButton.submitOnEnter = function (e) {
					if (13 === e.which && !this.button('option', 'disabled'))
						this.click();
				};
			}
		});

		setTimeout(function () {
			_this.$dlgNode.dialog('option', 'position', 'center');
		}, 1);

		this.dlgPresent = true;
	},
	rGetPolicy: function () {
		if (this.rPolicy)
			return this.nextTask();
		$.ajax({
			url: mw.config.get('wgScript'),
			dataType: 'html',
			data: {
				'action': 'render',
				'title': _this.rConfig.reasonPage,
				'uselang': lang
			},
			cache: true,
			success: function (result) {
				_this.rPolicy = $(result).find('#onlyinclude');
				_this.nextTask();
			},
			error: function (x, status, error) {
				_this.fail('RenameLink: Error getting policy. Server status: ' + x.status + ' - Error: ' + error);
			}
		});
	},
	rAbort: function ($el, text) {
		this.tasks = [];
		setTimeout(function () {
			_this.$txtReason.removeAttr('title');
			_this.$selRationale.removeAttr('title');
			_this.$txtNewName.removeAttr('title');
			_this.$dButtons.button('option', 'disabled', false);
			$el.removeClass('ui-state-error');
		}, 4000);
		this.showProgress();
		$el.attr('title', text).focus();
		$el.addClass('ui-state-error');
	},
	rCheckInputs: function () {
		AjaxQuickDelete.showProgress(this.rI18n.progress.input);
		this.destination = this.rNewName = this.cleanFileName(this.$txtNewName.val()).replace(/^File:/, '');
		if (!Number(this.$selRationale.val())) {
			return this.rAbort(this.$selRationale, this.rI18n.invalidRationale);
		}
		if (this.rNewName < 5) {
			return this.rAbort(this.$txtNewName, this.rI18n.nameToShort);
		}
		if (this.rNewName === this.cleanFileName(pn).replace(/^File:/, '')) {
			return this.rAbort(this.$txtNewName, this.rI18n.newName);
		}
		// Test whether user selected first reason
		if (this.$selRationale.val() - 0 === 1) {
			var query = {
				'prop': 'imageinfo',
				'iiprop': 'user',
				'iilimit': 100,
				'titles': pn.replace(/_/g, ' ')
			};
			return this.queryAPI(query, 'rCheckInputsCB');
		}
		this.nextTask();
	},
	rCheckInputsCB: function (result) {
		if (!result || !result.query || !result.query.pages)
			return this.nextTask();
		var hasRevisions,
			isByUser;
		$.each(result.query.pages, function (id, pg) {
			if (pg.imageinfo) {
				hasRevisions = true;
				$.each(pg.imageinfo, function (i, ii) {
					if (ii.user === user) {
						isByUser = true;
						return false;
					}
				});
			}
		});
		if (hasRevisions && !isByUser) {
			return this.rAbort(this.$selRationale, this.rI18n.notTheUploader);
		} else {
			return this.nextTask();
		}
	},
	rFileExists: function (result) {
		return this.rAbort(this.$txtNewName, this.rI18n.nameExists);
	},
	rIsOnBlackList: function () {
		var query = {
			'action': 'titleblacklist',
			'tbtitle': 'File:' + this.rNewName,
			'tbaction': 'create'
		};
		this.showProgress(this.rI18n.progress.blacklisted);
		this.queryAPI(query, 'rIsBlacklistedCB');
	},
	rIsBlacklistedCB: function (result) {
		if (!result || !result.titleblacklist || !result.titleblacklist.result)
			throw new Error('RenameLink: result.titleblacklist is undefined.');
		if ('blacklisted' === result.titleblacklist.result) {
			return this.rAbort(this.$txtNewName, this.rI18n.blacklisted);
		}
		return this.nextTask();
	},
	rSendRequest: function () {
		this.edittoken = this.edittoken || mw.user.tokens.get('csrfToken');
		var doEdit = function (result) {
			var editType,
				comRationale = _this.rPolicy.data('com-rowmap')[Number(_this.$selRationale.val())],
				newText = _this.rConfig.addTemplate
					.replace('%NEWFILE%', _this.rNewName)
					.replace('%REASON%', _this.$txtReason.val())
					.replace('%NUMBER%', comRationale);
					
			if (result) {
				newText += result.replace(_this.rConfig.removeTemplate, '');
				editType = 'text';
			} else {
				editType = 'prependtext';
			}

			var page = {
				title: pn.replace(/_/g, ' '),
				text: newText,
				editType: editType,
				tags: 'RenameLink'
			};
			_this.showProgress(_this.rI18n.progress.edit);
			_this.savePage(page, _this.rConfig.summary
				.replace('%NEWFILE%', _this.rNewName)
				.replace('%REASON%', _this.$txtReason.val())
				.replace('%NUMBER%', comRationale)
				.replace(' Reason: ;', ''), 'nextTask');
		};
		$.get(mw.config.get('wgScript'), {
				'action': 'raw',
				title: pn,
				maxage: 0,
				smaxage: 0,
				dummy: Math.round(Math.random() * 1073741824)
			}, doEdit)
			.fail(function (jqXHR, textStatus, errorThrown) {
			if (404 === jqXHR.status)
				return doEdit('');
			_this.fail('Error retrieving wikitext. Server status ' + jqXHR.status + '<br>\nERR: ' + textStatus + '.');
		});
		this.showProgress(this.rI18n.progress.load);
	},
	rReady: function (result) {
		this.showProgress();
		document.location.reload();
	},
	rInit: function () {
		// save some code-lines by assigning similar languages

		// merge languages
		$.extend(true, _this.rI18n, _this.rI18n[lang.split('-')[0]], _this.rI18n[lang]);

		// Finally set up event handlers
		$(document).on('renamerequest', function (evt, a, b) {
			if (a && 'start' === a) {
				_this.showProgress(_this.rI18n.progress.policy);
				_this.tasks = [];
				_this.addTask('rGetPolicy');
				_this.addTask('rDialog');
				_this.nextTask();
			}
		});
		$(document).triggerHandler('scriptLoaded', ['renamerequest', 'init']);
	},
	// Translation
	// This should be changed when gadgets 2.0 are available
	rI18n: {
		'bn': {
			submitButtonLabel: "পুনঃনামকরণের অনুরোধ",
			proceedButtonLabel: "প্রক্রিয়াকরণ হচ্ছে",
			cancelButtonLabel: "বাতিল",
			headline: "একটি ফাইল পুনঃনামকরণ",
			lNewName: "নতুন নাম লিখুন",
			tNewName: "পছন্দসই ফাইলের নাম লিখুন",
			pNewName: "নতুন নাম",
			lRationale: "নীতি অনুযায়ী যুক্তিসহ ব্যাখ্যা",
			tRationale: "একটি বৈধ কারণ উল্লেখ করুন বা টেবিল থেকে একটি বেছে নিন",
			pRationale: "একটি কারণ বেছে নিন",
			lReason: "অতিরিক্ত ব্যাখ্যা / কারণ / যুক্তি",
			tReason: "ঐচ্ছিক: বিস্তারিত প্রদান করুন",
			pReason: "অতিরিক্ত কারণ বা যুক্তি",
			lAccept: "আমি স্বীকার করি যে, পুনরাবৃত্তিমূলক অ-সমর্থনযোগ্য পুনঃনামকরণ অনুরোধের ক্ষেত্রে আমার জন্য এই বৈশিষ্ট্য অবরুদ্ধ হবে।",
			invalidRationale: "একটি বৈধ যুক্তিসহ ব্যাখ্যা নির্বাচন করুন",
			nameToShort: "নাম খুব ছোট",
			newName: "দয়া করে একটি *নতুন* নাম নির্দিষ্ট করুন",
			notTheUploader: "সৎ ভাবে: আপনি আপলোডকারী নয়",
			nameExists: "উল্লিখিত ফাইলটির নামে একটি ফাইল ইতিমধ্যেই আছে - দয়া করে অন্য নাম বেছে নিন",
			blacklisted: "এই নামটি কালোতালিকাভুক্ত - দয়া করে অন্য নাম বেছে নিন",
			progress: {
				policy: "নীতি লোড হচ্ছে",
				input: "ইনপুট পরীক্ষা হচ্ছে",
				blacklisted: "নতুন ফাইলের নাম কালোতালিকাভুক্ত কিনা তা পরীক্ষা করা হচ্ছে",
				load: "উইকিটেক্সট লোড হচ্ছে",
				edit: "এই ফাইল স্থানান্তর করতে একজন ফাইল মুভারকে অনুরোধ করা হচ্ছে"
			}
		},
		'de': {
			submitButtonLabel: "Umbenennung beauftragen",
			proceedButtonLabel: "Weiter",
			cancelButtonLabel: "Abbrechen",
			headline: "Umbenennung einer Datei",
			lNewName: "Neuer Dateiname",
			tNewName: "Gib den gewünschten Dateinamen ein",
			pNewName: "neuer Name",
			lRationale: "Kriterium gemäß der Richtlinie",
			tRationale: "Eine Begründung auswählen",
			pRationale: "Begründung wählen",
			lReason: "Weitere Gründe",
			tReason: "Optional: Weitere Erklärung",
			pReason: "zusätzliche Erklärung des Wunsches",
			lAccept: "Ich nehme zur Kenntnis, dass wiederholte ungerechtfertigte Umbenennungsaufträge zur Sperrung der Funktion führen können.",
			invalidRationale: "Ein gültiges Kriterium auswählen",
			nameToShort: "Name ist zu kurz",
			newName: "Bitte gib einen *neuen* Namen ein",
			notTheUploader: "Sei ehrlich: Du hast diese Datei nicht hochgeladen",
			nameExists: "Es gibt bereits eine Datei diesen Namens. Wähle einen anderen Namen",
			blacklisted: "Dieser Name steht auf der schwarzen Liste. Wähle einen anderen Namen",
			progress: {
				policy: "Richtlinie laden",
				input: "Eingabe überprüfen",
				blacklisted: "Schwarze Liste prüfen",
				load: "Wikitext laden",
				edit: "Einen Dateiverschieber beauftragen"
			}
		},
		'es': {
			submitButtonLabel: "Solicitar cambio de nombre",
			proceedButtonLabel: "Continuar",
			cancelButtonLabel: "Cancelar",
			headline: "Cambio de nombre de un archivo",
			lNewName: "Escribe el nombre nuevo",
			tNewName: "Escribe el nombre de archivo deseado",
			pNewName: "nombre nuevo",
			lRationale: "Justificación acorde a la política",
			tRationale: "Provee un motivo válido o selecciona uno de la tabla",
			pRationale: "Selecciona un motivo",
			lReason: "Explicación, motivo o justificación adicional",
			tReason: "Opcional: provee detalles",
			pReason: "motivo o justificación adicional",
			lAccept: "Entiendo que las solicitudes de cambio de nombre reiteradas y no justificadas provocarán que se me bloquee de esta función.",
			invalidRationale: "Selecciona una justificación válida",
			nameToShort: "El nombre es demasiado breve",
			newName: "Especifica un nombre *nuevo*",
			notTheUploader: "Sinceramente, no eres quien cargó el archivo",
			nameExists: "Ya existe un archivo con el nombre indicado; elige otro nombre",
			blacklisted: "Este nombre se encuentra en la lista negra; elige otro nombre",
			progress: {
				policy: "Cargando la politica",
				input: "Comprobando la entrada",
				blacklisted: "Comprobando si el nombre nuevo está en la lista negra",
				load: "Cargando el codigo wiki",
				edit: "Solicitando el traslado de este archivo"
			}
		},
		'fa': {
			submitButtonLabel: "درخواست تغییر نام",
			proceedButtonLabel: "اقدام",
			cancelButtonLabel: "لغو",
			headline: "تغییر نام پرونده",
			lNewName: "نام جدید را بنویسید",
			tNewName: "نام مورد نظرتان را بنویسید",
			pNewName: "نام جدید",
			lRationale: "دلیل بر پایه سیاست\u200cها",
			tRationale: "دلیلتان را بیان کنید یا از جدول زیر انتخاب کنید",
			pRationale: "انتخاب دلیل",
			lReason: "توضیحات بیشتر / دلیل / توجیه",
			tReason: "اختیاری: بیان جزئیات",
			pReason: "دلیل یا توجیه بیشتر",
			lAccept: "مطلع هستم که عدم بیان دلیل باعث می\u200cشود که رسیدگی به این درخواست متوقف گردد.",
			invalidRationale: "یک معیار مجاز انتخاب کنید",
			nameToShort: "نام بسیار کوتاه",
			newName: "لطفا یک نام *جدید* مشخص کنید",
			notTheUploader: "صادقانه: شما بارگذار نیستید",
			nameExists: ".پرونده\u200cای با این نام موجود است، لطفاً یک نام دیگر انتخاب کنید",
			blacklisted: "این نام در فهرست سیاه قرار دارد لطفاً یک نام دیگر انتخاب کنید.",
			progress: {
				policy: "بارگیری سیاست\u200cها",
				input: "چک کردن ورودی",
				blacklisted: "چک کردن اینکه آیا نام در فهرست سیاه است یا نه",
				load: "بارگیری ویکی\u200cمتن",
				edit: "در حال درخواست انتقال\u200cدهندهٔ پرونده برای انتقال این پرونده"
			}
		},
		'fr': {
			submitButtonLabel: "Confirmer la demande de renommage",
			proceedButtonLabel: "Confirmer",
			cancelButtonLabel: "Annuler",
			headline: "Renommer un fichier",
			lNewName: "Entrez le nouveau nom",
			tNewName: "Entrez le nom de fichier souhaité",
			pNewName: "nouveau nom",
			lRationale: "Motif, conformément aux règles",
			tRationale: "Veuillez indiquer un motif valide ou le sélectionner dans la table ci-dessus",
			pRationale: "Sélectionnez un motif",
			lReason: "Explications complémentaires",
			tReason: "Facultatif : Donnez des détails",
			pReason: "Motif complémentaire",
			lAccept: "Je comprends que des requêtes non justifiées répétées me priveront l’accès à cet outil.",
			invalidRationale: "Veuillez sélectionner un motif valide",
			nameToShort: "Le nom est trop court",
			newName: "Veuillez indiquer un *nouveau* nom",
			notTheUploader: "Sauf erreur, ce n’est pas vous qui avez téléversé ce fichier",
			nameExists: "Il existe déjà un autre fichier avec ce nom, veuillez en choisir un autre",
			blacklisted: "Ce nom est interdit par la liste noire, veuillez en choisir un autre",
			progress: {
				policy: "Chargement des règles",
				input: "Vérification des entrées",
				blacklisted: "Vérification du nouveau nom dans la liste noire",
				load: "Chargement du wikitexte",
				edit: "Demander à un renommeur de fichiers de renommer ce fichier"
			}
		},
		'gl': {
			submitButtonLabel: "Solicitar o cambio de nome",
			proceedButtonLabel: "Continuar",
			cancelButtonLabel: "Cancelar",
			headline: "Cambiar o nome dun ficheiro",
			lNewName: "Escribe o novo nome",
			tNewName: "Escribe o nome desexado para o ficheiro",
			pNewName: "novo nome",
			lRationale: "Motivo de acordo coa política",
			tRationale: "Dá un motivo válido ou selecciona un da táboa",
			pRationale: "Selecciona un motivo",
			lReason: "Explicación/motivo/xustificación adicional",
			tReason: "Opcional: Dá máis detalles",
			pReason: "motivo ou xustificación adicional",
			lAccept: "Acepto que as solicitudes reiteradas de cambio de nome non xustificadas hanme bloquear esta función.",
			invalidRationale: "Selecciona un motivo válido",
			nameToShort: "O nome é demasiado curto",
			newName: "Especifica un *novo* nome",
			notTheUploader: "Sé honesto: Non es a persoa que subiu o ficheiro",
			nameExists: "Xa existe un ficheiro co nome especificado. Escolle outro nome",
			blacklisted: "Este nome está na lista negra. Escolle outro nome",
			progress: {
				policy: "Cargando a política",
				input: "Comprobando a entrada",
				blacklisted: "Comprobando se o novo nome está na lista negra",
				load: "Cargando o texto wiki",
				edit: "Solicitando a un renomeador de ficheiros que traslade o ficheiro"
			}
		},
		'hr': {
			submitButtonLabel: "Zahtjev za preimenovanje",
			proceedButtonLabel: "Nastavi",
			cancelButtonLabel: "Odustani",
			headline: "Preimenovanje datoteke",
			lNewName: "Unesite novo ime",
			tNewName: "Unesite željeno ime datoteke",
			pNewName: "novo ime",
			lRationale: "Obrazloženje sukladno pravilima",
			tRationale: "Napišite valjani razlog ili ga odaberite iz popisa",
			pRationale: "Odaberite razlog",
			lReason: "Dodatno pojašnjenje / razlog / opravdanje",
			tReason: "Nije obvezno: napišite detalje",
			pReason: "dodatni razlog ili opravdanje",
			lAccept: "Razumijem da učestali neopravdani razlozi za preimenovanje mogu rezultiranjem blokiranjem ove mogućnosti za mene.",
			invalidRationale: "Odaberite valjano obrazloženje",
			nameToShort: "Ime je prekratko",
			newName: "Molimo navedite *novo* ime",
			notTheUploader: "Budite pošteni: niste postavljač datoteke",
			nameExists: "Već postoji datoteka s navedenim imenom - molimo odaberite drugo ime",
			blacklisted: "Ovo ime je na crnom popisu - molimo odaberite drugo",
			progress: {
				policy: "Učitavam",
				input: "Provjera unosa",
				blacklisted: "Provjera je li novo ime na crnom popisu",
				load: "Učitavam Wikitext",
				edit: "Zahtjev premještaču datoteka za premještanje ove datoteke"
			}
		},
		'id': {
			submitButtonLabel: "Permintaan pengubahan nama",
			proceedButtonLabel: "Proses",
			cancelButtonLabel: "Batal",
			headline: "Ubah nama berkas",
			lNewName: "Masukkan nama berkas yang baru",
			tNewName: "Masukkan nama berkas yang diinginkan",
			pNewName: "nama baru",
			lRationale: "Alasan menurut kebijakan",
			tRationale: "Berikan alasan yang sesuai atau pilih salah satunya dari tabel",
			pRationale: "Pilihlah sebuah alasan",
			lReason: "Penjelasan/alasan/justifikasi tambahan",
			tReason: "Opsional: Berikan detail",
			pReason: "alasan atau justifikasi tambahan",
			lAccept: "Saya memahami bahwa meminta pengubahan nama berkas berulang kali tanpa alasan yang benar mengakibatkan fitur ini diblokir untuk saya.",
			invalidRationale: "Pilihlah alasan yang sah",
			nameToShort: "Nama terlalu pendek",
			newName: "Tentukan nama *baru*",
			notTheUploader: "Jujurlah: Anda bukan pengunggahnya",
			nameExists: "Telah ada berkas dengan nama yang Anda berikan. Pilih nama lainnya",
			blacklisted: "Nama berkas ini dalam daftar hitam. Pilih nama lainnya",
			progress: {
				policy: "Memuat kebijakan",
				input: "Memeriksa masukan",
				blacklisted: "Memeriksa apakah nama berkas baru ada dalam daftar hitam",
				load: "Memuat teks wiki",
				edit: "Meminta pemindah berkas untuk memindahkan berkas ini"
			}
		},
		'ja': {
			submitButtonLabel: "改名を依頼",
			proceedButtonLabel: "進む",
			cancelButtonLabel: "取り消す",
			headline: "ファイルの改名",
			lNewName: "新しい名前をお入れください'",
			tNewName: "望ましいファイル名をここにお入れください",
			pNewName: "新しい名前",
			lRationale: "方針を踏まえた改名理由をお入れください",
			tRationale: "適切な理由をご記入、または下記の表からお選びください",
			pRationale: "理由をお選びください",
			lReason: "補足説明、理由、根拠",
			tReason: "詳細に説明してください（省略可能です）",
			pReason: "補足的な理由または根拠",
			lAccept: "根拠のない改名依頼を繰り返した場合、この機能の使用の禁止処分を受けることを了承します",
			invalidRationale: "適切な理由をお選びください",
			nameToShort: "名前が短すぎます",
			newName: "「新しい」名前を指定してください",
			notTheUploader: "嘘はやめましょう：あなたはアップロード者ではありません",
			nameExists: "指定された名前のファイルがすでにあります。別の名前をお選びください",
			blacklisted: "この名前は禁止されています。別の名前をお選びください",
			progress: {
				policy: "方針を読み込んでいます",
				input: "入力をチェックしています",
				blacklisted: "新しいファイル名が禁止されていないかチェックしています",
				load: "ウィキ文を読み込んでいます",
				edit: "ファイル移動者 (Filemover) に移動を依頼しています"
			}
		},
		'kk': {
			submitButtonLabel: "Атауын өзгертуге сұраныс жіберу",
			proceedButtonLabel: "Жалғастыру",
			cancelButtonLabel: "Болдырмау",
			headline: "Файлдың атын өзгерту",
			lNewName: "Жаңа атын енгізу",
			tNewName: "Қалаған файл атын енгізіңіз",
			pNewName: "Жаңа атауы",
			lRationale: "Ереже бойынша негіздеу",
			tRationale: "Дұрыс себебін жазыңыз немесе кестеден біреуін таңдаңыз",
			pRationale: "Себебін таңдау",
			lReason: "Қосымша түсіндірме / себебі / негіздеу",
			tReason: "Қосымша: Толығырақ жазыңыз",
			pReason: "Қосымша себебі немесе негіздеу",
			lAccept: "Мен негізсіз бірнеше рет атауын өзгерту сұраныстарын жіберген жағдайда мен үшін бұл мүмкіндікті жабады дегенге келісемін.",
			invalidRationale: "Дұрыс негіздеуді таңдаңыз",
			nameToShort: "Атауы тым қысқа",
			newName: "Өтініш, *жаңа* атауы дегенді көрсетіңіз",
			notTheUploader: "Шыншыл болыңыз: Сіз жүктеуші емессіз",
			nameExists: "Көрсеткен файл атауы әлдеқашан бар. Өтініш басқа атау таңдаңыз",
			blacklisted: "Бұл атау қара тізімге енген. Өтініш басқа атау таңдаңыз",
			progress: {
				policy: "Ереже жүктелуде",
				input: "Кірістіру тексерілуде",
				blacklisted: "Жаңа файл атауы қара тізімде бар ма дегенді тексеру",
				load: "Уикимәтін жүктелуде",
				edit: "Бұл файлды жылжыту үшін файлжылжытушыға сұраныс жіберілуде"
			}
		},
		'ko': {
			submitButtonLabel: "파일 이름 변경 요청",
			proceedButtonLabel: "확인",
			cancelButtonLabel: "취소",
			headline: "파일 이름 바꾸기",
			lNewName: "새로운 이름을 입력하세요",
			tNewName: "원하는 새 이름을 입력하세요",
			pNewName: "새 이름",
			lRationale: "정책에 따른 조건 번호",
			tRationale: "정당한 이유를 제시하거나 표에서 고르세요.",
			pRationale: "이유 선택",
			lReason: "추가 설명 / 이유 / 타당한 이유",
			tReason: "선택 사항: 자세한 설명",
			pReason: "추가적인 설명 혹은 타당한 이유",
			lAccept: "나는 정당하지 않은 파일 이름 변경 요청을 계속하면 이 기능을 쓸 수 없게 됨에 동의합니다.",
			invalidRationale: "유효한 이유를 선택하세요",
			nameToShort: "이름이 너무 짧습니다",
			newName: "*새*이름을 명시해 주세요",
			notTheUploader: "정직하십시오: 당신은 사진을 올리지 않았습니다.",
			nameExists: "이미 해당 파일 이름이 존재합니다 - 다른 이름을 선택해 주세요",
			blacklisted: "해당 파일 이름은 블랙리스트에 포함되어 있습니다 - 다른 이름을 선택해 주세요",
			progress: {
				policy: "정책 로딩 중",
				input: "입력 확인 중",
				blacklisted: "새 파일 이름이 블랙리스트에 포함되었나 확인 중",
				load: "위키텍스트 로딩 중",
				edit: "파일 이동자에게 파일을 이동할 것을 요청하는 중"
			}
		},
		'ml': {
			submitButtonLabel: "പേര് മാറ്റാൻ നിർദ്ദേശിക്കുക",
			proceedButtonLabel: "തുടങ്ങുക",
			cancelButtonLabel: "വേണ്ടെന്ന് വയ്ക്കുക",
			headline: "പ്രമാണത്തിന്റെ പേര് മാറ്റുക",
			lNewName: "പുതിയ നാമം നൽകുക",
			tNewName: "പുതിയ നാമം",
			pNewName: "പുതിയ നാമം",
			lRationale: "പേര് മാറ്റാനുള്ള കാരണം",
			tRationale: "താഴെയുള്ള പട്ടികയിൽ നിന്ന് ഒരു കാരണം തിരഞ്ഞെടുക്കുക, അല്ലെങ്കിൽ മറ്റൊന്ന് നൽകുക.",
			pRationale: "ഒരു കാരണം നൽകുക",
			lReason: "കൂടുതൽ കാരണങ്ങൾ / ന്യായങ്ങൾ",
			tReason: "ഐച്ചികം: കൂടുതൽ വിവരങ്ങൾ നൽകുക",
			pReason: "മറ്റ് കാരണങ്ങളും ന്യായങ്ങളും",
			lAccept: "അനാവശ്യമായി പേരു മാറ്റം നിർദ്ദേശിക്കുന്നത് ഈ ഉപകരണം ഉപയോഗിക്കുന്നതിന്റെ നിന്ന് എന്നെ തടഞ്ഞേക്കുമെന്ന് ഞാൻ മനസ്സിലാക്കന്നു.",
			invalidRationale: "ശരിയായ ഒരു കാരണം തിരഞ്ഞെടുക്കുക.",
			nameToShort: "പേരിനു നീളം കുറവാണ്",
			newName: "*പുതിയ* ഒരു പേര് നൽകുക",
			notTheUploader: "സമ്മതിക്കുക: താങ്കളല്ല ഈ പ്രമാണം അപ്ലോഡ് ചെയ്തിരിക്കുന്നത്",
			nameExists: "ഈ പേരിൽ മറ്റൊരു പ്രമാണം നിലവിലുണ്ട് - മറ്റേതെങ്കിലും നാമം നിർദ്ദേശിക്കുക.",
			blacklisted: "ഈ നാമം നൽകാൻ സാധ്യമല്ല - മറ്റേതെങ്കിലും നാമം നിർദ്ദേശിക്കുക.",
			progress: {
				policy: "നയങ്ങൾ തിരഞ്ഞെടുക്കുന്നു.",
				input: "പൂരിപ്പിച്ച വിവരങ്ങൾ പരിശോധിക്കുന്നു.",
				blacklisted: "തടയപ്പെട്ട നാമം ആണോ നൽകിയിരിക്കുന്നതെന്ന് പരിശോധിക്കുന്നു.",
				load: "വിക്കിടെക്സ്റ്റ് ശരിയാക്കുന്നു.",
				edit: "പ്രമാണത്തിന്റെ നാമം മാറ്റാനുള്ള നിർദ്ദേശം താളിൽ ചേർക്കുന്നു."
			}
		},
		'nl': {
			submitButtonLabel: "Vraag hernoeming aan",
			proceedButtonLabel: "Gaan",
			cancelButtonLabel: "Annuleren",
			headline: "Bestand hernoemen",
			lNewName: "Vul de nieuwe naam in",
			tNewName: "Vul de gewenste naam in",
			pNewName: "nieuwe naam",
			lRationale: "Motivering volgens het beleid",
			tRationale: "Kies een geldige reden of selecteer een uit de tabel",
			pRationale: "Selecteer een reden",
			lReason: "Aanvullende uitleg / reden / motivering",
			tReason: "Optioneel: verstrek details",
			pReason: "aanvullende reden of rechtvaardiging",
			lAccept: "Ik erken dat herhaalde niet-gerechtvaardige aanvragen voor hernoeming  kunnen leiden tot blokkade van deze functie.",
			invalidRationale: "Selecteer een geldige motivering",
			nameToShort: "Naam is te kort",
			newName: "Kies een *nieuwe* naam",
			notTheUploader: "Wees eerlijk: Je bent niet de uploader",
			nameExists: "Er bestaat al een bestand met de gekozen naam - kies een andere naam",
			blacklisted: "Deze naam is niet toegestaan - kies een andere naam",
			progress: {
				policy: "Beleid laden",
				input: "Invoer controleren",
				blacklisted: "Controleren of de nieuwe naam is toegestaan",
				load: "Wikitekst laden",
				edit: "Een bestandshernoemer vragen dit bestand te hernoemen"
			}
		},
		'pl': {
			submitButtonLabel: "Zmień nazwę",
			proceedButtonLabel: "Kontynuuj",
			cancelButtonLabel: "Anuluj",
			headline: "Zmiana nazwy pliku",
			lNewName: "Wpisz nową nazwę",
			tNewName: "Wpisz żądaną nazwę pliku",
			pNewName: "nowa nazwa",
			lRationale: "Uzasadnienie zgodnie z warunkami",
			tRationale: "Podaj ważny powód lub wybierz jeden z listy",
			pRationale: "Wskaż powód",
			lReason: "Dodatkowe wyjaśnienie / przyczyna / uzasadnienie",
			tReason: "Opcjonalnie: Podaj szczegóły",
			pReason: "dodatkowa przyczyna lub uzasadnienie",
			lAccept: "Rozumiem, że powtarzające się nieuzasadnione żądania zmiany nazwy spowodują zablokowanie tej funkcji dla mnie.",
			invalidRationale: "Wybierz poprawne uzasadnienie",
			nameToShort: "Nazwa jest za krótka",
			newName: "Proszę wpisać *nową* nazwę",
			notTheUploader: "Mówiąc szczerze: Nie jesteś uploaderem",
			nameExists: "Istnieje już plik o takiej nazwie - Proszę wybrać inną nazwę",
			blacklisted: "Ta nazwa jest na czarnej liście - Proszę wybrać inną nazwę",
			progress: {
				policy: "Ładowanie warunków",
				input: "Sprawdzanie formularza",
				blacklisted: "Sprawdzanie, czy nowa nazwa pliku nie jest na czarnej liście",
				load: "Ładowanie Wikitekstu",
				edit: "Powiadamianie filemovera o przeniesieniu tego pliku"
			}
		},
		'pt': {
			submitButtonLabel: "Solicitar renomeação",
			proceedButtonLabel: "Continuar",
			cancelButtonLabel: "Cancelar",
			headline: "Renomeando um arquivo",
			lNewName: "Digite o novo nome",
			tNewName: "Digite o nome do arquivo desejado",
			pNewName: "novo nome",
			lRationale: "Razão de acordo com a política",
			tRationale: "Forneça uma razão válida ou selecione uma da tabela",
			pRationale: "Selecione uma razão",
			lReason: "Explicação / razão / justificativa adicional",
			tReason: "Opcional: Forneça detalhes",
			pReason: "razão ou justificativa adicional",
			lAccept: "Eu reconheço que solicitações repetidas de renomeação não-justificadas farão com que essa ferramenta seja bloqueada para mim.",
			invalidRationale: "Selecione uma razão válida",
			nameToShort: "O nome é muito curto",
			newName: "Por favor, especifique um *novo* nome de arquivo",
			notTheUploader: "Seja honesto: você não é o carregador",
			nameExists: "Já existe um arquivo com o nome do arquivo especificado - Por favor, escolha um outro nome",
			blacklisted: "Este nome está na lista negra - Por favor, escolha um outro nome",
			progress: {
				policy: "Carregando política",
				input: "Verificando a entrada",
				blacklisted: "Verificando se o novo nome do arquivo está na lista negra",
				load: "Carregando Wikitexto",
				edit: "Solicitando a um renomeador de arquivos que mova este arquivo"
			}
		},
		'ro': {
			submitButtonLabel: "Cerere de redenumire",
			proceedButtonLabel: "Continuați",
			cancelButtonLabel: "Revocare",
			headline: "Redenumirea unui fișier",
			lNewName: "Introduceți noul nume",
			tNewName: "Introduceți numele dorit pentru fișier",
			pNewName: "nume nou",
			lRationale: "Motiv în conformitate cu politica",
			tRationale: "Alegeți introduceți un motiv valid sau alegeți unul din tabel",
			pRationale: "Alegeți un motiv",
			lReason: "Explicație / motiv / justificare adițională",
			tReason: "Opțional: Introduceți detalii",
			pReason: "motiv sau justificare adițională",
			lAccept: "Sunt de acord că cererile repetate nejustificate de redenumire vor duce la blocarea acestei funcții pentru mine.",
			invalidRationale: "Alegeți un motiv valid",
			nameToShort: "Numele este prea scurt",
			newName: "Introduceți un nume *nou*",
			notTheUploader: "Fiți sincer: Nu sunteți persoana care l-a încărcat",
			nameExists: "Există deja un fișier cu numele specificat - Alegeți altul",
			blacklisted: "Acest nume este pe lista neagră - Alegeți alt nume",
			progress: {
				policy: "Se încarcă politica",
				input: "Se verifică datele introduse",
				blacklisted: "Se verifică dacă numele nou este pe lista neagră",
				load: "Se încarcă Wikitextul",
				edit: "Se introduce cererea de redenumire a fișierului"
			}
		},
		'ru': {
			submitButtonLabel: "Запрос на переименование",
			proceedButtonLabel: "Продолжить",
			cancelButtonLabel: "Отмена",
			headline: "Переименование файла",
			lNewName: "Введите новое название",
			tNewName: "Введите желаемое название файла",
			pNewName: "новое название",
			lRationale: "Обоснование в соответствии с правилом",
			tRationale: "Укажите подходящую причину или выберите её из таблицы",
			pRationale: "Выбор причины",
			lReason: "Дополнительные пояснения / причины / обоснования",
			tReason: "Опционально: опишите подробнее",
			pReason: "дополнительная причина или обоснование",
			lAccept: "Я понимаю, что при систематическом размещении неоправданных запросов на переименование, эта возможность будет для меня заблокирована.",
			invalidRationale: "Выбор подходящего обоснования",
			nameToShort: "Название слишком короткое",
			newName: "Пожалуйста, укажите *новое* название",
			notTheUploader: "Будьте честны: не вы загрузили этот файл",
			nameExists: "Файл с указанным названием уже существует. Пожалуйста, выберите другое название",
			blacklisted: "Это название находится в чёрном списке. Пожалуйста, выберите другое название",
			progress: {
				policy: "Загрузка правила",
				input: "Проверка ввода",
				blacklisted: "Проверка, не входит ли новое название файла в чёрный список",
				load: "Загрузка викитекста",
				edit: "Запрос к переименовывающим файлы на переименование этого файла"
			}
		},
		'sk': {
			submitButtonLabel: "Požiadať o premenovanie",
			proceedButtonLabel: "Ďalej",
			cancelButtonLabel: "Zrušiť",
			headline: "Premenovať súbor",
			lNewName: "Zadajte nové meno",
			tNewName: "Zadajte požadované meno",
			pNewName: "nové meno",
			lRationale: "Dôvod na základe pravidla",
			tRationale: "Uveďte platný dôvod, alebo zvoľte jeden z tabuľky",
			pRationale: "Zvoľte dôvod",
			lReason: "Dodatočné vysvetlenie / dôvod / zdôvodnenie",
			tReason: "Voliteľné: Zadajte detaily",
			pReason: "dodatočný dôvod alebo zdôvodnenie",
			lAccept: "Beriem na vedomie, že opakované neoprávnené požiadavky na premenovanie mi zablokujú tento nástroj",
			invalidRationale: "Zvoľte platný dôvod",
			nameToShort: "Meno je príliš krátke",
			newName: "Zadajte, prosím, *nové* meno",
			notTheUploader: "Buďte čestný: Tento súbor ste nenahrali vy",
			nameExists: "Už existuje súbor s takýmto názvom - zvoľte prosím iný názov",
			blacklisted: "Tento názov je na čiernej listine - zvoľte prosím iný názov",
			progress: {
				policy: "Načítanie pravidla",
				input: "Kontrola zadania",
				blacklisted: "Kontrola či je nové meno na čiernej listine",
				load: "Načítanie Wikitextu",
				edit: "Požiadanie oprávneného užívateľa o presun tohto súboru"
			}
		},
		'sv': {
			submitButtonLabel: "Begär omdöpning",
			proceedButtonLabel: "Fortsätt",
			cancelButtonLabel: "Avbryt",
			headline: "Omdöpning av fil",
			lNewName: "Ange det nya namnet",
			tNewName: "Ange det önskade filnamnet",
			pNewName: "nytt namn",
			lRationale: "Kriterium enligt riktlinjerna",
			tRationale: "Ange en giltig anledning eller välj en från tabellen",
			pRationale: "Välj en anledning",
			lReason: "Ytterligare förklaring / anledning / motivation",
			tReason: "Valfri: Ytterligare detaljer",
			pReason: "ytterligare anledning eller motivation",
			lAccept: "Jag är införstådd med att upprepade icke-motiverade begäran om omdöpning kommer att leda till att detta verktyg blockeras för mig.",
			invalidRationale: "Välj en giltig anledning",
			nameToShort: "Namnet är för kort",
			newName: "Vänligen välj ett *nytt* namn",
			notTheUploader: "Var ärlig: Du är inte uppladdaren",
			nameExists: "Det finns redan en fil med det angivna namnet. Välj ett annat namn.",
			blacklisted: "Detta namn är svartlistat. Välj ett annat namn.",
			progress: {
				policy: "Laddar riktlinjer",
				input: "Kontrollerar indata",
				blacklisted: "Kollar om det nya filnamnet är svartlistat",
				load: "Laddar wikitext",
				edit: "Begär att en filflyttare flyttar denna fil"
			}
		},
		'tr': {
			submitButtonLabel: "Yeniden adlandırma isteği gönder",
			proceedButtonLabel: "İlerle",
			cancelButtonLabel: "İptal",
			headline: "Dosyaların yeniden adlandırılması",
			lNewName: "Yeni adı girin",
			tNewName: "İstediğiniz dosya adını girin",
			pNewName: "yeni adı",
			lRationale: "Politikaya göre yeniden adlandırma gerekçesi",
			tRationale: "Geçerli bir neden verin ya da tablodan birini seçin",
			pRationale: "Bir neden seçin",
			lReason: "Ek açıklama/neden/gerekçe",
			tReason: "Ayrıntı girin (isteğe bağlı)",
			pReason: "ek bir neden ya da gerekçe",
			lAccept: "Değerlendirilmemiş isim değişikliği taleplerini tekrarlamamın, engellenmemle sonuçlanacağını kabul ediyorum.",
			invalidRationale: "Geçerli bir gerekçe seçin",
			nameToShort: "Adı çok kısa",
			newName: "Lütfen \"yeni\" ad girin",
			notTheUploader: "Dürüst olunuz: Dosyayı yükleyen siz değilsiniz",
			nameExists: "Belirtilen dosya adıyla bir dosya zaten mevcut. Lütfen başka bir ad seçin.",
			blacklisted: "Bu ad kara listededir. Lütfen başka bir ad seçin.",
			progress: {
				policy: "Politika yükleniyor",
				input: "Girdi denetleniyor",
				blacklisted: "Yeni dosya adının kara listede olup olmadığı denetleniyor",
				load: "Vikimetin yükleniyor",
				edit: "Bu dosyayı taşımak için bir dosya taşıyıcı (filemover) isteniyor."
			}
		},
		'uk': {
			submitButtonLabel: "Запит на перейменування",
			proceedButtonLabel: "Продовжити",
			cancelButtonLabel: "Скасувати",
			headline: "Перейменування файлу",
			lNewName: "Введіть нову назву",
			tNewName: "Введіть бажану назву файлу",
			pNewName: "нова назва",
			lRationale: "Обґрунтування згідно з правилами",
			tRationale: "Вкажіть дійсну причину або виберіть з таблиці",
			pRationale: "Оберіть причину",
			lReason: "Додаткове пояснення / причина / обґрунтування ",
			tReason: "Необов'язково: Вкажіть деталі",
			pReason: "додаткова причина чи обґрунтування",
			lAccept: "Я знаю, що в разі повторюваних невиправданих запитів на перейменування цю функцію буде для мене закрито.",
			invalidRationale: "Оберіть дійсне обґрунтування",
			nameToShort: "Назва надто коротка",
			newName: "Будь ласка, вкажіть *нову* назву",
			notTheUploader: "Будьте чесні: Ви не є завантажувачем",
			nameExists: "Уже існує файл з вказаною назвою — будь ласка, оберіть іншу",
			blacklisted: "Ця назва знаходиться в чорному списку — будь ласка, оберіть іншу",
			progress: {
				policy: "Завантаження правил",
				input: "Перевірка введення",
				blacklisted: "Перевірка нової назви у чорному списку",
				load: "Завантаження вікітексту",
				edit: "Подання запиту перейменовувачу на перейменування цього файлу"
			}
		},
		'yue': {
			submitButtonLabel: "請求改名",
			proceedButtonLabel: "得喇",
			cancelButtonLabel: "咪住",
			headline: "改緊個名",
			lNewName: "請輸入個新名",
			tNewName: "請輸入個啱嘅名",
			pNewName: "新名",
			lRationale: "根據私隱權政策而提供解釋",
			tRationale: "畀一個啱嘅解釋或喺個表入面揀個解釋出嚟",
			pRationale: "揀話點解要改咗個名",
			lReason: "第啲解釋",
			tReason: "畀尐細節（可以唔寫）",
			pReason: "第啲啱嘅解釋",
			lAccept: "如估我冇啲啱嘅理由而喺度猛咁話要改名嘅話，我所提供嘅呢啲嘢係冇效嘅。",
			invalidRationale: "揀過啱啲嘅解釋",
			nameToShort: "個名太短",
			newName: "請指定一個＜新＞嘅名",
			notTheUploader: "提醒吓先：你唔係最先上傳呢張相嘅用戶。",
			nameExists: "你所改呢張相嘅名一早就已經喺度，唔該再揀過第啲名喇。",
			blacklisted: "你所改呢張相嘅名已經入咗黑名單，唔該再揀過第啲名喇。",
			progress: {
				policy: "行緊私隱權政策……",
				input: "喺度查緊輸入狀態……",
				blacklisted: "喺度查緊個新嘅文件名係咪喺黑名單入面……",
				load: "喺度行緊Wikitext",
				edit: "而家喺度提交緊數據……"
			}
		},
		submitButtonLabel: "Request renaming",
		proceedButtonLabel: "Proceed",
		cancelButtonLabel: "Cancel",
		headline: "Renaming a file",
		lNewName: "Enter the new name",
		tNewName: "Enter the desired file name",
		pNewName: "new name",
		lRationale: "Rationale according to the policy",
		tRationale: "Provide a valid reason or select one from the table",
		pRationale: "Select a reason",
		lReason: "Additional explanation / reason / justification",
		tReason: "Optional: Provide details",
		pReason: "additional reason or justification",
		lAccept: "I acknowledge that repeated non-justified rename requests will block this feature for me.",
		invalidRationale: "Select a valid rationale",
		nameToShort: "Name is too short",
		newName: "Please specify a *new* name",
		notTheUploader: "Be honest: You are not the uploader",
		nameExists: "There is already a file with the specified file name - Please choose another name",
		blacklisted: "This name is blacklisted - Please choose another name",
		progress: {
			policy: "Loading policy",
			input: "Checking input",
			blacklisted: "Checking whether the new file name is blacklisted",
			load: "Loading Wikitext",
			edit: "Requesting a filemover to move this file"
		}
	},
	// Configuration
	rConfig: {
		reasonPage: 'Template:File renaming reasons/render',
		removeTemplate: /\{\{\s*(?:[Rr]ename|[Bb]ad name)[^\{\}]*\}\}(?:\s*)?/,
		addTemplate: '{{rename|1=%NEWFILE%|2=%NUMBER%|3=%REASON%|user=' + user + '}}\n',
		summary: "Requesting renaming this file to [[File:%NEWFILE%]]; Reason: %REASON%; Criterion %NUMBER%",
		dlg: {
			width: 850,
			height: ($(window).height() > 770 ? 'auto' : $(window).height())
		},
		helpLink: '<a href="' + mw.util.getUrl('Help:RenameLink') + '" target="_blank"><img src="//upload.wikimedia.org/wikipedia/commons/4/45/GeoGebra_icon_help.png" alt="?"/></a>'
	}
};

mw.loader.using(['ext.gadget.AjaxQuickDelete', 'ext.gadget.libJQuery', 'jquery.tipsy'], function () {
	$.extend(true, window.AjaxQuickDelete, window.rRename);
	_this = window.AjaxQuickDelete;
	_this.rInit();
});
})(jQuery, mediaWiki);
// Just for debugging
// $(document).off('renamerequest');
// $(document).triggerHandler('renamerequest', ['start']);
// </nowiki>
