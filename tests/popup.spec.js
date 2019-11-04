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

  describe('toggleSetting', () => {

    let isExtensionOnStub;
    let isSettingOnStub;
    let messageActiveTabStub;
    let saveToSyncStorageStub;
    let chromeSetIconStub;
    let testTab;

    before(() => {
      testTab = {
        url: 'https://www.testurl.com/test',
        id: 'test'
      };

      chrome.browserAction = {
        setIcon: () => {}
      };

      isExtensionOnStub = sinon.stub(testPopup.utils, 'isExtensionOn');
      isSettingOnStub = sinon.stub(testPopup.utils, 'isSettingOn');
      messageActiveTabStub = sinon.stub(testPopup.utils, 'messageActiveTab');
      saveToSyncStorageStub = sinon.stub(testPopup.utils, 'saveToSyncStorage');
      chromeSetIconStub = sinon.stub(chrome.browserAction, 'setIcon');
    });

    afterEach(() => {
      isExtensionOnStub.resetHistory();
      isSettingOnStub.resetHistory();
      messageActiveTabStub.resetHistory();
      saveToSyncStorageStub.resetHistory();
      chromeSetIconStub.resetHistory();

      isExtensionOnStub.resolves(null);
      isSettingOnStub.resolves(null);
      saveToSyncStorageStub.resolves(null);
    });

    after(() => {
      isExtensionOnStub.restore();
      isSettingOnStub.restore();
      messageActiveTabStub.restore();
      saveToSyncStorageStub.restore();
      chromeSetIconStub.restore();

      delete chrome.browserAction;
    });

    it('should save setting as \'\', send \'stop\' message, and set inactive icon if setting is on', () => {
      isSettingOnStub.resolves(true);
      saveToSyncStorageStub.resolves(true);
      return testPopup.toggleSetting('testSetting', testTab)
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['testSetting', '']);
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'stop'}]);
          expect(chromeSetIconStub.calledOnce).to.equal(true);
          expect(chromeSetIconStub.firstCall.args).to.deep.equal([{path: '../assets/inactive32.png', tabId: 'test'}])
        })
    });

    it('should save setting as \'true\', send \'start\' message, and set active icon if setting is off and extension is on', () => {
      isSettingOnStub.resolves(false);
      saveToSyncStorageStub.resolves(true);
      isExtensionOnStub.resolves(true);
      return testPopup.toggleSetting('testSetting', testTab)
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['testSetting', 'true']);
          expect(isExtensionOnStub.calledOnce).to.equal(true);
          expect(isExtensionOnStub.firstCall.args).to.deep.equal(['www.testurl.com']);
          expect(messageActiveTabStub.calledOnce).to.equal(true);
          expect(messageActiveTabStub.firstCall.args).to.deep.equal([{message: 'start'}]);
          expect(chromeSetIconStub.calledOnce).to.equal(true);
          expect(chromeSetIconStub.firstCall.args).to.deep.equal([{path: '../assets/active32.png', tabId: 'test'}])
        });
    });

    it('should save setting as \'true\' and send no message if setting is off and extension is off', () => {
      isSettingOnStub.resolves(false);
      saveToSyncStorageStub.resolves(true);
      isExtensionOnStub.resolves(false);
      return testPopup.toggleSetting('testSetting', testTab)
        .then(() => {
          expect(saveToSyncStorageStub.calledOnce).to.equal(true);
          expect(saveToSyncStorageStub.firstCall.args).to.deep.equal(['testSetting', 'true']);
          expect(isExtensionOnStub.calledOnce).to.equal(true);
          expect(isExtensionOnStub.firstCall.args).to.deep.equal(['www.testurl.com']);
          expect(messageActiveTabStub.notCalled).to.equal(true);
          expect(chromeSetIconStub.notCalled).to.equal(true);
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

    before(() => {
      getActiveTabStub = sinon.stub(testPopup.utils, 'getActiveTab').resolves({
        url: 'https://www.test.com'
      });

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

    it('should toggle both toggles if both are on', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(true);
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.calledTwice).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args[0]).to.equal('domain-toggle');
          expect(toggleCheckboxStub.secondCall.args[0]).to.equal('extension-toggle');
        })
    });

    it('should only toggle domain toggle if only domain setting is on', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(true);
      isSettingOnStub.withArgs('clickAndRoll').resolves(false);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.calledOnce).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args[0]).to.equal('domain-toggle');
        })
    });

    it('should only toggle extension toggle if only extension setting is on', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(false);
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.calledOnce).to.equal(true);
          expect(toggleCheckboxStub.firstCall.args[0]).to.equal('extension-toggle');
        })
    });

    it('should not toggle either setting if both are off', () => {
      isSettingOnStub.withArgs('www.test.com').resolves(false);
      isSettingOnStub.withArgs('clickAndRoll').resolves(false);
      return testPopup.initialiseSettings()
        .then(() => {
          expect(toggleCheckboxStub.notCalled).to.equal(true);
        })
    });

  });

});
