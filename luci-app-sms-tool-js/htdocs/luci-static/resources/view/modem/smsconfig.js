'use strict';
'require baseclass';
'require form';
'require fs';
'require view';
'require uci';
'require ui';
'require rpc';
'require tools.widgets as widgets'

/*
	Copyright 2022-2026 Rafał Wabik - IceG - From eko.one.pl forum

	Licensed to the GNU General Public License v3.0.
*/

function popTimeout(a, message, timeout, severity) {
    ui.addTimeLimitedNotification(a, message, timeout, severity);
}

function update_sms_count_for_modem_sync(newValue, currentPort) {
	return uci.load('defmodems').then(function() {
		let defmodemSections = uci.sections('defmodems', 'defmodems');
		
		if (!defmodemSections || defmodemSections.length === 0) {
			// old format
			return newValue;
		}
		
		let serialModems = defmodemSections.filter(function(s) {
			return s.modemdata === 'serial';
		});
		
		if (serialModems.length === 0) {
			// old format
			return newValue;
		}
		
		let currentModemIndex = -1;
		
		for (let i = 0; i < serialModems.length; i++) {
			if (serialModems[i].comm_port === currentPort) {
				currentModemIndex = i + 1;
				break;
			}
		}
		
		if (currentModemIndex === -1) {
			// old format
			return newValue;
		}
		
		let existingSmsCount = uci.get('sms_tool_js', '@sms_tool_js[0]', 'sms_count') || '';
		let parts = existingSmsCount.split(' ').filter(function(p) { return p.trim() !== ''; });
		
		let updated = {};
		parts.forEach(function(part) {
			let match = part.match(/^dfm(\d+)_(\d+)$/);
			if (match) {
				updated[match[1]] = match[2];
			}
		});
		
		updated[currentModemIndex] = newValue;
		
		let result = [];
		for (let key in updated) {
			if (updated.hasOwnProperty(key)) {
				result.push('dfm' + key + '_' + updated[key]);
			}
		}
		
		return result.join(' ');
		
	}).catch(function() {
		// old format
		return newValue;
	});
}

var pkg = {
    get Name() { return 'mailsend'; },
    get URL()  { return 'https://openwrt.org/packages/pkgdata/' + this.Name + '/'; },
    get pkgMgrURINew() { return 'admin/system/package-manager'; },
    get pkgMgrURIOld() { return 'admin/system/opkg'; },
    bestPkgMgrURI: function () {
        return L.resolveDefault(
            fs.stat('/www/luci-static/resources/view/system/package-manager.js'), null
        ).then(function (st) {
            if (st && st.type === 'file')
                return 'admin/system/package-manager';
            return L.resolveDefault(fs.stat('/usr/libexec/package-manager-call'), null)
                .then(function (st2) {
                    return st2 ? 'admin/system/package-manager' : 'admin/system/opkg';
                });
        }).catch(function () { return 'admin/system/opkg'; });
    },
    openInstallerSearch: function (query) {
        let self = this;
        return self.bestPkgMgrURI().then(function (uri) {
            let q = query ? ('?query=' + encodeURIComponent(query)) : '';
            window.open(L.url(uri) + q, '_blank', 'noopener');
        });
    },
    checkPackages: function() {
        return fs.exec_direct('/usr/bin/opkg', ['list-installed'], 'text')
            .catch(function () {
                return fs.exec_direct('/usr/libexec/opkg-call', ['list-installed'], 'text')
                    .catch(function () {
                        return fs.exec_direct('/usr/libexec/package-manager-call', ['list-installed'], 'text')
                            .catch(function () {
                                return '';
                            });
                    });
            })
            .then(function (data) {
                data = (data || '').trim();
                return data ? data.split('\n') : [];
            });
    },
    _isPackageInstalled: function(pkgName) {
        return this.checkPackages().then(function(installedPackages) {
            return installedPackages.some(function(pkg) {
                return pkg.includes(pkgName);
            });
        });
    }
};

let phonebookEditorDialog = baseclass.extend({
	__init__: function(title, content) {
		this.title = title;
		this.content = content || '';
	},

	render: function() {
		let self = this;

		ui.showModal(this.title, [
			E('textarea', {
				'id': 'phonebook_modal_editor',
				'class': 'cbi-input-textarea',
				'style': 'width:100% !important; height:50vh; min-height:300px;',
				'wrap': 'off',
				'spellcheck': 'false'
			}, this.content.trim()),
			E('p', {'style': 'margin-top: 10px; font-size: 12px; color: var(--text-color-secondary)'}),

			E('div', {'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 10px;'}, [
				E('div', {}, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, _('Close'))
				]),
				E('div', {'style': 'display: flex; gap: 10px;'}, [
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'click': ui.createHandlerFn(this, function() {
							let input = document.createElement('input');
							input.type = 'file';
							input.accept = '.user';
							input.onchange = function(e) {
								let file = e.target.files[0];
								if (file) {
									let reader = new FileReader();
									reader.onload = function(event) {
										let content = event.target.result;
										let targetPath = '/etc/modem/phonebook.user';
										
										fs.write(targetPath, content)
											.then(function() {
												popTimeout(null, E('p', {}, _('File uploaded and saved to') + ' ' + targetPath), 5000, 'info');
												return fs.read(targetPath);
											})
											.then(function(savedContent) {
												let textarea = document.getElementById('phonebook_modal_editor');
												if (textarea) {
													textarea.value = savedContent;
												}
											})
											.catch(function(e) {
												ui.addNotification(null, E('p', {}, _('Unable to upload file') + ': ' + e.message), 'error');
											});
									};
									reader.readAsText(file);
								}
							};
							input.click();
						})
					}, _('Load .user file')),
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							let textarea = document.getElementById('phonebook_modal_editor');
							let content = textarea.value;
							let blob = new Blob([content], { type: 'text/plain' });
							let link = document.createElement('a');
							link.download = 'phonebook.user';
							link.href = URL.createObjectURL(blob);
							link.click();
							URL.revokeObjectURL(link.href);
						})
					}, _('Save .user file')),
					E('button', {
						'class': 'btn cbi-button-save',
						'click': ui.createHandlerFn(this, function() {
							let textarea = document.getElementById('phonebook_modal_editor');
							let newContent = textarea.value.trim().replace(/\r\n/g, '\n') + '\n';
							
							fs.write('/etc/modem/phonebook.user', newContent)
								.then(function() {
									popTimeout(null, E('p', {}, _('Phonebook saved successfully')), 5000, 'info');
									ui.hideModal();
								})
								.catch(function(e) {
									ui.addNotification(null, E('p', {}, _('Unable to save the file') + ': ' + e.message), 'error');
								});
						})
					}, _('Save'))
				])
			])
		], 'cbi-modal');
	},

	show: function() {
		this.render();
	}
});

