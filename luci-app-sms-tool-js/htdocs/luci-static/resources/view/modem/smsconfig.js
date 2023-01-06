'use strict';
'require form';
'require fs';
'require view';
'require uci';
'require ui';
'require tools.widgets as widgets'

/*
	Copyright 2022-2023 Rafał Wabik - IceG - From eko.one.pl forum
	
	Licensed to the GNU General Public License v3.0.
*/


return view.extend({
	load: function() {
		return fs.list('/dev').then(function(devs) {
			return devs.filter(function(dev) {
				return dev.name.match(/^ttyUSB/) || dev.name.match(/^cdc-wdm/) || dev.name.match(/^ttyACM/);
			});
		});
	},

	render: function(devs) {
		var m, s, o;
		m = new form.Map('sms_tool_js', _('Configuration sms-tool'), _('Configuration panel for sms-tool and gui application.'));

		s = m.section(form.TypedSection, 'sms_tool_js', '', _(''));
		s.anonymous = true;

		//TAB SMS

		s.tab('smstab' , _('SMS Settings'));
		s.anonymous = true;

		o = s.taboption('smstab' , form.Value, 'readport', _('SMS reading port'), 
			_("Select one of the available ttyUSBX ports."));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));
		
		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('smstab', form.ListValue, "storage", _("Message storage area"),
			_("Messages are stored in a specific location (for example, on the SIM card or modem memory), but other areas may also be available depending on the type of device."));
		o.value("SM", _("SIM card"));
		o.value("ME", _("Modem memory"));
		o.default = "SM";

		o = s.taboption('smstab', form.Flag, 'mergesms', _('Merge split messages'),
		_('Checking this option will make it easier to read the messages, but it will cause a discrepancy in the number of messages shown and received.')
		);
		o.rmempty = false;

		o = s.taboption('smstab', form.Value, 'sendport', _('SMS sending port'), 
			_("Select one of the available ttyUSBX ports."));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));
		
		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('smstab', form.Value, "pnumber", _("Prefix number"),
			_("The phone number should be preceded by the country prefix (for Poland it is 48, without '+'). If the number is 5, 4 or 3 characters, it is treated as 'short' and should not be preceded by a country prefix."));
		o.default = "48";

		o = s.taboption('smstab', form.Flag, 'prefix', _('Add prefix to phone number'),
		_('Automatically add prefix to the phone number field.')
		);
		o.rmempty = false;
		//o.default = true;
		
		o = s.taboption('smstab', form.Flag, 'sendingroup', _('Enable group messaging'),
		_("This option allows you to send one message to all contacts in the user's contact list."));
		o.rmempty = false;
		o.default = false;

		o = s.taboption('smstab', form.Value, 'delay', _('Message sending delay'),
		_('[3 - 59] second(s)')
		);
		o.default = "3";
		o.rmempty = false;
		o.validate = function(section_id, value) {

			if (value.match(/^[0-9]+(?:\.[0-9]+)?$/) && +value >= 3 && +value < 60)
				return true;

			return _('Expect a decimal value between one and fifty-nine');
		};
		o.depends("sendingroup", "1");

		o = s.taboption('smstab', form.Flag, 'information', _('Explanation of number and prefix'),
		_('In the tab for sending SMSes, show an explanation of the prefix and the correct phone number.')
		);
		o.rmempty = false;
		//o.default = true;

		o = s.taboption('smstab', form.TextValue, '_tmp2', _('User contacts'),
			_("Each line must have the following format: 'Contact name;phone number'. For user convenience, the file is saved to the location '/etc/modem/phonebook.user'."));
		o.rows = 7;
		o.cfgvalue = function(section_id) {
			return fs.trimmed('/etc/modem/phonebook.user');
		};
		o.write = function(section_id, formvalue) {
			return fs.write('/etc/modem/phonebook.user', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};

		//TAB USSD

		s.tab('ussd', _('USSD Codes Settings'));
		s.anonymous = true;

		o = s.taboption('ussd', form.Value, 'ussdport', _('USSD sending port'), 
			_("Select one of the available ttyUSBX ports."));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));
		
		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('ussd', form.Flag, 'ussd', _('Sending USSD code in plain text'),
		_('Send the USSD code in plain text. Command is not being coded to the PDU.')
		);
		o.rmempty = false;

		o = s.taboption('ussd', form.Flag, 'pdu', _('Receive message without PDU decoding'),
		_('Receive and display the message without decoding it as a PDU.')
		);
		o.rmempty = false;

		o = s.taboption('ussd', form.TextValue, '_tmp4', _('User USSD codes'),
			_("Each line must have the following format: 'Code description;code'. For user convenience, the file is saved to the location '/etc/modem/ussdcodes.user'."));
		o.rows = 7;
		o.cfgvalue = function(section_id) {
			return fs.trimmed('/etc/modem/ussdcodes.user');
		};
		o.write = function(section_id, formvalue) {
			return fs.write('/etc/modem/ussdcodes.user', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};

		//TAB AT

		s.tab('attab', _('AT Commands Settings'));
		s.anonymous = true;

		o = s.taboption('attab' , form.Value, 'atport', _('AT commands sending port'), 
			_("Select one of the available ttyUSBX ports."));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));
		
		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('attab' , form.TextValue, '_tmp6', _('User AT commands'),
			_("Each line must have the following format: 'At command description;AT command'. For user convenience, the file is saved to the location '/etc/modem/atcmmds.user'."));
		o.rows = 20;
		o.cfgvalue = function(section_id) {
			return fs.trimmed('/etc/modem/atcmmds.user');
		};
		o.write = function(section_id, formvalue) {
			return fs.write('/etc/modem/atcmmds.user', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};

		//TAB INFO

		s.tab('notifytab', _('Notification Settings'));
		s.anonymous = true;

		o = s.taboption('notifytab', form.DummyValue, '_dummy');
			o.rawhtml = true;
			o.default = '<div class="cbi-section-descr">' +
				_('Work in progress..') +
				'</div>';

		o = s.taboption('notifytab', form.DummyValue, '_dummy');
		o.rawhtml = true;
		o.default = '<div class="cbi-value-field"><em>' +
				_('Option will be back as soon as I write new procd script.') +
				'</em></div>';

		return m.render();
	}
});
