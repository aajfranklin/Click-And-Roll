describe('Popup', () => {

  const testPopup = new Popup();

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

  describe('toggleOnOffSetting', () => {

    let isExtensionOnStub;
    let isSettingOnStub;
    let messageActiveTabStub;
    let saveToSyncStorageStub;
    let removeFromSyncStorageStub;
    let browserSetIconStub;
    let testTab;

    before(() => {
      testTab = {
        url: 'https://www.test.com/test',
        id: 'test'
      };

      testPopup.tab = testTab;

      browser.browserAction = {
        setIcon: () => {}
      };

      isExtensionOnStub = sinon.stub(testPopup.utils, 'isExtensionOn');
      isSettingOnStub = sinon.stub(testPopup.utils, 'isSettingOn');
      messageActiveTabStub = sinon.stub(testPopup.utils, 'messageActiveTab');
      saveToSyncStorageStub = sinon.stub(testPopup.utils, 'saveToSyncStorage');
      removeFromSyncStorageStub = sinon.stub(testPopup.utils, 'removeFromSyncStorage');
      browserSetIconStub = sinon.stub(browser.browserAction, 'setIcon');
    });

    afterEach(() => {
      isExtensionOnStub.resetHistory();
      isSettingOnStub.resetHistory();
      messageActiveTabStub.resetHistory();
      saveToSyncStorageStub.resetHistory();
      removeFromSyncStorageStub.resetHistory();
      browserSetIconStub.resetHistory();

      isExtensionOnStub.resolves(null);
      isSettingOnStub.resolves(null);
      saveToSyncStorageStub.resolves(null);
    });

    after(() => {
      isExtensionOnStub.restore();
      isSettingOnStub.restore();
      messageActiveTabStub.restore();
      saveToSyncStorageStub.restore();
      removeFromSyncStorageStub.restore();
      browserSetIconStub.restore();

      delete browser.browserAction;
      testPopup.tab = null;
    });

    it('should save setting as \'\', send \'stop\' message, and set inactive icon if setting is on', () => {
      isSettingOnStub.resolves(true);
      saveToSyncStorageStub.resolves(true);
      return testPopup.toggleOnOffSetting('testSetting')
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['testSetting', '']);
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'stop'}]);
          expect(browserSetIconStub.calledOnce).to.equal(true);
          expect(browserSetIconStub.firstCall.args).to.deep.equal([{path: '../assets/static/inactive32.png', tabId: 'test'}])
        })
    });

    it('should remove setting, send \'start\' message, and set active icon if setting is off and extension is on', () => {
      isSettingOnStub.resolves(false);
      isExtensionOnStub.resolves(true);
      return testPopup.toggleOnOffSetting('testSetting')
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['testSetting']);
          expect(isExtensionOnStub.calledOnce).to.equal(true);
          expect(isExtensionOnStub.firstCall.args).to.deep.equal(['www.test.com']);
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'start'}]);
          expect(browserSetIconStub.calledOnce).to.equal(true);
          expect(browserSetIconStub.firstCall.args).to.deep.equal([{path: '../assets/static/active32.png', tabId: 'test'}])
        });
    });

    it('should remove setting and send no message if setting is off and extension is off', () => {
      isSettingOnStub.resolves(false);
      isExtensionOnStub.resolves(false);
      return testPopup.toggleOnOffSetting('testSetting')
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['testSetting']);
          expect(isExtensionOnStub.calledOnce).to.equal(true);
          expect(isExtensionOnStub.firstCall.args).to.deep.equal(['www.test.com']);
          expect(messageActiveTabStub.notCalled).to.equal(true);
          expect(browserSetIconStub.notCalled).to.equal(true);
        });
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

    it('should remove setting if it was on', () => {
      isSettingOnStub.resolves(true);
      return testPopup.toggleSetting('reverse')
        .then(() => {
          expect(removeFromSyncStorageStub.calledOnce).to.equal(true);
          expect(removeFromSyncStorageStub.firstCall.args).to.deep.equal(['reverse']);
        })
    });

    it('should save setting as true if it was off', () => {
      isSettingOnStub.resolves(false);
      return testPopup.toggleSetting('reverse')
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['reverse', 'true']);
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

  describe('initialiseSettings', () => {

    let getActiveTabStub;
    let isSettingOnStub;
    let toggleCheckboxStub;
    let testTab;

    before(() => {
      testTab = {
        url: 'https://www.test.com/test',
        id: 'test'
      };

      getActiveTabStub = sinon.stub(testPopup.utils, 'getActiveTab').resolves(testTab);
      isSettingOnStub = sinon.stub(testPopup.utils, 'isSettingOn');
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox');
    });

    afterEach(() => {
      isSettingOnStub.resolves(null);
      isSettingOnStub.resetHistory();
      toggleCheckboxStub.resetHistory();
    });

    after(() => {
      getActiveTabStub.restore();
      isSettingOnStub.restore();
      toggleCheckboxStub.restore();
    });

    it('should set the tab', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(true);
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(testPopup.tab).to.equal(testTab);
        })
    });

    it('should visually toggle settings which are on', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(true);
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('reverse').resolves(false);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.calledTwice).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args[0]).to.equal('domain-toggle');
          expect(toggleCheckboxStub.secondCall.args[0]).to.equal('extension-toggle');
        })
    });

  });

  describe('handleClick', () => {

    let addToggleAnimationStub;
    let toggleCheckboxStub;
    let toggleSettingStub;
    let toggleOnOffSettingStub;
    let browserCreateTabStub;

    let testTab;

    before(() => {
      browser.tabs = {
        create: () => {}
      };

      testTab = {
        url: 'https://www.test.com/test',
        id: 'test'
      };

      testPopup.tab = testTab;

      addToggleAnimationStub = sinon.stub(testPopup, 'addToggleAnimation');
      toggleCheckboxStub = sinon.stub(testPopup, 'toggleCheckbox');
      toggleSettingStub = sinon.stub(testPopup, 'toggleSetting');
      toggleOnOffSettingStub = sinon.stub(testPopup, 'toggleOnOffSetting');
      browserCreateTabStub = sinon.stub(browser.tabs, 'create');
    });

    afterEach(() => {
      addToggleAnimationStub.resetHistory();
      toggleCheckboxStub.resetHistory();
      toggleSettingStub.resetHistory();
      toggleOnOffSettingStub.resetHistory();
      browserCreateTabStub.resetHistory();
    });

    after(() => {
      addToggleAnimationStub.restore();
      toggleCheckboxStub.restore();
      toggleSettingStub.restore();
      toggleOnOffSettingStub.restore();
      browserCreateTabStub.restore();

      testPopup.tab = null;
    });

    it('should add the toggle animation if target id contains toggle and animation not present', () => {
      const e = {
        target: {
          id: '-toggle',
          classList: {
            contains: () => false
          },
          nextElementSibling: {
            classList: {
              contains: () => true
            }
          }
        }
      };

      testPopup.handleClick(e);
      expect(addToggleAnimationStub.calledOnce).to.equal(true);
    });

    it('should toggle extension slider and setting if target is extension toggle', () => {
      const e = {
        target: {
          id: 'extension-toggle',
          classList: {
            contains: () => false
          },
          nextElementSibling: {
            classList: {
              contains: () => false
            }
          }
        }
      };

      testPopup.handleClick(e);
      expect(toggleCheckboxStub.calledOnce).to.equal(true);
      expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['extension-toggle']);
      expect(toggleOnOffSettingStub.calledOnce).to.equal(true);
      expect(toggleOnOffSettingStub.firstCall.args).to.deep.equal(['clickAndRoll']);
    });

    it('should toggle domain slider and setting if target is domain toggle', () => {
      const e = {
        target: {
          id: 'domain-toggle',
          classList: {
            contains: () => false
          },
          nextElementSibling: {
            classList: {
              contains: () => false
            }
          }
        }
      };

      testPopup.handleClick(e);
      expect(toggleCheckboxStub.calledOnce).to.equal(true);
      expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['domain-toggle']);
      expect(toggleOnOffSettingStub.calledOnce).to.equal(true);
      expect(toggleOnOffSettingStub.firstCall.args).to.deep.equal(['www.test.com']);
    });

    it('should toggle reverse slider and setting if target is reverse toggle', () => {
      const e = {
        target: {
          id: 'reverse-toggle',
          classList: {
            contains: () => false
          },
          nextElementSibling: {
            classList: {
              contains: () => false
            }
          }
        }
      };

      testPopup.handleClick(e);
      expect(toggleCheckboxStub.calledOnce).to.equal(true);
      expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['reverse-toggle']);
      expect(toggleSettingStub.calledOnce).to.equal(true);
      expect(toggleSettingStub.firstCall.args).to.deep.equal(['reverse']);
    });

    it('should toggle dark mode slider and setting if target is dark toggle', () => {
      const e = {
        target: {
          id: 'dark-toggle',
          classList: {
            contains: () => false
          },
          nextElementSibling: {
            classList: {
              contains: () => false
            }
          }
        }
      };

      testPopup.handleClick(e);
      expect(toggleCheckboxStub.calledOnce).to.equal(true);
      expect(toggleCheckboxStub.firstCall.args).to.deep.equal(['dark-toggle']);
      expect(toggleSettingStub.calledOnce).to.equal(true);
      expect(toggleSettingStub.firstCall.args).to.deep.equal(['dark']);
    });

    it('should open target href in new tab if target is not a toggle and has an href', () => {
      const e = {
        target: {
          id: 'other',
          classList: {
            contains: () => false
          },
          href: 'https://www.test.com/test'
        }
      };

      testPopup.handleClick(e);
      expect(addToggleAnimationStub.notCalled).to.equal(true);
      expect(toggleCheckboxStub.notCalled).to.equal(true);
      expect(toggleSettingStub.notCalled).to.equal(true);
      expect(browserCreateTabStub.calledOnce).to.equal(true);
      expect(browserCreateTabStub.firstCall.args).to.deep.equal([{url: 'https://www.test.com/test'}]);
    });

  });

});