let ussdCodesManagerDialog = baseclass.extend({
	__init__: function(title) {
		this.title = title;
		this.baseDir = '/etc/modem/ussdcodes';
		this.fallbackFile = '/etc/modem/ussdcodes.user';
		this.currentFile = null;
	},

	loadFileList: function() {
		return fs.exec('/bin/sh', ['-c', 'ls ' + this.baseDir + '/*.user 2>/dev/null || true'])
			.then(function(res) {
				let files = (res.stdout || '').trim().split('\n').filter(f => f);
				let fileNames = files.map(f => f.replace(this.baseDir + '/', ''));
				fileNames.sort();
				return fileNames;
			}.bind(this))
			.catch(function() {
				return [];
			});
	},

	loadInitialContent: function() {
		let self = this;
		return this.loadFileList().then(function(files) {
			if (files.length > 0) {
				self.currentFile = files[0];
				return fs.read(self.baseDir + '/' + files[0])
					.then(function(content) {
						return { files: files, content: content || '', selectedFile: files[0] };
					})
					.catch(function() {
						return { files: files, content: '', selectedFile: files[0] };
					});
			} else {
				return fs.read(self.fallbackFile)
					.then(function(content) {
						return { files: [], content: content || '', selectedFile: '' };
					})
					.catch(function() {
						return { files: [], content: '', selectedFile: '' };
					});
			}
		});
	},

	render: function() {
		let self = this;

		this.loadInitialContent().then(function(data) {
			ui.showModal(self.title, [
				E('div', {'class': 'cbi-section'}, [
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('Select file')),
						E('div', {'class': 'cbi-value-field'}, [
							E('select', {
								'class': 'cbi-input-select',
								'id': 'ussd_file_select',
								'style': 'width: 100%;',
								'change': function() {
									let fileName = this.value;
									if (fileName) {
										self.currentFile = fileName;
										self.loadFileContent(fileName);
									}
								}
							}, [
								E('option', {'value': ''}, _('-- Select file --'))
							].concat(data.files.map(f => E('option', {'value': f}, f))))
						])
					]),
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('New file name')),
						E('div', {'class': 'cbi-value-field'}, [
							E('div', {'style': 'display: flex; gap: 10px;'}, [
								E('input', {
									'class': 'cbi-input-text',
									'id': 'ussd_new_filename',
									'type': 'text',
									'placeholder': _('filename.user'),
									'style': 'flex: 1;'
								}),
								E('button', {
									'class': 'btn cbi-button-add',
									'click': ui.createHandlerFn(self, self.createNewFile)
								}, _('Create'))
							])
						])
					]),
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('Delete selected file')),
						E('div', {'class': 'cbi-value-field'}, [
							E('button', {
								'class': 'btn cbi-button-remove',
								'id': 'ussd_delete_btn',
								'click': ui.createHandlerFn(self, self.deleteFile)
							}, _('Delete'))
						])
					])
				]),
				E('textarea', {
					'id': 'ussd_modal_editor',
					'class': 'cbi-input-textarea',
					'style': 'width:100% !important; height:40vh; min-height:250px; margin-top: 10px;',
					'wrap': 'off',
					'spellcheck': 'false',
					'placeholder': _('Select or create a file to edit...')
				}, data.content),

				E('div', {'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 10px;'}, [
					E('div', {}, [
						E('button', {
							'class': 'btn',
							'click': ui.hideModal
						}, _('Close'))
					]),
					E('div', {'style': 'display: flex; gap: 10px;'}, [
						E('button', {
							'class': 'cbi-button cbi-button-action important',
							'click': ui.createHandlerFn(self, function() {
								let input = document.createElement('input');
								input.type = 'file';
								input.accept = '.user';
								input.onchange = function(e) {
									let file = e.target.files[0];
									if (file) {
										let reader = new FileReader();
										reader.onload = function(event) {
											let content = event.target.result;
											let fileName = file.name;
											let targetPath = self.baseDir + '/' + fileName;
											
											fs.write(targetPath, content)
												.then(function() {
													popTimeout(null, E('p', {}, _('File uploaded and saved to') + ' ' + targetPath), 5000, 'info');
													self.currentFile = fileName;
													return self.loadFileList();
												})
												.then(function(files) {
													let select = document.getElementById('ussd_file_select');
													if (select) {
														while (select.options.length > 1) {
															select.remove(1);
														}
														files.forEach(function(f) {
															let option = document.createElement('option');
															option.value = f;
															option.text = f;
															if (f === fileName) {
																option.selected = true;
															}
															select.appendChild(option);
														});
													}
													return fs.read(targetPath);
												})
												.then(function(savedContent) {
													let textarea = document.getElementById('ussd_modal_editor');
													if (textarea) {
														textarea.value = savedContent;
													}
												})
												.catch(function(e) {
													ui.addNotification(null, E('p', {}, _('Unable to upload file') + ': ' + e.message), 'error');
												});
										};
										reader.readAsText(file);
									}
								};
								input.click();
							})
						}, _('Load .user file')),
						E('button', {
							'class': 'btn cbi-button-action',
							'click': ui.createHandlerFn(self, function() {
								let textarea = document.getElementById('ussd_modal_editor');
								let content = textarea.value;
								let fileName = self.currentFile || 'ussdcodes.user';
								let blob = new Blob([content], { type: 'text/plain' });
								let link = document.createElement('a');
								link.download = fileName;
								link.href = URL.createObjectURL(blob);
								link.click();
								URL.revokeObjectURL(link.href);
							})
						}, _('Save .user file')),
						E('button', {
							'class': 'btn cbi-button-save',
							'id': 'ussd_save_btn',
							'click': ui.createHandlerFn(self, self.saveFile)
						}, _('Save'))
					])
				])
			], 'cbi-modal');
			
			setTimeout(function() {
				let select = document.getElementById('ussd_file_select');
				if (select && data.selectedFile) {
					select.value = data.selectedFile;
				}
			}, 0);
		});
	},

	loadFileContent: function(fileName) {
		let filePath = this.baseDir + '/' + fileName;
		fs.read(filePath)
			.then(function(content) {
				let textarea = document.getElementById('ussd_modal_editor');
				if (textarea) {
					textarea.value = content || '';
				}
			})
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to load file') + ': ' + e.message), 'error');
			});
	},

	createNewFile: function() {
		let input = document.getElementById('ussd_new_filename');
		let fileName = input.value.trim();

		if (!fileName) {
			ui.addNotification(null, E('p', {}, _('Please enter a file name')), 'warning');
			return;
		}

		if (!fileName.endsWith('.user')) {
			fileName += '.user';
		}

		let filePath = this.baseDir + '/' + fileName;

		fs.exec('/bin/sh', ['-c', 'mkdir -p ' + this.baseDir])
			.then(function() {
				return fs.write(filePath, '');
			}.bind(this))
			.then(function() {
				return fs.exec('/bin/chmod', ['644', filePath]);
			})
			.then(function() {
				popTimeout(null, E('p', {}, _('File created successfully')), 5000, 'info');
				this.currentFile = fileName;
				input.value = '';
				
				let select = document.getElementById('ussd_file_select');
				let option = E('option', {'value': fileName, 'selected': 'selected'}, fileName);
				select.appendChild(option);
				select.value = fileName;
				
				let textarea = document.getElementById('ussd_modal_editor');
				if (textarea) {
					textarea.value = '';
					textarea.placeholder = '';
				}
			}.bind(this))
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to create file') + ': ' + e.message), 'error');
			});
	},

	deleteFile: function() {
		let select = document.getElementById('ussd_file_select');
		let fileName = select.value;

		if (!fileName) {
			ui.addNotification(null, E('p', {}, _('Please select a file to delete')), 'warning');
			return;
		}

		if (!confirm(_('Are you sure you want to delete this file?') + '\n' + fileName)) {
			return;
		}

		let filePath = this.baseDir + '/' + fileName;

		fs.exec('/bin/rm', ['-f', filePath])
			.then(function() {
				popTimeout(null, E('p', {}, _('File deleted successfully')), 5000, 'info');
				
				let option = select.querySelector('option[value="' + fileName + '"]');
				if (option) {
					option.remove();
				}
				select.value = '';
				this.currentFile = null;
				
				let textarea = document.getElementById('ussd_modal_editor');
				if (textarea) {
					textarea.value = '';
					textarea.placeholder = _('Select or create a file to edit...');
				}
			}.bind(this))
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to delete file') + ': ' + e.message), 'error');
			});
	},

	saveFile: function() {
		if (!this.currentFile) {
			ui.addNotification(null, E('p', {}, _('Please select or create a file first')), 'warning');
			return;
		}

		let textarea = document.getElementById('ussd_modal_editor');
		let content = textarea.value.trim().replace(/\r\n/g, '\n') + '\n';
		let filePath = this.baseDir + '/' + this.currentFile;

		fs.write(filePath, content)
			.then(function() {
				popTimeout(null, E('p', {}, _('File saved successfully')), 5000, 'info');
			})
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to save file') + ': ' + e.message), 'error');
			});
	},

	show: function() {
		this.render();
	}
});

