describe('Popup', () => {

  const testPopup = new Popup();

  describe('loadSiteList', () => {

    let sitesListContainer;
    let getSitesStub;

    before(() => {
      sitesListContainer = document.createElement('div');
      sitesListContainer.id = 'sites-list-container';
      document.body.appendChild(sitesListContainer);

      getSitesStub = sinon.stub(testPopup, 'getSites');
      getSitesStub.resolves(['test.com', 'test.co.uk'])
    });

    after(() => {
      document.body.removeChild(sitesListContainer);
      getSitesStub.restore();
    });

    it('should add list item and button for each site', () => {
      const expected = `<ul><li><span>test.com</span>${config.buttonString}</li><li><span>test.co.uk</span>${config.buttonString}</li></ul>`;

      return testPopup.loadSiteList()
        .then(() => {
          expect(sitesListContainer.innerHTML).to.equal(expected);
        });
    });

  });

  describe('getSites', () => {

    let getFromSyncStorageStub;

    before(() => {
      getFromSyncStorageStub = sinon.stub(testPopup.utils, 'getFromSyncStorage')
        .resolves({
          dark: '',
          reverse: '',
          clickAndRoll: '',
          whitelist: '',
          'test.com': '',
          'test.co.uk': ''
        });
    });

    after(() => {
      getFromSyncStorageStub.restore();
    });

    it('should return only sites from fetched items', () => {
      return testPopup.getSites()
        .then(res => {
          expect(res).to.deep.equal(['test.com', 'test.co.uk']);
        })
    });

  });

  describe('toggleCheckbox', () => {

    let checkbox;
    let getAttributeStub;
    let removeAttributeSpy;
    let setAttributeSpy;
    let getElementByIdStub;

    before(() => {
      checkbox = {
        getAttribute: () => {},
        removeAttribute: () => {},
        setAttribute: () => {}
      };

      getElementByIdStub = sinon.stub(document, 'getElementById').returns(checkbox);
      getAttributeStub = sinon.stub(checkbox, 'getAttribute');
      removeAttributeSpy = sinon.spy(checkbox, 'removeAttribute');
      setAttributeSpy = sinon.spy(checkbox, 'setAttribute');
    });

    afterEach(() =>{
      getElementByIdStub.resetHistory();
      getAttributeStub.resetHistory();
      removeAttributeSpy.resetHistory();
      setAttributeSpy.resetHistory();
    });

    after(() => {
      getElementByIdStub.restore();
      getAttributeStub.restore();
      removeAttributeSpy.restore();
      setAttributeSpy.restore();
    });

    it('should fetch the checkbox by id', () => {
      testPopup.toggleCheckbox('test');
      expect(getElementByIdStub.calledOnce).to.equal(true);
      expect(getElementByIdStub.withArgs('test').calledOnce).to.equal(true);
    });

    it('should remove the checked attribute if present', () => {
      getAttributeStub.returns('checked');
      testPopup.toggleCheckbox();
      expect(removeAttributeSpy.calledOnce).to.equal(true);
      expect(removeAttributeSpy.withArgs('checked').calledOnce).to.equal(true);
    });

    it('should set the checked attribute if absent', () => {
      getAttributeStub.returns(null);
      testPopup.toggleCheckbox();
      expect(setAttributeSpy.calledOnce).to.equal(true);
      expect(setAttributeSpy.firstCall.args).to.deep.equal(['checked', 'checked']);
    });

  });

  describe('toggleSetting', () => {

    let isSettingOnStub;
    let messageActiveTabStub;
    let saveToSyncStorageStub;
    let removeFromSyncStorageStub;
    let testTab;

    before(() => {
      testTab = {
        url: 'https://www.test.com/test',
        id: 'test'
      };

      testPopup.tab = testTab;

      isSettingOnStub = sinon.stub(testPopup.utils, 'isSettingOn');
      messageActiveTabStub = sinon.stub(testPopup.utils, 'messageActiveTab');
      saveToSyncStorageStub = sinon.stub(testPopup.utils, 'saveToSyncStorage');
      removeFromSyncStorageStub = sinon.stub(testPopup.utils, 'removeFromSyncStorage');
    });

    afterEach(() => {
      isSettingOnStub.resetHistory();
      messageActiveTabStub.resetHistory();
      saveToSyncStorageStub.resetHistory();
      removeFromSyncStorageStub.resetHistory();

      isSettingOnStub.resolves(null);
      saveToSyncStorageStub.resolves(null);
    });

    after(() => {
      isSettingOnStub.restore();
      messageActiveTabStub.restore();
      saveToSyncStorageStub.restore();
      removeFromSyncStorageStub.restore();

      testPopup.tab = null;
    });

    it('should remove off by default setting if it was on', () => {
      isSettingOnStub.resolves(true);
      return testPopup.toggleSetting('reverse')
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['reverse']);
        })
    });

    it('should save off by default setting as true if it was off', () => {
      isSettingOnStub.resolves(false);
      return testPopup.toggleSetting('reverse')
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['reverse', 'true']);
        })
    });

    it('should save on by default setting if it was on', () => {
      isSettingOnStub.resolves(true);
      return testPopup.toggleSetting('clickAndRoll')
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['clickAndRoll', '']);
        })
    });

    it('should remove on by default setting if it was off', () => {
      isSettingOnStub.resolves(false);
      return testPopup.toggleSetting('clickAndRoll')
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['clickAndRoll']);
        })
    });

    it('should message active tab if setting is reverse', () => {
      isSettingOnStub.resolves(false);
      return testPopup.toggleSetting('reverse')
        .then(() => {
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'toggle-reverse', isOn: true}]);
        });
    });

    it('should message active tab and apply dark mode class if setting is dark', () => {
      isSettingOnStub.resolves(false);
      return testPopup.toggleSetting('dark')
        .then(() => {
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'toggle-dark', isOn: true}]);
          expect(document.body.classList.contains('dark-mode')).to.equal(true);
        });
    });

  });

  describe('addToggleAnimation', () => {

    let slider;

    before(() => {
      slider = document.createElement('div');
      slider.classList.add('slider-initial');
    });

    it('should remove the slider-initial class and add the slider class', () => {
      testPopup.addToggleAnimation(slider);
      expect(slider.classList.length).to.equal(1);
      expect(slider.classList[0]).to.equal('slider');
    });

  });

  describe('updateIconAndStatus', () => {

    let isExtensionOnStub;
    let messageActiveTabStub;
    let getTabUrlStub;
    let setIconStub;

    before(() => {
      browser.browserAction = {
        setIcon: (arg) => {}
      };

      testPopup.tab = { id: 0 }

      isExtensionOnStub = sinon.stub(testPopup.utils, 'isExtensionOn');
      messageActiveTabStub = sinon.stub(testPopup.utils, 'messageActiveTab');
      getTabUrlStub = sinon.stub(testPopup.utils, 'getTabUrl');
      setIconStub = sinon.stub(browser.browserAction, 'setIcon');
    });

    afterEach(() => {
      isExtensionOnStub.resetHistory();
      messageActiveTabStub.resetHistory();
      getTabUrlStub.resetHistory();
      setIconStub.resetHistory();
    });

    after(() => {
      isExtensionOnStub.restore();
      messageActiveTabStub.restore();
      getTabUrlStub.restore();
      setIconStub.restore();

      delete browser.browserAction;
    });

    it('should message active tab to start and set active icon if extension is on', () => {
      isExtensionOnStub.resolves(true);

      return testPopup.updateIconAndStatus()
        .then(() => {
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'start'}]);
          expect(setIconStub.calledOnce).to.equal(true);
          expect(setIconStub.firstCall.args).to.deep.equal([{ path: '../assets/static/active32.png', tabId: 0}]);
        });
    });

    it('should message active tab to stop and set inactive icon if extension is on', () => {
      isExtensionOnStub.resolves(false);

      return testPopup.updateIconAndStatus()
        .then(() => {
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'stop'}]);
          expect(setIconStub.calledOnce).to.equal(true);
          expect(setIconStub.firstCall.args).to.deep.equal([{ path: '../assets/static/inactive32.png', tabId: 0}]);
        });
    });

  });

  describe('initialiseSettings', () => {

    let getActiveTabStub;
    let isSettingOnStub;
    let getFromSyncStorageStub;
    let toggleCheckboxStub;
    let loadSiteListStub;
    let applyColourSchemeStub;
    let testTab;

    let whitelist;
    let blacklist;

    before(() => {
      testTab = {
        url: 'https://www.test.com/test',
        id: 'test'
      };

      whitelist = document.createElement('div');
      whitelist.id = 'whitelist';

      blacklist = document.createElement('div');
      blacklist.id = 'blacklist';

      document.body.appendChild(whitelist);
      document.body.appendChild(blacklist);

      getActiveTabStub = sinon.stub(testPopup.utils, 'getActiveTab').resolves(testTab);
      isSettingOnStub = sinon.stub(testPopup.utils, 'isSettingOn');
      getFromSyncStorageStub = sinon.stub(testPopup.utils, 'getFromSyncStorage');
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox');
      loadSiteListStub = sinon.stub(testPopup, 'loadSiteList');
      applyColourSchemeStub = sinon.stub(testPopup, 'applyColourScheme');

      isSettingOnStub.withArgs('whitelist').resolves(true);
      getFromSyncStorageStub.withArgs('www.test.com').resolves({'www.test.com': ''});
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('reverse').resolves(true);
      isSettingOnStub.withArgs('dark').resolves(true);
    });

    afterEach(() => {
      isSettingOnStub.resetHistory();
      getFromSyncStorageStub.resetHistory();
      toggleCheckboxStub.resetHistory();
      loadSiteListStub.resetHistory();
      applyColourSchemeStub.resetHistory();
    });

    after(() => {
      getActiveTabStub.restore();
      isSettingOnStub.restore();
      getFromSyncStorageStub.restore();
      toggleCheckboxStub.restore();
      loadSiteListStub.restore();
      applyColourSchemeStub.restore();

      document.body.removeChild(whitelist);
      document.body.removeChild(blacklist);
    });

    it('should set the tab', () => {
      return testPopup.initialiseSettings()
        .then(() => {
          expect(testPopup.tab).to.equal(testTab);
        })
    });

    it('should visually toggle settings which are on', () => {
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.callCount).to.equal(4);
        })
    });

    it('should apply dark mode if on', () => {
      return testPopup.initialiseSettings()
        .then(() => {
          expect(applyColourSchemeStub.calledOnce).to.equal(true);
          expect(applyColourSchemeStub.firstCall.args).to.deep.equal([true]);

        });
    });

    it('should load sitelist', () => {
      return testPopup.initialiseSettings()
        .then(() => {
          expect(loadSiteListStub.calledOnce).to.equal(true);
        });
    });

  });

  describe('handleClick', () => {

    let event;
    let handleToggleStub;
    let handleNamedToggleStub;
    let handleTabStub;
    let handleButtonStub;
    let createTabStub;
    let containsStub;

    before(() => {
      event = {
        target: {
          id: '',
          classList: { contains: () => {} },
          href: '',
          tagName: ''
        },
        preventDefault: () => {}
      };

      browser.tabs = { create: () => {} };

      handleToggleStub = sinon.stub(testPopup, 'handleToggle');
      handleNamedToggleStub = sinon.stub(testPopup, 'handleNamedToggle');
      handleTabStub = sinon.stub(testPopup, 'handleTab');
      handleButtonStub = sinon.stub(testPopup, 'handleButton');
      createTabStub = sinon.stub(browser.tabs, 'create');
      containsStub = sinon.stub(event.target.classList, 'contains');

      containsStub.withArgs('named-toggle-button').returns(false);
      containsStub.withArgs('tab').returns(false);
    });

    afterEach(() => {
      handleToggleStub.resetHistory();
      handleNamedToggleStub.resetHistory();
      handleTabStub.resetHistory();
      handleButtonStub.resetHistory();
      createTabStub.resetHistory();
      containsStub.resetHistory();

      containsStub.withArgs('named-toggle-button').returns(false);
      containsStub.withArgs('tab').returns(false);

      event.target.id = '';
      event.target.tagName = undefined;
    });

    after(() => {
      handleToggleStub.restore();
      handleNamedToggleStub.restore();
      handleTabStub.restore();
      handleButtonStub.restore();
      createTabStub.restore();
      containsStub.restore();

      delete browser.tabs;
    });

    it('should handle toggle if target is slider', () => {
      event.target.id = 'test-slider';

      testPopup.handleClick(event);
      expect(handleToggleStub.calledOnce).to.equal(true);
      expect(handleNamedToggleStub.notCalled).to.equal(true);
      expect(handleTabStub.notCalled).to.equal(true);
      expect(handleButtonStub.notCalled).to.equal(true);
      expect(createTabStub.notCalled).to.equal(true);
    });

    it('should handle named if target is named toggle', () => {
      containsStub.withArgs('named-toggle-button').returns(true);

      testPopup.handleClick(event);
      expect(handleToggleStub.notCalled).to.equal(true);
      expect(handleNamedToggleStub.calledOnce).to.equal(true);
      expect(handleTabStub.notCalled).to.equal(true);
      expect(handleButtonStub.notCalled).to.equal(true);
      expect(createTabStub.notCalled).to.equal(true);
    });

    it('should handle tab if target is tab ', () => {
      containsStub.withArgs('tab').returns(true);

      testPopup.handleClick(event);
      expect(handleToggleStub.notCalled).to.equal(true);
      expect(handleNamedToggleStub.notCalled).to.equal(true);
      expect(handleTabStub.calledOnce).to.equal(true);
      expect(handleButtonStub.notCalled).to.equal(true);
      expect(createTabStub.notCalled).to.equal(true);
    });

    it('should handle button if target is button', () => {
      event.target.tagName = 'BUTTON';

      testPopup.handleClick(event);
      expect(handleToggleStub.notCalled).to.equal(true);
      expect(handleNamedToggleStub.notCalled).to.equal(true);
      expect(handleTabStub.notCalled).to.equal(true);
      expect(handleButtonStub.calledOnce).to.equal(true);
      expect(createTabStub.notCalled).to.equal(true);
    });

    it('should create tab with target href if target is link', () => {
      event.target.href = 'test';

      testPopup.handleClick(event);
      expect(handleToggleStub.notCalled).to.equal(true);
      expect(handleNamedToggleStub.notCalled).to.equal(true);
      expect(handleTabStub.notCalled).to.equal(true);
      expect(handleButtonStub.notCalled).to.equal(true);
      expect(createTabStub.calledOnce).to.equal(true);
      expect(createTabStub.firstCall.args).to.deep.equal([{url: 'test'}]);
    });

  });

  describe('handleToggle', () => {

    let event;
    let containsStub;
    let addToggleAnimationStub;
    let toggleCheckboxStub;
    let handleToggleDomainStub;
    let toggleSettingStub;
    let updateIconAndStatusStub;

    before(() => {
      event = {
        target: {
          id: '',
          classList: { contains: () => {} }
        }
      };

      containsStub = sinon.stub(event.target.classList, 'contains');
      addToggleAnimationStub = sinon.stub(testPopup, 'addToggleAnimation');
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox').resolves();
      handleToggleDomainStub = sinon.stub(testPopup, 'handleToggleDomain').resolves();
      toggleSettingStub = sinon.stub(testPopup, 'toggleSetting').resolves();
      updateIconAndStatusStub = sinon.stub(testPopup, 'updateIconAndStatus').resolves();
    });

    afterEach(() => {
      containsStub.resetHistory();
      addToggleAnimationStub.resetHistory();
      toggleCheckboxStub.resetHistory();
      handleToggleDomainStub.resetHistory();
      toggleSettingStub.resetHistory();
      updateIconAndStatusStub.resetHistory();

      containsStub.withArgs('slider-initial').returns(false);

      event.id = '';
    });

    after(() => {
      containsStub.restore();
      addToggleAnimationStub.restore();
      toggleCheckboxStub.restore();
      handleToggleDomainStub.restore();
      toggleSettingStub.restore();
      updateIconAndStatusStub.restore();
    });

    it('should add toggle animation if slider has initial class', () => {
      event.target.id = 'domain-slider';
      containsStub.withArgs('slider-initial').returns(true);

      return testPopup.handleToggle(event)
        .then(() => {
          expect(addToggleAnimationStub.calledOnce).to.equal(true);
        });
    });

    it('should not add toggle animation if slider does not have initial class', () => {
      event.target.id = 'domain-slider';
      containsStub.withArgs('slider-initial').returns(false);

      return testPopup.handleToggle(event)
        .then(() => {
          expect(addToggleAnimationStub.calledOnce).to.equal(false);
        });
    });

    it('should toggle the checkbox', () => {
      event.target.id = 'domain-slider';
      return testPopup.handleToggle(event)
        .then(() => {
          expect(toggleCheckboxStub.calledOnce).to.equal(true);
        });
    });

    it('should toggle domain if target domain slider', () => {
      event.target.id = 'domain-slider';
      return testPopup.handleToggle(event)
        .then(() => {
          expect(handleToggleDomainStub.calledOnce).to.equal(true);
        });
    });

    it('should toggle clickAndRoll and update icon and status if target is extension slider', () => {
      event.target.id = 'extension-slider';
      return testPopup.handleToggle(event)
        .then(() => {
          expect(toggleSettingStub.calledOnce).to.equal(true);
          expect(toggleSettingStub.firstCall.args).to.deep.equal(['clickAndRoll']);
          expect(updateIconAndStatusStub.calledOnce).to.equal(true);
        });
    });

    it('should toggle reverse if is revers slider', () => {
      event.target.id = 'reverse-slider';
      return testPopup.handleToggle(event)
        .then(() => {
          expect(toggleSettingStub.calledOnce).to.equal(true);
          expect(toggleSettingStub.firstCall.args).to.deep.equal(['reverse']);
        });
    });

    it('should toggle reverse if is revers slider', () => {
      event.target.id = 'dark-slider';
      return testPopup.handleToggle(event)
        .then(() => {
          expect(toggleSettingStub.calledOnce).to.equal(true);
          expect(toggleSettingStub.firstCall.args).to.deep.equal(['dark']);
        });
    });

  });

  describe('handleToggleDomain', () => {

    let getTabUrlStub;
    let getFromSyncStorageStub;
    let saveToSyncStorageStub;
    let removeFromSyncStorageStub;
    let updateIconAndStatusStub;
    let loadSiteListStub;

    before(() => {
      getTabUrlStub = sinon.stub(testPopup.utils, 'getTabUrl').returns('test.com');
      getFromSyncStorageStub = sinon.stub(testPopup.utils, 'getFromSyncStorage');
      saveToSyncStorageStub = sinon.stub(testPopup.utils, 'saveToSyncStorage');
      removeFromSyncStorageStub = sinon.stub(testPopup.utils, 'removeFromSyncStorage');
      updateIconAndStatusStub = sinon.stub(testPopup, 'updateIconAndStatus');
      loadSiteListStub = sinon.stub(testPopup, 'loadSiteList');
    });

    afterEach(() => {
      getTabUrlStub.resetHistory();
      getFromSyncStorageStub.resetHistory();
      saveToSyncStorageStub.resetHistory();
      removeFromSyncStorageStub.resetHistory();
      updateIconAndStatusStub.resetHistory();
      loadSiteListStub.resetHistory();
    });

    after(() => {
      getTabUrlStub.restore();
      getFromSyncStorageStub.restore();
      saveToSyncStorageStub.restore();
      removeFromSyncStorageStub.restore();
      updateIconAndStatusStub.restore();
      loadSiteListStub.restore();
    });

    it ('should save url to storage if absent', () => {
      getFromSyncStorageStub.resolves(null);
      return testPopup.handleToggleDomain()
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['test.com', '']);
        })
    });

    it ('should remove url from storage if present', () => {
      getFromSyncStorageStub.resolves({'test.com': ''});
      return testPopup.handleToggleDomain()
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['test.com']);
        })
    });

    it ('should update icon and status and toggle checkbox', () => {
      return testPopup.handleToggleDomain()
        .then(() => {
          expect(updateIconAndStatusStub.calledOnce).to.equal(true);
          expect(loadSiteListStub.calledOnce).to.equal(true);
        })
    });

  });

  describe('handleNamedToggle', () => {

    let event;
    let containsStub;
    let addStub;
    let toggleSettingStub;
    let updateIconAndStatusStub;
    let toggleCheckboxStub;

    before(() => {
      event = {
        target: {
          classList: {
            contains: () => {},
            add: () => {},
          }
        }
      };

      containsStub = sinon.stub(event.target.classList, 'contains');
      addStub = sinon.stub(event.target.classList, 'add');
      toggleSettingStub = sinon.stub(testPopup, 'toggleSetting').resolves();
      updateIconAndStatusStub = sinon.stub(testPopup, 'updateIconAndStatus').resolves();
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox').resolves();
    });

    afterEach(() => {
      containsStub.resetHistory();
      addStub.resetHistory();
      toggleSettingStub.resetHistory();
      updateIconAndStatusStub.resetHistory();
      toggleCheckboxStub.resetHistory();
    });

    after(() => {
      containsStub.restore();
      addStub.restore();
      toggleSettingStub.restore();
      updateIconAndStatusStub.restore();
      toggleCheckboxStub.restore();
    });

    it('should return if target is active', () => {
      containsStub.returns(true);
      testPopup.handleNamedToggle(event);
      expect(addStub.notCalled).to.equal(true);
    });

    it('should add active class, toggle whitelist, update icon and status, and toggle checkbox if target is inactive', () => {
      containsStub.returns(false);

      return testPopup.handleNamedToggle(event)
        .then(() => {
          expect(addStub.calledOnce).to.equal(true);
          expect(addStub.firstCall.args).to.deep.equal(['active']);
          expect(toggleSettingStub.calledOnce).to.equal(true);
          expect(toggleSettingStub.firstCall.args).to.deep.equal(['whitelist']);
          expect(updateIconAndStatusStub.calledOnce).to.equal(true);
          expect(toggleCheckboxStub.calledOnce).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['domain-input']);
        });
    });

  });

  describe('handleButton', () => {

    let event;
    let getTabUrlStub;
    let toggleCheckboxStub;
    let removeFromSyncStorageStub;
    let updateIconAndStatusSub;
    let loadSiteListStub;

    before(() => {
      event = { target: { previousElementSibling: { textContent : '' } } };

      getTabUrlStub = sinon.stub(testPopup.utils, 'getTabUrl');
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox');
      removeFromSyncStorageStub = sinon.stub(testPopup.utils, 'removeFromSyncStorage').resolves();
      updateIconAndStatusSub = sinon.stub(testPopup, 'updateIconAndStatus').resolves();
      loadSiteListStub = sinon.stub(testPopup, 'loadSiteList').resolves();
    });

    afterEach(() => {
      getTabUrlStub.resetHistory();
      toggleCheckboxStub.resetHistory();
      removeFromSyncStorageStub.resetHistory();
      updateIconAndStatusSub.resetHistory();
      loadSiteListStub.resetHistory();
    });

    after(() => {
      getTabUrlStub.restore();
      toggleCheckboxStub.restore();
      removeFromSyncStorageStub.restore();
      updateIconAndStatusSub.restore();
      loadSiteListStub.restore();
    });

    it('should toggle checkbox if current tab is same as url to remove', () => {
      event.target.previousElementSibling.textContent = 'test.com';
      getTabUrlStub.returns('test.com');

      return testPopup.handleButton(event)
        .then(() => {
          expect(toggleCheckboxStub.calledOnce).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['domain-input']);
        })
    });

    it('should not toggle checkbox if current tab is different from url to remove', () => {
      event.target.previousElementSibling.textContent = 'test.co.uk';
      getTabUrlStub.returns('test.com');

      return testPopup.handleButton(event)
        .then(() => {
          expect(toggleCheckboxStub.notCalled).to.equal(true);
        })
    });

    it('should remove url from sync storage, update icon and status, and load site list', () => {
      event.target.previousElementSibling.textContent = 'test.com';

      return testPopup.handleButton(event)
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['test.com']);
          expect(updateIconAndStatusSub.calledOnce).to.equal(true);
          expect(loadSiteListStub.calledOnce).to.equal(true);
        });
    });

  });

});
