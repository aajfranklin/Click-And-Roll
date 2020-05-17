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

  describe('getFromSyncStorage', () => {

    let browserStorageSyncSpy;

    before(() => {
      browser.storage = {
        sync: {
          get: (input, callback) => callback()
        }
      };

      browserStorageSyncSpy = sinon.spy(browser.storage.sync, 'get');
    });

    afterEach(() => {
      browserStorageSyncSpy.resetHistory();
    });

    after(() => {
      browserStorageSyncSpy.restore();
      delete browser.storage;
    });

    it('should call get on browser sync storage with passed in name', () => {
      return testUtils.getFromSyncStorage('testName')
        .then(result => {
          expect(browserStorageSyncSpy.calledOnce).to.equal(true);
          expect(browserStorageSyncSpy.withArgs(['testName']).calledOnce).to.equal(true);
          expect(result).to.equal(null);
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
      return testUtils.removeFromSyncStorage('testName')
        .then(() => {
          expect(browserStorageSyncSpy.calledOnce).to.equal(true);
          expect(browserStorageSyncSpy.withArgs(['testName']).calledOnce).to.equal(true);
        });
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

    it('should resolve true if setting is present and off by default', () => {
      result = { dark: '' };

      return testUtils.isSettingOn('dark')
        .then(res => {
          expect(res).to.equal(true);
        })
    });

    it('should resolve false if setting is absent and off by default', () => {
      result = {};

      return testUtils.isSettingOn('dark')
        .then(res => {
          expect(res).to.equal(false);
        })
    });

    it('should resolve false if setting is present and on by default', () => {
      result = { clickAndRoll: '' };

      return testUtils.isSettingOn('clickAndRoll')
        .then(res => {
          expect(res).to.equal(false);
        })
    });

    it('should resolve true if setting is absent and on by default', () => {
      result = {};

      return testUtils.isSettingOn('clickAndRoll')
        .then(res => {
          expect(res).to.equal(true);
        })
    });

  });

  describe('isExtensionOn', () => {
    let getFromSyncStorageStub;
    let isSettingOnStub;

    before(() => {
      getFromSyncStorageStub = sinon.stub(testUtils, 'getFromSyncStorage');
      isSettingOnStub = sinon.stub(testUtils, 'isSettingOn');
    });

    afterEach(() => {
      getFromSyncStorageStub.resetHistory();
      isSettingOnStub.resetHistory();
    });

    after(() => {
      getFromSyncStorageStub.restore();
      isSettingOnStub.restore();
    });

    it('should resolve true if extension is on globally, site list is blacklist, and domain not in sitelist', () => {
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('whitelist').resolves(false);
      getFromSyncStorageStub.withArgs('test.com').resolves(null);

      return testUtils.isExtensionOn('test.com')
        .then(res => {
          expect(res).to.equal(true);
        });
    });

    it('should resolve false if extension is on globally, site list is blacklist, and domain is in site list', () => {
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('whitelist').resolves(false);
      getFromSyncStorageStub.withArgs('test.com').resolves({ 'test.com': '' });

      return testUtils.isExtensionOn('test.com')
        .then(res => {
          expect(res).to.equal(false);
        });
    });

    it('should resolve false if extension is on globally, site list is whitelist, and domain not in site list', () => {
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('whitelist').resolves(true);
      getFromSyncStorageStub.withArgs('test.com').resolves(null);

      return testUtils.isExtensionOn('test.com')
        .then(res => {
          expect(res).to.equal(false);
        });
    });

    it('should resolve true if extension is on globally, site list is whitelist, and domain is in site list', () => {
      isSettingOnStub.withArgs('clickAndRoll').resolves(true);
      isSettingOnStub.withArgs('whitelist').resolves(true);
      getFromSyncStorageStub.withArgs('test.com').resolves({ 'test.com': '' });

      return testUtils.isExtensionOn('')
        .then(res => {
          expect(res).to.equal(true);
        });
    });

    it('should resolve false if extension is of globally', () => {
      isSettingOnStub.withArgs('clickAndRoll').resolves(false);
      isSettingOnStub.withArgs('whitelist').resolves(true);
      getFromSyncStorageStub.withArgs('test.com').resolves({ 'test.com': '' });

      return testUtils.isExtensionOn('')
        .then(res => {
          expect(res).to.equal(false);
        });
    });

  });

});