let atCommandsManagerDialog = baseclass.extend({
	__init__: function(title) {
		this.title = title;
		this.baseDir = '/etc/modem/atcmmds';
		this.fallbackFile = '/etc/modem/atcmmds.user';
		this.currentFile = null;
	},

	loadFileList: function() {
		return fs.exec('/bin/sh', ['-c', 'ls ' + this.baseDir + '/*.user 2>/dev/null || true'])
			.then(function(res) {
				let files = (res.stdout || '').trim().split('\n').filter(f => f);
				let fileNames = files.map(f => f.replace(this.baseDir + '/', ''));
				fileNames.sort();
				return fileNames;
			}.bind(this))
			.catch(function() {
				return [];
			});
	},

	loadInitialContent: function() {
		let self = this;
		return this.loadFileList().then(function(files) {
			if (files.length > 0) {
				self.currentFile = files[0];
				return fs.read(self.baseDir + '/' + files[0])
					.then(function(content) {
						return { files: files, content: content || '', selectedFile: files[0] };
					})
					.catch(function() {
						return { files: files, content: '', selectedFile: files[0] };
					});
			} else {
				return fs.read(self.fallbackFile)
					.then(function(content) {
						return { files: [], content: content || '', selectedFile: '' };
					})
					.catch(function() {
						return { files: [], content: '', selectedFile: '' };
					});
			}
		});
	},

	render: function() {
		let self = this;

		this.loadInitialContent().then(function(data) {
			ui.showModal(self.title, [
				E('div', {'class': 'cbi-section'}, [
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('Select file')),
						E('div', {'class': 'cbi-value-field'}, [
							E('select', {
								'class': 'cbi-input-select',
								'id': 'at_file_select',
								'style': 'width: 100%;',
								'change': function() {
									let fileName = this.value;
									if (fileName) {
										self.currentFile = fileName;
										self.loadFileContent(fileName);
									}
								}
							}, [
								E('option', {'value': ''}, _('-- Select file --'))
							].concat(data.files.map(f => E('option', {'value': f}, f))))
						])
					]),
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('New file name')),
						E('div', {'class': 'cbi-value-field'}, [
							E('div', {'style': 'display: flex; gap: 10px;'}, [
								E('input', {
									'class': 'cbi-input-text',
									'id': 'at_new_filename',
									'type': 'text',
									'placeholder': _('filename.user'),
									'style': 'flex: 1;'
								}),
								E('button', {
									'class': 'btn cbi-button-add',
									'click': ui.createHandlerFn(self, self.createNewFile)
								}, _('Create'))
							])
						])
					]),
					E('div', {'class': 'cbi-value'}, [
						E('label', {'class': 'cbi-value-title'}, _('Delete selected file')),
						E('div', {'class': 'cbi-value-field'}, [
							E('button', {
								'class': 'btn cbi-button-remove',
								'id': 'at_delete_btn',
								'click': ui.createHandlerFn(self, self.deleteFile)
							}, _('Delete'))
						])
					])
				]),
				E('textarea', {
					'id': 'at_modal_editor',
					'class': 'cbi-input-textarea',
					'style': 'width:100% !important; height:40vh; min-height:250px; margin-top: 10px;',
					'wrap': 'off',
					'spellcheck': 'false',
					'placeholder': _('Select or create a file to edit...')
				}, data.content),

				E('div', {'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 10px;'}, [
					E('div', {}, [
						E('button', {
							'class': 'btn',
							'click': ui.hideModal
						}, _('Close'))
					]),
					E('div', {'style': 'display: flex; gap: 10px;'}, [
						E('button', {
							'class': 'cbi-button cbi-button-action important',
							'click': ui.createHandlerFn(self, function() {
								let input = document.createElement('input');
								input.type = 'file';
								input.accept = '.user';
								input.onchange = function(e) {
									let file = e.target.files[0];
									if (file) {
										let reader = new FileReader();
										reader.onload = function(event) {
											let content = event.target.result;
											let fileName = file.name;
											let targetPath = self.baseDir + '/' + fileName;
											
											fs.write(targetPath, content)
												.then(function() {
													popTimeout(null, E('p', {}, _('File uploaded and saved to') + ' ' + targetPath), 5000, 'info');
													self.currentFile = fileName;
													return self.loadFileList();
												})
												.then(function(files) {
													let select = document.getElementById('at_file_select');
													if (select) {
														while (select.options.length > 1) {
															select.remove(1);
														}
														files.forEach(function(f) {
															let option = document.createElement('option');
															option.value = f;
															option.text = f;
															if (f === fileName) {
																option.selected = true;
															}
															select.appendChild(option);
														});
													}
													
													return fs.read(targetPath);
												})
												.then(function(savedContent) {
													let textarea = document.getElementById('at_modal_editor');
													if (textarea) {
														textarea.value = savedContent;
													}
												})
												.catch(function(e) {
													ui.addNotification(null, E('p', {}, _('Unable to upload file') + ': ' + e.message), 'error');
												});
										};
										reader.readAsText(file);
									}
								};
								input.click();
							})
						}, _('Load .user file')),
						E('button', {
							'class': 'btn cbi-button-action',
							'click': ui.createHandlerFn(self, function() {
								let textarea = document.getElementById('at_modal_editor');
								let content = textarea.value;
								let fileName = self.currentFile || 'atcmmds.user';
								let blob = new Blob([content], { type: 'text/plain' });
								let link = document.createElement('a');
								link.download = fileName;
								link.href = URL.createObjectURL(blob);
								link.click();
								URL.revokeObjectURL(link.href);
							})
						}, _('Save .user file')),
						E('button', {
							'class': 'btn cbi-button-save',
							'id': 'at_save_btn',
							'click': ui.createHandlerFn(self, self.saveFile)
						}, _('Save'))
					])
				])
			], 'cbi-modal');
			
			setTimeout(function() {
				let select = document.getElementById('at_file_select');
				if (select && data.selectedFile) {
					select.value = data.selectedFile;
				}
			}, 0);
		});
	},

	loadFileContent: function(fileName) {
		let filePath = this.baseDir + '/' + fileName;
		fs.read(filePath)
			.then(function(content) {
				let textarea = document.getElementById('at_modal_editor');
				if (textarea) {
					textarea.value = content || '';
				}
			})
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to load file') + ': ' + e.message), 'error');
			});
	},

	createNewFile: function() {
		let input = document.getElementById('at_new_filename');
		let fileName = input.value.trim();

		if (!fileName) {
			ui.addNotification(null, E('p', {}, _('Please enter a file name')), 'warning');
			return;
		}

		if (!fileName.endsWith('.user')) {
			fileName += '.user';
		}

		let filePath = this.baseDir + '/' + fileName;

		fs.exec('/bin/sh', ['-c', 'mkdir -p ' + this.baseDir])
			.then(function() {
				return fs.write(filePath, '');
			}.bind(this))
			.then(function() {
				return fs.exec('/bin/chmod', ['644', filePath]);
			})
			.then(function() {
				popTimeout(null, E('p', {}, _('File created successfully')), 5000, 'info');
				this.currentFile = fileName;
				input.value = '';
				
				let select = document.getElementById('at_file_select');
				let option = E('option', {'value': fileName, 'selected': 'selected'}, fileName);
				select.appendChild(option);
				select.value = fileName;
				
				let textarea = document.getElementById('at_modal_editor');
				if (textarea) {
					textarea.value = '';
					textarea.placeholder = '';
				}
			}.bind(this))
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to create file') + ': ' + e.message), 'error');
			});
	},

	deleteFile: function() {
		let select = document.getElementById('at_file_select');
		let fileName = select.value;

		if (!fileName) {
			ui.addNotification(null, E('p', {}, _('Please select a file to delete')), 'warning');
			return;
		}

		if (!confirm(_('Are you sure you want to delete this file?') + '\n' + fileName)) {
			return;
		}

		let filePath = this.baseDir + '/' + fileName;

		fs.exec('/bin/rm', ['-f', filePath])
			.then(function() {
				popTimeout(null, E('p', {}, _('File deleted successfully')), 5000, 'info');
				
				let option = select.querySelector('option[value="' + fileName + '"]');
				if (option) {
					option.remove();
				}
				select.value = '';
				this.currentFile = null;
				
				let textarea = document.getElementById('at_modal_editor');
				if (textarea) {
					textarea.value = '';
					textarea.placeholder = _('Select or create a file to edit...');
				}
			}.bind(this))
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to delete file') + ': ' + e.message), 'error');
			});
	},

	saveFile: function() {
		if (!this.currentFile) {
			ui.addNotification(null, E('p', {}, _('Please select or create a file first')), 'warning');
			return;
		}

		let textarea = document.getElementById('at_modal_editor');
		let content = textarea.value.trim().replace(/\r\n/g, '\n') + '\n';
		let filePath = this.baseDir + '/' + this.currentFile;

		fs.write(filePath, content)
			.then(function() {
				popTimeout(null, E('p', {}, _('File saved successfully')), 5000, 'info');
			})
			.catch(function(e) {
				ui.addNotification(null, E('p', {}, _('Unable to save file') + ': ' + e.message), 'error');
			});
	},

	show: function() {
		this.render();
	}
});

