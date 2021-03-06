/* globals Sortable, $ */
(function() {
	'use strict';

	modV.prototype.startUI = function() {
		var self = this;

		// simplebar
		$('.active-list-wrapper').simplebar({ wrapContent: false });

		self.mainWindowResize();

		var gallery = document.getElementsByClassName('gallery')[0];
		var list = document.getElementsByClassName('active-list')[0];
		self.currentActiveDrag = null;

		Sortable.create(list, {
			group: {
				name: 'layers',
				pull: true,
				put: true
			},
			handle: '.handle',
			chosenClass: 'chosen',
			onEnd: function(evt) {
				self.moveLayerToIndex(evt.oldIndex, evt.newIndex);
			}
		});

		Sortable.create(gallery, {
			group: {
				name: 'modV',
				pull: 'clone',
				put: false
			},
			draggable: '.gallery-item',
			sort: false
		});

		// Handle module removal (not using sortable because of api limitations with clone elements between lists)
		gallery.addEventListener('drop', function(e) {
			e.preventDefault();
			var droppedModuleData = e.dataTransfer.getData('modulename');
			
			self.currentActiveDrag  = null;

			forIn(self.activeModules, (moduleName, Module) => {
				if(Module.info.safeName === droppedModuleData) {					
					self.deleteActiveModule(Module);
				}
			});
		});

		gallery.addEventListener('dragover', function(e) {
			e.preventDefault();
			if(!self.currentActiveDrag) return;

			self.currentActiveDrag.classList.add('deletable');
		});

		gallery.addEventListener('dragleave', function(e) {
			e.preventDefault();
			if(!self.currentActiveDrag) return;
			
			self.currentActiveDrag.classList.remove('deletable');
		});

		window.addEventListener('focusin', activeElementHandler);
		window.addEventListener('focusout', clearActiveElement);

		function clearPanels() {
			var panels = document.querySelectorAll('.control-panel');

			// :^) hacks hacks hacks
			[].forEach.call(panels, function(panel) {
				panel.classList.remove('show');
			});

		}

		function clearCurrent() {
			var activeItems = document.querySelectorAll('.active-item');

			// :^) hacks hacks hacks
			[].forEach.call(activeItems, function(activeItemNode) {
				if(activeItemNode) activeItemNode.classList.remove('current');
			});
		}

		function activeElementHandler(evt) {
			var eventNode = evt.srcElement.closest('.active-item');
			if(!eventNode) return;

			clearCurrent();
			eventNode.classList.add('current');

			var dataName = eventNode.dataset.moduleName;
			var panel = document.querySelector('.control-panel[data-module-name="' + dataName + '"]');
			
			clearPanels();
			panel.classList.add('show');
		}

		function clearActiveElement() {
			// empty
		}

		// Create Global Controls
		var template = self.templates.querySelector('#global-controls');
		var globalControlPanel = document.importNode(template.content, true);

		document.querySelector('.global-control-panel-wrapper').appendChild(globalControlPanel);

		// Pull back initialised node from DOM
		globalControlPanel = document.querySelector('.global-control-panel-wrapper .global-controls');

		globalControlPanel.querySelector('#detectBPMGlobal').addEventListener('change', function() {
			self.useDetectedBPM = this.checked;
		});

		tapTempo.on('tempo', function(tempo){
			self.updateBPM(tempo);
		});

		globalControlPanel.querySelector('#BPMtapperGlobal').addEventListener('click', function() {
			tapTempo.tap();
		});

		let retinaCheckbox = globalControlPanel.querySelector('#retinaGlobal');

		retinaCheckbox.checked = self.options.retina;

		retinaCheckbox.addEventListener('change', function() {
			self.options.retina = this.checked;
			self.resize();
			self.mainWindowResize();
		});

		globalControlPanel.querySelector('#monitorAudioGlobal').addEventListener('change', function() {
				if(this.checked) {
					self.gainNode.gain.value = 1;
				} else {
					self.gainNode.gain.value = 0;
				}
		});

		this.enumerateSourceSelects();

		var audioSelectNode = document.querySelector('#audioSourceGlobal');
		var videoSelectNode = document.querySelector('#videoSourceGlobal');

		audioSelectNode.addEventListener('change', function() {
			self.setMediaSource(this.value, videoSelectNode.value);
		});

		videoSelectNode.addEventListener('change', function() {
			self.setMediaSource(audioSelectNode.value, this.value);
		});

		globalControlPanel.querySelector('#factoryResetGlobal').addEventListener('click', function() {
			self.factoryReset();
		});

		globalControlPanel.querySelector('#setUsername').value = self.options.user;

		globalControlPanel.querySelector('#setUsernameGlobal').addEventListener('click', function() {
			self.setName(globalControlPanel.querySelector('#setUsername').value);
		});

		let chooser = globalControlPanel.querySelector('#selectMediaFolderGlobal');

		chooser.addEventListener('change', function() {
			if(this.value.trim().length > 0) {
				self.mediaManager.send(JSON.stringify({request: 'save-option', key: 'mediaDirectory', value: this.value.trim()}));
			}
		}, false);

		globalControlPanel.querySelector('#selectMediaFolderButtonGlobal').addEventListener('click', function() {
			chooser.click();
		});

		// finds the offset of el from the body or html element
		function getAbsoluteOffsetFromBody( el ) {
			var _x = 0;
			var _y = 0;
			while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
				_x += el.offsetLeft - el.scrollLeft + el.clientLeft;
				_y += el.offsetTop - el.scrollTop + el.clientTop;
				el = el.offsetParent;
			}
			return { top: _y, left: _x };
		}


		function getClickPosition(e) {
			var parentPosition = getPosition(e.currentTarget);
			var xPosition = e.clientX - parentPosition.x;
			var yPosition = e.clientY - parentPosition.y;

			return { x: xPosition, y: yPosition, clientX: e.clientX, clientY: e.clientY};
		}

		function getPosition(element) {
			var xPosition = 0;
			var yPosition = 0;

			while (element) {
				xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
				yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
				element = element.offsetParent;
			}

			return { x: xPosition, y: yPosition };
		}

		// Area resize handles
		var bottom = document.querySelector('.bottom');
		var top = document.querySelector('.top');
		var activeListWrapper = document.querySelector('.active-list-wrapper');
		var galleryWrapper = document.querySelector('.gallery-wrapper');

		var mouseDown = false;
		var draggingBottom = false;
		var draggingGallery = false;

		window.addEventListener('mousedown', function(e) {

			mouseDown = true;
			if(e.currentTarget !== bottom || e.currentTarget !== activeListWrapper) {
				setTimeout(function() {
					mouseDown = false;
				}, 300);
			}

		});

		window.addEventListener('mouseup', function() {

			mouseDown = false;
			draggingBottom = false;
			draggingGallery = false;
			document.body.classList.remove('ns-resize');
			document.body.classList.remove('ew-resize');

		});

		window.addEventListener('mousemove', function(e) {

			var bottomPos = getAbsoluteOffsetFromBody(bottom);
			var galleryPos = getAbsoluteOffsetFromBody(galleryWrapper);
			var mousePosition = getClickPosition(e);
			
			if(mousePosition.clientY > bottomPos.top-3 && mousePosition.clientY < bottomPos.top+3) {

				document.body.classList.add('ns-resize');

				if(mouseDown) {
					draggingBottom = true;
				}
			} else if(
				mousePosition.clientX > galleryPos.left-3 &&
				mousePosition.clientX < galleryPos.left+3 &&
				mousePosition.clientY < bottomPos.top-3 ) {

				document.body.classList.add('ew-resize');

				if(mouseDown) {
					draggingGallery = true;
				}

			} else {

				if(!draggingBottom) {
					document.body.classList.remove('ns-resize');
				}

				if(!draggingGallery) {
					document.body.classList.remove('ew-resize');
				}
			}

			if(draggingBottom) {
				document.body.classList.add('ns-resize');
				e.preventDefault();
				e.cancelBubble=true;
				e.returnValue=false;

				var bottomHeight = 100 - ( mousePosition.clientY / window.innerHeight  ) * 100;

				if(bottomHeight < 20 || bottomHeight > 75) return false;

				bottom.style.height = bottomHeight + '%';
				top.style.height = (100 - bottomHeight) + '%';

				self.mainWindowResize();

				return false;
			}

			if(draggingGallery) {
				document.body.classList.add('ew-resize');
				e.preventDefault();
				e.cancelBubble=true;
				e.returnValue=false;

				var galleryWidth = (100 - ( mousePosition.clientX / window.innerWidth  ) * 100);

				if(galleryWidth < 20 || galleryWidth > (100 - (306 / window.innerWidth) * 100)) {
					console.log('nooooo');
					return false;
				}

				//galleryWrapper.style.width = galleryWidth + '%';
				activeListWrapper.style.width = (100 - galleryWidth) + '%';

				return false;
			}

		});

		//let galleryWidth = Math.floor(100 - (306 / window.innerWidth) * 100);

		//galleryWrapper.style.width = galleryWidth + '%';
		//activeListWrapper.style.width = (100 - galleryWidth) + '%';

		// Layer menu

		var addLayerButton = document.querySelector('.add-layer');
		addLayerButton.addEventListener('click', function() {
			self.addLayer();			
		});

		function findAncestor (el, cls) {
			while ((el = el.parentElement) && !el.classList.contains(cls));
			return el;
		}

		list.addEventListener('mousedown', e => {
			// find ancestor
			let ancestor = findAncestor(e.target, 'layer-item');

			if(e.target.classList.contains('layer-item') || ancestor) return;
			self.layers.forEach(Layer => {
				Layer.getNode().classList.remove('active');
			});
		});

		var trashLayerButton = document.querySelector('.trash-layer');
		trashLayerButton.addEventListener('click', function() {
			let Layer = self.layers[self.activeLayer];
			let activeLayer = document.querySelector('.layer-item.active');
			if(Layer && activeLayer) self.removeLayer(Layer);
		});

		// Create Layer Controls
		let layerTemplate = self.templates.querySelector('#layer-controls');
		let layerControlPanel = document.importNode(layerTemplate.content, true);

		document.querySelector('.layer-control-panel-wrapper').appendChild(layerControlPanel);

		// Pull back initialised node from DOM
		layerControlPanel = document.querySelector('.layer-control-panel-wrapper .layer-controls');

		layerControlPanel.querySelector('#clearingLayers').addEventListener('click', function() {
			self.layers[self.activeLayer].clearing = this.checked;
		});

		layerControlPanel.querySelector('#inheritLayers').addEventListener('click', function() {
			self.layers[self.activeLayer].inherit = this.checked;
		});

		layerControlPanel.querySelector('#pipeLineLayers').addEventListener('click', function() {
			self.layers[self.activeLayer].pipeline = this.checked;
		});

		this.updateLayerControls();

		// Create Preset Controls
		let presetTemplate = self.templates.querySelector('#preset-controls');
		let presetControlPanel = document.importNode(presetTemplate.content, true);

		document.querySelector('.preset-control-panel-wrapper').appendChild(presetControlPanel);

		// Pull back initialised node from DOM
		presetControlPanel = document.querySelector('.preset-control-panel-wrapper .preset-controls');

		let presetSelectNode = presetControlPanel.querySelector('#loadPresetSelect');

		// Set up loaded presets
		forIn(this.profiles, (profileName, profile) => {
			forIn(profile.presets, presetName => {
				var optionNode = document.createElement('option');
				optionNode.value = presetName;
				optionNode.textContent = presetName;

				presetSelectNode.appendChild(optionNode);
			});
		});

		presetControlPanel.querySelector('#loadPreset').addEventListener('click', function() {
			self.loadPreset(presetControlPanel.querySelector('#loadPresetSelect').value);
		});

		presetControlPanel.querySelector('#savePreset').addEventListener('click', function() {
			self.savePreset(presetControlPanel.querySelector('#savePresetName').value, 'default');
		});

		// Tabs for right-side controls
		let rightTabs = this.TabController();
		rightTabs = new rightTabs(); //jshint ignore:line
		rightTabs.add('Layers', document.querySelector('.layer-control-panel-wrapper'), true);
		rightTabs.add('Global', document.querySelector('.global-control-panel-wrapper'));
		rightTabs.add('Presets', document.querySelector('.preset-control-panel-wrapper'));

		let rightControls = document.querySelector('.right-controls');

		rightControls.insertBefore(rightTabs.tabBar(), rightControls.firstChild);
	};

})(module);