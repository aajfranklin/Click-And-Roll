describe('Utils', () => {

  const testUtils = new Utils();

  describe('sendRuntimeMessage', () => {

    let browserSendMessageStub;
    let request = {message: 'testRequest'};
    let response;

    before(() => {
      response = [null, 'res'];
      browserSendMessageStub = sinon.stub(browser.runtime, 'sendMessage');
      browserSendMessageStub.callsArgWith(1, response);
    });

    afterEach(() => {
      browserSendMessageStub.resetHistory();
    });

    after(() => {
      browserSendMessageStub.restore();
    });

    it('should send a message to browser runtime with passed in request', () => {
      return testUtils.sendRuntimeMessage(request)
        .then(() => {
          expect(browserSendMessageStub.calledOnce).to.equal(true);
          expect(browserSendMessageStub.withArgs(request).calledOnce).to.equal(true);
        });
    });

    it('should resolve response if browser returns no error', () => {
      return testUtils.sendRuntimeMessage(request)
        .then((res) => {
          expect(res).to.equal('res');
        });
    });

    it('should reject if browser returns an error', () => {
      response = ['err', null];
      browserSendMessageStub.callsArgWith(1, response);

      return testUtils.sendRuntimeMessage(request)
        .catch((err) => {
          expect(err).to.equal('err');
        })
    });

  });

  describe('getActiveTab', () => {

    before(() => {
      browser.tabs = {
        query: (input, callback) => callback([{id: 0}])
      }
    });

    after(() => {
      delete browser.tabs;
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

    it('should return \'browser://newtab/\' if empty tab', () => {
      expect(testUtils.getTabUrl({url: ''})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl({url: 'chrome://newtab/'})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl({url: 'chrome://new-tab-page/'})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl({url: 'edge://newtab/'})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl({url: 'about:newtab'})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl({url: 'chrome://startpageshared/'})).to.equal('browser://newtab/');
      expect(testUtils.getTabUrl(undefined)).to.equal('browser://newtab/');
    });

  });

  describe('messageActiveTab', () => {

    let sendMessageSpy;

    before(() => {
      browser.tabs = {
        sendMessage: () => {},
        query: (input, callback) => callback([{id: 0}])
      };

      sendMessageSpy = sinon.spy(browser.tabs, 'sendMessage');
    });

    afterEach(() => {
      sendMessageSpy.resetHistory();
    });

    after(() => {
      sendMessageSpy.restore();
      delete browser.tabs;
    });


    it('should send message with id of returned tab and passed in request', () => {
      const request = {message: 'test'};
      testUtils.messageActiveTab(request);
      expect(sendMessageSpy.calledOnce).to.equal(true);
      expect(sendMessageSpy.firstCall.args).to.deep.equal([0, request]);
    });

    it('should return before sending message if no tab is returned', () => {
      const request = {message: 'test'};
      browser.tabs.query = (input, callback) => callback([]);
      testUtils.messageActiveTab(request);
      expect(sendMessageSpy.calledOnce).to.equal(false);
    });

  });

  describe('saveToLocalStorage', () => {

    let browserStorageLocalSetSpy;

    before(() => {
      browser.storage = {
        local: {
          set: (input, callback) => callback()
        }
      };

      browserStorageLocalSetSpy = sinon.spy(browser.storage.local, 'set');
    });

    afterEach(() => {
      browserStorageLocalSetSpy.resetHistory();
    });

    after(() => {
      browserStorageLocalSetSpy.restore();
      delete browser.storage;
    });

    it('should call set on browser local storage with passed in name and values', () => {
      testUtils.saveToLocalStorage('testName', ['testValues']);
      expect(browserStorageLocalSetSpy.calledOnce).to.equal(true);
      expect(browserStorageLocalSetSpy.withArgs({['testName']: ['testValues']}).calledOnce).to.equal(true);
    });

  });


  describe('getFromLocalStorage', () => {

    let browserStorageLocalGetSpy;

    before(() => {
      browser.storage = {
        local: {
          get: (input, callback) => callback()
        }
      };

      browserStorageLocalGetSpy = sinon.spy(browser.storage.local, 'get');
    });

    afterEach(() => {
      browserStorageLocalGetSpy.resetHistory();
    });

    after(() => {
      browserStorageLocalGetSpy.restore();
      delete browser.storage;
    });

    it('should call get on browser local storage with passed in name', () => {
      return testUtils.getFromLocalStorage('testName')
        .then(result => {
          expect(browserStorageLocalGetSpy.calledOnce).to.equal(true);
          expect(browserStorageLocalGetSpy.withArgs(['testName']).calledOnce).to.equal(true);
          expect(result).to.equal(null);
        });
    });

  });

  describe('removeFromLocalStorage', () => {

    let browserStorageLocalSpy;

    before(() => {
      browser.storage = {
        local: {
          remove: (input, callback) => callback()
        }
      };

      browserStorageLocalSpy = sinon.spy(browser.storage.local, 'remove');
    });

    afterEach(() => {
      browserStorageLocalSpy.resetHistory();
    });

    after(() => {
      browserStorageLocalSpy.restore();
      delete browser.storage;
    });

    it('should call remove on browser sync storage with passed in name', () => {
      testUtils.removeFromLocalStorage('testName');
      expect(browserStorageLocalSpy.calledOnce).to.equal(true);
      expect(browserStorageLocalSpy.withArgs(['testName']).calledOnce).to.equal(true);
    });

  });

  describe('saveToSyncStorage', () => {

    let browserStorageSyncSpy;

    before(() => {
      browser.storage = {
        sync: {
          set: (input, callback) => callback()
        }
      };

      browserStorageSyncSpy = sinon.spy(browser.storage.sync, 'set');
    });

    afterEach(() => {
      browserStorageSyncSpy.resetHistory();
    });

    after(() => {
      browserStorageSyncSpy.restore();
      delete browser.storage;
    });

    it('should call set on browser sync storage with passed in name and values', () => {
      return testUtils.saveToSyncStorage('testName', 'testValue')
        .then(() => {
          expect(browserStorageSyncSpy.calledOnce).to.equal(true);
          expect(browserStorageSyncSpy.withArgs({testName: 'testValue'}).calledOnce).to.equal(true);
        });
    });

  });

  describe('removeFromSyncStorage', () => {

    let browserStorageSyncSpy;

    before(() => {
      browser.storage = {
        sync: {
          remove: (input, callback) => callback()
        }
      };

      browserStorageSyncSpy = sinon.spy(browser.storage.sync, 'remove');
    });

    afterEach(() => {
      browserStorageSyncSpy.resetHistory();
    });

    after(() => {
      browserStorageSyncSpy.restore();
      delete browser.storage;
    });

    it('should call remove on browser sync storage with passed in name', () => {
      testUtils.removeFromSyncStorage('testName');
      expect(browserStorageSyncSpy.calledOnce).to.equal(true);
      expect(browserStorageSyncSpy.withArgs(['testName']).calledOnce).to.equal(true);
    });

  });

  describe('isSettingOn', () => {

    let result;

    before(() => {
      browser.storage = {
        sync: {
          get: (input, callback) => callback(result)
        }
      }
    });

    after(() => {
      delete browser.storage;
    });

    it('should resolve false if browser storage value is empty string', () => {
      result = {test: ''};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(false);
        });
    });

    it('should resolve true if browser storage value is \'true\'', () => {
      result = {test: 'true'};

      return testUtils.isSettingOn('test')
        .then((response) => {
          expect(response).to.equal(true);
        });
    });

    it('should resolve false if browser storage value is empty object and setting defaults to off', () => {
      result = {};

      return testUtils.isSettingOn('reverse')
        .then((response) => {
          expect(response).to.equal(false);
        });
    });

    it('should resolve true if browser storage value is empty object and setting defaults to on', () => {
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