return view.extend({
	load: function() {
		return fs.list('/dev').then(function(devs) {
			return devs.filter(function(dev) {
				return dev.name.match(/^ttyUSB/) || dev.name.match(/^cdc-wdm/) || dev.name.match(/^ttyACM/) || dev.name.match(/^mhi_/) || dev.name.match(/^wwan/);
			});
		});
	},

	render: function(devs) {
		let m, s, o;
		m = new form.Map('sms_tool_js', _('Configuration sms-tool'), _('Configuration panel for sms-tool and gui application.'));

		s = m.section(form.TypedSection, 'sms_tool_js', '', null);
		s.anonymous = true;

		//TAB SMS

		s.tab('smstab' , _('SMS Settings'));
		s.anonymous = true;

		o = s.taboption('smstab' , form.Value, 'readport', _('SMS reading port'), 
			_('Select one of the available ttyUSBX ports.'));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));

		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('smstab', form.ListValue, 'storage', _('Message storage area'),
		_('Messages are stored in a specific location (for example, on the SIM card or modem memory), but other areas may also be available depending on the type of device.'));
		o.value('SM', _('SIM card'));
		o.value('ME', _('Modem memory'));
		o.default = 'SM';

		o = s.taboption('smstab', form.Flag, 'mergesms', _('Merge split messages'),
		_('Checking this option will make it easier to read the messages, but it will cause a discrepancy in the number of messages shown and received.')
		);
		o.rmempty = false;

		o = s.taboption('smstab' , form.ListValue, 'algorithm', _('Merge algorithm'),
			_(''));
		o.value('Simple', _('Simple (merge without sorting)'));
		o.value('Advanced', _('Advanced (merges with sorting)'));
		o.default = 'Advanced';
		o.depends('mergesms', '1');

		o = s.taboption('smstab' , form.ListValue, 'direction', _('Direction of message merging'),
			_(''));
		o.value('Start', _('From beginning to end'));
		o.value('End', _('From end to beginning'));
		o.default = 'Start';
		o.depends('algorithm', 'Advanced');

		o = s.taboption('smstab', form.Value, 'bnumber', _('Phone number to be blurred'),
		_('The last 5 digits of this number will be blurred.')
		);
		o.password = true;

		o = s.taboption('smstab', form.Button, '_fsave');
		o.title = _('Save messages to a text file');
		o.description = _('This option allows to backup SMS messages or, for example, save messages that are not supported by the sms-tool.');
		o.inputtitle = _('Save as .txt file');
		o.onclick = function() {
			return uci.load('sms_tool_js').then(function() {
					let portES = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));
						L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portES , '-f' , '%Y-%m-%d %H:%M' , 'recv' , '2>/dev/null']))
							.then(function(res) {
								if (res) {
									fs.write('/tmp/mysms.txt', res.trim().replace(/\r\n/g, '\n') + '\n');
									let fileName = 'mysms.txt';
									let filePath = '/tmp/' + fileName;

									fs.stat(filePath)
									.then(function () {

									if (confirm(_('Save sms to txt file?'))) {
										L.resolveDefault(fs.read_direct('/tmp/mysms.txt'), null).then(function (restxt) {
											if (restxt) {
												L.ui.showModal(_('Saving...'), [
													E('p', { 'class': 'spinning' }, _('Please wait.. Process of saving SMS message to a text file is in progress.'))
												]);
												let link = E('a', {
													'download': 'mysms.txt',
													'href': URL.createObjectURL(
													new Blob([ restxt ], { type: 'text/plain' })),
												});
												window.setTimeout(function() {
													link.click();
													URL.revokeObjectURL(link.href);
													L.hideModal();
												}, 2000).finally();
											} else {
												ui.addNotification(null, E('p', {}, _('Saving SMS messages to a file failed. Please try again.')));
											}
										}).catch(() => {
											ui.addNotification(null, E('p', {}, _('Download error') + ': ' + err.message));
										});
									}
									});
							}
				    });

			});

		};

		o = s.taboption('smstab', form.Button, '_fdelete');
		o.title = _('Delete all messages');
		o.description = _("This option allows you to delete all SMS messages when they are not visible in the 'Received Messages' tab.");
		o.inputtitle = _('Delete all');
		o.onclick = function() {
			if (confirm(_('Delete all the messages?'))) {
				return uci.load('sms_tool_js').then(function() {
					let portFD = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));
					fs.exec_direct('/usr/bin/sms_tool', [ '-d' , portFD , 'delete' , 'all' ]);
				});
			}
		};

		o = s.taboption('smstab', form.Value, 'sendport', _('SMS sending port'), 
			_("Select one of the available ttyUSBX ports."));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));

		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('smstab', form.Value, 'pnumber', _('Prefix number'),
			_("The phone number should be preceded by the country prefix (for Poland it is 48, without '+'). If the number is 5, 4 or 3 characters, it is treated as 'short' and should not be preceded by a country prefix."));
		o.default = '48';
		o.validate = function(section_id, value) {

			if (value.match(/^[0-9]+(?:\.[0-9]+)?$/))
				return true;

			return _('Expect a decimal value');
		};

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
			_("[3 - 59] second(s) \
			<br /><br /><b>Important</b> \
				<br />Messages are sent without verification and confirmation delivery of the message. \
				Therefore, there is a risk of non-delivery of the message."));
		o.default = "3";
		o.rmempty = false;
		o.validate = function(section_id, value) {

			if (value.match(/^[0-9]+(?:\.[0-9]+)?$/) && +value >= 3 && +value < 60)
				return true;

			return _('Expect a decimal value between three and fifty-nine');
		};
		o.depends("sendingroup", "1");
		o.datatype = 'range(3, 59)';

		o = s.taboption('smstab', form.Flag, 'information', _('Explanation of number and prefix'),
		_('In the tab for sending SMSes, show an explanation of the prefix and the correct phone number.')
		);
		o.rmempty = false;
		//o.default = true;

		o = s.taboption('smstab', form.Button, '_phonebook_edit');
		o.title = _('User contacts');
		o.description = _("Each line must have the following format: 'Contact name;phone number'. For user convenience, the file is saved to the location <code>/etc/modem/phonebook.user</code>.");
		o.inputtitle = _('Manage contacts');
		o.onclick = function() {
			return fs.trimmed('/etc/modem/phonebook.user').then(function(content) {
				let dialog = new phonebookEditorDialog(_('Edit User Contacts'), content || '');
				dialog.show();
			}).catch(function(e) {
				let dialog = new phonebookEditorDialog(_('Edit User Contacts'), '');
				dialog.show();
			});
		};

		//TAB FORWARD SMS by E-MAIL

		s.tab('email', _('SMS Forwarding to E-mail Settings'));
		s.anonymous = true;

        var emailProviders = {
	        'custom': {
		        name: _('user define'),
		        smtp: '',
		        port: '',
		        security: 'tls'
	        },
	        'gmail': {
		        name: 'Gmail',
		        smtp: 'smtp.gmail.com',
		        port: '587',
		        security: 'tls'
	        },
	        'outlook': {
		        name: 'Outlook.com / Hotmail',
		        smtp: 'smtp-mail.outlook.com',
		        port: '587',
		        security: 'tls'
	        },
	        'yahoo': {
		        name: 'Yahoo Mail',
		        smtp: 'smtp.mail.yahoo.com',
		        port: '587',
		        security: 'tls'
	        },
	        'icloud': {
		        name: 'iCloud Mail',
		        smtp: 'smtp.mail.me.com',
		        port: '587',
		        security: 'tls'
	        },
	        'aol': {
		        name: 'AOL Mail',
		        smtp: 'smtp.aol.com',
		        port: '587',
		        security: 'tls'
	        },
	        'zoho': {
		        name: 'Zoho Mail',
		        smtp: 'smtp.zoho.com',
		        port: '587',
		        security: 'tls'
	        },
	        'mailru': {
		        name: 'Mail.ru',
		        smtp: 'smtp.mail.ru',
		        port: '465',
		        security: 'ssl'
	        },
	        'yandex': {
		        name: 'Yandex.Mail',
		        smtp: 'smtp.yandex.com',
		        port: '465',
		        security: 'ssl'
	        },
	        'gmx': {
		        name: 'GMX Mail',
		        smtp: 'smtp.gmx.com',
		        port: '587',
		        security: 'tls'
	        },
	        'mailcom': {
		        name: 'Mail.com',
		        smtp: 'smtp.mail.com',
		        port: '587',
		        security: 'tls'
	        },
	        'fastmail': {
		        name: 'FastMail',
		        smtp: 'smtp.fastmail.com',
		        port: '587',
		        security: 'tls'
	        },
	        'sina': {
		        name: 'Sina Mail',
		        smtp: 'smtp.sina.com',
		        port: '587',
		        security: 'tls'
	        },
	        'mailboxorg': {
		        name: 'Mailbox.org',
		        smtp: 'smtp.mailbox.org',
		        port: '587',
		        security: 'tls'
	        },
	        'o2pl': {
		        name: 'o2.pl',
		        smtp: 'poczta.o2.pl',
		        port: '465',
		        security: 'ssl'
	        },
	        'wppl': {
		        name: 'wp.pl',
		        smtp: 'smtp.wp.pl',
		        port: '465',
		        security: 'ssl'
	        },
	        'interia': {
		        name: 'interia.pl',
		        smtp: 'poczta.interia.pl',
		        port: '465',
		        security: 'ssl'
	        }
        };

        o = s.taboption('email', form.Flag, 'forward_sms_enabled',
	        _('Enable message forwarding'));
        o.rmempty = false;
        o.modalonly = true;

        o.write = function(section_id, value) {
	        if (value === '1') {
		        return pkg._isPackageInstalled('mailsend').then(function(isInstalled) {
			        if (!isInstalled) {
				        ui.addNotification(null, E('p', {}, _('Package mailsend is not installed. Please install it first using the Install... button below')), 'info');
				        return form.Flag.prototype.write.apply(this, [section_id, '0']);
			        } else {
				        return form.Flag.prototype.write.apply(this, [section_id, value]);
			        }
		        }.bind(this));
	        }
	        return form.Flag.prototype.write.apply(this, [section_id, value]);
        };
		
		o = s.taboption('email', form.ListValue, 'emailprovider', _('E-mail settings'),
			_('Select a predefined e-mail settings or enter settings manually.'));
		
		for (var key in emailProviders) {
			o.value(key, emailProviders[key].name);
		}
		o.default = 'custom';
		o.modalonly = true;
		
		o.onchange = function(ev, section_id, value) {
			var provider = emailProviders[value] || emailProviders['custom'];
			var map = this.map;
			
			// SMTP server
			var smtpField = map.lookupOption('forward_sms_mail_smtp', section_id);
			if (smtpField && smtpField[0]) {
				smtpField[0].getUIElement(section_id).setValue(provider.smtp);
			}
			
			// Update port
			var portField = map.lookupOption('forward_sms_mail_smtp_port', section_id);
			if (portField && portField[0]) {
				portField[0].getUIElement(section_id).setValue(provider.port);
			}
			
			// Update security
			var securityField = map.lookupOption('forward_sms_mail_security', section_id);
			if (securityField && securityField[0]) {
				securityField[0].getUIElement(section_id).setValue(provider.security);
			}
		};
	
		o = s.taboption('email', form.Value,
			'forward_sms_mail_recipient', _('Recipient'));
		o.description = _('E-mail address of the recipient.');
		o.modalonly   = true;

		o = s.taboption('email', form.Value,
			'forward_sms_mail_sender', _('Sender'));
		o.description = _('E-mail address of the sender.');
		o.modalonly   = true;

		o = s.taboption('email', form.Value,
		'forward_sms_mail_user', _('User'));
		o.description = _('Username for SMTP authentication.');
		o.modalonly   = true;

		o = s.taboption('email', form.Value,
			'forward_sms_mail_password', _('Password'));
		o.description = _('Google app password / Password for SMTP authentication.');
		o.password    = true;
		o.modalonly   = true;

		o = s.taboption('email', form.Value,
			'forward_sms_mail_smtp', _('SMTP server'));
		o.description = _('Hostname/IP address of the SMTP server.');
		o.datatype    = 'host';
		o.modalonly   = true;

		o = s.taboption('email', form.Value,
			'forward_sms_mail_smtp_port', _('SMTP server port'));
		o.datatype  = 'port';
		o.modalonly = true;

		o = s.taboption('email', form.ListValue,
			'forward_sms_mail_security', _('Security'));
		o.description = '%s<br />%s'.format(
			_('TLS: use STARTTLS if the server supports it.'),
			_('SSL: SMTP over SSL.'),
		);
		o.value('tls', 'TLS');
		o.value('ssl', 'SSL');
		o.default   = 'tls';
		o.modalonly = true;

		o = s.taboption('email', form.DummyValue, '_dummy_mailsend');
		o.rawhtml = true;
		o.render = function() {
			return E('div', {}, [
				E('h3', {}, _('Required Package')),
				E('div', { 'class': 'cbi-map-descr' }, _('The SMS forwarding option requires the mailsend package to be installed.'))
			]);
		};

        o = s.taboption('email', form.DummyValue, '_mailsend_status', _('mailsend package'));
        o.rawhtml = true;
        o.cfgvalue = function(section_id) {
	        return '';
        };
        o.render = function(option_index, section_id, in_table) {
	        return pkg._isPackageInstalled('mailsend').then(function(isInstalled) {
		        var content;
		        
		        if (isInstalled) {
			        content = E('span', {
				        'class': 'cbi-value-field',
				        'style': 'font-style: italic;'
			        }, _('Installed'));
		        } else {
			        content = E('button', {
				        'class': 'cbi-button cbi-button-action',
				        'click': function() {
					        pkg.openInstallerSearch('mailsend');
				        }
			        }, _('Install…'));
		        }
		        
		        return E('div', { 'class': 'cbi-value' }, [
			        E('label', { 'class': 'cbi-value-title' }, _('mailsend')),
			        E('div', { 'class': 'cbi-value-field' }, content)
		        ]);
	        });
        };

		//TAB USSD

		s.tab('ussd', _('USSD Codes Settings'));
		s.anonymous = true;

		o = s.taboption('ussd', form.Value, 'ussdport', _('USSD sending port'), 
			_('Select one of the available ttyUSBX ports.'));
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

		o = s.taboption('ussd', form.ListValue, 'coding', _('PDU decoding scheme'));
		o.value('auto', _('Autodetect'));
		o.value('0', _('7Bit'));
		o.value('2', _('UCS2'));
		o.default = 'auto';

		o = s.taboption('ussd', form.Button, '_ussd_manage');
		o.title = _('User USSD codes');
		o.description = _("Each line must have the following format: 'Code description;code'. For user convenience, the file is saved to the location <code>/etc/modem/ussdcodes/</code>.");
		o.inputtitle = _('Manage USSD codes');
		o.onclick = function() {
			let dialog = new ussdCodesManagerDialog(_('Manage User USSD Codes'));
			dialog.show();
		};

		//TAB AT

		s.tab('attab', _('AT Commands Settings'));
		s.anonymous = true;

		o = s.taboption('attab' , form.Value, 'atport', _('AT commands sending port'), 
			_('Select one of the available ttyUSBX ports.'));
		devs.sort((a, b) => a.name > b.name);
		devs.forEach(dev => o.value('/dev/' + dev.name));

		o.placeholder = _('Please select a port');
		o.rmempty = false;

		o = s.taboption('attab', form.Button, '_at_manage');
		o.title = _('User AT commands');
		o.description = _("Each line must have the following format: 'AT command description;AT command'. For user convenience, the file is saved to the location <code>/etc/modem/atcmmds/</code>.");
		o.inputtitle = _('Manage AT commands');
		o.onclick = function() {
			let dialog = new atCommandsManagerDialog(_('Manage User AT Commands'));
			dialog.show();
		};

		//TAB INFO

		s.tab('notifytab', _('Notification Settings'));
		s.anonymous = true;

		o = s.taboption('notifytab', form.Flag, 'lednotify', _('Notify new messages'),
		_('The LED informs about a new message. Before activating this function, please config and save the SMS reading port, time to check SMS inbox and select the notification LED.')
		);
		o.rmempty = false;
		o.default = true;
		o.write = function(section_id, value) {

			uci.load('sms_tool_js').then(function() {
				let storeL = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'storage'));
				let portR = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'readport'));
				let dsled = (uci.get('sms_tool_js', '@sms_tool_js[0]', 'ledtype'));

		        if (!portR) {
			        ui.addNotification(null, E('p', {}, _('Please configure SMS reading port first')), 'info');
			        return form.Flag.prototype.write.apply(this, [section_id, value]);
		        }

					L.resolveDefault(fs.exec_direct('/usr/bin/sms_tool', [ '-s' , storeL , '-d' , portR , 'status' ]))
						.then(function(res) {
							if (res) {
								let total = res.substring(res.indexOf('total'));
								let t = total.replace ( /[^\d.]/g, '' );
								let used = res.substring(17, res.indexOf('total'));
								let u = used.replace ( /[^\d.]/g, '' );

								let sections = uci.sections('sms_tool_js');
								let led = sections[0].smsled;

								if (value == '1') {
									update_sms_count_for_modem_sync(u, portR).then(function(updatedValue) {
										uci.set('sms_tool_js', '@sms_tool_js[0]', 'sms_count', updatedValue);
										uci.set('sms_tool_js', '@sms_tool_js[0]', 'lednotify', "1");
										uci.save();
										
							            let PTR = uci.get('sms_tool_js', '@sms_tool_js[0]', 'prestart');
							            
                                    fs.exec('sleep 4');
							            
							            L.resolveDefault(fs.read('/etc/crontabs/root'), '').then(function(crontab) {
								            let cronEntry = '1 */' + PTR + ' * * *  /etc/init.d/my_new_sms enable && /etc/init.d/my_new_sms restart';
								            let newCrontab = (crontab || '').trim().replace(/\r\n/g, '\n') + '\n' + cronEntry + '\n';
								            
								            fs.write('/etc/crontabs/root', newCrontab).then(function() {
                                            fs.exec('sleep 2');
									            fs.exec_direct('/etc/init.d/cron', ['restart']);
								            });
							            });

										fs.exec_direct('/etc/init.d/my_new_sms', [ 'enable' ]);
										fs.exec('sleep 2');
										fs.exec_direct('/etc/init.d/my_new_sms', [ 'start' ]);
									});
								}

								if (value == '0') {
									uci.set('sms_tool_js', '@sms_tool_js[0]', 'lednotify', "0");
									uci.save();
									
                                    fs.exec('sleep 4');

						            L.resolveDefault(fs.read('/etc/crontabs/root'), '').then(function(crontab) {
							            let lines = (crontab || '').trim().replace(/\r\n/g, '\n').split('\n');
							            let filteredLines = lines.filter(function(line) {
								            return line.trim() !== '' && !line.includes('my_new_sms');
							            });
							            let newCrontab = filteredLines.join('\n') + '\n';
							            
							            fs.write('/etc/crontabs/root', newCrontab).then(function() {
                                            fs.exec('sleep 2');
								            fs.exec_direct('/etc/init.d/cron', ['restart']);
							            });
						            });

									fs.exec_direct('/etc/init.d/my_new_sms', [ 'stop' ]);
									fs.exec('sleep 2');
									fs.exec_direct('/etc/init.d/my_new_sms', [ 'disable' ]);
									fs.exec_direct('/etc/init.d/my_new_sms', [ 'disable' ]);

									if (dsled == 'D') {
										fs.write('/sys/class/leds/'+led+'/brightness', '0');
									}
								}
							}
					});
			});
			
			return form.Flag.prototype.write.apply(this, [section_id, value]);
		};
		
		o = s.taboption('notifytab', form.Flag, 'ontopsms', _('Show notification icon'),
		_('Show the new message notification icon on the status overview page.')
		);
		o.rmempty = false;
        //o.depends('lednotify', '1');

		o = s.taboption('notifytab', form.Value, 'checktime', _('Check inbox every minute(s)'),
			_('Specify how many minutes you want your inbox to be checked.'));
		o.default = '10';
		o.rmempty = false;
		o.validate = function(section_id, value) {

			if (value.match(/^[0-9]+(?:\.[0-9]+)?$/) && +value >= 5 && +value < 60)
				return true;

			return _('Expect a decimal value between five and fifty-nine');
		};
		o.datatype = 'range(5, 59)';

		o = s.taboption('notifytab' , form.ListValue, 'prestart', _('Restart the inbox checking process every'),
			_('The process will restart at the selected time interval. This will eliminate the delay in checking your inbox.'));
		o.value('4', _('4h'));
		o.value('6', _('6h'));
		o.value('8', _('8h'));
		o.value('12', _('12h'));
		o.default = '6';
		o.rmempty = false;

		o = s.taboption('notifytab' , form.ListValue, 'ledtype',
			_('The diode is dedicated only to these notifications'),
			_("Select 'No' in case the router has only one LED or if the LED is multi-tasking. \
				<br /><br /><b>Important</b> \
				<br />This option requires LED to be defined in the system (if possible) to work properly. \
				This requirement applies when the diode supports multiple tasks."));
		o.value('S', _('No'));
		o.value('D', _('Yes'));
		o.default = 'D';
		o.rmempty = false;

		o = s.taboption('notifytab', form.ListValue, 'smsled',_('<abbr title="Light Emitting Diode">LED</abbr> Name'),
			_('Select the notification LED.'));
		o.load = function(section_id) {
			return L.resolveDefault(fs.list('/sys/class/leds'), []).then(L.bind(function(leds) {
				if(leds.length > 0) {
					leds.sort((a, b) => a.name > b.name);
					leds.forEach(e => o.value(e.name));
				}
				return this.super('load', [section_id]);
			}, this));
		};
		o.exclude = s.section;
		o.nocreate = true;
		o.optional = true;
		o.rmempty = true;

		return m.render();
	}
});
