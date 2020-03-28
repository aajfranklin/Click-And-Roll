describe('Utils', () => {

  const testUtils = new Utils();

  describe('sendRuntimeMessage', () => {

    let chromeSendMessageStub;
    let request = {message: 'testRequest'};
    let response;

    before(() => {
      response = [null, 'res'];
      chromeSendMessageStub = sinon.stub(chrome.runtime, 'sendMessage');
      chromeSendMessageStub.callsArgWith(1, response);
    });

    afterEach(() => {
      chromeSendMessageStub.resetHistory();
    });

    after(() => {
      chromeSendMessageStub.restore();
    });

    it('should send a message to chrome runtime with passed in request', () => {
      return testUtils.sendRuntimeMessage(request)
        .then(() => {
          expect(chromeSendMessageStub.calledOnce).to.equal(true);
          expect(chromeSendMessageStub.withArgs(request).calledOnce).to.equal(true);
        });
    });

    it('should resolve response if chrome returns no error', () => {
      return testUtils.sendRuntimeMessage(request)
        .then((res) => {
          expect(res).to.equal('res');
        });
    });

    it('should reject if chrome returns an error', () => {
      response = ['err', null];
      chromeSendMessageStub.callsArgWith(1, response);

      return testUtils.sendRuntimeMessage(request)
        .catch((err) => {
          expect(err).to.equal('err');
        })
    });

  });

  describe('getActiveTab', () => {

    before(() => {
      chrome.tabs = {
        query: (input, callback) => callback([{id: 0}])
      }
    });

    after(() => {
      delete chrome.tabs;
    });

    it('should resolve first returned tab', () => {
      return testUtils.getActiveTab()
        .then((tab) => {
          expect(tab).to.deep.equal({id: 0});
        });
    });

  });

  describe('getTabUrl', () => {

    it('should return tab host name if not empty tab', () => {
      expect(testUtils.getTabUrl({url: 'https://www.testhost.com/etc'})).to.equal('www.testhost.com');
    });

    it('should return \'chrome://newtab/\' if empty tab', () => {
      expect(testUtils.getTabUrl({url: ''})).to.equal('chrome://newtab/');
      expect(testUtils.getTabUrl({url: 'chrome://newtab/'})).to.equal('chrome://newtab/');
      expect(testUtils.getTabUrl({url: 'chrome://new-tab-page/'})).to.equal('chrome://newtab/');
      expect(testUtils.getTabUrl(undefined)).to.equal('chrome://newtab/');
    });

  });

  describe('messageActiveTab', () => {

    let sendMessageSpy;

    before(() => {
      chrome.tabs = {
        sendMessage: () => {},
        query: (input, callback) => callback([{id: 0}])
      };

      sendMessageSpy = sinon.spy(chrome.tabs, 'sendMessage');
    });

    afterEach(() => {
      sendMessageSpy.resetHistory();
    });

    after(() => {
      sendMessageSpy.restore();
      delete chrome.tabs;
    });


    it('should send message with id of returned tab and passed in request', () => {
      const request = {message: 'test'};
      testUtils.messageActiveTab(request);
      expect(sendMessageSpy.calledOnce).to.equal(true);
      expect(sendMessageSpy.firstCall.args).to.deep.equal([0, request]);
    });

    it('should return before sending message if no tab is returned', () => {
      const request = {message: 'test'};
      chrome.tabs.query = (input, callback) => callback([]);
      testUtils.messageActiveTab(request);
      expect(sendMessageSpy.calledOnce).to.equal(false);
    });

  });

  describe('saveToLocalStorage', () => {

    let chromeStorageLocalSetSpy;

    before(() => {
      chrome.storage = {
        local: {
          set: (input, callback) => callback()
        }
      };

      chromeStorageLocalSetSpy = sinon.spy(chrome.storage.local, 'set');
    });

    afterEach(() => {
      chromeStorageLocalSetSpy.resetHistory();
    });

    after(() => {
      chromeStorageLocalSetSpy.restore();
      delete chrome.storage;
    });

    it('should call set on chrome local storage with passed in name and values', () => {
      testUtils.saveToLocalStorage('testName', ['testValues']);
      expect(chromeStorageLocalSetSpy.calledOnce).to.equal(true);
      expect(chromeStorageLocalSetSpy.withArgs({['testName']: ['testValues']}).calledOnce).to.equal(true);
    });

  });


  describe('getFromLocalStorage', () => {

    let chromeStorageLocalGetSpy;

    before(() => {
      chrome.storage = {
        local: {
          get: (input, callback) => callback()
        }
      };

      chromeStorageLocalGetSpy = sinon.spy(chrome.storage.local, 'get');
    });

    afterEach(() => {
      chromeStorageLocalGetSpy.resetHistory();
    });

    after(() => {
      chromeStorageLocalGetSpy.restore();
      delete chrome.storage;
    });

    it('should call get on chrome local storage with passed in name', () => {
      return testUtils.getFromLocalStorage('testName')
        .then(result => {
          expect(chromeStorageLocalGetSpy.calledOnce).to.equal(true);
          expect(chromeStorageLocalGetSpy.withArgs(['testName']).calledOnce).to.equal(true);
          expect(result).to.equal(null);
        });
    });

  });

  describe('removeFromLocalStorage', () => {

    let chromeStorageLocalSpy;

    before(() => {
      chrome.storage = {
        local: {
          remove: (input, callback) => callback()
        }
      };

      chromeStorageLocalSpy = sinon.spy(chrome.storage.local, 'remove');
    });

    afterEach(() => {
      chromeStorageLocalSpy.resetHistory();
    });

    after(() => {
      chromeStorageLocalSpy.restore();
      delete chrome.storage;
    });

    it('should call remove on chrome sync storage with passed in name', () => {
      testUtils.removeFromLocalStorage('testName');
      expect(chromeStorageLocalSpy.calledOnce).to.equal(true);
      expect(chromeStorageLocalSpy.withArgs(['testName']).calledOnce).to.equal(true);
    });

  });

  describe('saveToSyncStorage', () => {

    let chromeStorageSyncSpy;

    before(() => {
      chrome.storage = {
        sync: {
          set: (input, callback) => callback()
        }
      };

      chromeStorageSyncSpy = sinon.spy(chrome.storage.sync, 'set');
    });

    afterEach(() => {
      chromeStorageSyncSpy.resetHistory();
    });

    after(() => {
      chromeStorageSyncSpy.restore();
      delete chrome.storage;
    });

    it('should call set on chrome sync storage with passed in name and values', () => {
      return testUtils.saveToSyncStorage('testName', 'testValue')
        .then(() => {
          expect(chromeStorageSyncSpy.calledOnce).to.equal(true);
          expect(chromeStorageSyncSpy.withArgs({testName: 'testValue'}).calledOnce).to.equal(true);
        });
    });

  });

  describe('removeFromSyncStorage', () => {

    let chromeStorageSyncSpy;

    before(() => {
      chrome.storage = {
        sync: {
          remove: (input, callback) => callback()
        }
      };

      chromeStorageSyncSpy = sinon.spy(chrome.storage.sync, 'remove');
    });

    afterEach(() => {
      chromeStorageSyncSpy.resetHistory();
    });

    after(() => {
      chromeStorageSyncSpy.restore();
      delete chrome.storage;
    });

    it('should call remove on chrome sync storage with passed in name', () => {
      testUtils.removeFromSyncStorage('testName');
      expect(chromeStorageSyncSpy.calledOnce).to.equal(true);
      expect(chromeStorageSyncSpy.withArgs(['testName']).calledOnce).to.equal(true);
    });

  });

  describe('isSettingOn', () => {

    let result;

    before(() => {
      chrome.storage = {
        sync: {
          get: (input, callback) => callback(result)
        }
      }
    });

    after(() => {
      delete chrome.storage;
    });

    it('should resolve false if chrome storage value is empty string', () => {
      result = {test: ''};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(false);
        });
    });

    it('should resolve true if chrome storage value is \'true\'', () => {
      result = {test: 'true'};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(true);
        });
    });

    it('should resolve false if chrome storage value is empty object and setting defaults to off', () => {
      result = {};

      return testUtils.isSettingOn('reverse')
        .then((response) => {
          expect(response).to.equal(false);
        });
    });

    it('should resolve true if chrome storage value is empty object and setting defaults to on', () => {
      result = {};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(true);
        });
    });

  });

  describe('isExtensionOn', () => {
    let isSettingOnStub;

    before(() => {
      isSettingOnStub = sinon.stub(testUtils, 'isSettingOn');
    });

    afterEach(() => {
      isSettingOnStub.resetHistory();
    });

    after(() => {
      isSettingOnStub.restore();
    });

    it('should resolve true if extension is active globally and for the passed in domain', () => {
      isSettingOnStub.resolves(true);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          expect(result).to.equal(true);
        })
    });

    it('should resolve false if extension is off globally', () => {
      isSettingOnStub.resolves(false);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          expect(result).to.equal(false);
        })
    });

    it('should resolve false if extension is off for the passed in domain', () => {
      isSettingOnStub.onCall(0).resolves(true);
      isSettingOnStub.onCall(1).resolves(false);
      return testUtils.isExtensionOn('testDomain')
        .then(result => {
          expect(result).to.equal(false);
        })
    });

  });

});
