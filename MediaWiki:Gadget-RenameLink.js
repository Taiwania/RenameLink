/**
* @description
* Install a rename link for users who cannot move files
* Feel free to add more links that support usability
*
* Clicking this link will add the rename template with a valid reason
*
* Invoke automated jsHint-validation on save: A feature on Wikimedia Commons
* Interested? See [[:commons:MediaWiki:JSValidator.js]] or [[:commons:Help:JSValidator]].
*
* @dependencies
*  the usual mediaWiki stuff (mediawiki.user, mediawiki.util)
*  Gadget-AjaxQuickDelete.js (ext.gadget.AjaxQuickDelete)
*
* @autor [[User:Rillke]], 2012
*/
// <nowiki>
/*global jQuery:false, mediaWiki:false, AjaxQuickDelete:false*/
(function ($, mw) {
'use strict';
var cats = mw.config.get('wgCategories'),
	usergroups = mw.config.get('wgUserGroups'),
	userlang = mw.config.get('wgUserLanguage');

if (6 !== mw.config.get('wgNamespaceNumber') || mw.user.isAnon() || $('.redirectMsg').length) return;
if (mw.config.get('wgRestrictionEdit') && mw.config.get('wgRestrictionEdit').length && $.inArray(mw.config.get('wgRestrictionEdit')[0], usergroups) === -1) return;
		
// Translation to be replaced with MediaWiki-messages ASAP (MediaWiki:Vector-action-move)
var i18n = {
	'ar': 'نقل',
	'bn': 'স্থানান্তর',
	'de': 'Verschieben',
	'en': 'Move',
	'es': 'Trasladar',
	'fa': 'انتقال',
	'fr': 'Renommer',
	'gl': 'Mover',
	'hr': 'Premjesti',
	'ja': '移動',
	'kk': 'Атауын өзгерту',
	'ko': '이동',
	'ml': 'തലക്കെട്ട് മാറ്റുക',
	'nl': 'Hernoemen',
	'pl': 'Przenieś',
	'pt': 'Mover',
	'ro': 'Redenumire',
	'ru': 'Переименовать',
	'sk': 'Premenovať',
	'sv': 'Flytta',
	'tr': 'Taşı',
	'uk': 'Перейменувати',
	'yue' : '搬'
};
var i18nP = {
	'ar': 'تحميل النص',
	'bn': 'স্ক্রিপ্ট লোড হচ্ছে',
	'de': 'Programmcode laden',
	'en': 'Loading script',
	'es': 'Cargando la secuencia de órdenes',
	'fa': 'بارگیری اسکریپت',
	'fr': 'Chargement',
	'gl': 'Cargando o script',
	'hr': 'Učitavanje skripte',
	'id': 'Memuat skrip',
	'kk': 'Скрипт жүктелуде',
	'ko': '스크립트 로딩 중',
	'ml': 'സ്ക്രിപ്റ്റ് തയ്യാറാക്കുന്നു.',
	'nl': 'Script laden',
	'pl': 'Ładowanie skryptu',
	'pt': 'Carregando script',
	'ro': 'Se încarcă scriptul',
	'ru': 'Загрузка скрипта',
	'sk': 'Skript sa načítava',
	'sv': 'Laddar skript',
	'tr': 'Betik yükleniyor',
	'uk': 'Завантаження скрипта',
	'yue': '喺度搞緊代碼……唔該等陣……'
};

function loadAndStart() {
	AjaxQuickDelete.showProgress(i18nP[userlang] || i18nP[userlang.split('-')[0]] || i18nP.en);
	if (window.rRename) {
		$(document).triggerHandler('renamerequest', ['start']);
	} else {
		$(document).on('scriptLoaded', function (evt, d, e) {
			if (d && 'renamerequest' === d) {
				$(document).triggerHandler('renamerequest', ['start']);
			}
		});
		mw.loader.load(mw.config.get('wgServer') + mw.config.get('wgScript') + '?title=' + mw.util.wikiUrlencode('MediaWiki:RenameRequest.js') + '&action=raw&ctype=text/javascript&dummy=0');
	}
}

if ( (-1 !== $.inArray( 'Media requiring renaming', cats )) ||
	(-1 !== $.inArray( 'Media renaming requests needing target', cats )) ||
	(-1 !== $.inArray( 'Incomplete media renaming requests', cats )) ) {
		$('#renameChange').show().find('a').on('click', function(e){
			e.preventDefault();
			loadAndStart();
		});
		return;
}
if ($.inArray('sysop', usergroups) + $.inArray('filemover', usergroups) > -2) return;

$(function () {
	var p = mw.util.addPortletLink('p-cactions', '#',
			i18n[userlang] || i18n[userlang.split('-')[0]] || i18n.en,
			'ca-rename', 'Request renaming this file.', 'm');
	if (p)
		$(p).on('click', function (e) {
			e.preventDefault();
			loadAndStart();
		});
});
})(jQuery, mediaWiki);
// </nowiki>
