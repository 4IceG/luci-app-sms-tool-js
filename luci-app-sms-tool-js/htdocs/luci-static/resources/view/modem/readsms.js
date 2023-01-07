'use strict';
'require dom';
'require form';
'require fs';
'require ui';
'require uci';
'require view';


/*
	Copyright 2022-2023 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/



document.querySelector('head').appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('view/modem/sms_tool_js.css')
}));


function msg_bar(v, m) {
var pg = document.querySelector('#msg')
var vn = parseInt(v) || 0;
var mn = parseInt(m) || 100;
var pc = Math.floor((100 / mn) * vn);

pg.firstElementChild.style.width = pc + '%';
pg.setAttribute('title', '%s'.format(v) + ' / ' + '%s'.format(m) + ' ('+ pc + '%)');
}


function count_sms() {
	uci.load('sms_tool_js').then(function() {
		var storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
		var portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));

			L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
					.then(function(res) {
							if (res) {
								var total = res.substring(res.indexOf("total"));
								var t = total.replace ( /[^\d.]/g, '' );
								var used = res.substring(17, res.indexOf("total"));
								var u = used.replace ( /[^\d.]/g, '' );
								msg_bar(Math.floor(u), t);
							}
			});
	});
}

return view.extend({
	load: function() {
		uci.load('sms_tool_js');

	},


	handleDelete: function(ev) {

		if (document.querySelectorAll('input[name="smsn"]:checked').length == 0){
		ui.addNotification(null, E('p', _('Please select the message(s) to be deleted')), 'info');   
		}
		else {
			if (document.querySelectorAll('input[name="smsn"]:checked').length === document.querySelectorAll('input[name="smsn"]').length) {
					if (confirm(_('Delete all the messages?')))
						{
							var sections = uci.sections('sms_tool_js');
							var portDA = sections[0].readport;
							var storeDA = sections[0].storage;

							fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portDA , 'delete' , 'all' ]);
							document.getElementById("ch-all").checked = false;

							var rowCount = smsTable.rows.length;
							for (var i = rowCount - 1; i > 0; i--) {
            						smsTable.deleteRow(i);}

    							setTimeout(function() {
								L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeDA , '-d' , portDA , 'status' ]))
									.then(function(res) {
										if (res) {

											var total = res.substring(res.indexOf("total"));
											var t = total.replace ( /[^\d.]/g, '' );

											var u = "0";
											msg_bar(Math.floor(u), t);
										}
								});
							}, 2000);
						}
			}
			else {

					if (confirm(_('Delete selected message(s)?')))
						{
							var array = [];
							var checkb = document.querySelectorAll('input[type=checkbox]:checked');

							for (var i = 0; i < checkb.length; i++) {
								if (checkb[i] != source)
  								array.push(checkb[i].id)
							}
							if (array) {

							var args = [];

							var sections = uci.sections('sms_tool_js');
							var portDEL = sections[0].readport;
							var storeDS = sections[0].storage;

							args.push(array);
							var ax = args.toString();
							ax = ax.replace(/,/g, ' ');
							ax = ax.replace(/-/g, ' ');

							var smsnr = ax.split(" ");

								for (var i=0; i < smsnr.length; i++)
									{
									(function(i) {
    									setTimeout(function() { 
    									smsnr[i] = parseInt(smsnr[i], 10);

									if (!Number.isNaN(smsnr[i]))
										{
										count_sms();
										fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portDEL , 'delete' , smsnr[i] ]);					
										}		
									count_sms();
									}, 1500 * i);
								})(i);				
								}
								var table = document.getElementById("smsTable"); 
  								var index = 1;
  									while (index < table.rows.length) {
   										var input = table.rows[index].cells[0].children[0];
    										if (input && input.checked) {
      											table.deleteRow(index);
   										}
    										else {
      											index++;
   										}
  									}
							}

						}
			}
		}
	},

	handleRefresh: function(ev) {

		window.location.reload();

	},

	handleSelect: function(ev) {

		var checkBox = document.getElementById("ch-all");
		var checkBoxes = document.querySelectorAll('input[type="checkbox"]');

  		if (checkBox.checked == true){

			for (var i = 0; i < checkBoxes.length; i++)
				checkBoxes[i].setAttribute('checked', 'true');
  		} else {

			for (var i = 0; i < checkBoxes.length; i++)
				checkBoxes[i].removeAttribute('checked');
  		}

	},


	render: function(data) {

		var sections, store;
		var view = document.getElementById("smssarea");
		store = '-';

		uci.load('sms_tool_js').then(function() {
		var storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
		var portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));
		var smsM = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'mergesms'));
		var view = document.getElementById("smssarea");
		view.innerHTML = '-';

		if (storeL == "SM")
      			view.innerHTML = _('SIM card');

		if (storeL == "ME")
      			view.innerHTML = _('Modem memory');

		L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
				.then(function(res) {
					if (res) {

							var total = res.substring(res.indexOf("total"));
							var t = total.replace ( /[^\d.]/g, '' );


							var used = res.substring(17, res.indexOf("total"));
							var u = used.replace ( /[^\d.]/g, '' );


						L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , '-f' , '%Y-%m-%d %H:%M' , '-j' , 'recv' , '2>/dev/null' ]))
							.then(function(res2) {
								if (res2) {

 									var table = document.getElementById('smsTable');
									while (table.rows.length > 1) { table.deleteRow(1); }					

									var start = res2.substring(7);
									var end = start.substring(0,start.length-2);

									var json = JSON.parse(end);

									var sortedData = json.sort((function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp) }));

									/* Merging messages */
									if (smsM == "1") {

										var MergeMySMS = sortedData;

											var result = [];

											MergeMySMS.forEach(function (o) {
												if (!this[o.sender]) {
    														if(o.part > 0){
        														this[o.sender] = { index: o.index, sender: o.sender, timestamp: o.timestamp, part: o.part, total: o.total, content: o.content, contentparts: [] };
        														this[o.sender].contentparts[o.part] = o.content;
        													}else{
        														this[o.sender] = { index: o.index, sender: o.sender, timestamp: o.timestamp, part: o.part, total: o.total, content: o.content};
        													}
        												result.push(this[o.sender]);
        												return;
    												}
												if (this[o.sender].total == o.total && this[o.sender].timestamp == o.timestamp && this[o.sender].sender == o.sender && this[o.sender].part > 0) {
    															this[o.sender].index += '-' + o.index;
            														this[o.sender].contentparts[o.part] = o.content;}
														else {
															this[o.sender] = { index: o.index, sender: o.sender, timestamp: o.timestamp, part: o.part, total: o.total, content: o.content };
        														result.push(this[o.sender]);
        												return;
													}
														}, Object.create(null));
															result.forEach(function(o) {
                														if(o.contentparts){
                    															o.contentparts.shift();
                    															o.content = o.contentparts.join('');
                														}
												});
													if (u){

															var Lres = L.resource('icons/newdelsms.png');
															var iconz = String.format('<img style="width: 24px; height: 24px; "src="%s"/>', Lres);

															for (var i = 0; i < result.length; i++) {
            															var row = table.insertRow(-1);
  																var cell1 = row.insertCell(0);
  																var cell2 = row.insertCell(0);
  																var cell3 = row.insertCell(0);
  																var cell4 = row.insertCell(0);
																cell4.innerHTML = "<input type='checkbox' name='smsn' id="+result[i].index+","+" />"+iconz;
 				 												cell3.innerHTML = result[i].sender;
  																cell2.innerHTML = result[i].timestamp;
    																cell1.innerHTML = result[i].content;
										
															}
											}



										}

									}

									/* No merging messages */
									if (smsM == "0") {

										if (u){

											var Lres = L.resource('icons/newdelsms.png');
											var iconz = String.format('<img style="width: 24px; height: 24px; "src="%s"/>', Lres);

											for (var i = 0; i < sortedData.length; i++) {

            										var row = table.insertRow(-1);
  											var cell1 = row.insertCell(0);
  											var cell2 = row.insertCell(0);
  											var cell3 = row.insertCell(0);
  											var cell4 = row.insertCell(0);
											cell4.innerHTML = "<input type='checkbox' name='smsn' id="+sortedData[i].index+","+" />"+iconz;
 				 							cell3.innerHTML = sortedData[i].sender;
  											cell2.innerHTML = sortedData[i].timestamp;
    											cell1.innerHTML = sortedData[i].content;
										
											}
									}


								}

						});


				} else {
					if ( t.lenght < 1 )
						{
						msg_bar(Math.floor(u), t);
						}

					ui.addNotification(null, E('p', _('Please set the port for communication with the modem')), 'info');
				}


			if (document.getElementById('msg')) {

				msg_bar(Math.floor(u), t);
			}

    			});

		});

		var v = E([], [
			E('h2', _('SMS Messages')),
			E('div', { 'class': 'cbi-map-descr' }, _('User interface for reading messages using sms-tool. More information about the sms-tool on the %seko.one.pl forum%s.').format('<a href="https://eko.one.pl/?p=openwrt-sms_tool" target="_blank">', '</a>')),

			E('h3', _('Received Messages')),
				E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td left', 'width': '33%' }, [ _('Messages store in')]),
						E('td', { 'class': 'td left', 'id': 'smssarea' }, [ store ]),
					]),	
						E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td left', 'width': '33%' }, [_('Messages (inbox / maximum)'),]),
						E('td', { 'class': 'td' }, 
						E('div', {
							'id': 'msg',
							'class': 'cbi-progressbar',
							'title': '-'
							}, E('div')
						))
					])
				]),
				E('div', { 'class': 'right' }, [
					E('button', {
						//'class': 'cbi-button cbi-button-negative important',
						'class': 'cbi-button cbi-button-remove',
						'id': 'execute',
						'click': ui.createHandlerFn(this, 'handleDelete')
					}, [ _('Delete message(s)') ]),
					'\xa0\xa0\xa0',
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'id': 'clr',
						'click': ui.createHandlerFn(this, 'handleRefresh')
					}, [ _('Refresh SMS') ]),

			]),

			E('p'),

			E('table', { 'class': 'table' , 'id' : 'smsTable' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th checker' }, 
					E('input', {
						'id': 'ch-all',
						'type': 'checkbox',
						'name': 'checkall',
						'disabled': null,
						'checked': null,
						'click': ui.createHandlerFn(this, 'handleSelect')
					}), '',
					),
					E('th', { 'class': 'th from' }, _("From")),
					E('th', { 'class': 'th received' }, _("Received")),
					E('th', { 'class': 'th center message' }, _("Message"))
				])
			]),

			E('hr'),
		]);

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
